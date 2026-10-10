"""Validate a tagging-agent output file against the vocabulary and its manifest.

Usage: python -I tools/photos/validate_tags.py tools/photos/work/tags/<chunk>.json

The output file has the shape {"tags": {"<id>": ["tag", ...]}, "suggest_new": {...}, "notes": [...]}.
Exit code 1 lists every problem; exit code 0 means the file can be merged into
journals/photo-tags.json.
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
MIN_TAGS = 3
MAX_TAGS = 14


def main(path: str) -> int:
    out = pathlib.Path(path)
    data = json.loads(out.read_text(encoding="utf-8"))
    vocab = json.loads((ROOT / "journals/tag-vocabulary.json").read_text(encoding="utf-8"))
    manifest_name = out.name
    manifest = ROOT / "tools/photos/work/manifests" / manifest_name
    if not manifest.exists():
        print(f"no manifest named {manifest_name}; the output file must share its manifest's name")
        return 1
    expected = [item["id"] for item in json.loads(manifest.read_text(encoding="utf-8"))["items"]]
    tags = data.get("tags")
    problems = []
    if not isinstance(tags, dict):
        problems.append('top-level "tags" must be an object keyed by photo id')
        tags = {}
    for photo_id in expected:
        if photo_id not in tags:
            problems.append(f"missing id: {photo_id}")
    for photo_id, photo_tags in tags.items():
        if photo_id not in expected:
            problems.append(f"unexpected id (not in manifest): {photo_id}")
            continue
        if not isinstance(photo_tags, list) or not all(isinstance(t, str) for t in photo_tags):
            problems.append(f"{photo_id}: tags must be a list of strings")
            continue
        unknown = [t for t in photo_tags if t not in vocab]
        if unknown:
            problems.append(f"{photo_id}: not in vocabulary: {', '.join(unknown)}")
        if len(set(photo_tags)) != len(photo_tags):
            problems.append(f"{photo_id}: duplicate tags")
        if len(photo_tags) < MIN_TAGS:
            problems.append(f"{photo_id}: only {len(photo_tags)} tags (minimum {MIN_TAGS})")
        if len(photo_tags) > MAX_TAGS:
            problems.append(f"{photo_id}: {len(photo_tags)} tags (maximum {MAX_TAGS}); keep the specific ones")
    for problem in problems:
        print(problem)
    if problems:
        print(f"{len(problems)} problem(s)")
        return 1
    print(f"ok: {len(tags)} items tagged, {sum(len(t) for t in tags.values()) / max(len(tags), 1):.1f} tags per item")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
