"""Recent real workflow updates, always resolved for the current account."""
from __future__ import annotations

import hashlib
import time


class NotificationStore:
    def _notification_rows(self,db,actor,settings):
        options=settings.get('notifications',{})
        if not isinstance(options,dict):
            options={}
        events=[]
        if options.get('jobNotifications') is not False:
            rows=db.execute("SELECT j.* FROM m1_jobs j JOIN af_recordings r ON r.id=j.recording_id WHERE r.owner_id=? ORDER BY COALESCE(j.completed_at,j.started_at,j.created_at) DESC,j.id LIMIT 100",(actor['id'],))
            titles={'queued':'Your recording is queued','processing':'Sound separation started','succeeded':'Your separation result is ready','failed':'Sound separation needs attention'}
            for row in rows:
                if row['status'] not in titles:
                    continue
                stamp=row['completed_at'] or row['started_at'] or row['created_at']
                events.append({'id':f"job-{row['id']}-{row['status']}-{stamp}",'kind':'processing','title':titles[row['status']],'occurred_at':stamp,'href':f"/app/results/{row['result_id']}" if row['status']=='succeeded' and row['result_id'] else f"/app/recordings/{row['recording_id']}"})
        if options.get('reviewNotifications') is not False:
            rows=db.execute("SELECT v.*,g.recording_id FROM m1_reviews v JOIN af_grants g ON g.id=v.assignment_id JOIN af_recordings r ON r.id=g.recording_id WHERE r.owner_id=? ORDER BY v.updated_at DESC,v.assignment_id LIMIT 100",(actor['id'],))
            for row in rows:
                revision=hashlib.sha256((row['decision']+'\0'+row['notes']).encode()).hexdigest()[:16]
                events.append({'id':f"review-{row['assignment_id']}-{row['updated_at']}-{revision}",'kind':'review','title':'An analyst saved a review','occurred_at':row['updated_at'],'href':f"/app/recordings/{row['recording_id']}"})
            rows=db.execute("SELECT g.*,u.status AS owner_status,u.email_verified AS owner_verified FROM af_grants g JOIN af_users u ON u.id=g.grantor_id WHERE g.recipient_id=? ORDER BY COALESCE(g.revoked_at,g.created_at) DESC,g.id LIMIT 100",(actor['id'],))
            now=int(time.time())
            for row in rows:
                expired=row['expires_at'] is not None and row['expires_at']<=now
                available=row['status']=='active' and not expired and row['owner_status']=='active' and row['owner_verified']==1
                stamp=row['revoked_at'] or (row['expires_at'] if expired else row['created_at'])
                state='shared' if available else 'closed'
                events.append({'id':f"grant-{row['id']}-{state}-{stamp}",'kind':'sharing','title':('A recording was assigned for your review' if row['permission']=='review' else 'A recording was shared with you') if available else 'Shared access has closed','occurred_at':stamp,'href':'/app/shared'})
        return sorted(events,key=lambda event:(-event['occurred_at'],event['id']))[:30]

    def notifications(self,identity,*,read_ids=None):
        with self._connection(write=read_ids is not None) as db:
            actor=self._actor(db,identity)
            settings=self._settings(db,actor['id'])
            events=self._notification_rows(db,actor,settings)
            cursor=settings.get('notification_cursor',{})
            saved_ids=set(cursor.get('read_ids',[])) if isinstance(cursor,dict) else set()
            if read_ids is not None:
                # IDs avoid losing an update created in the same clock second.
                # Only acknowledge displayed IDs that are still authorized.
                requested=set(read_ids)
                current=[event['id'] for event in events if event['id'] in requested]
                previous=[value for value in cursor.get('read_ids',[]) if value not in current] if isinstance(cursor,dict) else []
                saved=(current+previous)[:512]
                settings['notification_cursor']={'read_ids':saved}
                self._save_settings(db,actor['id'],settings)
                saved_ids=set(saved)
            items=[{**event,'unread':event['id'] not in saved_ids} for event in events]
            return {'items':items,'unread':sum(item['unread'] for item in items),'limit':30,'scope':'current_account_recent_updates'}
