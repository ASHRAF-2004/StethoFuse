"""TEST ONLY loopback API, temporary data, fixed fictional provider. Never deploy."""
import json
import sys
import time
from pathlib import Path
from tempfile import TemporaryDirectory

import uvicorn

sys.path.insert(0,str(Path(__file__).resolve().parents[3]))
from app.access_foundation import AuthenticationDenied,VerifiedIdentity
from app.m1.api import create_app
from app.m1.config import Settings

class TestVerifier:
    def verify(self,token):
        if token not in {'M1-MOCK:alice','M1-MOCK:bob'}:
            raise AuthenticationDenied('Invalid fictional identity.')
        uid=token.split(':')[1]
        return VerifiedIdentity(uid,uid+'@example.invalid',True,auth_time=time.time())
    def delete_self(self,token,*,confirmed_uid):
        if token!='M1-MOCK:'+confirmed_uid:
            raise AuthenticationDenied('Wrong fictional account.')

if __name__=='__main__':
    with TemporaryDirectory(prefix='stethofuse-readiness-browser-') as directory:
        root=Path(directory)
        # Admission only: no worker/model is attached to this temporary queue.
        app=create_app(Settings(root/'m1.sqlite3',root/'private',separation_enabled=True),verifier=TestVerifier())
        print(json.dumps({'scope':'TEST ONLY','port':18084}),flush=True)
        uvicorn.run(app,host='127.0.0.1',port=18084,access_log=False,log_level='warning')
