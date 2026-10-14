"""Confirmed, resumable deletion of owned live data without a schema/ML change."""
from __future__ import annotations

import math
import re
import time

from app.access_foundation import AccessDenied
from .media import failure


def require_recent_sign_in(identity):
    stamp=identity.auth_time
    now=time.time()
    if isinstance(stamp,bool) or not isinstance(stamp,(int,float)) or not math.isfinite(stamp) or stamp>now+30 or now-stamp>300:
        raise failure(403,"recent_sign_in_required","Sign out and sign in again before deleting your account.")


class AccountLifecycleStore:
    def request_account_deletion(self,identity,confirmed_reference):
        require_recent_sign_in(identity)
        with self._connection(write=True) as db:
            actor=self._actor(db,identity)
            if actor["public_id"] != confirmed_reference:
                raise failure(409,"account_confirmation_mismatch","Confirm the current account reference.")
            if actor["role"]=="admin" and db.execute("SELECT COUNT(*) FROM af_users WHERE role='admin' AND status='active' AND email_verified=1").fetchone()[0]<=1:
                raise AccessDenied("The last active administrator cannot be removed.")
            own="SELECT id FROM af_recordings WHERE owner_id=?"
            if db.execute(f"SELECT 1 FROM m1_jobs WHERE recording_id IN ({own}) AND status='processing' LIMIT 1",(actor["id"],)).fetchone():
                raise failure(409,"processing_in_progress","Wait for your current processing job to finish before deleting the account.")
            files=[row[0] for row in db.execute(f"SELECT f.relative_path FROM m1_files f JOIN af_resources r ON r.id=f.resource_id WHERE r.recording_id IN ({own})",(actor["id"],))]
            if any(not re.fullmatch(r"[0-9a-f]{32}\.(wav|png)",name) for name in files):
                raise failure(503,"deletion_unavailable","Private storage needs operator verification before deletion.")
            settings=self._settings(db,actor["id"])
            settings["account_lifecycle"]={"state":"requested","requested_at":int(time.time()),"files":files,"provider_deleted":False}
            self._save_settings(db,actor["id"],settings)
            db.execute("UPDATE af_users SET status='disabled',updated_at=? WHERE id=?",(int(time.time()),actor["id"]))
            db.execute("UPDATE af_grants SET status='revoked',revoked_at=? WHERE (grantor_id=? OR recipient_id=?) AND status='active'",(int(time.time()),actor["id"],actor["id"]))
            self._audit(db,actor["id"],"account.deletion_requested",actor["id"])
            return actor["id"]

    def pending_account_deletions(self):
        with self._connection() as db:
            return [row[0] for row in db.execute("SELECT p.user_id FROM m1_preferences p JOIN af_users u ON u.id=p.user_id WHERE u.status='disabled'") if self._settings(db,row[0]).get("account_lifecycle",{}).get("state")=="requested"]

    def finish_account_deletion(self,user_id,private_root):
        root=private_root.resolve()
        with self._connection() as db:
            actor=db.execute("SELECT * FROM af_users WHERE id=? AND status='disabled'",(user_id,)).fetchone()
            settings=self._settings(db,user_id)
            lifecycle=settings.get("account_lifecycle",{})
            if actor is None or lifecycle.get("state") not in {"requested","deleted"}:
                raise AccessDenied("Access denied.")
            files=lifecycle.get("files",[])
        # Each exact flat UUID file was journalled before any unlink. A crash leaves
        # access revoked and this durable list for a bounded startup retry.
        for name in files:
            if not isinstance(name,str) or not re.fullmatch(r"[0-9a-f]{32}\.(wav|png)",name):
                raise failure(503,"deletion_unavailable","Private storage needs operator verification.")
            target=root/name
            if target.is_symlink() or target.resolve().parent!=root:
                raise failure(503,"deletion_unavailable","Private storage needs operator verification.")
            try:
                target.unlink(missing_ok=True)
            except OSError:
                raise failure(503,"deletion_pending","Access is closed. Data removal needs a storage retry.") from None
        with self._connection(write=True) as db:
            settings=self._settings(db,user_id)
            lifecycle=settings.get("account_lifecycle",{})
            if lifecycle.get("state")=="deleted":
                return
            own="SELECT id FROM af_recordings WHERE owner_id=?"
            ids=(user_id,)
            db.execute(f"DELETE FROM m1_reviews WHERE assignment_id IN (SELECT id FROM af_grants WHERE recording_id IN ({own}))",ids)
            db.execute(f"DELETE FROM m1_result_files WHERE result_id IN (SELECT id FROM m1_results WHERE recording_id IN ({own}))",ids)
            db.execute(f"DELETE FROM m1_results WHERE recording_id IN ({own})",ids)
            db.execute(f"DELETE FROM m1_jobs WHERE recording_id IN ({own})",ids)
            db.execute(f"DELETE FROM m1_files WHERE resource_id IN (SELECT id FROM af_resources WHERE recording_id IN ({own}))",ids)
            db.execute(f"DELETE FROM m1_recording_data WHERE recording_id IN ({own})",ids)
            db.execute(f"DELETE FROM af_grants WHERE recording_id IN ({own})",ids)
            db.execute(f"DELETE FROM af_resources WHERE recording_id IN ({own})",ids)
            db.execute("DELETE FROM af_recordings WHERE owner_id=?",ids)
            db.execute("UPDATE af_users SET email='',display_name='Deleted account',email_verified=0,updated_at=? WHERE id=?",(int(time.time()),user_id))
            lifecycle.update(state="deleted",deleted_at=int(time.time()),files=[])
            self._save_settings(db,user_id,{"account_lifecycle":lifecycle})
            self._audit(db,user_id,"account.live_data_deleted",user_id)

    def record_provider_deletion(self,user_id,confirmed):
        with self._connection(write=True) as db:
            settings=self._settings(db,user_id)
            lifecycle=settings.get("account_lifecycle",{})
            if lifecycle.get("state")!="deleted":
                raise AccessDenied("Access denied.")
            lifecycle["provider_deleted"]=confirmed is True
            self._save_settings(db,user_id,settings)
            self._audit(db,user_id,"account.provider_deleted" if confirmed else "account.provider_removal_pending",user_id)
