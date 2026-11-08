"""Additive analysis state within the existing result/provenance transaction domain."""
import json
import time
from uuid import uuid4

from app.access_foundation import AccessDenied
from .analysis_engine import ANALYSIS_VERSION


class AnalysisStore:
    def analysis(self, identity, result_id):
        result = self.results(identity, result_id)
        return (result.get("provenance") or {}).get("analysis") or {
            "version": ANALYSIS_VERSION, "status": "not_analyzed", "components": {}}

    def request_analysis(self, identity, result_id):
        with self._connection(write=True) as db:
            actor = self._actor(db, identity)
            row = db.execute("SELECT * FROM m1_results WHERE id=?", (result_id,)).fetchone()
            if row is None:
                raise AccessDenied("Access denied.")
            self._owner(db, actor, row["recording_id"])
            provenance = json.loads(row["provenance_json"] or "{}")
            current = provenance.get("analysis")
            if current and current.get("version") == ANALYSIS_VERSION:
                if current.get("status") in ("complete", "queued", "processing", "partial"):
                    return current
                if int(time.time()) - current.get("completed_at", 0) < 60:
                    return current
            value = {"version": ANALYSIS_VERSION, "run_id": uuid4().hex,
                     "status": "queued", "requested_at": int(time.time()),
                     "attempts": 0, "components": {}}
            provenance["analysis"] = value
            db.execute("UPDATE m1_results SET provenance_json=? WHERE id=?",
                       (json.dumps(provenance, sort_keys=True), result_id))
            self._audit(db, actor["id"], "analysis.requested", result_id)
            return value

    def claim_analysis(self):
        with self._connection(write=True) as db:
            row = db.execute("SELECT r.*,o.owner_id FROM m1_results r "
                             "JOIN af_recordings o ON o.id=r.recording_id "
                             "WHERE json_extract(r.provenance_json,'$.analysis.status')='queued' "
                             "ORDER BY r.created_at,r.id LIMIT 1").fetchone()
            if row is None:
                return None
            provenance = json.loads(row["provenance_json"])
            value = provenance["analysis"]
            try:
                self._active_user(db, row["owner_id"])
            except AccessDenied:
                value.update({"status": "unavailable", "error_code": "owner_unavailable",
                              "completed_at": int(time.time())})
                db.execute("UPDATE m1_results SET provenance_json=? WHERE id=?",
                           (json.dumps(provenance, sort_keys=True), row["id"]))
                return None
            files = db.execute("SELECT f.*,r.kind FROM m1_files f JOIN af_resources r "
                               "ON r.id=f.resource_id WHERE r.recording_id=? "
                               "AND (f.resource_id=(SELECT original_resource_id FROM m1_recording_data WHERE recording_id=?) "
                               "OR f.resource_id IN (SELECT resource_id FROM m1_result_files WHERE result_id=?))",
                               (row["recording_id"], row["recording_id"], row["id"])).fetchall()
            value.update({"status": "processing", "started_at": int(time.time()),
                          "attempts": value.get("attempts", 0) + 1})
            db.execute("UPDATE m1_results SET provenance_json=? WHERE id=?",
                       (json.dumps(provenance, sort_keys=True), row["id"]))
            return {"result_id": row["id"], "owner_id": row["owner_id"],
                    "recording_id": row["recording_id"], "run_id": value["run_id"],
                    "files": {r["kind"]: dict(r) for r in files}}

    def complete_analysis(self, request, analysis):
        with self._connection(write=True) as db:
            row = db.execute("SELECT * FROM m1_results WHERE id=?", (request["result_id"],)).fetchone()
            if row is None:
                return False
            provenance = json.loads(row["provenance_json"] or "{}")
            current = provenance.get("analysis", {})
            if current.get("run_id") != request["run_id"] or current.get("status") != "processing":
                return False
            try:
                self._active_user(db, request["owner_id"])
            except AccessDenied:
                # An administrator may disable the account during inference.
                # Discard its findings without terminating the shared worker.
                provenance["analysis"] = {**current, "status": "unavailable",
                                          "error_code": "owner_unavailable",
                                          "completed_at": int(time.time())}
                db.execute("UPDATE m1_results SET provenance_json=? WHERE id=?",
                           (json.dumps(provenance, sort_keys=True), row["id"]))
                return False
            provenance["analysis"] = {**analysis, "run_id": request["run_id"],
                                      "requested_at": current.get("requested_at"),
                                      "attempts": current.get("attempts", 1)}
            db.execute("UPDATE m1_results SET provenance_json=? WHERE id=?",
                       (json.dumps(provenance, sort_keys=True, allow_nan=False), row["id"]))
            self._audit(db, request["owner_id"], "analysis.completed", row["id"])
            return True

    def recover_interrupted_analysis(self):
        # Called only under the existing process-lifetime exclusive worker lock.
        with self._connection(write=True) as db:
            rows = db.execute("SELECT id,provenance_json FROM m1_results "
                              "WHERE json_extract(provenance_json,'$.analysis.status')='processing'").fetchall()
            for row in rows:
                provenance = json.loads(row["provenance_json"])
                value = provenance["analysis"]
                if value.get("attempts", 0) < 2:
                    value["status"] = "queued"
                else:
                    value.update({"status": "unavailable", "error_code": "analysis_interrupted",
                                  "completed_at": int(time.time())})
                db.execute("UPDATE m1_results SET provenance_json=? WHERE id=?",
                           (json.dumps(provenance, sort_keys=True), row["id"]))
