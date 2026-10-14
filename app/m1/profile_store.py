"""Owner-only profile material and account metadata in the existing private DB."""
from __future__ import annotations

import base64
import hashlib
import json
import struct
import time
import zlib

from .media import failure

PRIVATE_PREFERENCES = {"profile_avatar", "account_lifecycle", "notification_cursor"}


def canonical_avatar(data: bytes) -> bytes:
    """Bounded non-interlaced RGB/RGBA PNG, with metadata and trailing data removed."""
    if len(data) > 300_000:
        raise failure(413, "avatar_too_large", "Choose an image that can be cropped to a small profile picture.")
    try:
        if data[:8] != b"\x89PNG\r\n\x1a\n":
            raise ValueError
        offset, header, compressed, ended, count = 8, None, bytearray(), False, 0
        while offset < len(data):
            length = struct.unpack_from(">I", data, offset)[0]
            kind = data[offset + 4:offset + 8]
            if length > 300_000 or offset + 12 + length > len(data):
                raise ValueError
            chunk = data[offset + 8:offset + 8 + length]
            crc = struct.unpack_from(">I", data, offset + 8 + length)[0]
            if zlib.crc32(kind + chunk) & 0xffffffff != crc:
                raise ValueError
            count += 1
            if count > 128 or (header is None and kind != b"IHDR"):
                raise ValueError
            if kind == b"IHDR":
                if header is not None or length != 13:
                    raise ValueError
                header = chunk
            elif kind == b"IDAT":
                compressed.extend(chunk)
            elif kind == b"IEND":
                if length or offset + 12 != len(data):
                    raise ValueError
                ended = True
                break
            elif kind in {b"acTL", b"fcTL", b"fdAT"} or kind[:1].isupper():
                raise ValueError
            offset += length + 12
        if not header or not ended or not compressed:
            raise ValueError
        width, height, depth, colour, compression, filtering, interlace = struct.unpack(">IIBBBBB", header)
        if not (1 <= width <= 256 and 1 <= height <= 256) or depth != 8 or colour not in (2, 6) or compression or filtering or interlace:
            raise ValueError
        row = width * (4 if colour == 6 else 3) + 1
        decoder = zlib.decompressobj()
        pixels = decoder.decompress(compressed, row * height + 1)
        if len(pixels) != row * height or not decoder.eof or decoder.unused_data or decoder.unconsumed_tail:
            raise ValueError
        if any(pixels[y * row] > 4 for y in range(height)):
            raise ValueError
        def pack(kind, value):
            return struct.pack(">I", len(value)) + kind + value + struct.pack(">I", zlib.crc32(kind + value) & 0xffffffff)
        return b"\x89PNG\r\n\x1a\n" + pack(b"IHDR", header) + pack(b"IDAT", zlib.compress(pixels, 9)) + pack(b"IEND", b"")
    except (ValueError, struct.error, zlib.error, IndexError):
        raise failure(422, "invalid_avatar", "Use a cropped, static PNG profile picture.") from None


class ProfileStore:
    @staticmethod
    def _settings(db, user_id):
        row = db.execute("SELECT preferences_json FROM m1_preferences WHERE user_id=?", (user_id,)).fetchone()
        return json.loads(row[0]) if row else {}

    @staticmethod
    def _save_settings(db, user_id, value):
        db.execute("INSERT INTO m1_preferences VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET preferences_json=excluded.preferences_json", (user_id, json.dumps(value)))

    def avatar(self, identity, data=None, *, remove=False):
        normal = canonical_avatar(data) if data is not None else None
        with self._connection(write=data is not None or remove) as db:
            actor = self._actor(db, identity)
            settings = self._settings(db, actor["id"])
            if normal is not None:
                settings["profile_avatar"] = {"mime": "image/png", "base64": base64.b64encode(normal).decode("ascii"), "revision": hashlib.sha256(normal).hexdigest()}
            if remove:
                settings.pop("profile_avatar", None)
            if normal is not None or remove:
                self._save_settings(db, actor["id"], settings)
                self._audit(db, actor["id"], "profile.avatar_removed" if remove else "profile.avatar_changed", actor["id"])
            return settings.get("profile_avatar")

    def export_metadata(self, identity):
        with self._connection() as db:
            actor = self._actor(db, identity)
            count = db.execute("SELECT COUNT(*) FROM af_recordings WHERE owner_id=?", (actor["id"],)).fetchone()[0]
            if count > 1000:
                raise failure(413, "export_too_large", "This workspace needs an operator-assisted export.")
            own = "SELECT id FROM af_recordings WHERE owner_id=?"
            records = [dict(row) for row in db.execute("SELECT r.id,r.public_id,r.created_at,d.* FROM af_recordings r JOIN m1_recording_data d ON d.recording_id=r.id WHERE r.owner_id=? ORDER BY r.created_at,r.id", (actor["id"],))]
            jobs = [dict(row) for row in db.execute(f"SELECT id,public_id,recording_id,status,created_at,started_at,completed_at,error_code,model_version FROM m1_jobs WHERE recording_id IN ({own})", (actor["id"],))]
            results = [dict(row) for row in db.execute(f"SELECT id,public_id,recording_id,job_id,created_at,method_label,provenance_json FROM m1_results WHERE recording_id IN ({own})", (actor["id"],))]
            grants = [dict(row) for row in db.execute(f"SELECT id,public_id,recording_id,resource_id,recipient_id,permission,status,created_at,revoked_at,expires_at FROM af_grants WHERE recording_id IN ({own})", (actor["id"],))]
            reviews = [dict(row) for row in db.execute(f"SELECT r.* FROM m1_reviews r JOIN af_grants g ON g.id=r.assignment_id WHERE g.recording_id IN ({own})", (actor["id"],))]
            settings = {k: v for k, v in self._settings(db, actor["id"]).items() if k not in PRIVATE_PREFERENCES}
            return {"format": "stethofuse-account-metadata-v1", "exported_at": int(time.time()), "scope": "own_account_and_owned_recordings", "audio_included": False, "account": self.user_dto(actor), "preferences": settings, "recordings": records, "jobs": jobs, "results": results, "grants": grants, "reviews": reviews}
