"""Helpers for asserting stored Django file fields in tests."""

from __future__ import annotations

from django.db.models.fields.files import FieldFile


def require_stored_file_name(field_file: FieldFile, *, field_name: str) -> str:
    """Returns a persisted file name or fails with a clear invariant message."""

    file_name = field_file.name
    if not isinstance(file_name, str) or not file_name:
        raise AssertionError(f"{field_name} must have a stored file name")
    return file_name
