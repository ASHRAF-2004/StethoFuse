# Next improvement: application workflow and supervisor feedback

Recorded: 9 November 2026, Asia/Kuala_Lumpur.
Original instruction: record the gaps and continue discussing. The owner later
authorized implementation and deployment. APP-04/APP-05 software was merged in
PR #17/#18 and deployed. See [release evidence](ANALYSIS_RELEASE_20261109.md)
and [ACOUSTIC_ANALYSIS.md](ACOUSTIC_ANALYSIS.md). Software acceptance passed;
stakeholder and clinical closure remain open. The planning discussion below is
preserved as history.

## Owner direction — 20 November 2026

### Live recording is flagged "Soon!"

The owner flagged in-app live recording as **Soon!**. Real chest recordings need
a dedicated device; a laptop microphone is not an acceptable chest-sound source.
The New recording card now shows a locked **Soon!** badge, and
`/app/recordings/new/record` shows a coming-soon page that opens no microphone.
Upload stays available. `frontend/src/components/LiveCapture.tsx` is kept
unrouted so it can return once a device is qualified. This is source only until
it is deployed through the guarded release process.

### Task: find and buy a USB / Type-C digital stethoscope

Status: **open — owner purchase**. Claude does not buy hardware; the owner pays.
Shortlist candidates against these requirements before buying:

- Connects to a laptop by **USB-A or USB Type-C** and appears as a standard
  (class-compliant) audio input, so the browser can select it without a vendor
  app or a proprietary cloud. A Bluetooth-only or phone-app-only device does
  not meet this requirement.
- Captures **heart and lung** sounds, ideally with a raw or minimally filtered
  mode, mono, a sample rate of 4 kHz or more, and no forced noise cancellation.
- Usable on **adults and children** (pediatric chest piece or diaphragm).
- Works on Windows without paid software or subscriptions (free services only).
- Record the exact model, price, seller, and the date it was checked.

After purchase: qualify it with real recordings (level, clipping, frequency
range, noise), then re-enable `LiveCapture` behind the same Upload → Separate and
analyze → Results flow, and remove the Soon! flag only after that evidence passes.

### Disease prediction and patient-focused report must be visual and game-like

The owner wants the planned disease-prediction and patient-focused report
results to be highly visual and game-like, with purposeful motion and animation,
not a plain text report. When those features are built, use the design skills in
`OwnerRelease/design-skills/taste-skill` and `OwnerRelease/design-skills/frontend-design`
for the visual direction, motion and animation. The existing `animejs`
dependency and the app's reduced-motion setting must be used; every animation
needs a reduced-motion equivalent. Visual style must not hide uncertainty,
unsupported conditions or age groups, or the difference between acoustic
findings, model predictions and professional observations. No disease result may
be shown until a model is separately evaluated (see the sequence below).

### Built in source: case details, patient board and condition evaluation

- **Case details** (no identifiers): case reference code, age group, sex, reason,
  symptoms, chest location, position and device. Fields come from
  `app/m1/case_context_fields.json`; the server validates them (schema v4,
  table `m1_case_context`, owner-only edit, included in export and account
  deletion). The report shows "Not supplied" for missing fields.
- **Patient board** (`frontend/src/frost/PatientBoard.tsx`): a game-like board
  with one condition tile per evaluated target, an unlock count, and an evidence
  track that shows the measured AUROC range against the pass line. Locked tiles
  explain in plain English/Arabic what is still needed. Motion uses `animejs`
  and is skipped under reduced motion.
- **Condition evaluation** (`research/clinical/`, protocol
  `research/configs/clinical_targets_v4.json`; v1-v3 kept): pass bars declared before
  results; patients split so no patient is in both training and test.
  Results are generated into `docs/CLINICAL_EVALUATION.md` by
  `python -m research.clinical.report` and published to the app as
  `app/m1/clinical_targets_status.json` by `python -m research.clinical.publish`.

Measured outcome (20 November 2026, protocols v2-v4): **no condition passed its
bar, so no disease prediction is switched on.** The valve diseases (BMD-HS) score
high (aortic stenosis AUROC 0.99) but the test set has only 9 patients per disease
and calibration fails. Abnormal heart (CirCor) reaches AUROC 0.69 with a lower
bound of 0.62 and fails on the second dataset (PhysioNet 2016, 0.36–0.58).

ICBHI has no healthy adults, so v3 and v4 pool adult lung sets from other
hospitals (KAUH, RespiratoryDatabase@TR, BRACETS Thessaloniki). Each hospital has
a different class mix, so the baseline is a model that knows only the hospital;
a disease model must beat it. COPD reaches AUROC 0.84 (v4) but the hospital-only
model already reaches 0.77, and the difference is not significant: the model has
not shown it hears COPD rather than the site. Pneumonia has 5 adult patients
(KAUH), too few to test.

v4 adds an echo-confirmed regurgitation set (Littmann 3200) to BMD-HS. Aortic
regurgitation drops from 0.86-0.88 (BMD-HS only, v3) to 0.79; mitral regurgitation drops from 0.83
to 0.63, and on the new set alone it is below chance (0.33). The BMD-HS models do
not transfer to another device and hospital. This is the main finding: high
single-dataset scores are not evidence of a working detector.

To unlock any condition: many more patients per condition from several sites,
recorded with one device, and recordings from the chosen stethoscope.

The **automatic chest-sound gate passed** its bar with all seven declared
datasets present (CirCor, PhysioNet 2016, ICBHI, SPRSound as chest sound;
LibriSpeech, ESC-50, MUSAN as unrelated audio): on held-out subjects, chest
false rejection 0.1% (upper bound 0.4%), unrelated false acceptance 0.4% (upper
bound 1.0%), uncertain 0.3%. This is research audio only, not this app's users
or devices. The status file says `passed`, not `activated`: the worker does not
run the gate yet. The next step is to run it in the worker before separation.
That needs scikit-learn in the worker image, the model file shipped with a
checksum like the analysis models, a "not a chest sound" result state, and a
release through the maintenance path. After that step, add `"gate"` to
`publish.live` in the protocol. A check on real recordings from the purchased
stethoscope should come first.

## Owner direction recorded after the homepage correction

On 9 November the owner selected a **final FYP2 report** and an intended population
of **adults and children**. The current recording report should evolve into a
patient-focused auscultation report using supplied case context, actual findings
and separately attributed clinical/reviewer observations. Current exports do not
contain patient history or a validated disease assessment. Preserve the short
recording → separation/analysis → results/report flow.

The owner then explicitly confirmed **both sound assessment and prediction of
specific diseases** as the meaning of patient status. The planned patient report
must cover both in clearly attributed sections. Disease models are an additional
development/evaluation target; current murmur/wheeze/crackle candidates are not
already disease predictions. Select a small initial target set from permitted
clinically labelled data; establish patient-disjoint performance, age support,
uncertainty and calibration before activating each target. Keep unsupported
conditions/age groups explicit and preserve one processing action.

Add an automatic input-recognition layer before separation to reject clearly
unrelated recordings such as music. It must be evaluated on real normal and
abnormal heart/lung audio, including children and noisy clinical recordings;
uncertainty must not become a fabricated medical finding. This gate is planned,
not implemented or deployed. No extra mandatory quality-feedback page is requested.

Real-data candidates have been checked against publisher sources: PhysioNet2016,
CirCor, HF_Lung_V1, SPRSound and ICBHI. Existing 9 CirCor and 18 ICBHI examples were
reverified. Three small SPRSound **training** examples were downloaded at an exact
publisher revision and hash/decode checked; no new inference or test-set use.
Separate real-patient validation from paired manikin-reference experiments and
from synthetic mixtures made using real source recordings. Protect frozen T9.

The owner has **no healthcare testers yet**. Retain the original 53-response FYP1
survey and its limitations; no new intended-user acceptance result exists.

In the separate documentation repository, `report/FYP2 report.docx` is an exact
initial copy of the authoritative revised FYP1 submission, with all 73 OOXML parts
identical. Original FYP1 files are unchanged. The handbook requires final Chapters
5 Implementation, 6 Testing and 7 Conclusion. Chapter content, especially focused
literature-review changes, is to be discussed before rewriting. The canonical
preparation/change plan is `fyp2/FINAL_REPORT_PREPARATION_20261109.md`; the companion
`fyp2/PATIENT_REPORT_REAL_DATA_AND_INPUT_GATE_20261109.md` records source licences,
population limits, report fields, evaluation and proposed automatic recognition.
The DOCX remains a starting copy, not a completed final submission.

### Confirmed next implementation sequence

The owner asked to record the next-work plan after confirming that patient status
includes both understandable sound assessment and specific disease predictions.
Keep the user-facing workflow **Upload → Separate and analyze → Results and
report**. All recognition and analysis run automatically behind the same action.

1. Establish permitted real-patient development/evaluation cohorts, with patient
   grouping and adult/child coverage recorded. Build an offline chest-source
   recognition prototype using genuine normal/abnormal chest sounds and unrelated
   music, speech and noise. Measure false acceptance, false rejection and uncertain
   cases; noisy legitimate recordings must not be rejected merely for background
   speech. This adds no mandatory recording-quality page.
2. Extend the existing recording report into a patient-focused report: supplied
   case context, understandable acoustic findings, supporting segments and explicit
   uncertainty. Define optional context fields and their access/storage/deletion
   rules before persisting them. Missing context must remain missing.
3. Add separately evaluated disease-prediction models for a small set of supported
   targets. Choose targets from suitable clinical labels, permitted uses and actual
   population coverage; do not derive diagnoses from sound-label lookups. Keep
   acoustic findings, model predictions and professional observations distinct in
   the same report. Unsupported conditions or age groups remain unassessed.
4. Validate the complete input-recognition → separation → analysis → report flow
   on patients excluded from training and tuning, with adult/child results kept
   separate. Verify failure/uncertainty handling, report fidelity, private access
   and worker resource limits. Integrate and deploy qualified changes through the
   existing guarded release process. Use actual implementation and test evidence
   for FYP2; discuss chapter changes before rewriting the original material.

**Next concrete deliverable:** an offline-tested chest-source recognition and
analysis prototype, with its data manifest, evaluation protocol, measured results
and remaining limitations. This is not yet implemented or deployed. Existing
acoustic-analysis previews and recording reports remain the current baseline.

The first disease-metadata audit is recorded in the companion FYP2 data plan and
`OwnerRelease/patient-report-data-20261109/bmd-metadata-audit.json`. It identified
annotation, population and licensing constraints; no disease target/model or
adult-and-child clinical performance is established by that audit. Intended-user
healthcare evaluation remains open because testers have not yet been recruited.

## Assessment to preserve

StethoFuse has an application-based software foundation: distinct healthcare-staff,
audio-analyst and administrator responsibilities; a persistent recording library;
separation jobs; comparison/listening; explicit sharing; analyst reviews; and
revocation. The 5 November verification record includes actual role/workflow tests.

That establishes implemented application behavior. It does not establish that the
workflow meets healthcare personnel's needs or that every supervisor report comment
has been resolved. Do not equate interface polish, automated tests or developer-run
test accounts with stakeholder validation.

Source reviewed in this discussion: implementation main
`a1a201e46ac159b662e19e12c30eaa0e1bc3bf4d`. This was a source/evidence review,
not a fresh production or clinical evaluation.

## Agreed improvement direction — 9 November 2026

The owner wants a simple, strong application whose value comes from the quality
and usefulness of its results. Details and interpretation belong after sound
separation. Two audio downloads alone should not be the complete results experience.
This is the recorded direction for the next implementation, not a claim that the
analysis models or report already exist.

### Keep the user interaction short

**Upload or record → Separate and analyze → Results and report.**

- One user action starts separation and the subsequent analysis automatically.
- No separate recording-quality screen, score or mandatory feedback stage.
  Keep essential format/size/readability validation automatic; show an actionable
  error when it prevents processing.
- Put findings, supporting details and report access on the results page.
  Additional information can be progressively disclosed within that page.
- Save/share and human review remain useful optional actions, not extra mandatory
  steps before the user can receive a result.
- Prioritize output accuracy, sound preservation, reliable processing and clear
  interpretation. Avoid adding infrastructure or workflow stages for appearance.

### Planned architecture extension

```text
                     +-- Heart analyzer --+
Recording → Separator                     +→ Structured findings → Report
                     +-- Lung analyzer ---+
```

Use the existing application/backend, private storage and background-job approach.
The two analyzers can execute as branches of one analysis run; this does not
require a service for every component or a new paid platform. Preserve the
original recording, registered track timing and versioned processing results.
An analysis failure must be visible and must not erase successful separation
outputs or masquerade as a normal finding.

The existing frozen separator remains the baseline while candidate analyzers
are developed and evaluated separately. Future backend/model/schema changes need
the existing technical qualification, preservation and rollback procedure in the
same conversation; this planning note does not alter production pins or data.

### Initial analysis targets

| Output | First candidate target | Boundary to establish before implementation claims |
| --- | --- | --- |
| Heart | Murmur present, absent or uncertain | Select suitable labeled data/model and intended population; validate on the actual separated heart output. |
| Lungs | Wheezes, crackles, both or neither | Select suitable expert-annotated data/model; evaluate on the actual separated lung output. |
| Disease assessment | A specific disease or clinical-outcome target, if suitable evidence supports it | Define the endpoint and independently established diagnosis labels. Sound-finding detection alone does not establish a disease prediction. No broad disease list or fabricated diagnostic probabilities. |

The owner accepted the direction of automatic post-separation analysis and
reporting. Exact model architectures, weights, disease targets, thresholds and
performance claims have not been selected or validated in this discussion.

### Results and recording-analysis report

The results page should contain:

- A concise findings summary for heart and lung analysis, including uncertain
  results and unavailable/failed analysis states.
- Synchronized original, heart and lung playback for direct comparison.
- Supporting audio segments when localization is supported and evaluated.
- Relevant recording context and optional reviewer observations.
- A downloadable recording-analysis report containing the actual findings,
  uncertainty, input/run identity and model versions.

Generate the report from structured results and reviewer notes so its statements
remain traceable. A language model is not required for the initial report builder.
Never fill missing analysis with invented findings, certainty or diagnoses. This
recording-analysis report is distinct from the FYP academic report in APP-03.

Lead the product presentation with its intended benefit: one chest recording
produces separated sounds, explainable findings and a reviewable report. Keep
validation status clear where findings are interpreted; repetitive negative
taglines should not be the main product story. New clinical-benefit claims must
match actual evaluation results.

### Evidence that makes the extension strong

- Establish whether clinically relevant abnormal sounds survive separation.
- Compare original-input and separated-input analysis with fair baselines on
  held-out patients; prevent patient leakage across training/tuning/evaluation.
- Measure missed findings, false positives and appropriate task metrics, including
  sensitivity/specificity where applicable. Evaluate uncertainty/calibration
  before presenting model scores as probabilities.
- Evaluate the complete separation-to-analysis pipeline; performance on clean
  training-style recordings does not establish performance on separator outputs.
- Verify that every report statement agrees with its stored result and that
  uncertainty/failure survives report generation and export.
- Obtain intended-user feedback on whether the findings/report help their review.
  Keep the existing stakeholder-validation and supervisor-report gaps active.
- Use permitted, appropriately labeled data and free resources. Do not reuse
  protected T9 recordings or frozen evaluation evidence for new training/demo work.

### Research starting points

These establish available task definitions, not performance of StethoFuse:

- [PhysioNet 2022](https://physionet.org/content/challenge-2022/1.0.0/):
  murmur presence/absence/unknown and a separate clinical-outcome task.
- [PhysioNet label description](https://moody-challenge.physionet.org/2022/data/):
  clinical outcomes come from a broader assessment than a murmur sound label.
- [Official ICBHI dataset](https://bhichallenge.med.auth.gr/node/50):
  expert annotations of wheezes/crackles and separate subject diagnosis information.

## Priority gaps

| ID | Gap and evidence status | Next improvement | Evidence needed to close |
| --- | --- | --- | --- |
| APP-01 | **Confirmed partial coverage: user-entered recording attributes.** `app/m1/api.py` accepts a file and optional title at upload. `app/m1/schema.sql` stores title, filename, duration, sample rate, channels and size; most are automatically derived technical properties. | Establish which recording-context attributes intended users need, then implement the agreed fields consistently in upload/edit, library/detail views and persistence. Keep technical properties automatically derived. Preserve the existing no-patient-identifiers scope and access rules. | Requirements with a rationale, actual create/edit/list/detail behavior, validation and permission checks, and a demonstration using representative non-patient material. Adding arbitrary fields alone is not acceptance. |
| APP-02 | **Healthcare stakeholder validation is not established by the evidence reviewed.** This does not mean no survey exists; existing survey material has not been audited here. | Locate the existing survey/respondent evidence first. Assess coverage of actual intended healthcare staff and audio analysts; address missing requirements/usability evidence with appropriate participants. Evaluate the recording-to-review workflow. | Actual respondent roles, method, responses, findings, resulting requirements/design decisions and task feedback. Distinguish completed research from planned work and developer testing; never invent responses. |
| APP-03 | **FYP report alignment is not established.** The current implementation has role-specific workflows, but the current FYP submission has not been checked end to end against the supervisor's comments. | Identify the authoritative FYP report in the separate documentation repository. Trace user needs through requirements, use cases, design, implementation and evaluation; audit each report correction below. | A traceability matrix and the actual corrected report, with accurate feature status, complete use-case descriptions and stakeholder evidence. Do not assume the separate software-design assignment report is the current FYP submission. |
| APP-04 | **Software implemented and deployed as an experimental preview; clinical qualification remains open.** Automatic heart/lung sound candidates, source comparison, uncertainty and versioned results are live. Disease prediction is not implemented. | Add evaluated heart/lung analyzers behind the existing single action; select exact models and targets based on suitable data and the complete pipeline's performance. | Held-out-patient results, sound-preservation checks, original-versus-separated baselines, error analysis, uncertainty behavior and versioned runtime outputs. No new user workflow stage. |
| APP-05 | **Software implemented and live-tested; intended-user acceptance remains open.** Private bilingual HTML reports use actual saved analysis, preserve uncertainty and exact-result access, and support browser Print/Save PDF. | Present a concise summary with comparison playback and supporting details; generate a downloadable report from stored model findings and optional reviewer notes. | Correct source/run/model linkage, faithful findings and uncertainty, clear failed/partial states, preserved private access, useful export and intended-user evaluation. |

## Supervisor report checklist to verify

These are recorded review items, not findings that each item is still missing.

- Abstract: summarize the problem, intended users, approach, application features,
  evaluation/results and contribution at an appropriate length.
- Chapter 2: study existing cardiopulmonary processing tools/apps, compare concrete
  features, and justify selected features and proposed additions.
- Chapter 3: use evidence from actual intended users; specify healthcare-staff and
  audio-analyst responsibilities and user functions, including entering recording
  attributes and listing/managing recordings.
- Chapter 4: provide a description table for every use case; place appropriate
  technical design and algorithms here.
- Chapter 5: follow the supervisor's requested brief FYP2 activity-plan scope for
  the relevant report stage. Confirm the submission stage before applying this
  instruction to a later final report.
- References: audit APA formatting and citation/reference consistency.
- Presentation: justified body text and chapter-based figure/table numbering
  such as Figure 4.2 and Table 3.1.
- Overall argument: explain and evaluate a solution supporting the intended
  recording, processing and review workflow. Present sound separation as a
  capability within that solution; make research-use limitations explicit.

## Suggested order when improvement resumes

1. Inspect existing stakeholder/survey material, the authoritative FYP report and
   available permitted datasets; define focused analysis targets and evidence.
2. Establish baselines and evaluate candidate analyzers with the actual separator
   outputs. Map relevant recording attributes without expanding the user flow.
3. Integrate the selected analyzers and structured findings/report behind one
   action, with appropriate source, data and deployment qualification. Preserve
   existing accounts, grants, recordings and the approved pointer-following owl.
4. Evaluate results and usability with intended users, then update requirements,
   use cases and the FYP report using actual findings. Preserve the short workflow.

Current application behavior and the approved pointer-following owl remain intact.
No application, model, data, account, infrastructure or deployment change was made
to record this backlog. Future work remains free-only under the owner's policy.

## Local evidence pointers

- [Current API upload contract](../app/m1/api.py)
- [Recording persistence](../app/m1/schema.sql)
- [Live role/workspace routes](../frontend/src/pages/LiveWorkspacePages.tsx)
- [Architecture](../ARCHITECTURE.md)
- [Dated workflow verification and its limits](COMPLETION_2026-11-05.md)
- [Resume checkpoint](../PAUSE_NOTES.md)
