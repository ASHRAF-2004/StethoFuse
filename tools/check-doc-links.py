"""Check local targets in the public entry documentation without network access."""
from pathlib import Path
import re
from urllib.parse import unquote

root = Path(__file__).resolve().parents[1]
documents = [root / name for name in (
    'README.md', 'ARCHITECTURE.md', 'CONTRIBUTING.md', 'CHANGELOG.md',
    'SECURITY.md', 'THIRD_PARTY_NOTICES.md', 'docs/COMPLETION_2026-11-05.md',
    'docs/ACCOUNT_EMAIL_DELIVERY.md', 'services/stethofuse-account-mail/README.md')]
missing = []
checked = 0
for document in documents:
    if not document.is_file():
        missing.append(str(document.relative_to(root)))
        continue
    text = document.read_text(encoding='utf-8')
    targets = re.findall(r'\]\(([^)]+)\)', text)
    targets += re.findall(r'(?:src|srcset)="([^"]+)"', text)
    for target in targets:
        if target.startswith(('#', 'http:', 'https:', 'mailto:')):
            continue
        target = unquote(target.split('#')[0].split('?')[0])
        checked += 1
        if not (document.parent / target).is_file():
            missing.append(f'{document.relative_to(root)}: {target}')
if missing:
    raise SystemExit('Missing documentation targets:\n' + '\n'.join(missing))
print(f'PASS: {len(documents)} documents, {checked} local links/assets')
