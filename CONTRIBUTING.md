# Contributing

Use a focused branch and describe the user-visible change, scope and checks actually run. Keep private recordings, credentials, weights and runtime databases outside Git. The application and academic report are separate repositories.

## Prerequisites

- Node.js 24 and npm.
- Python 3.14 for the current API dependency set, in an isolated environment.
- The existing approved Firebase web app for connected sign-in. Public SDK settings are distinct from privileged credentials.
- Playwright Chromium for browser checks. Install once with `npx playwright-core install chromium` from `frontend/`.

## Frontend

```sh
cd frontend
npm ci
npm run dev:demo
```

The development-only demo uses fictional data on port 4182. For the real API, copy `.env.example` to `.env.local`, fill in the existing selected app's public Firebase values, and run `npm run dev` on port 4180. `STETHOFUSE_API_PROXY` accepts an explicit loopback HTTP destination only. Never point fixtures at production private data.

Production builds validate the Firebase contract and cannot substitute demo accounts:

```sh
npm run build
npm test
npm run test:startup
npm run test:3g
node tests/owl-stages.mjs
```

`npm test` checks the compiled public/account/support interface. Startup tests cover first-frame readiness, RTL, motion preferences, responsive layouts and failures. The 3G test throttles bandwidth and CPU and takes several minutes. `owl-stages.mjs` compares actual initial/full GPU and software frames. Read each test's scope before treating fixtures as live-provider evidence.

## Isolated API

Create a virtual environment at the root and install the lightweight API/auth requirements. This does not install Torch, datasets or model weights.

```sh
python -m venv .venv
# POSIX: source .venv/bin/activate
# PowerShell: .\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-m1.txt
```

Set `STETHOFUSE_M1_DATABASE` and `STETHOFUSE_M1_PRIVATE_STORAGE` to **absolute, separate paths outside the source tree**, such as a dedicated temporary development directory. The database must not be inside media storage. Set `STETHOFUSE_FIREBASE_ENABLED=1` and `STETHOFUSE_FIREBASE_API_KEY` only for approved connected development. The project is fixed; ordinary local tests inject fictional identities into temporary stores and need no provider login.

```sh
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
python -m pytest -q tests/test_access_foundation.py tests/test_m1_api.py tests/test_m1_sharing.py tests/test_m1_processing.py tests/test_m1_operator_safety.py tests/test_firebase_token_boundary.py
node --test services/stethofuse-support/worker.test.mjs
```

Do not use the legacy entrypoint or an existing production database for a quick preview. Separation remains unavailable until the qualified frozen model and worker are configured; do not replace it with mock scientific output. Read [the ML worker runbook](deploy/ML_WORKER_RUNBOOK.md) before worker work.

## Change boundaries

- Preserve source recordings and confirmed deletions. Never restore stale data as part of a UI rollback.
- Keep authorization on the server. A hidden button or client cache is not a permission check.
- Preserve approved owl artwork, registration and cursor/RTL behavior. Regenerate packets with `node tools/prepare-owl-runtime.mjs` from `frontend/`; commit descriptor and packets together. `--verify` checks native-source equality.
- Check both languages/appearances, keyboard focus, reduced motion and small screens after visible changes. Inspect screenshots; a build is not a visual review.
- Do not use T9 recordings or replace frozen research artifacts for frontend work.
- Keep dependency locks and notices accurate. Avoid unrelated reformatting and scaffolding.

## Pull requests and releases

Include the problem, resulting behavior, validation and limits. Screenshots must show public or clearly fictional data. Bug reports must omit tokens, action links, private media and raw environments.

CI runs on pushes and pull requests. It does not deploy or provision cloud resources. Authorized releases use the installed owner workflow at `C:/Users/thalt/StethoFuseDeployment/OwnerRelease/DEPLOYMENT.md`; that local file and its credentials are not portable repository secrets. Preserve qualification, locks, data checks and rollback.

No project-wide open-source license is declared. Request permission before redistributing project artwork, source or research artifacts. Third-party dependencies retain their own licenses.
