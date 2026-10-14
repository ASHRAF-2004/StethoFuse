"""Workflow updates must follow current ownership, grants and account state."""
import time

from app.access_foundation import Status
from test_m1_api import auth,env,grant,upload
from test_m1_review_feedback import save


def feed(env,name='owner'):
    response=env.client.get('/api/notifications',headers=auth(name))
    assert response.status_code==200,response.text
    assert response.headers['cache-control']=='private, no-store'
    return response.json()


def read(env,items,name='owner'):
    return env.client.post('/api/notifications/read',headers=auth(name),json={'ids':[item['id'] for item in items]})


def test_updates_are_real_owned_state_not_administrator_or_grantee_visibility(env):
    assert feed(env)['items']==[]
    record=upload(env)
    job=env.store.request_separation(env.verifier.identities['owner'],record['id'])
    item=feed(env)['items'][0]
    assert item['kind']=='processing' and item['unread']
    assert item['href']=='/app/recordings/'+record['id']
    assert read(env,[item]).json()['unread']==0
    assert feed(env)['unread']==0
    env.store.claim_job()
    current=feed(env)['items'][0]
    assert current['id']!=item['id'] and current['unread']
    for name in ('admin','other','analyst'):
        assert feed(env,name)['items']==[]
    assert job['id'] in current['id']
    assert 'relative_path' not in str(current)


def test_saved_reviews_notify_only_owner_and_revisions_in_same_second_remain_unread(env):
    record=upload(env)
    assignment=grant(env,record,resource_id=record['original_resource_id'],permission='review')
    save(env,assignment,'Private note one <script>')
    first=feed(env)['items']
    assert len(first)==1 and first[0]['kind']=='review'
    assert 'Private note' not in str(first) and 'script' not in str(first)
    read(env,first)
    save(env,assignment,'Private revised note')
    # An old displayed feed cannot acknowledge a later saved revision.
    response=read(env,first)
    assert response.json()['unread']==1
    assert feed(env,'admin')['items']==[]
    assert feed(env,'other')['items']==[]
    assert {item['kind'] for item in feed(env,'analyst')['items']}=={'sharing'}


def test_revoked_expired_or_unavailable_sharing_is_generic_and_still_denies_media(env):
    record=upload(env)
    assignment=grant(env,record,resource_id=record['original_resource_id'],expires_at=int(time.time())+3600)
    initial=feed(env,'analyst')['items'][0]
    read(env,[initial],'analyst')
    assert env.client.delete('/api/grants/'+assignment['id'],headers=auth()).status_code==204
    closed=feed(env,'analyst')['items'][0]
    assert closed['title']=='Shared access has closed' and closed['unread']
    assert record['title'] not in str(closed) and closed['href']=='/app/shared'
    assert env.client.get('/api/media/'+record['original_resource_id'],headers=auth('analyst')).status_code==403
    second=grant(env,record,resource_id=record['original_resource_id'])
    with env.store._connection(write=True) as db:
        db.execute('UPDATE af_grants SET expires_at=? WHERE id=?',(int(time.time())-1,second['id']))
    assert all(item['title']=='Shared access has closed' for item in feed(env,'analyst')['items'])
    grant(env,record,resource_id=record['original_resource_id'])
    env.store.change_account(env.verifier.identities['admin'],env.users['owner']['id'],confirmed_target_id=env.users['owner']['id'],status=Status.SUSPENDED)
    assert all(item['title']=='Shared access has closed' for item in feed(env,'analyst')['items'])
    assert env.client.get('/api/notifications',headers=auth()).status_code==403


def test_preferences_filter_feed_and_internal_read_state_cannot_be_injected(env):
    record=upload(env)
    env.store.request_separation(env.verifier.identities['owner'],record['id'])
    old=feed(env)['items']
    assert env.client.patch('/api/preferences',headers=auth(),json={'preferences':{'notifications':{'jobNotifications':False}}}).status_code==200
    assert feed(env)['items']==[]
    assert read(env,old).json()['unread']==0
    env.client.patch('/api/preferences',headers=auth(),json={'preferences':{'notifications':{'jobNotifications':True}}})
    assert feed(env)['unread']==1
    read(env,feed(env)['items'])
    assert 'notification_cursor' not in env.client.get('/api/preferences',headers=auth()).text
    assert env.client.patch('/api/preferences',headers=auth(),json={'preferences':{'notification_cursor':{'read_ids':['forged']}}}).status_code==422
    assert env.client.post('/api/notifications/read',headers=auth(),json={'ids':['x']*31}).status_code==422
    assert env.client.post('/api/notifications/read',headers=auth(),json={'ids':['x'*201]}).status_code==422
    assert env.client.get('/api/notifications').status_code==401
    assert env.client.post('/api/notifications/read',json={'ids':[]}).status_code==401


def test_marking_another_accounts_ids_does_not_read_own_updates(env):
    record=upload(env)
    env.store.request_separation(env.verifier.identities['owner'],record['id'])
    assignment=grant(env,record,resource_id=record['original_resource_id'])
    incoming=feed(env,'analyst')['items']
    assert assignment['id'] in incoming[0]['id']
    assert read(env,incoming).json()['unread']==1
    assert feed(env,'analyst')['unread']==1
