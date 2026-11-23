#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import sqlite3
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = ROOT.parent.parent
SOURCE = ROOT / "production_items.json"
DATABASE = ROOT / "production.db"
FIELDS = (
    "id",
    "original_item_id",
    "kind",
    "version",
    "enabled",
    "name_zh",
    "description_zh",
    "story_text",
    "story_status",
    "image_path",
    "image_status",
    "mechanics_override_json",
    "production_stage",
)
KINDS = {"building", "upgrade", "spell", "trophy", "alignment", "faction", "exchange"}
PROGRESS_STATES = {"not_started", "in_progress", "done"}
IMAGE_STATES = PROGRESS_STATES | {"not_required"}
SCHEMA = """
CREATE TABLE production_items (
    id TEXT PRIMARY KEY,
    original_item_id TEXT,
    kind TEXT NOT NULL,
    version TEXT,
    enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
    name_zh TEXT NOT NULL,
    description_zh TEXT NOT NULL DEFAULT '',
    story_text TEXT,
    story_status TEXT NOT NULL CHECK (story_status IN ('not_started', 'in_progress', 'done')),
    image_path TEXT,
    image_status TEXT NOT NULL CHECK (image_status IN ('not_started', 'in_progress', 'done', 'not_required')),
    mechanics_override_json TEXT,
    production_stage TEXT NOT NULL CHECK (production_stage IN ('not_started', 'in_progress', 'done'))
);
"""


def dump(value) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def fail(errors: list[str]) -> None:
    if errors:
        raise ValueError("\n".join(errors))


def load_items() -> list[dict]:
    document = json.loads(SOURCE.read_text(encoding="utf-8"))
    if set(document) != {"schema_version", "defaults", "version_defaults", "items"}:
        raise ValueError("Source must contain schema_version, defaults, version_defaults and items")
    if document["schema_version"] != 1:
        raise ValueError("Unsupported source schema_version")
    defaults = document["defaults"]
    version_defaults = document["version_defaults"]
    errors = []
    for field in set(defaults) - set(FIELDS):
        errors.append(f"Unknown default field: {field}")
    for version, values in version_defaults.items():
        if not re.fullmatch(r"\d+\.\d+\.\d+", version):
            errors.append(f"Invalid default version: {version}")
        for field in set(values) - set(FIELDS):
            errors.append(f"Unknown {version} default field: {field}")
    fail(errors)
    return [normalize_item(item, defaults, version_defaults) for item in document["items"]]


def normalize_item(item: dict, defaults: dict, version_defaults: dict) -> dict:
    if not isinstance(item, dict):
        raise ValueError("Every item must be an object")
    unknown = set(item) - set(FIELDS)
    if unknown:
        raise ValueError(f"{item.get('id', '<unknown>')}: unknown fields {sorted(unknown)}")
    version = item.get("version")
    values = {**defaults, **version_defaults.get(version, {}), **item}
    missing = set(FIELDS) - set(values)
    if missing:
        raise ValueError(f"{item.get('id', '<unknown>')}: missing fields {sorted(missing)}")
    return {field: values[field] for field in FIELDS}


def validate_items(items: list[dict]) -> None:
    errors = []
    ids = set()
    for item in items:
        item_id = item["id"]
        label = item_id if isinstance(item_id, str) and item_id else "<missing id>"
        if not isinstance(item_id, str) or not item_id.strip():
            errors.append("Every item needs a non-empty string id")
        elif item_id in ids:
            errors.append(f"{item_id}: duplicate id")
        ids.add(item_id)
        if item["kind"] not in KINDS:
            errors.append(f"{label}: invalid kind {item['kind']}")
        version = item["version"]
        if version is not None and (not isinstance(version, str) or not re.fullmatch(r"\d+\.\d+\.\d+", version)):
            errors.append(f"{label}: invalid version {version}")
        if item["enabled"] not in (0, 1):
            errors.append(f"{label}: enabled must be 0 or 1")
        if item["enabled"] == 1 and version is None:
            errors.append(f"{label}: an enabled item needs an implementation version")
        if not isinstance(item["name_zh"], str) or not item["name_zh"].strip():
            errors.append(f"{label}: name_zh is required")
        for field in ("original_item_id", "description_zh", "story_text", "image_path"):
            if item[field] is not None and not isinstance(item[field], str):
                errors.append(f"{label}: {field} must be a string or null")
        if item["production_stage"] not in PROGRESS_STATES:
            errors.append(f"{label}: invalid production_stage")
        if item["story_status"] not in PROGRESS_STATES:
            errors.append(f"{label}: invalid story_status")
        if item["image_status"] not in IMAGE_STATES:
            errors.append(f"{label}: invalid image_status")
        if item["story_status"] == "done" and not (item["story_text"] or "").strip():
            errors.append(f"{label}: done story needs story_text")
        image_path = item["image_path"]
        if item["image_status"] == "done":
            if not image_path:
                errors.append(f"{label}: done image needs image_path")
            elif image_path.endswith("red-cross.svg"):
                errors.append(f"{label}: placeholder cannot be a done image")
            elif not (PROJECT_ROOT / image_path).is_file():
                errors.append(f"{label}: missing image file {image_path}")
        if item["image_status"] == "not_required" and image_path is not None:
            errors.append(f"{label}: not_required image must have a null image_path")
        override = item["mechanics_override_json"]
        if override is not None and not isinstance(override, dict):
            errors.append(f"{label}: mechanics_override_json must be an object or null")
    fail(errors)


def database_value(value):
    return dump(value) if isinstance(value, dict) else value


def expected_rows(items: list[dict]) -> list[tuple]:
    return [tuple(database_value(item[field]) for field in FIELDS) for item in items]


def write_database(items: list[dict]) -> None:
    temporary = DATABASE.with_suffix(".db.tmp")
    temporary.unlink(missing_ok=True)
    try:
        connection = sqlite3.connect(temporary)
        try:
            connection.execute("PRAGMA foreign_keys = ON")
            connection.execute(SCHEMA)
            connection.executemany(
                f"INSERT INTO production_items ({', '.join(FIELDS)}) VALUES ({', '.join('?' for _ in FIELDS)})",
                expected_rows(items),
            )
            connection.commit()
            result = connection.execute("PRAGMA integrity_check").fetchone()[0]
            if result != "ok":
                raise ValueError(f"SQLite integrity_check failed: {result}")
        finally:
            connection.close()
        os.replace(temporary, DATABASE)
    finally:
        temporary.unlink(missing_ok=True)


def check_database(items: list[dict]) -> None:
    if not DATABASE.is_file():
        raise ValueError(f"Missing database: {DATABASE}")
    connection = sqlite3.connect(f"file:{DATABASE}?mode=ro", uri=True)
    try:
        result = connection.execute("PRAGMA integrity_check").fetchone()[0]
        if result != "ok":
            raise ValueError(f"SQLite integrity_check failed: {result}")
        actual = connection.execute(f"SELECT {', '.join(FIELDS)} FROM production_items").fetchall()
        if actual != expected_rows(items):
            raise ValueError("production.db differs from production_items.json; run build.py")
    finally:
        connection.close()


def print_summary(items: list[dict]) -> None:
    versions = Counter(item["version"] or "unimplemented" for item in items)
    images = Counter(item["image_status"] for item in items)
    stories = Counter(item["story_status"] for item in items)
    production = Counter(item["production_stage"] for item in items)
    print(f"Items: {len(items)}")
    print("Versions:", dict(sorted(versions.items())))
    print("Images:", dict(sorted(images.items())))
    print("Stories:", dict(sorted(stories.items())))
    print("Production:", dict(sorted(production.items())))


def main() -> None:
    parser = argparse.ArgumentParser(description="Build and validate Infinite Work Hours production content")
    parser.add_argument("--check", action="store_true", help="validate source and database without writing")
    args = parser.parse_args()
    items = load_items()
    validate_items(items)
    if args.check:
        check_database(items)
        print(f"Validation passed: {DATABASE}")
    else:
        write_database(items)
        check_database(items)
        print(f"Database written: {DATABASE}")
    print_summary(items)


if __name__ == "__main__":
    main()
