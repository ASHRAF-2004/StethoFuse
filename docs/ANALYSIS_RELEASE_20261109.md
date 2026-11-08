# Acoustic analysis release — 9 November 2026

Live: <https://stethofuse.ashraf-alsaloul.com/>

**Upload/record → Separate and analyze → Results and report.** The existing
worker now adds experimental heart/lung sound candidates after separation.
Private English/Arabic HTML reports retain actual findings, uncertainty and
source/model/run references. Reports support browser Print/Save PDF. Earlier
saved results can queue analysis without rerunning separation.

## Exact deployed state

| Component | Recorded identity |
| --- | --- |
| Website release | `20261108T223046Z-93ff781cfbf3` |
| Website source | `379a8598a1a8f8d1602622d29e2d5daafed650e4` |
| Backend source | `c62514a44f0fc25e5b8e4894f36f1149ead2569c` |
| API image | `sha256:cfbc380acbe8196d112ad64659042025ba767840d827cbdbc1c490539eeb06f8` |
| Worker image | `sha256:23856905137606746ab6760484d40d8f8a721a6648663a9f921e46e001e722f3` |
| Web image | `sha256:f7f53e5f011b3b304a42daa32a283bc76d22c335ea7a5233870e4e5fb982c918` |
| Frozen separator checkpoint | `1f7e549ba53240bc085221e4eed1f935bb7c330e9a66cfab4c183c8f096c2658` |

PR #17 added the analysis/report workflow; PR #18 corrected the browser's typed
report-language query. Both were merged after all required checks passed. The
follow-up changed only website code; API/worker pins stayed fixed. The normal
website helper remains web-only. Qualified backend maintenance, source/image
recovery, data guards and rollback were completed in the same owner conversation.
No coordinator handoff, paid service, other-app change or VM restart was invoked.

## Verified behavior

- Actual frozen separator plus both analyzers, bilingual reports and legacy
  reanalysis queue passed in isolation under the production worker's 2 GB cap;
  peak RSS was 1,339 MiB. A current schema-3 SQLite copy started without logical
  changes. Separator source, numerical environment, weights and T9 were preserved.
- Real disposable Firebase staff/analyst sessions exercised synthetic PCM upload,
  separation, both analyzers, exact original/output hashes, private reports,
  idempotence, exact-result grants and revocation. Original-only sharing did not
  reveal findings. A fresh run after restart produced identical saved audio bytes.
- Real production browsers checked English/Arabic, 1440/390 px, day/night,
  four actual report-button downloads matching the saved run, original-only
  analyst access and unrelated-account denial. No runtime errors, overflow or
  private-response cache hits were observed. The findings panel had zero focused
  WCAG A/AA violations. Actual screenshots and exported reports were inspected.
- A report-button defect was found in live acceptance and fixed before completion:
  language is now a bounded `en`/`ar` option, while arbitrary API paths/queries
  remain rejected. Six report and eight session/cache regressions passed; the
  report regression is included in CI.
- The exact public HTML and both immutable native owl packets matched the built
  files. Homepage edge caching and private/account/version bypass passed after
  purging only the StethoFuse homepage. Owl artwork and renderer are unchanged;
  no new 3G startup timing is claimed.
- All three disposable provider/application accounts and their synthetic files
  were removed. All **181 pre-existing rows** and the original private files,
  permissions, frozen model, credentials and foreign resources were unchanged.
  New task security/audit tombstones remain intentionally. Final SQLite integrity
  passed with zero foreign-key errors; logical SHA-256 is
  `069de78fef3eb021a44e31c65e6447841c645b23dddfdc480364f4195b94ccd6`.

The deployment and endpoint receipts, retained failed-download evidence, current
runtime proof and cleanup/preservation proof are under the owner's
`OwnerRelease/analysis-20261109/` directory. They are operational evidence, not
patient or model-performance validation. No combined backup or restore was run;
the existing verified backup and required rollback artifacts remain retained.

## Remaining product and evidence gaps

This is an **experimental acoustic preview**, not validated disease diagnosis.
It covers up to the first 120 seconds explicitly; uncertainty and disagreement
remain visible. The small external studies exposed missed targets. Their samples
were imbalanced and heart training overlap is unknown. Do not present upstream
training accuracy or source-cycle smoke results as clinical pipeline performance.

APP-04 still requires representative held-out-patient evaluation, original versus
separated comparisons, clinically relevant sound preservation and calibration.
APP-05 still requires intended-user usefulness feedback. Recording-context
requirements, actual healthcare stakeholder evidence and supervisor/FYP report
traceability remain APP-01/02/03. None is closed by developer test accounts.
See [analysis behavior](ACOUSTIC_ANALYSIS.md) and the
[improvement backlog](NEXT_IMPROVEMENT_GAPS.md).
