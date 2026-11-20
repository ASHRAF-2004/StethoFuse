"""Dataset loaders that turn publisher layouts into uniform ``Recording`` rows.

Each loader only reads metadata and file paths; audio is decoded later. A
missing dataset raises ``DatasetMissing`` so callers can record it instead of
silently shrinking a cohort.
"""
from __future__ import annotations

import csv
import re
from collections.abc import Callable, Iterable
from dataclasses import dataclass, field
from functools import partial
from pathlib import Path


class DatasetMissing(FileNotFoundError):
    pass


@dataclass(frozen=True)
class Recording:
    dataset: str
    recording_id: str
    subject: str
    path: Path
    labels: dict[str, str] = field(default_factory=dict)
    age_group: str | None = None


AgeGroups = dict[str, list[float]]


def age_group_from_years(years: float | None, groups: AgeGroups) -> str | None:
    if years is None:
        return None
    for name, (low, high) in groups.items():
        if low <= years < high:
            return name
    return None


def age_group_from_band(band: str, groups: AgeGroups) -> str | None:
    """Map a ``"30-39"`` style band; a band crossing a group boundary stays unknown."""
    match = re.fullmatch(r"\s*(\d+)\s*-\s*(\d+)\s*", band or "")
    if not match:
        return None
    low, high = int(match[1]), int(match[2])
    first, last = age_group_from_years(low, groups), age_group_from_years(high, groups)
    return first if first == last else None


def _single_child(root: Path, name: str) -> Path:
    path = root / name
    if not path.exists():
        raise DatasetMissing(f"{name}: no extracted folder named {name!r} in the data root")
    return path


def _find_one(root: Path, pattern: str, dataset: str) -> Path:
    found = sorted(root.rglob(pattern))
    if not found:
        raise DatasetMissing(f"{dataset}: {pattern} not found")
    return found[0]


# ----- heart -----------------------------------------------------------------

CIRCOR_AGE = {"Neonate": "infant", "Infant": "infant", "Child": "child", "Adolescent": "adolescent", "Young Adult": "adult"}


def load_circor(root: Path, groups: AgeGroups) -> list[Recording]:
    base = _single_child(root, "circor")
    table = _find_one(base, "training_data.csv", "circor")
    audio = table.parent / "training_data"
    rows: list[Recording] = []
    with table.open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            patient = row["Patient ID"].strip()
            labels = {"outcome": row["Outcome"].strip(), "murmur": row["Murmur"].strip()}
            for wav in sorted(audio.glob(f"{patient}_*.wav")):
                rows.append(Recording("circor", wav.stem, f"circor:{patient}", wav, labels, CIRCOR_AGE.get(row["Age"].strip())))
    return rows


PHYSIONET_LABEL = {"1": "Abnormal", "-1": "Normal"}


def load_physionet2016(root: Path, groups: AgeGroups) -> list[Recording]:
    """Training databases only (the validation folder duplicates training records).

    Subject identity is not published, so each record is its own subject; this is
    used only as an external test set, never for training splits.
    """
    base = _single_child(root, "physionet2016")
    references = sorted(path for path in base.rglob("REFERENCE.csv") if re.fullmatch(r"training-[a-z]", path.parent.name))
    if not references:
        raise DatasetMissing("physionet2016: training-*/REFERENCE.csv not found")
    rows: list[Recording] = []
    for reference in references:
        database = reference.parent.name
        with reference.open(encoding="utf-8", newline="") as handle:
            for record, code, *_ in csv.reader(handle):
                wav = reference.parent / f"{record}.wav"
                if wav.exists():
                    rows.append(Recording("physionet2016", record, f"physionet2016:{database}:{record}", wav,
                                          {"outcome": PHYSIONET_LABEL[code.strip()], "database": database}))
    return rows


BMDHS_TARGETS = ("AS", "AR", "MR", "MS", "N")


def load_bmdhs(root: Path, groups: AgeGroups) -> list[Recording]:
    base = _single_child(root, "bmdhs")
    ages: dict[str, str] = {}
    with (base / "additional_metadata.csv").open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            ages[row["patient_id"]] = row["Age"]
    rows: list[Recording] = []
    with (base / "train.csv").open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            patient = row["patient_id"]
            labels = {name: row[name].strip() for name in BMDHS_TARGETS}
            if not all(value in {"0", "1"} for value in labels.values()):
                continue  # Out-of-taxonomy case (publisher N/A row): never coerced to negative.
            age = age_group_from_band(ages.get(patient, ""), groups)
            for key in sorted(k for k in row if k.startswith("recording_")):
                wav = base / "train" / f"{row[key].strip()}.wav"
                if wav.exists():
                    rows.append(Recording("bmdhs", wav.stem, f"bmdhs:{patient}", wav, labels, age))
    return rows


def regurgitation_status(findings: list[tuple[str, object]], valve: str) -> str:
    """Patient-level echo status for one valve: ``present`` (grade >= 1), ``trace`` (only trace/ungraded) or ``absent``."""
    grades = [grade for finding, grade in findings if finding == valve]
    if not grades:
        return "absent"
    numeric = [g for g in grades if isinstance(g, (int, float))]
    return "present" if numeric and max(numeric) >= 1 else "trace"


def load_heart_regurgitation(root: Path, groups: AgeGroups) -> list[Recording]:
    """Mendeley jfbdvjw6sf (Littmann 3200): four valve-area recordings per patient, echo finding and grade per area.

    Labels are patient-level (``ar``, ``mr``: present / trace / absent). Patients with a metallic prosthetic valve
    (``ME``) are marked ``prosthetic`` and match no target class.
    """
    import openpyxl  # Annotations are published as a spreadsheet.

    base = _single_child(root, "heart_regurgitation")
    sheet = openpyxl.load_workbook(_find_one(base, "*.xlsx", "heart_regurgitation"), read_only=True).active
    findings: dict[int, list[tuple[str, object]]] = {}
    ages: dict[int, float] = {}
    patient = None
    for row in sheet.iter_rows(min_row=2, max_col=8, values_only=True):
        if row[0] is not None:
            patient = int(row[0])
            findings[patient] = []
            if isinstance(row[1], (int, float)):
                ages[patient] = float(row[1])
        if patient is not None and row[3]:
            findings[patient].append((str(row[6] or "").strip().upper(), row[7]))
    rows = []
    for wav in sorted(base.rglob("*.wav")):
        match = re.fullmatch(r"E_H_(\d+)_([APTM])", wav.stem)
        if not match or int(match[1]) not in findings:
            continue
        number = int(match[1])
        prosthetic = any(finding == "ME" for finding, _ in findings[number])
        labels = {"location": match[2]}
        for valve in ("AR", "MR"):
            labels[valve.lower()] = "prosthetic" if prosthetic else regurgitation_status(findings[number], valve)
        rows.append(Recording("heart_regurgitation", wav.stem, f"heart_regurgitation:{number}", wav, labels,
                              age_group_from_years(ages.get(number), groups)))
    if not rows:
        raise DatasetMissing("heart_regurgitation: no labelled WAV files found")
    return rows


ZCHSOUND_SUBSETS = {"clean": ("clean Heartsound Data", "Clean Heartsound Data Details.csv"),
                    "noisy": ("Noise Heartsound Data Details", "Noise Heartsound Data Details.csv")}


def load_zchsound(root: Path, groups: AgeGroups, subset: str = "clean") -> list[Recording]:
    """ZCHSound (Jia et al. 2024): one recording per child, echo-confirmed diagnosis, age in days.

    The authors publish a clean set and a noisy set, each with its own folder and label file
    (comma- and semicolon-separated respectively).
    """
    base = _single_child(root, "zchsound")
    folder, label_file = ZCHSOUND_SUBSETS[subset]
    lines = _find_one(base, label_file, "zchsound").read_text(encoding="utf-8-sig").splitlines()
    delimiter = ";" if lines and lines[0].count(";") > lines[0].count(",") else ","
    audio = _find_one(base, folder, "zchsound")
    name = "zchsound" if subset == "clean" else f"zchsound_{subset}"
    rows = []
    for meta in csv.DictReader(lines, delimiter=delimiter):
        wav = audio / meta["fileName"].strip()
        if not wav.exists():
            continue
        days = meta["age(days)"].strip()
        rows.append(Recording(name, wav.stem, f"zchsound:{wav.stem}", wav, {"diagnosis": meta["diagnosis"].strip().upper()},
                              age_group_from_years(float(days) / 365.25 if days else None, groups)))
    if not rows:
        raise DatasetMissing(f"{name}: no labelled WAV files found")
    return rows


# ----- lung ------------------------------------------------------------------

def load_icbhi(root: Path, groups: AgeGroups) -> list[Recording]:
    base = _single_child(root, "icbhi")
    diagnosis_file = _find_one(base, "*diagnosis*.txt", "icbhi")
    demographic_file = next(iter(sorted(base.rglob("*demographic*.txt"))), None)
    diagnoses = dict(line.split()[:2] for line in diagnosis_file.read_text(encoding="utf-8").splitlines() if line.strip())
    ages: dict[str, float] = {}
    if demographic_file:
        for line in demographic_file.read_text(encoding="utf-8").splitlines():
            parts = line.split()
            if len(parts) > 1 and parts[1] not in {"NA", "nan"}:
                ages[parts[0]] = float(parts[1])
    rows: list[Recording] = []
    for wav in sorted(base.rglob("*.wav")):
        patient = wav.stem.split("_")[0]
        if patient in diagnoses:
            rows.append(Recording("icbhi", wav.stem, f"icbhi:{patient}", wav, {"diagnosis": diagnoses[patient]},
                                  age_group_from_years(ages.get(patient), groups)))
    return rows


def load_sprsound(root: Path, groups: AgeGroups) -> list[Recording]:
    """Paediatric respiratory audio named ``<patient>_<age years>_<sex>_<location>_<n>.wav``.

    The publisher repeats recordings across task folders; each file name is kept once.
    """
    base = _single_child(root, "sprsound")
    unique: dict[str, Path] = {}
    for wav in sorted(base.rglob("*.wav")):
        unique.setdefault(wav.name, wav)
    rows = []
    for wav in unique.values():
        parts = wav.stem.split("_")
        try:
            age = float(parts[1])
        except (IndexError, ValueError):
            age = None
        rows.append(Recording("sprsound", wav.stem, f"sprsound:{parts[0]}", wav, {"source": "chest"},
                              age_group_from_years(age, groups)))
    if not rows:
        raise DatasetMissing("sprsound: no WAV files found")
    return rows


KAUH_NAME = re.compile(r"(?P<filter>[A-Z]+)P(?P<patient>\d+)_(?P<diagnosis>[^,]+),(?P<sounds>[^,]*),(?P<location>[^,]*),(?P<age>\d+),(?P<sex>[MF])")
KAUH_DIAGNOSIS = {"n": "healthy"}  # The publisher writes healthy subjects as "N"; other names are lower-cased as written.


def load_kauh(root: Path, groups: AgeGroups, filter: str = "E") -> list[Recording]:
    """Fraiwan et al. 2021 (KAUH, Jordan), one recording per patient exported with three Littmann filters.

    Only the declared ``filter`` export is kept so a patient is never counted three times.
    """
    base = _single_child(root, "kauh")
    rows = []
    for wav in sorted(base.rglob("*.wav")):
        match = KAUH_NAME.fullmatch(wav.stem)
        if not match or match["filter"] != filter:
            continue
        diagnosis = " ".join(match["diagnosis"].lower().split())
        rows.append(Recording("kauh", wav.stem, f"kauh:P{match['patient']}", wav,
                              {"diagnosis": KAUH_DIAGNOSIS.get(diagnosis, diagnosis), "location": match["location"].strip()},
                              age_group_from_years(float(match["age"]), groups)))
    if not rows:
        raise DatasetMissing(f"kauh: no WAV files for filter {filter!r}")
    return rows


def load_respiratorydatabase_tr(root: Path, groups: AgeGroups) -> list[Recording]:
    """Altan et al. RespiratoryDatabase@TR (COPD severity release): 12 chest channels per patient, COPD0-COPD4.

    Per-patient ages are not released, so ``age_group`` stays unknown; the protocol may declare the
    published cohort age range instead (see ``published_age_years``).
    """
    import openpyxl  # Labels are published as a spreadsheet.

    base = _single_child(root, "respiratorydatabase_tr")
    sheet = openpyxl.load_workbook(_find_one(base, "Labels.xlsx", "respiratorydatabase_tr"), read_only=True).active
    labels = {str(patient).strip(): str(level).strip() for patient, level in sheet.iter_rows(min_row=2, max_col=2, values_only=True) if patient}
    rows = []
    for wav in base.rglob("*.wav"):
        patient, _, channel = wav.stem.partition("_")
        if patient in labels and re.fullmatch(r"[LR]\d+", channel):
            rows.append(Recording("respiratorydatabase_tr", wav.stem, f"respiratorydatabase_tr:{patient}", wav,
                                  {"diagnosis": labels[patient], "channel": channel}))
    if not rows:
        raise DatasetMissing("respiratorydatabase_tr: no labelled WAV files found")
    # Alternate sides (L1, R1, L2, ...) so a per-subject cap keeps both lungs.
    return sorted(rows, key=lambda r: (r.subject, int(r.labels["channel"][1:]), r.labels["channel"][0]))


def load_bracets(root: Path, groups: AgeGroups, place: str, export: str = "EXTD") -> list[Recording]:
    """BRACETS (Pessoa et al. 2023): adult respiratory sounds from two hospitals, one row per subject in Metadata.txt.

    Each hospital is its own dataset name so a site's class mix is visible to the site baseline.
    """
    base = _single_child(root, "bracets")
    with _find_one(base, "Metadata.txt", "bracets").open(encoding="utf-8", newline="") as handle:
        subjects = {row["SubjectID"].strip().zfill(2): row for row in csv.DictReader(handle) if row["Place"].strip() == place}
    name = f"bracets_{place.lower()}"
    rows = []
    for subject, meta in sorted(subjects.items()):
        for wav in sorted((base / "Data" / subject / "Sound" / export).glob("*.wav")):
            rows.append(Recording(name, wav.stem, f"bracets:{subject}", wav, {"diagnosis": meta["Diagnosis"].strip().lower()},
                                  age_group_from_years(float(meta["Age"]), groups)))
    if not rows:
        raise DatasetMissing(f"{name}: no {export} recordings found")
    return rows


# ----- unrelated audio (gate negatives) ---------------------------------------

def load_esc50(root: Path, groups: AgeGroups) -> list[Recording]:
    base = _single_child(root, "esc50")
    rows: list[Recording] = []
    with (base / "meta" / "esc50.csv").open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            wav = base / "audio" / row["filename"]
            rows.append(Recording("esc50", wav.stem, f"esc50:{row['src_file']}", wav, {"category": row["category"]}))
    return rows


def load_librispeech(root: Path, groups: AgeGroups) -> list[Recording]:
    base = _single_child(root, "librispeech")
    rows = [Recording("librispeech", flac.stem, f"librispeech:{flac.parent.parent.name}", flac, {"category": "speech"})
            for flac in sorted(base.rglob("*.flac"))]
    if not rows:
        raise DatasetMissing("librispeech: no FLAC files found")
    return rows


def load_musan(root: Path, groups: AgeGroups) -> list[Recording]:
    base = _single_child(root, "musan")
    rows = [Recording("musan", wav.stem, f"musan:{wav.relative_to(base).parts[1]}:{wav.stem}", wav,
                      {"category": wav.relative_to(base).parts[1]})
            for wav in sorted(base.rglob("*.wav")) if len(wav.relative_to(base).parts) > 2]
    if not rows:
        raise DatasetMissing("musan: no WAV files found")
    return rows


LOADERS: dict[str, Callable[[Path, AgeGroups], list[Recording]]] = {
    "circor": load_circor,
    "physionet2016": load_physionet2016,
    "bmdhs": load_bmdhs,
    "icbhi": load_icbhi,
    "kauh": load_kauh,
    "bracets_aveiro": partial(load_bracets, place="Aveiro"),
    "bracets_thessaloniki": partial(load_bracets, place="Thessaloniki"),
    "heart_regurgitation": load_heart_regurgitation,
    "zchsound": partial(load_zchsound, subset="clean"),
    "zchsound_noisy": partial(load_zchsound, subset="noisy"),
    "respiratorydatabase_tr": load_respiratorydatabase_tr,
    "sprsound": load_sprsound,
    "esc50": load_esc50,
    "librispeech": load_librispeech,
    "musan": load_musan,
}


def load(name: str, root: Path, groups: AgeGroups, options: dict | None = None) -> list[Recording]:
    """``options`` are the protocol's declared per-dataset settings (e.g. which KAUH filter export)."""
    if name not in LOADERS:
        raise KeyError(f"No loader for dataset {name!r}")
    return LOADERS[name](root, groups, **(options or {}))


def groups_covering(years: list[float], groups: AgeGroups) -> set[str]:
    """Every age group that overlaps the closed range ``[low, high]`` years."""
    low, high = years
    return {name for name, (start, end) in groups.items() if start <= high and low < end}


def cap_per_subject(rows: Iterable[Recording], limit: int) -> list[Recording]:
    """Keep at most ``limit`` recordings per subject (stable, deterministic order)."""
    counts: dict[str, int] = {}
    kept: list[Recording] = []
    for row in rows:
        if counts.get(row.subject, 0) < limit:
            counts[row.subject] = counts.get(row.subject, 0) + 1
            kept.append(row)
    return kept
