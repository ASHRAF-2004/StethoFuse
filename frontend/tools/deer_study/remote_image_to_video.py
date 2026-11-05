"""One free public Lightricks demo request; no billing or paid API fallback."""

import argparse
import hashlib
import json
import shutil
import time
import urllib.request
from pathlib import Path

from gradio_client import Client, handle_file


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("run", type=Path)
    args = parser.parse_args()
    root = args.run.resolve()
    request = json.loads((root / "request.json").read_text(encoding="utf-8"))
    if request["space"] not in {
        "Lightricks/LTX-2.5",
        "zerogpu-aoti/wan2-2-fp8da-aoti-faster",
    }:
        raise RuntimeError(
            "This runner is restricted to the inspected public free demos"
        )
    if request["status"] != "PREPARED_NOT_SUBMITTED":
        raise RuntimeError(
            "Existing submission state must be reconciled, never replayed"
        )
    prompt = (root / "prompt.txt").read_text(encoding="utf-8")
    ref = root / "reference.png"
    if hashlib.sha256(ref.read_bytes()).hexdigest() != request["reference_sha256"]:
        raise RuntimeError("Reference identity changed")
    metadata = json.load(
        urllib.request.urlopen(
            "https://huggingface.co/api/spaces/" + request["space"], timeout=25
        )
    )
    if metadata["sha"] != request["revision"]:
        raise RuntimeError("Public demo revision changed; inspect it before submitting")
    (root / "space-metadata.json").write_text(
        json.dumps(metadata, indent=2), encoding="utf-8"
    )
    shutil.copy2(__file__, root / "request-source.py")
    started = time.monotonic()

    def state(status, **fields):
        request.update(
            status=status, elapsed_seconds=time.monotonic() - started, **fields
        )
        (root / "request.json").write_text(
            json.dumps(request, indent=2), encoding="utf-8"
        )
        print(json.dumps({"status": status, **fields}), flush=True)

    client = Client(
        request["space"],
        token=False,
        verbose=False,
        download_files=str(root / "downloads"),
    )
    try:
        state("SUBMITTING_ONCE_FREE_DEMO")
        params = request.get("api_parameters")
        if params is None:
            params = {
                key: request[key]
                for key in [
                    "height",
                    "width",
                    "duration_s",
                    "seed",
                    "decoder",
                    "auto_len",
                    "randomize_seed",
                    "do_enhance",
                ]
            }
        params = dict(params)
        params.update(prompt=prompt)
        params[request.get("reference_argument", "image_path")] = handle_file(str(ref))
        job = client.submit(**params, api_name=request["api"])
        while not job.done():
            state("WAITING_FREE_DEMO", remote_status=str(job.status()))
            if time.monotonic() - started > 240:
                job.cancel()
                raise TimeoutError(
                    "Bounded free demo wait exceeded; inspect state before retry"
                )
            time.sleep(10)
        result = job.result()
        (root / "remote-result.json").write_text(
            json.dumps(result, indent=2, default=str), encoding="utf-8"
        )

        def files(value):
            if isinstance(value, str) and value.lower().endswith((".mp4", ".webm")):
                candidate = Path(value)
                if candidate.is_file():
                    yield candidate
            elif isinstance(value, dict):
                for item in value.values():
                    yield from files(item)
            elif isinstance(value, (tuple, list)):
                for item in value:
                    yield from files(item)

        video = next(files(result), None)
        if video is None:
            raise RuntimeError("No completed downloaded video in the response")
        output = root / ("generated-source" + video.suffix)
        shutil.copy2(video, output)
        state(
            "COMPLETED_UNAPPROVED_SOURCE",
            video_sha256=hashlib.sha256(output.read_bytes()).hexdigest(),
        )
    except Exception as error:
        state("FAILED_NO_PAID_FALLBACK", error=str(error))
        raise
    finally:
        client.close()


if __name__ == "__main__":
    main()
