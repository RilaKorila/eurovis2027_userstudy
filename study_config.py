"""Load a versioned study and construct its participant-facing manifest."""
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import quote

from PIL import Image

ROOT = Path(__file__).resolve().parent
GROUPS = ("A", "B", "C")
OPTIONS = ("A", "B", "C", "D")
LAYOUTS = ("L1", "L2", "L3")
QUESTIONS = tuple(f"Q{i}" for i in range(1, 7))
VERSIONS = ("study_version", "stimulus_manifest_version", "assignment_version")
SOURCE_FIELDS = ("dataset_id", "event_id", "source_timestamp", "target_timestamp")


def require(condition, message):
    if not condition:
        raise ValueError(message)


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def has_placeholder(value):
    if isinstance(value, dict):
        return any(has_placeholder(item) for item in value.values())
    if isinstance(value, list):
        return any(has_placeholder(item) for item in value)
    return isinstance(value, str) and "PLACEHOLDER" in value.upper()


def demo_image(index, layout):
    """Draw synthetic stimuli, with the same edges across layouts of a question."""
    target = (index + 1) % 4
    coords = [
        [(95, 85), (248, 67), (283, 192), (63, 186)],
        [(252, 73), (274, 184), (76, 185), (90, 66)],
        [(281, 182), (74, 197), (87, 72), (260, 72)],
    ][layout]
    svg = ['<svg xmlns="http://www.w3.org/2000/svg" width="800" height="260" viewBox="0 0 800 260">',
           '<rect width="800" height="260" fill="#f4f7fa"/>']
    for frame, offset in enumerate((0, 400)):
        svg.append(f'<rect x="{offset + 12}" y="10" width="376" height="240" rx="8" fill="white" stroke="#abb9c7"/>')
        svg.append(f'<text x="{offset + 28}" y="40" font-size="17">t{frame}</text>')
        px, py = offset + 180, 130
        x, y = coords[index % 4 if frame == 0 else target]
        svg.append(f'<line x1="{px}" y1="{py}" x2="{offset + x}" y2="{y}" stroke="#475569" stroke-width="3"/>')
        for (x, y), label in [*zip(coords, OPTIONS), ((180, 130), "P")]:
            svg.append(f'<circle cx="{offset + x}" cy="{y}" r="18" fill="#e2efff" stroke="#284766"/>')
            svg.append(f'<text x="{offset + x}" y="{y + 6}" text-anchor="middle" font-size="17">{label}</text>')
    svg = "".join(svg) + "</svg>"
    return "data:image/svg+xml," + quote(svg, safe=""), hashlib.sha256(svg.encode()).hexdigest()


def preview_config():
    """Build the synthetic demo independently of the local study materials."""
    question = {
        "prompt": "後の時刻（t1）で、Pと線で直接つながっているノードはどれですか？",
        "definition": "左右の図は、連続する2つのタイムスタンプのグラフを表しています。",
        "option_ids": OPTIONS,
    }
    labels = (
        "まったく自信がない", "あまり自信がない", "どちらともいえない",
        "やや自信がある", "とても自信がある",
    )
    return {
        "study_version": "preview-v1",
        "stimulus_manifest_version": "synthetic-v1",
        "assignment_version": "rotation-6q-v1",
        "layout_conditions": {layout: {"researcher_algorithm_name": f"Synthetic {layout}"}
                              for layout in LAYOUTS},
        "groups": {
            group: {"trials": [
                {"question_id": qid, "layout_condition_id": LAYOUTS[(offset + index) % len(LAYOUTS)]}
                for index, qid in enumerate(QUESTIONS)
            ]}
            for offset, group in enumerate(GROUPS)
        },
        "practice": dict(question, question_id="P0", stimulus_id="P0-practice"),
        "questions": {
            qid: dict(question, variants={layout: {"stimulus_id": f"{qid}-{layout}"} for layout in LAYOUTS})
            for qid in QUESTIONS
        },
        "confidence": {
            "prompt": "今の回答に、どのくらい自信がありますか？",
            "options": [{"value": value, "label": label} for value, label in enumerate(labels, 1)],
            "default": None,
        },
        "display": {"minimum_viewport_width": 900, "minimum_viewport_height": 600},
    }


def load_study(mode, config_dir, cloud_json=None):
    require(mode in ("preview", "production"), "STUDY_MODE must be preview or production")
    preview = mode == "preview"
    if preview:
        config = preview_config()
        answers = dict(zip(("P0", *QUESTIONS), [OPTIONS[(i + 1) % 4] for i in range(len(QUESTIONS) + 1)]))
    else:
        if cloud_json is None:
            config = read_json(config_dir / "study-config.json")
            key = read_json(config_dir / "answer-key.json")
        else:
            config, key = map(json.loads, cloud_json)
        require(config.get("ready_for_participants") is True, "Study is not marked ready")
        require(not has_placeholder(config) and not has_placeholder(key), "Placeholder in study configuration")
        require(key["stimulus_manifest_version"] == config["stimulus_manifest_version"],
                "Answer key version differs from the stimulus manifest")
        answers = key["correct_option_ids"]

    versions = {field: config[field] for field in VERSIONS}
    require(all(isinstance(v, str) and v.strip() for v in versions.values()), "Missing study version")
    require(preview or not versions["study_version"].lower().startswith("preview"), "Use a production study version")
    require(set(config["groups"]) == set(GROUPS), "Expected Groups A, B, C")
    require(set(config["questions"]) == set(QUESTIONS), "Expected Q1–Q6")
    require(set(config["layout_conditions"]) == set(LAYOUTS), "Expected layouts L1–L3")
    require(set(answers) == {"P0", *QUESTIONS} and all(a in OPTIONS for a in answers.values()),
            "Invalid or missing answer key")
    confidence = config["confidence"]
    require([option["value"] for option in confidence["options"]] == list(range(1, 6)),
            "Expected confidence values 1–5")
    require(isinstance(confidence["prompt"], str) and confidence["prompt"].strip()
            and all(isinstance(option["label"], str) and option["label"].strip()
                    for option in confidence["options"]), "Missing confidence text")
    display = [config["display"][f"minimum_viewport_{axis}"] for axis in ("width", "height")]
    require(all(type(value) is int and value > 0 for value in display), "Set a positive minimum viewport")
    algorithms = {layout: config["layout_conditions"][layout]["researcher_algorithm_name"] for layout in LAYOUTS}
    require(all(isinstance(name, str) and name.strip() for name in algorithms.values()), "Missing algorithm name")

    stimuli = {}
    used_ids = set()
    for index, question_id in enumerate(("P0", *QUESTIONS)):
        practice = index == 0
        question = config["practice"] if practice else config["questions"][question_id]
        require(not practice or question["question_id"] == "P0", "Expected practice P0")
        require(tuple(question["option_ids"]) == OPTIONS, f"{question_id}: expected options A–D")
        labels = question.get("option_labels", {})
        require(isinstance(labels, dict) and set(labels) <= set(OPTIONS)
                and all(isinstance(label, str) for label in labels.values()), "Invalid option labels")
        condition_sizes = set()
        for layout_index, layout in enumerate(("practice",) if practice else LAYOUTS):
            variant = question if practice else question["variants"][layout]
            stimulus_id = variant["stimulus_id"]
            require(isinstance(stimulus_id, str) and stimulus_id.strip() and stimulus_id not in used_ids,
                    f"{question_id}/{layout}: stimulus ID missing or duplicated")
            used_ids.add(stimulus_id)
            source = {field: question.get(field) for field in SOURCE_FIELDS}
            prompt = question["prompt"]
            if preview:
                url, digest = demo_image(index, layout_index)
                source = dict(zip(SOURCE_FIELDS, ("synthetic", question_id, "t0", "t1")))
            else:
                relpath = Path(variant["image_path"])
                static_dir = (ROOT / "static").resolve()
                path = (static_dir / relpath).resolve()
                require(path.is_relative_to(static_dir) and re.fullmatch(r"[\w./-]+", relpath.as_posix())
                        and path.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"),
                        f"{question_id}/{layout}: invalid static image path")
                digest = hashlib.sha256(path.read_bytes()).hexdigest()
                require(variant.get("sha256") in (None, digest), f"{question_id}/{layout}: image hash mismatch")
                with Image.open(path) as image:
                    condition_sizes.add(image.size)
                    require(not getattr(image, "is_animated", False), "Stimulus must be a still image")
                    image.verify()
                url = f"app/static/{quote(relpath.as_posix())}?v={digest}"
                if not practice:
                    require(all(v is not None and str(v).strip() for v in source.values()),
                            f"{question_id}: set data source metadata")
            definition = question["definition"]
            require(all(isinstance(value, str) and value.strip() for value in (prompt, definition)),
                    f"{question_id}: missing prompt or definition")
            stimuli[question_id, layout] = {
                "question_id": question_id, "layout_condition_id": layout, "stimulus_id": stimulus_id,
                "stimulus_sha256": digest, "prompt": prompt, "definition": definition,
                "option_ids": list(OPTIONS), "option_labels": labels,
                "image_url": url, **source,
            }
        require(len(condition_sizes) <= 1, f"{question_id}: image sizes differ between layouts")

    groups = {}
    for group in GROUPS:
        assigned = config["groups"][group]["trials"]
        require(len(assigned) == len(QUESTIONS) and {item["question_id"] for item in assigned} == set(QUESTIONS),
                f"Group {group}: expected each question once")
        keys = [("P0", "practice")] + [(item["question_id"], item["layout_condition_id"]) for item in assigned]
        groups[group] = [
            dict(stimuli[key], trial_index=i, is_practice=i == 0) for i, key in enumerate(keys)
        ]

    feedback = "t1で、Pから伸びている線の先を確認してください。" if preview else config["practice"]["feedback"]
    require(isinstance(feedback, str) and feedback.strip(), "Set practice feedback")
    public = dict(versions, preview=preview, minimum_viewport=display, groups=groups,
                  confidence=confidence,
                  practice_feedback={"answer": answers["P0"], "explanation": feedback})
    return public, answers, algorithms
