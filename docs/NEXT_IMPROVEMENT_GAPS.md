# Next improvement: application workflow and supervisor feedback

Recorded: 9 November 2026, Asia/Kuala_Lumpur.
Original instruction: record the gaps and continue discussing. The owner later
authorized implementation and deployment. APP-04/APP-05 implementation is now on
PR #17; see [ACOUSTIC_ANALYSIS.md](ACOUSTIC_ANALYSIS.md) for actual behavior and
validation limits. Deployment and stakeholder/clinical closure require their own
evidence; the planning discussion below is preserved as history.

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
| APP-04 | **Planned new capability: automatic post-separation analysis.** Current separation does not establish automated acoustic findings or disease predictions. | Add evaluated heart/lung analyzers behind the existing single action; select exact models and targets based on suitable data and the complete pipeline's performance. | Held-out-patient results, sound-preservation checks, original-versus-separated baselines, error analysis, uncertainty behavior and versioned runtime outputs. No new user workflow stage. |
| APP-05 | **Planned new capability: structured results and recording-analysis report.** A report must be supported by actual analysis outputs. | Present a concise summary with comparison playback and supporting details; generate a downloadable report from stored model findings and optional reviewer notes. | Correct source/run/model linkage, faithful findings and uncertainty, clear failed/partial states, preserved private access, useful export and intended-user evaluation. |

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
