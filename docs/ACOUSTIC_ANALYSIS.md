# Post-separation acoustic analysis

One action starts separation and analysis. The result keeps the original, heart
and lung tracks, model-generated sound candidates, supporting window references
and a downloadable English/Arabic HTML report. The report supports browser
printing and PDF saving; the endpoint does not claim to return a PDF file.

## Status and interpretation

This is an **experimental acoustic-analysis preview**, not a validated diagnostic
model. Heart targets are murmur present/absent/uncertain; lung targets are crackle,
wheeze, both or neither. None of these labels establishes a specific disease.
An absent target does not establish healthy heart or lung function.

The first bounded run covers at most 120 seconds. Longer recordings retain their
full separated audio and explicitly show the analyzed range. Inputs below one
second or effectively silent produce insufficient evidence. Models process
8-second windows; lung windows use the upstream cyclic padding. The 0.70 score
and 0.15 top-class margin are conservative exploratory decision rules, **not
calibrated clinical thresholds**. Scores are not disease probabilities. Both
original and separated audio are evaluated; disagreement produces an uncertain
summary and remains visible in the report and stored evidence.

The small external source-audio smoke study found a missed labeled heart murmur.
It is a functional/domain-shift check, not independent held-out validation:
training overlap for the heart weights is undocumented. Do not advertise the
upstream model-card accuracy as StethoFuse accuracy. A representative patient-wise
evaluation of the complete mixed-audio pipeline, threshold calibration and expert
review remain required before clinical-performance claims.

## Additive architecture

The existing dedicated CPU worker loads the analyzers locally with no network,
remote code or runtime download. Pinned model revisions and every runtime file's
SHA-256 are in `research/configs/acoustic_analysis_v1.json`. The existing frozen
T8 v2 separator, its checkpoint, specification, source and numerical dependencies
are preserved. Analysis executes after the saved float32 WAVs are verified.

Structured output is stored in `m1_results.provenance_json.analysis`; SQLite schema
version 3 and the existing storage layout do not change. A component failure
does not fail or delete successful separation. Earlier results can queue analysis
without running separation again. The queue is transactionally claimed, idempotent,
and requeues an interrupted attempt once. Disabling an owner during analysis
discards its findings; account deletion waits for active processing.

## Authorization and privacy

- `GET /api/results/{id}/analysis`: existing exact-result read/review authority.
- `POST /api/results/{id}/analysis`: current recording owner only; no model choice
  or arbitrary input path is accepted.
- `GET /api/results/{id}/report?locale=en|ar`: the same exact-result access;
  original-audio-only grants do not grant findings or reports.
- Revocation is checked on every request. The report uses private `no-store`,
  attachment, no-sniff and restrictive CSP headers. Text and reviewer notes are
  escaped. Reviewer observations are included only for the recording owner.
- There is no public report URL, public findings cache, new hosted AI service or
  generated narrative. A downloaded report is private material that its recipient
  must deliberately protect; revocation cannot recall downloaded bytes.

## Models and reproducibility

| Target | Artifact | License | Important limitation |
| --- | --- | --- | --- |
| Heart | [cogniveon Wav2Vec2 classifier](https://huggingface.co/cogniveon/eeem069_heart_murmur_classification/tree/716eb534dca3936594ea6421d460fe3bd4839ecb) | Apache-2.0, as declared upstream | Training split and population are insufficiently documented. |
| Lungs | [Atakanisik AST-SAM](https://huggingface.co/Atakanisik/ICBHI-AST-SAM/tree/78578463426d11bf38f7279ec3155a4efdadf76a) | MIT | Trained for annotated respiratory cycles; fixed windows and separated tracks change the input domain. |

The lung forward pass reproduces the author's mean-pooled AST embedding and
linear classifier. Its state dictionary is loaded with `weights_only=True` and
strict key/shape matching. Heart weights use safetensors. No `trust_remote_code`
is enabled. Third-party weights, public evaluation audio and private reports are
not committed to Git. Respect [ICBHI's research-use terms](https://bhichallenge.med.auth.gr/node/50)
and the [CirCor source license](https://physionet.org/content/circor-heart-sound/1.0.3/).

`deploy/Dockerfile.analysis-*` extend authenticated existing image IDs. The
analysis dependency lock is an additional offline wheel set; it does not replace
Torch, torchaudio, NumPy or SciPy. Building images is staging, not deployment.
Backend and worker changes require the deployment guide's qualified maintenance
path, fresh data/foreign/runtime guards, exact image recovery archives and a
guarded rollback. The ordinary website wrapper remains web-only.

## Verification

Focused tests cover exact access/revocation, audio-only grants, report escaping,
idempotence, restart, owner disablement, partial results, uncertainty and float-WAV
decoding. CI also runs the existing application authorization and browser checks.
Model performance, real clinical utility and stakeholder suitability are separate
questions; software-test fixtures are never counted as model-validation samples.
