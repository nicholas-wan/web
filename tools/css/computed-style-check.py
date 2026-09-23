"""Capture (or compare) the computed style of every element on every built page.

usage (from the repository root, after tools/site.ps1 build):
  python tools/css/computed-style-check.py compare-dirs <built copy A> <built copy B>   # preferred: side-by-side diff
  python tools/css/computed-style-check.py base .cache/css-baseline.json
  ...edit assets/css/main.css or custom.css, rebuild...
  python tools/css/computed-style-check.py compare .cache/css-baseline.json

Needs the playwright package (pip install playwright) and Microsoft Edge; no
browser download is required.

Each page is loaded at three viewports (desktop, tablet, phone with touch), in
several states (top of page, scrolled to the bottom, navigation panel open,
lightbox open, atlas trip entered / phone overlay open). For every element the
full computed style of the element and its ::before/::after plus its bounding
box are hashed (property names sorted, because enumeration order
depends on stylesheet parse order). The union of class names, ids and tag names seen after scripts
ran is stored too, so the dead-rule audit can use it.
"""
import json, subprocess, sys, time, os
from playwright.sync_api import sync_playwright

PORT = 4399
PAGES = ['404.html', 'experience.html', 'house.html', 'index.html', 'personal.html', 'prewed.html',
         'skills.html', 'travel.html', 'travel_2017_seoul.html', 'travel_2019_siliconvalley.html',
         'travel_2022_europe.html', 'travel_2023_perth.html', 'travel_2023_usacanada.html',
         'travel_2024_australia.html', 'travel_2024_germany.html', 'travel_2025_japan.html',
         'travel_2026_guangzhou.html']
VIEWPORTS = [('desktop', dict(viewport={'width': 1440, 'height': 900})),
             ('tablet', dict(viewport={'width': 900, 'height': 900})),
             ('phone', dict(viewport={'width': 375, 'height': 812}, device_scale_factor=2, is_mobile=True, has_touch=True))]

CAPTURE = r"""
() => {
  const els = [document.documentElement, ...document.querySelectorAll('*')];
  const h = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0).toString(16); };
  const dump = cs => { const names = []; for (let i = 0; i < cs.length; i++) names.push(cs[i]); names.sort(); let s = ''; for (const p of names) s += p + ':' + cs.getPropertyValue(p).split(location.origin).join('') + ';'; return s; };
  const C = new Set(), I = new Set(), T = new Set(); const out = []; const desc = [];
  for (const el of els) {
    T.add(el.tagName.toLowerCase()); if (el.id) I.add(el.id); for (const c of el.classList) C.add(c);
    let s = dump(getComputedStyle(el)) + '|' + dump(getComputedStyle(el, '::before')) + '|' + dump(getComputedStyle(el, '::after'));
    const r = el.getBoundingClientRect(); s += '|' + Math.round(r.x) + ',' + Math.round(r.y) + ',' + Math.round(r.width) + ',' + Math.round(r.height);
    out.push(h(s));
    desc.push(el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : ''));
  }
  return { hashes: out, desc, classes: [...C], ids: [...I], tags: [...T] };
}
"""

def settle(page, ms=2500):
    try:
        page.wait_for_load_state('networkidle', timeout=8000)
    except Exception:
        pass
    page.wait_for_timeout(ms)

def states(page, name, vp):
    """Yield (state, ) after putting the page in each state."""
    yield 'top'
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    page.wait_for_timeout(1500)
    yield 'bottom'
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(800)
    toggle = page.query_selector('.navPanelToggle, [aria-controls="navPanel"], button[aria-label*="menu" i]')
    if toggle and toggle.is_visible():
        toggle.click(); page.wait_for_timeout(900)
        yield 'nav-open'
        page.keyboard.press('Escape'); page.wait_for_timeout(600)
    trigger = page.query_selector('.journal-lightbox-trigger')
    if trigger:
        page.evaluate("el => { el.scrollIntoView({block:'center'}); el.click(); }", trigger)
        page.wait_for_timeout(1200)
        yield 'lightbox'
        page.keyboard.press('Escape'); page.wait_for_timeout(600)
        page.evaluate("window.scrollTo(0, 0)"); page.wait_for_timeout(400)
    if name == 'travel.html':
        teaser = page.query_selector('.travel-map-teaser')
        if vp == 'phone' and teaser and teaser.is_visible():
            teaser.click(); page.wait_for_timeout(1500)
            yield 'atlas-overlay'
        marker = page.query_selector('.travel-map__marker')
        if marker and marker.is_visible():
            marker.click(); page.wait_for_timeout(2500)
            yield 'atlas-trip'

def run(mode, store_path):
    base = {}
    if mode == 'compare':
        base = json.load(open(store_path, encoding='utf-8'))
    results = {}
    tokens = {'classes': set(), 'ids': set(), 'tags': set()}
    server = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', 'dist', '--bind', '127.0.0.1'],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.5)
    diffs = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(channel='msedge', headless=True)
            for vp_name, vp in VIEWPORTS:
                ctx = browser.new_context(**vp)
                page = ctx.new_page()
                for name in PAGES:
                    page.goto(f'http://127.0.0.1:{PORT}/{name}', wait_until='load')
                    settle(page)
                    for state in states(page, name, vp_name):
                        key = f'{name}|{vp_name}|{state}'
                        cap = page.evaluate(CAPTURE)
                        for k in tokens:
                            tokens[k].update(cap[k])
                        results[key] = cap['hashes']
                        if mode == 'compare':
                            old = base['results'].get(key)
                            if old is None:
                                diffs.append((key, 'missing baseline', []))
                                continue
                            changed = [f'{i}:{cap["desc"][i] if i < len(cap["desc"]) else "?"}'
                                       for i in range(max(len(old), len(cap['hashes'])))
                                       if (old[i] if i < len(old) else None) != (cap['hashes'][i] if i < len(cap['hashes']) else None)]
                            if changed:
                                diffs.append((key, f'{len(changed)} of {len(old)} elements differ', changed[:8]))
                ctx.close()
            browser.close()
    finally:
        server.terminate()
    if mode == 'base':
        json.dump({'results': results, 'tokens': {k: sorted(v) for k, v in tokens.items()}}, open(store_path, 'w', encoding='utf-8'))
        print(f'baseline: {len(results)} captures, {sum(len(v) for v in results.values())} element hashes; '
              f'tokens classes={len(tokens["classes"])} ids={len(tokens["ids"])} tags={len(tokens["tags"])}')
    else:
        print(f'compared {len(results)} captures; {len(diffs)} with differences')
        for key, summary, sample in diffs:
            print(' ', key, '->', summary)
            for s in sample:
                print('      ', s)
        json.dump({'diffs': diffs}, open(store_path + '.diff.json', 'w', encoding='utf-8'), indent=1)

FULL = CAPTURE.replace("out.push(h(s));", "out.push(s);")

def compare_dirs(dir_a, dir_b):
    """Load every page/state from two built copies side by side in one browser and
    diff the full computed style text of every element, so nothing depends on
    hashes or on state kept between runs."""
    servers = [subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--directory', d, '--bind', '127.0.0.1'],
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
               for port, d in ((PORT, dir_a), (PORT + 1, dir_b))]
    time.sleep(1.5)
    total = 0; problems = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(channel='msedge', headless=True)
            for vp_name, vp in VIEWPORTS:
                for name in PAGES:
                    caps = []
                    for port in (PORT, PORT + 1):
                        ctx = browser.new_context(**vp)
                        page = ctx.new_page()
                        page.goto(f'http://127.0.0.1:{port}/{name}', wait_until='load')
                        settle(page)
                        got = {}
                        for state in states(page, name, vp_name):
                            got[state] = page.evaluate(FULL)
                        ctx.close()
                        caps.append(got)
                    a, b = caps
                    for state in a:
                        total += 1
                        print(f'{name}|{vp_name}|{state}: ' + ('same' if a[state]['hashes'] == b.get(state, {}).get('hashes') else 'DIFFERENT'), flush=True)
                        if state not in b:
                            problems.append((f'{name}|{vp_name}|{state}', 'state missing in B', [])); continue
                        ha, hb = a[state]['hashes'], b[state]['hashes']
                        if len(ha) != len(hb):
                            problems.append((f'{name}|{vp_name}|{state}', f'element count {len(ha)} vs {len(hb)}', [])); continue
                        changed = []
                        for i, (x, y) in enumerate(zip(ha, hb)):
                            if x != y:
                                props = []
                                for label, sx, sy in zip(('', '::before ', '::after '), x.split('|')[:3], y.split('|')[:3]):
                                    px = dict(kv.split(':', 1) for kv in sx.split(';') if ':' in kv)
                                    py = dict(kv.split(':', 1) for kv in sy.split(';') if ':' in kv)
                                    props += [f'{label}{k}: {px[k]!r} -> {py.get(k)!r}' for k in px if px[k] != py.get(k)][:3]
                                if x.split('|')[3] != y.split('|')[3]:
                                    props.append(f'rect {x.split("|")[3]} -> {y.split("|")[3]}')
                                changed.append(f'{i}:{a[state]["desc"][i]} {props[:4]}')
                        if changed:
                            problems.append((f'{name}|{vp_name}|{state}', f'{len(changed)} of {len(ha)} elements differ', changed[:6]))
            browser.close()
    finally:
        for s in servers: s.terminate()
    print(f'compared {total} page states between {dir_a} and {dir_b}; {len(problems)} differ')
    for key, summary, sample in problems:
        print(' ', key, '->', summary)
        for s in sample: print('      ', s)
    return problems

if __name__ == '__main__':
    if sys.argv[1] == 'compare-dirs':
        compare_dirs(sys.argv[2], sys.argv[3])
    else:
        run(sys.argv[1], sys.argv[2])
