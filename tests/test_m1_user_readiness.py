"""Real isolated SQLite/private files; fictional provider only, no live accounts."""
import base64
from dataclasses import replace
import hashlib
import struct
import time
import zlib

import pytest
from fastapi.testclient import TestClient

from app.access_foundation import AccessDenied,Status
from app.access_foundation.identity import ProviderUnavailable
from app.m1.api import create_app
from app.m1.profile_store import canonical_avatar
from test_m1_api import auth,env,grant,upload


def png(*,width=128,height=128,metadata=False):
    def chunk(kind,data):
        return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
    header=struct.pack('>IIBBBBB',width,height,8,6,0,0,0)
    pixels=(b'\0'+b'\x40\x80\x60\xff'*width)*height
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',header)+(chunk(b'tEXt',b'owner\0private metadata <script>') if metadata else b'')+chunk(b'IDAT',zlib.compress(pixels))+chunk(b'IEND',b'')


def recent(env,name='owner'):
    env.verifier.identities[name]=replace(env.verifier.identities[name],auth_time=time.time())


def deletion_provider(env,*,fail=False):
    calls=[]
    def remove(token,*,confirmed_uid):
        calls.append((token,confirmed_uid))
        if fail:
            raise ProviderUnavailable('Fictional outage.')
    env.verifier.delete_self=remove
    return calls


def delete(env,*,name='owner',reference=None,extra=None):
    return env.client.post('/api/account/delete',headers=auth(name),json={'confirmation':'DELETE','confirmed_account_reference':reference or env.users[name]['public_id'],**(extra or {})})


def test_private_avatar_persists_is_owned_and_strips_metadata(env):
    data=png(metadata=True)
    response=env.client.put('/api/auth/me/avatar',headers={**auth(),'Content-Type':'image/png'},content=data)
    assert response.status_code==200
    avatar=response.json()['avatar']
    decoded=base64.b64decode(avatar['base64'])
    assert b'tEXt' not in decoded and b'private metadata' not in decoded
    assert hashlib.sha256(decoded).hexdigest()==avatar['revision']
    assert env.client.get('/api/auth/me/avatar',headers=auth()).json()['avatar']==avatar
    for other in ('other','analyst','admin'):
        assert env.client.get('/api/auth/me/avatar',headers=auth(other)).json()=={'avatar':None}
    assert env.client.get('/api/auth/me/avatar').status_code==401
    assert 'profile_avatar' not in env.client.get('/api/preferences',headers=auth()).json()['preferences']
    assert env.client.patch('/api/preferences',headers=auth(),json={'preferences':{'profile_avatar':{'base64':'fake'}}}).status_code==422
    assert env.client.delete('/api/auth/me/avatar',headers=auth()).status_code==204
    assert env.client.get('/api/auth/me/avatar',headers=auth()).json()=={'avatar':None}


@pytest.mark.parametrize('bad',[b'<svg onload="alert(1)"/>',b'not png',png()+b'trailing',png(width=257),png()[:-3]])
def test_avatar_rejects_unsafe_or_invalid_images_without_persistence(env,bad):
    response=env.client.put('/api/auth/me/avatar',headers={**auth(),'Content-Type':'image/png'},content=bad)
    assert response.status_code==422
    assert env.client.get('/api/auth/me/avatar',headers=auth()).json()['avatar'] is None


def test_avatar_compression_bomb_is_bounded():
    data=png(width=128,height=128)
    start=data.index(b'IDAT')-4
    malicious=zlib.compress(b'\0'*5_000_000)
    body=struct.pack('>I',len(malicious))+b'IDAT'+malicious+struct.pack('>I',zlib.crc32(b'IDAT'+malicious)&0xffffffff)
    crafted=data[:start]+body+data[-12:]
    with pytest.raises(Exception) as error:
        canonical_avatar(crafted)
    assert error.value.status_code==422


def test_metadata_export_never_includes_granted_or_other_owner_data(env):
    record=upload(env)
    grant(env,record,recipient='other',resource_id=record['original_resource_id'])
    for name in ('other','analyst','admin'):
        export=env.client.get('/api/account/export',headers=auth(name))
        assert export.status_code==200
        data=export.json()
        assert data['account']['id']==env.users[name]['id']
        assert data['recordings']==data['jobs']==data['results']==data['grants']==data['reviews']==[]
        assert record['title'] not in export.text
    response=env.client.get('/api/account/export',headers=auth())
    assert response.headers['cache-control']=='private, no-store'
    assert response.json()['audio_included'] is False
    assert response.json()['recordings'][0]['id']==record['id']
    assert 'relative_path' not in response.text
    assert env.client.get('/api/account/export').status_code==401


def test_delete_requires_recent_signed_identity_exact_self_and_confirmation(env):
    deletion_provider(env)
    upload(env)
    assert delete(env).status_code==403
    recent(env)
    assert delete(env,reference=env.users['other']['public_id']).status_code==409
    assert delete(env,extra={'auth_time':time.time()}).status_code==422
    assert env.client.post('/api/account/delete',headers=auth(),json={'confirmation':'wrong','confirmed_account_reference':env.users['owner']['public_id']}).status_code==422
    assert env.client.get('/api/auth/me',headers=auth()).status_code==200


def test_deletion_refuses_processing_and_last_admin_without_side_effects(env):
    deletion_provider(env)
    recent(env)
    record=upload(env)
    job=env.store.request_separation(env.verifier.identities['owner'],record['id'])
    assert env.store.claim_job()['id']==job['id']
    assert delete(env).status_code==409
    assert env.client.get('/api/recordings',headers=auth()).json()['items']
    recent(env,'admin')
    assert delete(env,name='admin').status_code==409
    assert env.client.get('/api/auth/me',headers=auth('admin')).status_code==200


def test_confirmed_deletion_removes_owned_files_metadata_and_closes_access(env):
    calls=deletion_provider(env)
    recent(env)
    record=upload(env)
    with env.store._connection() as db:
        own_file=env.settings.private_storage/db.execute('SELECT relative_path FROM m1_files WHERE resource_id=?',(record['original_resource_id'],)).fetchone()[0]
    grant(env,record,recipient='other',resource_id=record['original_resource_id'])
    env.client.put('/api/auth/me/avatar',headers={**auth(),'Content-Type':'image/png'},content=png())
    other=env.client.post('/api/recordings',headers=auth('other'),files={'file':('other.wav',__import__('test_m1_api').wav_bytes(),'audio/wav')},data={'title':'Other private title'}).json()
    env.store.request_separation(env.verifier.identities['owner'],record['id'])
    response=delete(env)
    assert response.status_code==200 and response.json()['live_data_deleted'] is True and response.json()['provider_account_deleted'] is True
    assert calls==[('owner',env.verifier.identities['owner'].uid)]
    assert not own_file.exists()
    assert env.client.get('/api/auth/me',headers=auth()).status_code==403
    assert env.client.post('/api/auth/session',headers=auth(),json={}).status_code==403
    assert env.client.get('/api/media/'+record['original_resource_id'],headers=auth('other')).status_code==403
    assert env.client.get('/api/recordings/'+other['id'],headers=auth('other')).status_code==200
    with env.store._connection() as db:
        assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
        assert db.execute('PRAGMA foreign_key_check').fetchall()==[]
        assert db.execute('SELECT email,display_name,status FROM af_users WHERE id=?',(env.users['owner']['id'],)).fetchone()[:]==('','Deleted account','disabled')
        assert env.store._settings(db,env.users['owner']['id'])['account_lifecycle']['files']==[]
    with pytest.raises(AccessDenied):
        env.store.change_account(env.verifier.identities['admin'],env.users['owner']['id'],confirmed_target_id=env.users['owner']['id'],status=Status.ACTIVE)


def test_provider_failure_is_explicit_after_live_data_removal(env):
    deletion_provider(env,fail=True)
    recent(env)
    upload(env)
    response=delete(env)
    assert response.status_code==200
    assert response.json()['live_data_deleted'] is True and response.json()['provider_account_deleted'] is False
    assert not list(env.settings.private_storage.glob('*.wav'))
    assert env.client.post('/api/auth/session',headers=auth(),json={}).status_code==403


def test_interrupted_deletion_resumes_from_durable_journal_on_startup(env):
    recent(env)
    upload(env)
    user=env.store.request_account_deletion(env.verifier.identities['owner'],env.users['owner']['public_id'])
    app=create_app(env.settings,verifier=env.verifier)
    with TestClient(app):
        assert app.state.store.pending_account_deletions()==[]
        assert not list(env.settings.private_storage.glob('*.wav'))
        with app.state.store._connection() as db:
            journal=app.state.store._settings(db,user)['account_lifecycle']
            assert journal['state']=='deleted' and journal['provider_deleted'] is False
