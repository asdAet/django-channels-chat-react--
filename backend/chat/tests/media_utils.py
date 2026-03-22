"""Utilities for media-related chat tests."""

from __future__ import annotations

import shutil
from contextlib import contextmanager
from pathlib import Path
from uuid import uuid4

from django.test import override_settings


@contextmanager
def workspace_media_root():
    """Provide a writable MEDIA_ROOT inside the workspace for Windows-safe tests."""

    backend_root = Path(__file__).resolve().parents[2]
    media_root = backend_root / "tmp_test_media" / f"chat-tests-{uuid4().hex}"
    media_root.mkdir(parents=True, exist_ok=False)
    try:
        with override_settings(MEDIA_ROOT=str(media_root)):
            yield str(media_root)
    finally:
        # Windows can keep attachment handles alive briefly during storage cleanup.
        shutil.rmtree(media_root, ignore_errors=True)
