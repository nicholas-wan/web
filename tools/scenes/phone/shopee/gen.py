# Builds the phone-only Shopee scene (scene-m.html, scene-m.css) from the
# desktop markup in orig.html (copied from experience.html).
# Layout (a clockwise U, every connector a short straight arrow):
#   listing (scaled S) -> word column        (top band, as on desktop)
#                              | down
#   spec list  <-  model (mirrored)          (bottom band)
# The spec list sits under the listing, right below its "Spesifikasi Produk"
# row, which is what the model fills.
import re, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'orig.html'), encoding='utf8').read()

W = 360
S = 1.45                  # listing scale
COL_GAP = 26.0            # listing edge to word column (holds the arrow)
ROW_W0 = 92.0             # code + gap + longest word (59.5) + 6
# centre the composition: equal margins left of the listing and right of the column
OX = (360 - (2 * 1.45 + 116 * 1.45 + COL_GAP + ROW_W0) - 2 * 1.45) / 2
TX, TY = OX, -2.0
def L(x, y): return (TX + S * x, TY + S * y)

# ---- word column -----------------------------------------------------------
F_WORD, F_CODE = 14.5, 11.0
ROW_H, ROW_P = 18.0, 22.5
COL_X, ROW_W, CODE_W = L(118, 0)[0] + COL_GAP, ROW_W0, 21.0
TEXT_X = COL_X + CODE_W + 5.5
ROWS_TOP = L(0, 83)[1] - (4 * 22.5 + 18) / 2   # arrow meets the title line
WORDS = [('ID', '#ee4d2d', 'Sepatu', False), ('ID', '#ee4d2d', 'Lari', False), ('ID', '#ee4d2d', 'Pria', False),
         ('ZH', '#a92f17', '男士跑鞋', True), ('TH', '#b86b00', 'รองเท้าวิ่ง', True)]
def row_top(i): return ROWS_TOP + i * ROW_P
def row_base(i, alt): return row_top(i) + ROW_H / 2 + (0.34 if alt else 0.31) * F_WORD
ROWS_MID = ROWS_TOP + (4 * ROW_P + ROW_H) / 2
COL_CX = COL_X + ROW_W / 2
import sys
NOTE_F, NOTE_P = 13.0, 16.5   # notes: the anomaly cards' note style (Merriweather 300)
WORDS_NOTE_BELOW = 'above' not in sys.argv
NOTES = {'words': ('Words from all', 'three languages.'),
         'model': ('Predicts attributes', 'from the words.'),
         'attrs': ('Fills in the', 'product specs.')}
# 'Words' heads its column (the space above the rows is otherwise empty),
# so its note never meets the arrow down to the model.
if WORDS_NOTE_BELOW:     # caption and note under the rows, like the other two steps
    WORDS_CAP_Y = row_top(4) + ROW_H + 20
    WORDS_NOTE_Y = WORDS_CAP_Y + 17.5
else:
    WORDS_NOTE_Y = ROWS_TOP - 12 - NOTE_P
    WORDS_CAP_Y = WORDS_NOTE_Y - 18.5

# ---- bottom band -----------------------------------------------------------
LIST_X0, LIST_X1 = L(2, 0)[0], L(118, 0)[0]
B_TOP = (WORDS_NOTE_Y + NOTE_P + 6 + 18 + 5 - 4.9) if WORDS_NOTE_BELOW else 223.0   # an 18-unit arrow down to the model
SPEC_P = 20.0
SPEC_H = 4 * SPEC_P + 9
SPEC_MID = B_TOP + SPEC_H / 2
M = 1.8                    # model scale
MODEL_CX = COL_CX
MODEL_CY = SPEC_MID
CAP_Y = B_TOP + SPEC_H + 20
NOTE_Y = CAP_Y + 17.5
H = round(NOTE_Y + NOTE_P + 6)

# ---- chips -----------------------------------------------------------------
# (listing-space text x, baseline, rect x, y, w, h, fill, alt, row)
CHIPS = [(8, 86, 7, 77.5, 37.4, 11, '#fbd9cf', False, 0, 'Sepatu'),
         (46.05, 86, 45.05, 77.5, 19.9, 11, '#fbd9cf', False, 1, 'Lari'),
         (66.64, 86, 65.64, 77.5, 20.6, 11, '#fbd9cf', False, 2, 'Pria'),
         (8, 97.5, 7, 89.5, 40, 10.5, '#efd5ce', True, 3, '男士跑鞋'),
         (53.53, 97.5, 52.53, 89.5, 40.3, 10.5, '#fbe3cd', True, 4, 'รองเท้าวิ่ง')]
CLEAR_X = 97               # listing x every chip slides to before it travels
LIFT = 1.2

def f(v): return ('%.2f' % v).rstrip('0').rstrip('.')
def note(key, n, x, y):
    return f'<text class="sp-m-note sp-m-note-{n}" text-anchor="middle">' + ''.join(f'<tspan x="{f(x)}" y="{f(y + i * NOTE_P)}">{t}</tspan>' for i, t in enumerate(NOTES[key])) + '</text>'

# ---- listing artwork, lifted from the desktop svg --------------------------
card = src[src.index('<g class="sp-card">'):src.index('<g class="sp-chips"')]
card = card.replace('<g class="sp-card">', '', 1)
card = card[:card.rindex('</g>')]          # drop the sp-card closing tag
card = card.replace('class="sp-crop"', 'class="sp-m-crop"')
for a in ('spUpper', 'spSole', 'spBackdrop'): card = card.replace(f'#{a})', f'#{a}M)')
# The 1/9 counter: 5.5 units would render under 7px, so its pill and text
# grow (still bottom-right of the photo).
card = card.replace('<rect x="101" y="52.5" width="13" height="6" rx="3" fill="#000" opacity=".45"></rect><text class="sp-counter" x="107.5" y="57.2" text-anchor="middle">1/9</text>',
                    '<rect x="99.5" y="50.6" width="16" height="8" rx="4" fill="#000" opacity=".45"></rect><text class="sp-counter sp-m-counter" x="107.5" y="57.2" text-anchor="middle">1/9</text>')
assert 'sp-m-counter' in card
defs = src[src.index('<defs>'):src.index('</defs>') + 7]
for a in ('spUpper', 'spSole', 'spBackdrop'): defs = defs.replace(f'id="{a}"', f'id="{a}M"')
filt = src[src.index('<filter id="spLift"'):src.index('</filter>') + 9].replace('id="spLift"', 'id="spLiftM"')

out = []
A = out.append
A(f'<svg class="sp-brand sp-brand--m" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="A Shopee product page with an Indonesian title and a Chinese and Thai line: every word, in all three languages, is tokenised and read by a text model, which fills the product specifications with Shoes, Running, Men and Sport.">{defs}')
A(f'<g class="sp-m-card"><g transform="translate({f(TX)} {f(TY)}) scale({S})">{card}</g></g>')

# chips: outer g animates in scene space; inner g carries the listing transform
A('<g class="sp-m-chips" filter="url(#spLiftM)">')
for n, (tx, ty, rx, ry, rw, rh, fill, alt, row, word) in enumerate(CHIPS, 1):
    cls = 'sp-title sp-title--alt sp-chip-text' if alt else 'sp-title sp-chip-text'
    A(f'<g class="sp-m-chip sp-m-chip-{n}"><g transform="translate({f(TX)} {f(TY)}) scale({S})"><rect x="{rx}" y="{ry}" width="{rw}" height="{rh}" rx="2" fill="{fill}"></rect><text class="{cls}" x="{tx}" y="{ty}">{word}</text></g></g>')
A('</g>')

# word column
ax0 = L(118, 0)[0] + 5
A('<g class="sp-m-words">')
A(f'<path class="sp-arrow sp-m-arrow-1" d="M{f(ax0)} {f(ROWS_MID)}H{f(COL_X - 5)}M{f(COL_X - 9)} {f(ROWS_MID - 4)}L{f(COL_X - 5)} {f(ROWS_MID)}L{f(COL_X - 9)} {f(ROWS_MID + 4)}"></path>')
for i, (code, col, word, alt) in enumerate(WORDS):
    t = row_top(i)
    A(f'<g class="sp-m-slot sp-m-slot-{i+1}"><rect x="{f(COL_X)}" y="{f(t)}" width="{f(ROW_W)}" height="{f(ROW_H)}" rx="2.5" fill="#fff4ef"></rect>'
      f'<rect x="{f(COL_X)}" y="{f(t)}" width="{f(CODE_W)}" height="{f(ROW_H)}" rx="2.5" fill="{col}"></rect>'
      f'<text class="sp-code" x="{f(COL_X + CODE_W/2)}" y="{f(t + ROW_H/2 + 0.36*F_CODE)}" text-anchor="middle">{code}</text>'
      f'<text class="sp-word{" sp-word--alt" if alt else ""}" x="{f(TEXT_X)}" y="{f(row_base(i, alt))}">{word}</text></g>')
A(f'<text class="sp-label sp-m-cap-words" x="{f(COL_CX)}" y="{f(WORDS_CAP_Y)}" text-anchor="middle">Words</text>' + note('words', 1, COL_CX, WORDS_NOTE_Y))
A('</g>')

# model: mirrored (inputs on the right under the word column, output on the
# left facing the spec list), scaled M about its centre
def mx(dx): return MODEL_CX + M * dx      # ins at +13 (right), output at -13 (left)
def my(dy): return MODEL_CY + M * dy
ins = [(13, d) for d in (-15, -7.5, 0, 7.5, 15)]
mids = [(0, d) for d in (-11, 0, 11)]
outn = (-13, 0)
bw, bh = 40 * M, 44 * M
in_x = mx(13)
A('<g class="sp-m-model">')
dn0 = (WORDS_NOTE_Y + NOTE_P + 6) if WORDS_NOTE_BELOW else (row_top(4) + ROW_H + 8)
A(f'<path class="sp-arrow sp-m-arrow-2" d="M{f(in_x)} {f(dn0)}V{f(MODEL_CY - bh/2 - 5)}M{f(in_x - 4)} {f(MODEL_CY - bh/2 - 9)}L{f(in_x)} {f(MODEL_CY - bh/2 - 5)}L{f(in_x + 4)} {f(MODEL_CY - bh/2 - 9)}"></path>')
A(f'<rect x="{f(MODEL_CX - bw/2)}" y="{f(MODEL_CY - bh/2)}" width="{f(bw)}" height="{f(bh)}" rx="{f(4*M)}" fill="#fff" stroke="#efb9a5" stroke-width="1.2"></rect>')
A(f'<g fill="none" stroke="#f2cbbd" stroke-width="{f(.75*M)}">')
for (mdx, mdy) in mids:
    d = ''.join(f'M{f(mx(a))} {f(my(b))}L{f(mx(mdx))} {f(my(mdy))}' for a, b in ins)
    A(f'<path class="sp-m-edge" d="{d}"></path>')
d = ''.join(f'M{f(mx(a))} {f(my(b))}L{f(mx(outn[0]))} {f(my(outn[1]))}' for a, b in mids)
A(f'<path class="sp-m-edge sp-m-edge--out" d="{d}"></path></g>')
A('<g class="sp-nodes sp-m-nodes-in" fill="#f0a086">' + ''.join(f'<circle cx="{f(mx(a))}" cy="{f(my(b))}" r="{f(2.2*M)}"></circle>' for a, b in ins) + '</g>')
A('<g class="sp-nodes sp-m-nodes-mid" fill="#ea7752">' + ''.join(f'<circle cx="{f(mx(a))}" cy="{f(my(b))}" r="{f(2.4*M)}"></circle>' for a, b in mids) + '</g>')
A(f'<g class="sp-nodes sp-m-nodes-out" fill="#ee4d2d"><circle cx="{f(mx(outn[0]))}" cy="{f(my(outn[1]))}" r="{f(3*M)}"></circle></g>')
A(f'<text class="sp-label" x="{f(MODEL_CX)}" y="{f(CAP_Y)}" text-anchor="middle">Model</text>' + note('model', 2, MODEL_CX, NOTE_Y))
A('</g>')

# spec list under the listing
A('<g class="sp-m-result">')
bx0 = MODEL_CX - bw / 2
A(f'<path class="sp-arrow" d="M{f(bx0 - 5)} {f(SPEC_MID)}H{f(LIST_X1 + 5)}M{f(LIST_X1 + 9)} {f(SPEC_MID - 4)}L{f(LIST_X1 + 5)} {f(SPEC_MID)}L{f(LIST_X1 + 9)} {f(SPEC_MID + 4)}"></path>')
A(f'<rect x="{f(LIST_X0)}" y="{f(B_TOP)}" width="{f(LIST_X1 - LIST_X0)}" height="{f(SPEC_H)}" rx="5" fill="#fff" stroke="#efb9a5" stroke-width="1.2"></rect>')
kx, vx = LIST_X0 + 9, LIST_X1 - 9
for i, (k, v) in enumerate([('Category', 'Shoes'), ('Type', 'Running'), ('Gender', 'Men'), ('Activity', 'Sport')]):
    y = B_TOP + 4.5 + SPEC_P * i + SPEC_P / 2 + 4.2
    A(f'<g class="sp-m-row sp-m-row-{i+1}"><text class="sp-key" x="{f(kx)}" y="{f(y)}">{k}</text><text class="sp-value" x="{f(vx)}" text-anchor="end" y="{f(y)}">{v}</text></g>')
    if i < 3:
        ry = B_TOP + 4.5 + SPEC_P * (i + 1)
        A(f'<path d="M{f(kx)} {f(ry)}H{f(vx)}" stroke="#f4e6e1"></path>')
A(f'<text class="sp-label" x="{f((LIST_X0 + LIST_X1)/2)}" y="{f(CAP_Y)}" text-anchor="middle">Attributes</text>' + note('attrs', 3, (LIST_X0 + LIST_X1)/2, NOTE_Y))
A('</g>')
A(filt + '</svg>')
open(os.path.join(HERE, 'scene-m.html'), 'w', encoding='utf8').write('\n'.join(out) + '\n')

# ---- CSS -------------------------------------------------------------------
lc = (LIST_X0 + LIST_X1) / 2
card_dx = W / 2 - lc
card_dy = (H / 2) - (L(0, 5)[1] + L(0, 147)[1]) / 2
css = [f'''/* Shopee, phone only (<=736px): the same scene on a taller canvas
   (360x{H}), stacked as a clockwise U so every label is at least 10.5 units
   (about 9.6px at 390). Generated by gen.py. Base styles are the final
   frame; motion runs only under .is-playing, on the desktop timeline. */
.internship-demo-card__plot > svg.sp-brand--m {{ aspect-ratio: {W} / {H}; }}
.sp-brand--m .sp-label {{ font-size: 14px; }}
.sp-brand--m .sp-word {{ font-size: {F_WORD}px; }}
.sp-brand--m .sp-code {{ font-size: {F_CODE}px; }}
.sp-brand--m .sp-key {{ font-size: 12px; }}
.sp-brand--m .sp-value {{ font-size: 13px; }}
.sp-brand--m .sp-m-counter {{ font-size: 7.6px; }}
.sp-brand--m .sp-arrow {{ stroke-width: 1.5; }}
.sp-brand--m .sp-m-chip {{ opacity: 0; }}
/* One plain note per step, in the anomaly cards' note style; each
   fades in just after its step arrives and holds in the final frame. */
.sp-brand--m .sp-m-note {{ font-family: "Merriweather", Georgia, serif; font-size: {NOTE_F:g}px; font-weight: 300; fill: #596273; }}
.is-playing .sp-brand--m .sp-m-note-1 {{ animation: sp-m-reveal 0.5s 1.95s both; }}
.is-playing .sp-brand--m .sp-m-note-2 {{ animation: sp-m-reveal 0.5s 4.35s both; }}
.is-playing .sp-brand--m .sp-m-note-3 {{ animation: sp-m-reveal 0.5s 5.75s both; }}
.is-playing .sp-brand--m .sp-m-card {{ animation: sp-m-split 0.9s 0.4s ease-in-out both; }}
.is-playing .sp-brand--m .sp-m-crop {{ animation: sp-m-reveal 0.4s 1.2s both; }}
.is-playing .sp-brand--m .sp-m-chip-5 {{ animation: sp-m-chip-5 1.2s 1.8s both; }}
.is-playing .sp-brand--m .sp-m-chip-4 {{ animation: sp-m-chip-4 1.2s 2.08s both; }}
.is-playing .sp-brand--m .sp-m-chip-3 {{ animation: sp-m-chip-3 1.2s 2.36s both; }}
.is-playing .sp-brand--m .sp-m-chip-2 {{ animation: sp-m-chip-2 1.2s 2.64s both; }}
.is-playing .sp-brand--m .sp-m-chip-1 {{ animation: sp-m-chip-1 1.2s 2.92s both; }}
.is-playing .sp-brand--m .sp-m-words {{ animation: sp-m-arrive-x 0.6s 1.7s both; }}
.is-playing .sp-brand--m .sp-m-slot-5 {{ animation: sp-m-reveal 0.3s 2.54s both; }}
.is-playing .sp-brand--m .sp-m-slot-4 {{ animation: sp-m-reveal 0.3s 2.82s both; }}
.is-playing .sp-brand--m .sp-m-slot-3 {{ animation: sp-m-reveal 0.3s 3.1s both; }}
.is-playing .sp-brand--m .sp-m-slot-2 {{ animation: sp-m-reveal 0.3s 3.38s both; }}
.is-playing .sp-brand--m .sp-m-slot-1 {{ animation: sp-m-reveal 0.3s 3.66s both; }}
.is-playing .sp-brand--m .sp-m-arrow-1 {{ animation: sp-m-arrive-x 0.4s 3.9s both; }}
.is-playing .sp-brand--m .sp-m-model {{ animation: sp-m-arrive-y 0.5s 4.1s both; }}
.is-playing .sp-brand--m .sp-m-edge {{ animation: sp-m-glow 0.55s 4.5s ease-out both; }}
.is-playing .sp-brand--m .sp-m-edge--out {{ animation: sp-m-glow 0.55s 4.95s ease-out both; }}
.is-playing .sp-brand--m .sp-m-nodes-in circle {{ animation: sp-m-pulse 0.55s 4.5s ease-out both; }}
.is-playing .sp-brand--m .sp-m-nodes-mid circle {{ animation: sp-m-pulse 0.55s 4.85s ease-out both; }}
.is-playing .sp-brand--m .sp-m-nodes-out circle {{ animation: sp-m-pulse 0.55s 5.2s ease-out both; }}
.is-playing .sp-brand--m .sp-m-result {{ animation: sp-m-arrive-back 0.5s 5.5s both; }}
.is-playing .sp-brand--m .sp-m-row-1 {{ animation: sp-m-row 0.35s 5.95s both; }}
.is-playing .sp-brand--m .sp-m-row-2 {{ animation: sp-m-row 0.35s 6.08s both; }}
.is-playing .sp-brand--m .sp-m-row-3 {{ animation: sp-m-row 0.35s 6.21s both; }}
.is-playing .sp-brand--m .sp-m-row-4 {{ animation: sp-m-row 0.35s 6.34s both; }}
/* The listing opens centred in the taller canvas, then settles top left. */
@keyframes sp-m-split {{ from {{ transform: translate({f(card_dx)}px, {f(card_dy)}px); }} to {{ transform: none; }} }}
@keyframes sp-m-reveal {{ from {{ opacity: 0; }} to {{ opacity: 1; }} }}
@keyframes sp-m-arrive-x {{ from {{ opacity: 0; transform: translateX(-8px); }} to {{ opacity: 1; transform: none; }} }}
@keyframes sp-m-arrive-y {{ from {{ opacity: 0; transform: translateY(-8px); }} to {{ opacity: 1; transform: none; }} }}
@keyframes sp-m-arrive-back {{ from {{ opacity: 0; transform: translateX(8px); }} to {{ opacity: 1; transform: none; }} }}
@keyframes sp-m-row {{ from {{ opacity: 0; transform: translateY(2px); }} to {{ opacity: 1; transform: none; }} }}
@keyframes sp-m-glow {{ 0%, 100% {{ stroke: #f2cbbd; }} 40% {{ stroke: #ee6a48; }} }}
@keyframes sp-m-pulse {{ 0%, 100% {{ transform: scale(1); }} 45% {{ transform: scale(1.35); fill: #ff7a5c; }} }}
/* Each chip lifts, slides along its own line until it clears the listing's
   text (listing x {CLEAR_X}), then travels to its row and lands as an exact
   copy of the row's word, scaled about its own text anchor; it holds until
   the row has faded in, then fades. */''']
for n, (tx, ty, rx, ry, rw, rh, fill, alt, row, word) in enumerate(CHIPS, 1):
    ox, oy = L(tx, ty)
    fs = (9.5 if alt else 11) * S
    k = F_WORD / fs
    lift = LIFT * S
    sx = S * (CLEAR_X - tx)
    gx, gy = TEXT_X - ox, row_base(row, alt) - oy
    css.append(f'.sp-brand--m .sp-m-chip-{n} {{ transform-box: view-box; transform-origin: {f(ox)}px {f(oy)}px; }}')
    css.append(f'''@keyframes sp-m-chip-{n} {{
  0% {{ opacity: 0; transform: none; }}
  9% {{ opacity: 1; transform: translate(0, {f(-lift)}px) scale(1.05); animation-timing-function: ease-in; }}
  33.75% {{ transform: translate({f(sx)}px, {f(-lift)}px) scale(1.05); animation-timing-function: ease-out; }}
  61.5%, 86.5% {{ opacity: 1; transform: translate({f(gx)}px, {f(gy)}px) scale({k:.4f}); }}
  100% {{ opacity: 0; transform: translate({f(gx)}px, {f(gy)}px) scale({k:.4f}); }}
}}''')
open(os.path.join(HERE, 'scene-m.css'), 'w', encoding='utf8').write('\n'.join(css) + '\n')
print('H', H, 'card offset', f(card_dx), f(card_dy))
