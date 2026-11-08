"""Storage encoding regression, without model downloads or production fixtures."""
import io
import hashlib
from types import SimpleNamespace

import numpy as np
import pytest
from scipy.io import wavfile

from app.m1.worker import Worker
from app.m1.ml_contract import ProcessingError


def test_analysis_reads_saved_float_wav_without_pcm_upload_decoder():
    # These are the exact output format/dtype, with values outside PCM [-1, 1].
    samples = np.array([0, -1.25, 0.5, 1.125], dtype=np.float32)
    stream = io.BytesIO()
    wavfile.write(stream, 4000, samples)
    data = stream.getvalue()
    sha = hashlib.sha256(data).hexdigest()
    worker = SimpleNamespace(read_input=lambda job: (data, sha))
    actual, digest = Worker.read_analysis_output(worker, {"sha256": sha})
    assert np.array_equal(actual, samples)
    assert actual.dtype == np.float32
    assert digest == sha


@pytest.mark.parametrize('rate,samples', [(8000, np.zeros(10,dtype=np.float32)),
    (4000, np.zeros((10,2),dtype=np.float32)), (4000,np.array([np.nan],dtype=np.float32)),
    (4000,np.zeros(10,dtype=np.int16))])
def test_analysis_rejects_wrong_output_contract(rate,samples):
    stream = io.BytesIO();wavfile.write(stream,rate,samples);data=stream.getvalue()
    worker=SimpleNamespace(read_input=lambda job:(data,'fixture'))
    with pytest.raises(ProcessingError):
        Worker.read_analysis_output(worker,{"sha256":"fixture"})
