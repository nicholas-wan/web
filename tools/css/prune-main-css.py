"""Remove rules from assets/css/main.css whose selectors can never match.

usage (from the repository root, with a fresh computed-style-check.py baseline):
  python tools/css/prune-main-css.py .cache/css-baseline.json .cache/css-prune-report.json \n      --assume-tags=h4,h5,h6,em,b,ol,blockquote,q,code,pre,hr,sub,sup,mark,table,thead,tbody,tfoot,tr,td,th,dl,dt,dd,iframe [--write]

Without --write it only reports. Run computed-style-check.py compare afterwards.

A selector is kept if every class, id and tag token it names exists somewhere
on the built site: in the generated HTML, in any script string literal (states
scripts add later), or in the DOM captured after scripts ran at three viewports
and several interaction states (from computed-style-check.py's baseline). Pseudo-classes
and pseudo-elements are ignored for the decision, and anything inside :not(),
:is() or :where() is treated as unknown, so those selectors are kept. @font-face
and every other non-media at-rule is left untouched. A rule that lists several
selectors keeps its block with only the live selectors.
"""
import re, glob, json, sys
import tinycss2
from bs4 import BeautifulSoup

SRC = 'assets/css/main.css'
css = open(SRC, encoding='utf-8', newline='').read()
baseline = json.load(open(sys.argv[1], encoding='utf-8'))
write = '--write' in sys.argv

html_classes, html_ids, html_tags = set(), set(), set()
for f in glob.glob('dist/*.html'):
    soup = BeautifulSoup(open(f, encoding='utf-8').read(), 'html.parser')
    for el in soup.find_all(True):
        html_tags.add(el.name.lower())
        for c in (el.get('class') or []):
            html_classes.add(c)
        if el.get('id'):
            html_ids.add(el['id'])
js_tokens = set()
literal = re.compile(r"'([^'\n]*)'|\"([^\"\n]*)\"")
for f in glob.glob('assets/js/*.js'):
    for m in literal.finditer(open(f, encoding='utf-8').read()):
        lit = m.group(1) if m.group(1) is not None else m.group(2)
        js_tokens.update(re.findall(r'[A-Za-z_][\w-]*', lit))
bt = baseline['tokens']
classes = html_classes | js_tokens | set(bt['classes'])
ids = html_ids | js_tokens | set(bt['ids'])
tags = html_tags | set(bt['tags']) | {'html', 'body', 'head'}
# Plain HTML content elements that hand-written journals may use later keep their
# base styling even though no page uses them today; pass --assume-tags=a,b,c.
for arg in sys.argv:
    if arg.startswith('--assume-tags='):
        tags |= set(t.strip().lower() for t in arg.split('=', 1)[1].split(',') if t.strip())

PSEUDO = re.compile(r'::?[a-zA-Z-]+(\([^)]*\))?')

def alive(sel):
    s = PSEUDO.sub('', sel).strip()
    if not s:
        return True
    for m in re.finditer(r'\.(-?[_a-zA-Z][\w-]*)', s):
        if m.group(1) not in classes:
            return False
    for m in re.finditer(r'#(-?[_a-zA-Z][\w-]*)', s):
        if m.group(1) not in ids:
            return False
    for m in re.finditer(r'(?:^|[\s>+~,(])([a-zA-Z][a-zA-Z0-9]*)', s):
        if m.group(1).lower() not in tags:
            return False
    return True

removed, trimmed = [], []

def prune(nodes, media=None):
    out = []
    for n in nodes:
        if n.type == 'qualified-rule':
            sel = tinycss2.serialize(n.prelude).strip()
            parts = [p.strip() for p in sel.split(',')]
            keep = [p for p in parts if alive(p)]
            if not keep:
                removed.append((media, sel))
                continue
            if len(keep) < len(parts):
                trimmed.append((media, sel, keep))
                n.prelude = tinycss2.parse_component_value_list(', '.join(keep) + ' ')
            out.append(n)
        elif n.type == 'at-rule' and n.lower_at_keyword in ('media', 'supports') and n.content is not None:
            inner = prune(tinycss2.parse_rule_list(n.content), tinycss2.serialize(n.prelude).strip())
            if not any(x.type in ('qualified-rule', 'at-rule') for x in inner):
                removed.append((None, '@' + n.at_keyword + ' ' + tinycss2.serialize(n.prelude).strip() + ' (whole block)'))
                continue
            n.content = tinycss2.parse_component_value_list(tinycss2.serialize(inner))
            out.append(n)
        else:
            out.append(n)
    return out

sheet = tinycss2.parse_stylesheet(css, skip_comments=False, skip_whitespace=False)
kept = prune(sheet)
result = tinycss2.serialize(kept)
# Collapse runs of blank lines left behind by removed rules.
result = re.sub(r'\n{3,}', '\n\n', result)
if not result.endswith('\n'):
    result += '\n'
print(f'rules removed={len(removed)} rules trimmed={len(trimmed)}; bytes {len(css)} -> {len(result.encode())}')
json.dump({'removed': removed, 'trimmed': trimmed}, open(sys.argv[2], 'w', encoding='utf-8'), indent=1)
if write:
    open(SRC, 'w', encoding='utf-8', newline='').write(result)
    print('written', SRC)
