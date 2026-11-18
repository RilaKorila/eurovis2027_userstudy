"""Validate, score, and save a complete submission."""
import hashlib
import json
import math
import sqlite3
import uuid
from contextlib import closing
from datetime import datetime, timezone

from study_config import OPTIONS, VERSIONS, SOURCE_FIELDS, require

TRIAL_FIELDS = ("trial_index", "question_id", "layout_condition_id", "stimulus_id", "stimulus_sha256")
SIZE_FIELDS = ("image_natural_width", "image_natural_height", "image_rendered_width",
               "image_rendered_height", "viewport_width", "viewport_height", "device_pixel_ratio")


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def stable_json(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False)


def uuid_text(value):
    require(isinstance(value, str) and str(uuid.UUID(value)) == value, "Invalid ID")
    return value


def utc_text(value):
    require(isinstance(value, str) and len(value) <= 40, "Invalid timestamp")
    dt = datetime.fromisoformat(value)
    require(dt.utcoffset() == timezone.utc.utcoffset(dt), "Expected a UTC timestamp")
    return value


def number(value, minimum):
    require(type(value) in (int, float) and 0 <= minimum <= value and math.isfinite(value),
            "Invalid measurement")
    return value


def index(value):
    require(type(value) is int and value >= 1, "Invalid attempt number")
    return value


def exposure(record):
    events = record["attention_events"]
    require(isinstance(events, list), "Invalid attention events")
    clean_events = []
    for event in events:
        require(event["kind"] in ("hidden", "blur"), "Invalid attention event")
        clean_events.append({"kind": event["kind"], "at_utc": utc_text(event["at_utc"]),
                             "elapsed_ms": number(event["elapsed_ms"], 0)})
    return {
        "attempt_index": index(record["attempt_index"]),
        "image_shown_at_utc": utc_text(record["image_shown_at_utc"]),
        "attention_events": clean_events,
        "hidden_count": sum(e["kind"] == "hidden" for e in clean_events),
        "blur_count": sum(e["kind"] == "blur" for e in clean_events),
        **{field: number(record[field], 0.000001) for field in SIZE_FIELDS},
    }


def validate_submission(payload, study, answers, algorithms):
    require(isinstance(payload, dict), "Invalid submission")
    require(all(payload[field] == study[field] for field in VERSIONS), "Study versions differ")
    require(payload["group_id"] in study["groups"], "Invalid group")
    assigned = study["groups"][payload["group_id"]]
    records = payload["trials"]
    require(isinstance(records, list) and len(records) == len(assigned), "Expected six complete trials")
    submission_id = uuid_text(payload["submission_id"])
    session_id = uuid_text(payload["session_id"])
    aborted = []
    attempt_counts = [0] * len(assigned)
    require(isinstance(payload["aborted_attempts"], list), "Invalid aborted attempts")
    for record in payload["aborted_attempts"]:
        trial_index = record["trial_index"]
        require(type(trial_index) is int and 0 <= trial_index < len(assigned), "Invalid interrupted trial")
        trial = assigned[trial_index]
        require(all(record[field] == trial[field] for field in TRIAL_FIELDS), "Interrupted trial does not match assignment")
        attempt_counts[trial_index] += 1
        data = exposure(record)
        require(data["attempt_index"] == attempt_counts[trial_index], "Interrupted attempts out of order")
        aborted.append({
            **{field: trial[field] for field in TRIAL_FIELDS}, **data,
            "status": "aborted_reload", "aborted_at_utc": utc_text(record["aborted_at_utc"]),
            "repeated_exposure": data["attempt_index"] > 1,
        })

    trials = []
    for record, trial, attempts in zip(records, assigned, attempt_counts):
        require(all(record[field] == trial[field] for field in TRIAL_FIELDS), "Trial does not match assignment")
        selected = record["selected_option_id"]
        confidence = record["confidence"]
        require(selected in OPTIONS and type(confidence) is int and 1 <= confidence <= 5, "Invalid answer or confidence")
        data = exposure(record)
        require(data["attempt_index"] == attempts + 1, "Trial attempt number does not match interruptions")
        correct = answers[trial["question_id"]]
        trials.append({
            **{field: trial[field] for field in (*TRIAL_FIELDS, *SOURCE_FIELDS, "is_practice")}, **data,
            "trial_id": f"{session_id}:{trial['trial_index']}",
            "repeated_exposure": attempts > 0, "selected_option_id": selected, "confidence": confidence,
            "correct_option_id": correct, "is_correct": selected == correct,
            "response_time_ms": number(record["response_time_ms"], 0),
            "answer_confirmed_at_utc": utc_text(record["answer_confirmed_at_utc"]),
        })
    user_agent = payload["environment"]["user_agent"]
    require(isinstance(user_agent, str) and len(user_agent) <= 4096, "Invalid user agent")
    environment = {"user_agent": user_agent}
    for field in ("viewport_width", "viewport_height", "device_pixel_ratio"):
        environment[field] = number(payload["environment"][field], 0.000001)
    return {
        **{field: study[field] for field in VERSIONS},
        "session_id": session_id, "submission_id": submission_id,
        "participant_id": uuid_text(payload["participant_id"]), "group_id": payload["group_id"],
        "started_at_utc": utc_text(payload["started_at_utc"]),
        "submitted_at_utc": utc_text(payload["submitted_at_utc"]),
        "status": "submitted", "environment": environment,
        "assignment_snapshot": {
            group: [{field: trial[field] for field in TRIAL_FIELDS} for trial in assignment]
            for group, assignment in study["groups"].items()
        },
        "layout_conditions": algorithms, "trials": trials, "aborted_attempts": aborted,
    }


class PreviewStore:
    def __init__(self, path):
        self.path = path

    def save(self, submission):
        digest = hashlib.sha256(stable_json(submission).encode()).hexdigest()
        received = dict(submission, received_at_utc=utc_now())
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with closing(sqlite3.connect(self.path)) as connection, connection:
            connection.execute(
                "CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, digest TEXT, record TEXT)"
            )
            connection.execute("INSERT OR IGNORE INTO submissions VALUES (?, ?, ?)",
                               (submission["submission_id"], digest, stable_json(received)))
            stored, = connection.execute("SELECT digest FROM submissions WHERE id = ?",
                                         (submission["submission_id"],)).fetchone()
            require(stored == digest, "Submission ID already belongs to another payload")


class SheetsStore:
    def __init__(self, api, spreadsheet_id, sheet_id):
        self.api = api
        self.spreadsheet_id = spreadsheet_id
        self.sheet_id = sheet_id

    def spreadsheet(self):
        return self.api.spreadsheets()

    def find_digest(self, submission_id):
        response = self.spreadsheet().values().batchGetByDataFilter(
            spreadsheetId=self.spreadsheet_id,
            body={"dataFilters": [{"gridRange": {"sheetId": self.sheet_id,
                                                  "startColumnIndex": 0, "endColumnIndex": 2}}]},
        ).execute()
        matches = [
            row[1]
            for value_range in response.get("valueRanges", [])
            for row in value_range["valueRange"].get("values", [])
            if len(row) >= 2 and row[0] == submission_id
        ]
        require(len(matches) <= 1, "Duplicate rows found in response sheet")
        return matches[0] if matches else None

    def save(self, submission):
        submission_id = submission["submission_id"]
        digest = hashlib.sha256(stable_json(submission).encode()).hexdigest()
        record = dict(submission, received_at_utc=utc_now())
        serialized = stable_json(record)
        # Store in adjacent cells when the JSON exceeds one Sheets cell.
        chunks = [serialized[i:i + 20_000] for i in range(0, len(serialized), 20_000)]
        values = [submission_id, digest, record["study_version"], record["group_id"],
                  record["received_at_utc"], *chunks]
        # A duplicate namedRangeId invalidates the entire batch, including appendCells.
        marker = "submission_" + submission_id.replace("-", "")
        requests = [
            {"addNamedRange": {"namedRange": {
                "namedRangeId": marker, "name": marker,
                "range": {"sheetId": self.sheet_id, "startRowIndex": 0, "endRowIndex": 1,
                          "startColumnIndex": 0, "endColumnIndex": 1},
            }}},
            {"appendCells": {"sheetId": self.sheet_id, "fields": "userEnteredValue",
                             "rows": [{"values": [{"userEnteredValue": {"stringValue": v}} for v in values]}]}},
        ]
        try:
            self.spreadsheet().batchUpdate(
                spreadsheetId=self.spreadsheet_id, body={"requests": requests}
            ).execute()
        except Exception:
            stored = self.find_digest(submission_id)
            if stored is None:
                raise
            require(stored == digest, "Submission ID already belongs to another payload")
