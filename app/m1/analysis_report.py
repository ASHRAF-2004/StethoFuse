"""Self-contained, escaped English/Arabic report from stored authorized results."""
from datetime import datetime, timezone
from html import escape

FINDINGS = {
    "heart": {"present": ("Murmur candidate", "إشارة محتملة إلى نفخة قلبية"),
              "absent": ("No clear murmur candidate", "لم تظهر إشارة واضحة إلى نفخة قلبية"),
              "uncertain": ("Needs listening review", "يحتاج إلى مراجعة صوتية")},
    "lung": {"neither": ("Neither target sound detected", "لم تُرصد الأصوات المستهدفة"),
             "crackle": ("Crackle candidate", "إشارة محتملة إلى خراخر"),
             "wheeze": ("Wheeze candidate", "إشارة محتملة إلى أزيز"),
             "both": ("Crackle and wheeze candidates", "إشارات محتملة إلى خراخر وأزيز"),
             "uncertain": ("Needs listening review", "يحتاج إلى مراجعة صوتية")}}


def report_html(result, analysis, locale="en", reviews=()):
    ar = locale == "ar"
    def text(en, arabic): return arabic if ar else en
    def safe(value): return escape(str(value), quote=True)
    reference = result.get("public_id") or result["id"]
    completed = analysis.get("completed_at")
    date = datetime.fromtimestamp(completed, timezone.utc).strftime("%Y-%m-%d %H:%M UTC") if completed else "—"
    sections = []
    for kind in ("heart", "lung"):
        component = analysis.get("components", {}).get(kind, {})
        state = component.get("status", "unavailable")
        finding = component.get("finding", "uncertain")
        label = FINDINGS[kind].get(finding, FINDINGS[kind]["uncertain"])[int(ar)]
        if state == "unavailable":
            label = text("Analysis unavailable", "التحليل غير متاح")
        elif state == "insufficient_evidence":
            label = text("Insufficient acoustic evidence", "أدلة صوتية غير كافية")
        evidence = []
        for row in component.get("windows", ()):
            label_pair = FINDINGS[kind].get(row.get("finding"), FINDINGS[kind]["uncertain"])
            evidence.append(f'<tr><td dir="ltr">{safe(row["start_seconds"])}–{safe(row["end_seconds"])} s</td>'
                            f'<td>{safe(label_pair[int(ar)])}</td></tr>')
        consistency = ""
        if component.get("track_agreement") is False:
            consistency = f'<p class="note">{text("Original and separated tracks produced different findings. Listen to both before interpreting this result.", "أعطى التسجيل الأصلي والمسار المفصول نتائج مختلفة. استمع إلى كليهما قبل تفسير النتيجة.")}</p>'
        windows = ('<table><thead><tr><th>'+text('Interval','الفترة')+'</th><th>'+text('Window finding','نتيجة المقطع')+
                   '</th></tr></thead><tbody>'+''.join(evidence)+'</tbody></table>') if evidence else ''
        sections.append(f'<section><p class="eyebrow">{text("Heart" if kind=="heart" else "Lungs", "القلب" if kind=="heart" else "الرئتان")}</p>'
                        f'<h2>{safe(label)}</h2>{consistency}{windows}'
                        f'<p class="small">{text("Model", "النموذج")}: <bdi>{safe(component.get("model_id", "—"))}</bdi></p>'
                        f'<p class="small">{text("Weights SHA-256", "بصمة أوزان النموذج")}: <bdi class="hash">{safe(component.get("weights_sha256", "—"))}</bdi></p></section>')
    notes = ''.join(f'<blockquote><p>{safe(r.get("notes", ""))}</p><footer>{safe(r.get("reviewer_display_name", ""))} · {safe(r.get("decision", ""))}</footer></blockquote>' for r in reviews if r.get("notes"))
    review = f'<section><h2>{text("Saved reviewer observations", "ملاحظات المراجع المحفوظة")}</h2>{notes}</section>' if notes else ''
    hashes = ''.join(f'<tr><td>{safe(k)}</td><td class="hash" dir="ltr">{safe(v)}</td></tr>' for k,v in analysis.get("source_sha256", {}).items())
    coverage = ''
    if analysis.get('analyzed_seconds', 0) < analysis.get('duration_seconds', 0):
        coverage = '<p class="note">' + text(
            f"Analysis covers the first {safe(analysis['analyzed_seconds'])} seconds of this {safe(analysis['duration_seconds'])}-second recording; it does not cover the remaining audio.",
            f"يشمل التحليل أول {safe(analysis['analyzed_seconds'])} ثانية من التسجيل البالغ {safe(analysis['duration_seconds'])} ثانية؛ ولا يشمل بقية الصوت.") + '</p>'
    return f'''<!doctype html><html lang="{locale}" dir="{'rtl' if ar else 'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>StethoFuse — {safe(reference)}</title>
<style>:root{{color-scheme:light}}*{{box-sizing:border-box}}body{{margin:0;background:#edf1ed;color:#202b26;font:15px/1.7 Arial,Tahoma,sans-serif}}main{{max-width:860px;margin:36px auto;padding:42px;background:white;border:1px solid #d3ddd5;border-radius:18px}}header{{border-bottom:2px solid #54765e;padding-bottom:24px}}.brand{{font-size:25px;font-weight:bold;letter-spacing:-1px}}h1{{font-size:32px;line-height:1.25;margin:25px 0 10px}}h2{{font-size:21px;line-height:1.4;margin:6px 0 18px}}.eyebrow{{font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#486650}}section{{padding:26px 0;border-bottom:1px solid #dce4dd}}.note{{padding:14px 18px;background:#f1f4ef;border-inline-start:3px solid #7a906e}}.small,footer{{font-size:12px;color:#506159}}.hash{{font:11px/1.6 monospace;overflow-wrap:anywhere;word-break:break-all}}table{{width:100%;border-collapse:collapse;font-size:13px;margin:16px 0}}td,th{{padding:9px 12px;border-bottom:1px solid #e0e6e0;text-align:start;vertical-align:top}}th{{background:#f3f6f2}}blockquote{{margin:10px 0;padding:12px 18px;background:#f5f7f3;white-space:pre-wrap}}a{{color:#30543c}}.meta{{display:flex;gap:20px;flex-wrap:wrap}}@media(max-width:600px){{body{{background:white}}main{{margin:0;padding:24px 18px;border:0;border-radius:0}}h1{{font-size:27px}}}}@media print{{@page{{margin:16mm}}body{{background:white}}main{{margin:0;padding:0;max-width:none;border:0}}header,section,blockquote{{break-inside:avoid}}tr{{break-inside:avoid}}a{{color:inherit;text-decoration:none}}.screen{{display:none}}}}</style></head><body><main>
<header><div class="brand" dir="ltr">StethoFuse</div><p class="eyebrow">{text("RECORDING ANALYSIS REPORT", "تقرير تحليل التسجيل")}</p><h1>{text("Every finding, in context.", "كل نتيجة، في سياقها.")}</h1><div class="meta"><span>{text("Result", "النتيجة")}: <bdi>{safe(reference)}</bdi></span><span>{safe(date)}</span></div></header>
<p>{text("AI acoustic findings from the saved heart–lung analysis, with the original recording retained for comparison.", "نتائج صوتية آلية من تحليل القلب والرئتين المحفوظ، مع الاحتفاظ بالتسجيل الأصلي للمقارنة.")}</p>
{coverage}{''.join(sections)}{review}
<section><h2>{text("Interpretation", "التفسير")}</h2><p>{text("These are model-generated sound candidates, not confirmed disease labels. The models have not been clinically validated for this separated-audio pipeline. A negative target finding does not establish normal heart or lung health. Model scores are uncalibrated and are not probabilities of disease.", "هذه إشارات صوتية يقترحها النموذج وليست تشخيصات مرضية مؤكدة. لم تُتحقّق الفعالية السريرية للنماذج على مسار الفصل الصوتي هذا. عدم رصد صوت مستهدف لا يثبت سلامة القلب أو الرئتين. درجات النموذج غير معايرة ولا تمثّل احتمالات الإصابة بمرض.")}</p></section>
<section><h2>{text("Traceability", "التتبّع")}</h2><p class="small">{text("Analysis run", "عملية التحليل")}: <bdi>{safe(analysis.get("run_id", "—"))}</bdi> · <bdi>{safe(analysis.get("version", "—"))}</bdi></p><table>{hashes}</table><p><a href="https://stethofuse.ashraf-alsaloul.com/app/results/{safe(result['id'])}">{text("Open the authorized result and audio", "فتح النتيجة والأصوات حسب صلاحيات الوصول")}</a></p></section>
<p class="small screen">{text("Use your browser’s Print command to save a PDF copy. This file contains private findings; share it deliberately.", "استخدم أمر الطباعة في المتصفح لحفظ نسخة PDF. يحتوي هذا الملف على نتائج خاصة؛ شاركه بعناية.")}</p><footer><p dir="ltr">© 2026 Designed and developed by: Ashraf Ali Hussain Al-Saloul</p></footer></main></body></html>'''
