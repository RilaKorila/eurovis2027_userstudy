"""Turn a researcher-only Sheets CSV or local preview database into main-trial CSV."""
import argparse
import csv
import json
import sqlite3
from contextlib import closing
from pathlib import Path

SESSION_FIELDS = ("study_version", "stimulus_manifest_version", "assignment_version", "participant_id",
                  "session_id", "submission_id", "group_id", "received_at_utc")
TRIAL_FIELDS = (
    "trial_id", "question_id", "is_practice", "trial_index", "layout_condition_id", "stimulus_id",
    "stimulus_sha256", "dataset_id", "event_id", "source_timestamp", "target_timestamp",
    "selected_option_id", "correct_option_id", "is_correct", "response_time_ms", "confidence",
    "image_shown_at_utc", "answer_confirmed_at_utc", "attempt_index", "repeated_exposure",
    "hidden_count", "blur_count", "image_natural_width", "image_natural_height",
    "image_rendered_width", "image_rendered_height", "viewport_width", "viewport_height", "device_pixel_ratio",
)


def sessions(source):
    if source.suffix == ".sqlite3":
        with closing(sqlite3.connect(source.resolve().as_uri() + "?mode=ro", uri=True)) as db:
            for (record,) in db.execute("SELECT record FROM submissions ORDER BY rowid"):
                yield json.loads(record)
    else:
        with source.open(encoding="utf-8-sig", newline="") as stream:
            rows = csv.reader(stream)
            header = next(rows)
            start = header.index("responses_json")
            for row in rows:
                if any(row):
                    yield json.loads("".join(row[start:]))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    records = list(sessions(args.source))
    with args.destination.open("x", encoding="utf-8", newline="") as stream:
        fields = (*SESSION_FIELDS, *TRIAL_FIELDS, "response_time_seconds")
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        for session in records:
            metadata = {field: session[field] for field in SESSION_FIELDS}
            for trial in session["trials"]:
                if not trial["is_practice"]:
                    writer.writerow({**metadata, **{field: trial[field] for field in TRIAL_FIELDS},
                                     "response_time_seconds": trial["response_time_ms"] / 1000})


if __name__ == "__main__":
    main()
