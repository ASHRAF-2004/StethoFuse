# Deer study diagnostics

Research only. These scripts do not activate animation or touch production.
Run from `frontend`. Video utilities require the existing FFmpeg/FFprobe on PATH;
the local ignored research venv contains Pillow, NumPy and OpenCV.

```powershell
python tools/deer_study/inspect-generated-video.py
& evidence/deer-frame-study/.venv/Scripts/python.exe tools/deer_study/measure-video-registration.py
& evidence/deer-frame-study/.venv/Scripts/python.exe tools/deer_study/stabilize-video.py
& evidence/deer-frame-study/.venv/Scripts/python.exe tools/deer_study/check-adjacent-video.py
python tools/deer_study/render-continuous-guide.py
```

The first four scripts read/write ignored
`evidence/deer-frame-study/continuity-test`. Copy the preserved
`assets/forest-world/animation/deer-frame-study/rejected-continuity-take.mp4`
there as `generated-candidate.mp4` before reproducing the diagnostics.

Stabilization applies one global similarity transform per frame. It does not
repair anatomy or create in-between poses. Adjacent differences flag appearance
changes for inspection; they are not a quality score or an acceptance test.

The final script draws a separate continuous joint/timing diagram. Fixed-length
links, smooth joint angles and far/near occlusion replace the rejected held-image
guide. It is a technical blockout, **not character artwork, not an anatomically
certified gait and not an accepted runtime sequence**. It does not alter any
photograph. Its outputs stay in ignored `evidence/deer-frame-study/continuous-control`.
No further generation has used that diagram.
