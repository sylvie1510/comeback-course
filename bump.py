#!/usr/bin/env python3
"""מעלה את מספר הגרסה בכל קישורי ה-JS/CSS, כדי שהדפדפן לא יגיש גרסה ישנה."""
import re, glob, json, os, subprocess
os.chdir(os.path.dirname(os.path.abspath(__file__)))
v = 1
if os.path.exists('.version'):
    v = int(open('.version').read().strip()) + 1
open('.version','w').write(str(v))
n = 0
for f in glob.glob('*.html'):
    s = open(f, encoding='utf-8').read()
    def fix(m):
        return f'{m.group(1)}="{m.group(2)}?v={v}"'
    new = re.sub(r'(src|href)="([\w.\-]+\.(?:js|css))(?:\?v=\d+)?"', fix, s)
    if new != s:
        open(f, 'w', encoding='utf-8').write(new); n += 1
print(f'version {v} · {n} files')
