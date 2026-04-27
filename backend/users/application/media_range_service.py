"""Helpers for protected media byte-range responses."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from django.core.files.base import File
from django.core.files.storage import default_storage
from django.http import HttpResponse


class InvalidByteRangeError(Exception):
    """Raised when a request range cannot be satisfied."""


@dataclass(frozen=True)
class ByteRange:
    """Resolved single byte-range request."""

    start: int
    end: int
    total_size: int

    @property
    def length(self) -> int:
        """Возвращает длину выбранного диапазона в байтах."""
        return self.end - self.start + 1


def open_protected_media_source(
    normalized_path: str,
    *,
    file_path_override: Path | None = None,
) -> tuple[File, int]:
    """Open a readable media source together with its size."""
    if file_path_override is not None:
        return (
            File(file_path_override.open("rb"), name=file_path_override.name),
            int(file_path_override.stat().st_size),
        )

    file_obj = default_storage.open(normalized_path, "rb")
    size = getattr(file_obj, "size", None)
    if not isinstance(size, int):
        size = int(default_storage.size(normalized_path))
    return file_obj, size


def parse_single_byte_range_header(
    range_header: str | None,
    *,
    file_size: int,
) -> ByteRange | None:
    """Parse a single HTTP Range header for byte serving."""
    if not range_header:
        return None

    normalized_header = range_header.strip()
    if not normalized_header.startswith("bytes="):
        raise InvalidByteRangeError

    if file_size < 1:
        raise InvalidByteRangeError

    range_spec = normalized_header[6:].strip()
    if not range_spec or "," in range_spec or "-" not in range_spec:
        raise InvalidByteRangeError

    start_raw, end_raw = range_spec.split("-", 1)
    if not start_raw and not end_raw:
        raise InvalidByteRangeError

    if not start_raw:
        try:
            suffix_length = int(end_raw)
        except ValueError as error:
            raise InvalidByteRangeError from error
        if suffix_length <= 0:
            raise InvalidByteRangeError
        if suffix_length >= file_size:
            return ByteRange(start=0, end=file_size - 1, total_size=file_size)
        return ByteRange(
            start=file_size - suffix_length,
            end=file_size - 1,
            total_size=file_size,
        )

    try:
        start = int(start_raw)
    except ValueError as error:
        raise InvalidByteRangeError from error

    if start < 0 or start >= file_size:
        raise InvalidByteRangeError

    if end_raw:
        try:
            end = int(end_raw)
        except ValueError as error:
            raise InvalidByteRangeError from error
        if end < start:
            raise InvalidByteRangeError
        end = min(end, file_size - 1)
    else:
        end = file_size - 1

    return ByteRange(start=start, end=end, total_size=file_size)


def build_partial_media_response(
    file_obj: File,
    *,
    byte_range: ByteRange,
    content_type: str,
    cache_control: str,
) -> HttpResponse:
    """Build a partial content response for a single byte-range."""
    if hasattr(file_obj, "seek"):
        file_obj.seek(byte_range.start)
        content = file_obj.read(byte_range.length)
    else:
        content = file_obj.read()[byte_range.start : byte_range.end + 1]

    response = HttpResponse(content, status=206, content_type=content_type)
    response["Accept-Ranges"] = "bytes"
    response["Cache-Control"] = cache_control
    response["Content-Length"] = str(len(content))
    response["Content-Range"] = (
        f"bytes {byte_range.start}-{byte_range.end}/{byte_range.total_size}"
    )
    return response


def build_invalid_range_response(
    *,
    file_size: int,
    content_type: str,
    cache_control: str,
) -> HttpResponse:
    """Build a 416 response for unsatisfied ranges."""
    response = HttpResponse(status=416, content_type=content_type)
    response["Accept-Ranges"] = "bytes"
    response["Cache-Control"] = cache_control
    response["Content-Length"] = "0"
    response["Content-Range"] = f"bytes */{file_size}"
    return response
