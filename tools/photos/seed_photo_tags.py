"""Seed journals/photo-tags.json from the journals and journals/tag-vocabulary.json.

Run from anywhere with:  python -I tools/photos/seed_photo_tags.py

Every gallery tile (an <img> or <video> with the content-image class) in each
journal listed in journals/manifest.json gets an id: its path under
images/travel/ without the extension, e.g. 2025_japan/day14_hakone/fuji1, or
with ".mp4" kept for an animation, e.g. 2023_usa_canada/day3/cruise_gif1.mp4.
Seeds come only from the vocabulary: tag names and synonyms found (whole words,
case- and accent-insensitive) in the tile's caption title, caption text, alt or
aria-label, and image folder and file name. The section heading supplies places
only when the tile's own text names none, and the trip's fallback place below
applies when neither does. Place tags pull in their vocabulary parents.

The file is merged, never overwritten: existing tags (including hand-added ones)
are kept and new seeds are added, so rerunning is safe and idempotent. Ids whose
tile has left the journals are kept and reported, so curation is not lost to a
rename; delete or re-key them by hand.
"""

import html
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "journals" / "manifest.json"
VOCABULARY = ROOT / "journals" / "tag-vocabulary.json"
OUTPUT = ROOT / "journals" / "photo-tags.json"
FACETS = {"place", "subject", "activity", "food", "people", "animal", "season", "weather", "time", "event"}
# Facets whose terms also match a plural (zoo -> zoos, beach -> beaches).
PLURAL_FACETS = {"subject", "activity", "food", "animal"}

# Per-trip facts the captions do not repeat. "place" is the fallback for tiles
# that name no place at all; "tags" apply to every tile. Seasons follow each
# journal's date line and hemisphere. A new journal needs a row here.
TRIPS = {
    "travel_2017_seoul": {"place": "south korea", "tags": ["winter"]},
    "travel_2019_siliconvalley": {"place": "california", "tags": []},
    "travel_2022_europe": {"place": "europe", "tags": ["autumn"]},
    "travel_2023_perth": {"place": "western australia", "tags": ["winter"]},
    "travel_2023_usacanada": {"place": "north america", "tags": ["autumn"]},
    "travel_2024_germany": {"place": "germany", "tags": ["spring"]},
    "travel_2024_australia": {"place": "australia", "tags": ["winter", "honeymoon"]},
    "travel_2025_japan": {"place": "japan", "tags": ["autumn"]},
    "travel_2026_guangzhou": {"place": "guangzhou", "tags": ["spring"]},
}

# (phrase, tag): the tag must not match inside the phrase. "New York" is not
# York, WA; HMAS Sydney II is a memorial in Geraldton; Little Tokyo is in LA.
STOP_PHRASES = [
    ("new york", "york"),
    ("hmas sydney", "sydney"),
    ("little tokyo", "tokyo"),
    ("singapore airlines", "singapore"),
    ("good essen", "essen"),
    ("china-restaurant", "china"),
    ("wombat & friends", "friends"),
    ("winter realm", "winter"),
    ("night king", "night"),
    ("hippo's yawn", "hippo"),
    ("bubble tram", "train"),
    ("fishing boat", "cruise"),
    ("cantonese opera", "cantonese food"),
    ("their apartment", "hotel"),
    ("menlo park", "park"),
    ("green island", "island"),
    ("niagara falls", "waterfall"),
]

MEDIA_RE = re.compile(r"<(img|video)\b[^>]*>", re.I)
H2_RE = re.compile(r"<h2\b[^>]*>(.*?)</h2>", re.I | re.S)
COMMENT_RE = re.compile(r"<!--.*?-->", re.S)


def fold(text):
    text = unicodedata.normalize("NFKD", text.replace("’", "'"))
    return "".join(ch for ch in text if not unicodedata.combining(ch)).lower()


def plain(fragment):
    text = html.unescape(re.sub(r"<[^>]+>", "", fragment))
    return re.sub(r"\s+", " ", text).strip()


def attribute(tag, name):
    match = re.search(r"\s" + name + r'="([^"]*)"', tag)
    return html.unescape(match.group(1)) if match else ""


def caption(segment, cls):
    match = re.search(r'<(\w+)\b[^>]*\bclass="[^"]*\b' + cls + r'\b[^"]*"[^>]*>(.*?)</\1>', segment, re.S)
    return plain(match.group(2)) if match else ""


def is_gallery_media(tag):
    # Australia's banner also carries content-image; banners are not tiles.
    classes = re.search(r'\sclass="([^"]*)"', tag)
    names = classes.group(1).split() if classes else []
    return "content-image" in names and "journal-banner" not in names


def photo_id(src):
    # Images drop their extension so the id survives a JPEG -> WebP swap. Videos
    # keep ".mp4": several share a base name with a still (SF_sutro.jpg and
    # SF_sutro.mp4 are different tiles).
    path = re.sub(r"^images/(travel/)?", "", src)
    if path.lower().endswith(".mp4"):
        return path
    return re.sub(r"\.[A-Za-z0-9]+$", "", path)


def section_headings(markup):
    # Mirrors the h2 numbering in build.ps1's Add-TravelNavigation, including
    # its skip of a leading trip-title heading.
    headings = []
    for index, match in enumerate(H2_RE.finditer(markup)):
        title = plain(match.group(1))
        if index == 0 and re.search(r"(trip|silicon valley)$", title, re.I):
            continue
        headings.append((match.start(), title))
    return headings


def journal_items(slug, markup):
    # Blank comments in place so commented-out tiles are skipped while every
    # offset still lines up with the h2 positions.
    blanked = COMMENT_RE.sub(lambda m: " " * len(m.group(0)), markup)
    headings = section_headings(markup)
    media = [m for m in MEDIA_RE.finditer(blanked) if is_gallery_media(m.group(0))]
    items = []
    for position, match in enumerate(media):
        end = media[position + 1].start() if position + 1 < len(media) else len(blanked)
        segment = blanked[match.end():end]
        tag = match.group(0)
        if match.group(1).lower() == "video":
            body = segment.split("</video>", 1)[0]
            source = re.search(r'<source\b[^>]*\ssrc="([^"]+)"', body)
            src = source.group(1) if source else ""
            alt = attribute(tag, "aria-label")
        else:
            src = attribute(tag, "src")
            alt = attribute(tag, "alt")
        if not src.startswith("images/"):
            # build.ps1 refuses these too: every tile needs a local, indexable file.
            sys.exit(f"{slug}: gallery tile without a local images/ source: {tag[:100]}")
        heading = ""
        for offset, title in headings:
            if offset < match.start():
                heading = title
        items.append({
            "id": photo_id(src),
            "trip": slug,
            "title": caption(segment, "content-title"),
            "text": caption(segment, "content-text"),
            "alt": alt,
            "heading": heading,
        })
    return items


def load_vocabulary():
    vocabulary = json.loads(VOCABULARY.read_text(encoding="utf-8"))
    for name, entry in vocabulary.items():
        if name != name.strip().lower():
            sys.exit(f"vocabulary: tag {name!r} must be lowercase and trimmed")
        if entry.get("facet") not in FACETS:
            sys.exit(f"vocabulary: tag {name!r} has unknown facet {entry.get('facet')!r}")
        if not isinstance(entry.get("synonyms"), list):
            sys.exit(f"vocabulary: tag {name!r} needs a synonyms list")
        parent = entry.get("parent")
        if parent is not None and (parent not in vocabulary or vocabulary[parent]["facet"] != "place"):
            sys.exit(f"vocabulary: tag {name!r} has unknown parent place {parent!r}")
    for trip in TRIPS.values():
        for name in [trip["place"]] + trip["tags"]:
            if name not in vocabulary:
                sys.exit(f"seed_photo_tags.py: trip tag {name!r} is not in the vocabulary")
    return vocabulary


def build_matchers(vocabulary):
    matchers = []
    for name, entry in vocabulary.items():
        terms = sorted({fold(term) for term in [name] + entry["synonyms"] if term.strip()}, key=len, reverse=True)
        suffix = r"(?:e?s)?" if entry["facet"] in PLURAL_FACETS else ""
        pattern = r"(?<!\w)(?:" + "|".join(re.escape(term) for term in terms) + r")" + suffix + r"(?!\w)"
        stops = [fold(phrase) for phrase, tag in STOP_PHRASES if tag == name]
        matchers.append((name, entry["facet"], re.compile(pattern), stops))
    return matchers


def match_tags(text, matchers):
    text = fold(text)
    found = set()
    for name, _facet, pattern, stops in matchers:
        candidate = text
        for phrase in stops:
            candidate = candidate.replace(phrase, " " * len(phrase))
        if pattern.search(candidate):
            found.add(name)
    return found


def with_parents(tags, vocabulary):
    result = set(tags)
    for name in tags:
        parent = vocabulary[name].get("parent")
        while parent and parent not in result:
            result.add(parent)
            parent = vocabulary[parent].get("parent")
    return result


def seed(item, vocabulary, matchers):
    path = re.sub(r"\.mp4$", "", item["id"].split("/", 1)[-1])
    path_words = re.sub(r"[_\-/]+|\d+", " ", path)
    own = match_tags(" | ".join([item["title"], item["text"], item["alt"], path_words]), matchers)
    places = {tag for tag in own if vocabulary[tag]["facet"] == "place"}
    if not places:
        places = {tag for tag in match_tags(item["heading"], matchers) if vocabulary[tag]["facet"] == "place"}
    trip = TRIPS.get(item["trip"])
    if not places and trip:
        places = {trip["place"]}
    tags = own | with_parents(places, vocabulary)
    if trip:
        tags.update(trip["tags"])
    if "us" in tags:
        tags.update({"nicholas", "yx"})
    elif {"nicholas", "yx"} <= tags:
        tags.add("us")
    return tags


def write_tags(tags_by_id):
    lines = [f"  {json.dumps(key, ensure_ascii=False)}: {json.dumps(tags_by_id[key], ensure_ascii=False)}" for key in sorted(tags_by_id)]
    content = "{\n" + ",\n".join(lines) + "\n}\n"
    if OUTPUT.exists() and OUTPUT.read_text(encoding="utf-8") == content:
        return False
    OUTPUT.write_text(content, encoding="utf-8", newline="\n")
    return True


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    vocabulary = load_vocabulary()
    matchers = build_matchers(vocabulary)
    manifest = sorted(json.loads(MANIFEST.read_text(encoding="utf-8")), key=lambda journal: journal["order"])
    items = []
    for journal in manifest:
        if journal["slug"] not in TRIPS:
            print(f"warning: {journal['slug']} has no TRIPS row; its tiles get no fallback place or season")
        items.extend(journal_items(journal["slug"], (ROOT / journal["source"]).read_text(encoding="utf-8")))

    existing = json.loads(OUTPUT.read_text(encoding="utf-8")) if OUTPUT.exists() else {}
    merged = {key: sorted(set(value)) for key, value in existing.items()}
    seen = set()
    added = 0
    for item in items:
        if item["id"] in seen:
            print(f"warning: duplicate tile id {item['id']} (the same file appears twice); tags are shared")
        seen.add(item["id"])
        current = set(merged.get(item["id"], []))
        combined = current | seed(item, vocabulary, matchers)
        added += len(combined - current)
        merged[item["id"]] = sorted(combined)

    for key in sorted(set(merged) - seen):
        print(f"warning: {key} is in photo-tags.json but no journal tile uses it; kept for re-keying")
    for key in sorted(merged):
        unknown = [tag for tag in merged[key] if tag not in vocabulary]
        if unknown:
            print(f"warning: {key} has tags missing from the vocabulary: {', '.join(unknown)}")

    sparse = [key for key in sorted(seen) if len(merged[key]) < 3]
    changed = write_tags(merged)
    print(f"Found {len(items)} gallery tiles ({len(seen)} ids) across {len(manifest)} journals.")
    print(f"Added {added} tags; photo-tags.json {'updated' if changed else 'unchanged'}.")
    print(f"{len(sparse)} tiles have fewer than 3 tags" + (":" if sparse else "."))
    for key in sparse:
        print(f"  {key}: {', '.join(merged[key]) or '(none)'}")


if __name__ == "__main__":
    main()
