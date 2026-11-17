#!/usr/bin/env python3
"""Builds src/content/foodNutrition.ts from the official CSV downloads.

Inputs (not stored in the repo):
  --cnf   folder with the Canadian Nutrient File 2026 CSVs (Health Canada)
  --usda-sr, --usda-foundation  USDA FoodData Central SR Legacy (2018-04) and Foundation Foods (2026-10-29) JSON files
Matching, in order: (1) a hand-picked code in scripts/food-match-overrides.json;
(2) the food name equals a CNF description, or a CNF description plus ", raw"
(plural and singular accepted, exactly one record). Everything else gets no numbers ("Needs review").
Values are stored per 100 g, unmodified.
Run: python3 -I scripts/build-food-nutrition.py --cnf DIR --usda-sr FILE --usda-foundation FILE --checked YYYY-MM-DD
"""
import argparse, csv, json, os, re, collections

ap = argparse.ArgumentParser()
ap.add_argument('--cnf', required=True); ap.add_argument('--usda-sr', dest='usda_sr', required=True); ap.add_argument('--usda-foundation', dest='usda_foundation', required=True); ap.add_argument('--checked', required=True)
a = ap.parse_args()
HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(HERE, '..', 'src', 'content')

def rd(path): return list(csv.DictReader(open(path, encoding='utf-8-sig')))
def n(s): return ' '.join(re.sub(r'[^a-z0-9 ]', '', s.lower().replace(',', ' ').replace('-', ' ')).split())

src = open(os.path.join(APP, 'foods.ts'), encoding='utf-8').read()
foods = [(i, nm.replace("\\'", "'")) for i, nm in re.findall(r"\{ id: '([^']+)', name: '((?:[^'\\]|\\.)*)'", src)]

cnf = rd(os.path.join(a.cnf, 'Food_Name.csv'))
by_code = {r['Food_Code']: r for r in cnf}
idx = collections.defaultdict(list)
for r in cnf: idx[n(r['Food_Description_EN'])].append(r)

def variants(nm):
    b = n(nm); out = {b}
    if b.endswith('ies'): out.add(b[:-3] + 'y')
    if b.endswith('oes'): out.add(b[:-2])
    if b.endswith('es'): out.add(b[:-2])
    if b.endswith('s'): out.add(b[:-1])
    else: out.add(b + 's'); out.add(b + 'es')
    if b.endswith('y'): out.add(b[:-1] + 'ies')
    return out

ov = json.load(open(os.path.join(HERE, 'food-match-overrides.json')))['byName']
matches = {}  # app id -> (cnf row, how)
for i, nm in foods:
    if nm in ov: matches[i] = (by_code[str(ov[nm])], 'picked'); continue
    for suf in (' raw', ' raw with skin', ''):
        c = {r['Food_Code']: r for v in variants(nm) for r in idx.get(n(v + suf), [])}
        if len(c) == 1: matches[i] = (list(c.values())[0], 'name'); break
        if len(c) > 1: break

NUT = {'203': 'proteinG', '305': 'phosphorusMg', '306': 'potassiumMg', '307': 'sodiumMg'}
amt = collections.defaultdict(dict)
for r in rd(os.path.join(a.cnf, 'Nutrient_Amount.csv')):
    if r['Nutrient_Code'] in NUT:
        amt[r['Food_Code']][NUT[r['Nutrient_Code']]] = (float(r['Nutrient_Amount']), int(r['Nutrient_Source_Code']))

def cls(code):
    if code in (3, 7): return 'analysed'
    if code in (0, 1): return 'usda'
    if code in (2, 4, 5, 15, 16, 17, 51): return 'calculated'
    return 'review'  # 12 assumed zero, 14 provisional, and every code the approved rules do not list

mname = {r['Measure_Code']: r['Measure_Description_and_Unit_EN'] for r in rd(os.path.join(a.cnf, 'Measure_Name.csv'))}
meas = collections.defaultdict(list)
for r in rd(os.path.join(a.cnf, 'Measure_Weight_Conversion.csv')):
    if r['Measure_Type_Code'] == '6': meas[r['Food_Code']].append((mname.get(r['Measure_Code'], ''), float(r['Measure_Weight_Conversion'])))
PREF = [r'^\d+ g$', r'^1 (medium|slice|small|large)\b', r'^250 ml$', r'^125 ml$']
def serving(code):
    ms = meas.get(code, [])
    for p in PREF:
        for lab, g in ms:
            if re.search(p, lab): return lab, g
    return None

# USDA: Foundation Foods (newer) first, then SR Legacy, both JSON, linked through the NDB number the CNF stores
def load(path, key):
    return json.load(open(path, encoding='utf-8'))[key]
def pick(food):
    d = {}
    for fn in food['foodNutrients']:
        k = NUT.get(fn['nutrient'].get('number'))
        if k and 'amount' in fn: d[k] = fn['amount']
    return d
ff = load(a.usda_foundation, 'FoundationFoods'); sr = load(a.usda_sr, 'SRLegacyFoods')
ff_by = collections.defaultdict(list); sr_by = {}
for f in ff:
    if f.get('ndbNumber'): ff_by[str(f['ndbNumber']).lstrip('0')].append(f)
for f in sr: sr_by[str(f.get('ndbNumber', '')).lstrip('0')] = f
def usda_for(nd):
    for f in ff_by.get(nd, []):
        d = pick(f)
        if len(d) == 4: return f, d, 'Foundation Foods, 2026-10-29'
    f = sr_by.get(nd)
    if f:
        d = pick(f)
        if d: return f, d, 'SR Legacy, 2018-04'
    return None

def num(x): return round(x, 3)
# Raw and cooked forms: pair the matched record with the official record of the other form, when exactly one clear partner exists.
COOK = ['boiled or steamed', 'baked or broiled', 'boiled', 'steamed', 'baked', 'broiled', 'roasted', 'braised', 'simmered', 'stewed', 'pan-fried', 'fried', 'microwaved', 'cooked']
SALT = re.compile(r'with salt|salt added|salted')
def form_of(d):
    dl = d.lower()
    if re.search(r'\braw\b', dl): return 'raw'
    if any(c in dl for c in COOK): return 'cooked'
    return 'other'
def core(d):
    t = d.lower()
    for c in COOK + ['drained', 'without salt', 'raw', 'solids and liquid']: t = re.sub(r'\b' + re.escape(c) + r'\b', ' ', t)
    t = re.sub(r'\bor\b', ' ', t)
    return n(t)
groups = collections.defaultdict(list)
for r in cnf:
    d = r['Food_Description_EN']
    if SALT.search(d.lower()) or form_of(d) == 'other' or str(r['Food_Code']) not in amt: continue
    groups[(core(d))].append(r)
def method_rank(d):
    dl = d.lower()
    for k, c in enumerate(COOK):
        if c in dl: return k
    return 99
def partner(cr):
    f = form_of(cr['Food_Description_EN'])
    if f == 'other': return None
    want = 'cooked' if f == 'raw' else 'raw'
    c = [r for r in groups.get(core(cr['Food_Description_EN']), []) if form_of(r['Food_Description_EN']) == want]
    if not c: return None
    if want == 'cooked':
        # boiled, drained is the plain cooked form for vegetables; otherwise the lowest-ranked method, only when it is unique at that rank
        c.sort(key=lambda r: (method_rank(r['Food_Description_EN']), len(r['Food_Description_EN'])))
        best = [r for r in c if method_rank(r['Food_Description_EN']) == method_rank(c[0]['Food_Description_EN'])]
        return best[0] if len(best) == 1 else None
    return c[0] if len(c) == 1 else None

def num(x): return round(x, 3)
def make_form(cr):
    code = cr['Food_Code']; sv = serving(code); am = amt.get(code, {})
    if not sv or not am: return None
    rec = {'form': form_of(cr['Food_Description_EN']), 'servingG': num(sv[1]), 'servingLabel': sv[0].replace(' ml', ' mL'),
           'cnf': {'code': int(code), 'name': cr['Food_Description_EN'],
                   'per100': {k: num(v[0]) for k, v in am.items()},
                   'src': {k: v[1] for k, v in am.items()},
                   'cls': {k: cls(v[1]) for k, v in am.items()}}}
    nd = (cr['USDA_NDB_Code'] or '').lstrip('0')
    u = usda_for(nd) if nd else None
    if u:
        f, d, file = u
        rec['usda'] = {'fdcId': int(f['fdcId']), 'name': f['description'], 'file': file, 'per100': {k: num(v) for k, v in d.items()}}
    return rec

out = {}; skipped = []
for i, (cr, how) in matches.items():
    main = make_form(cr)
    if not main: skipped.append((i, cr['Food_Description_EN'])); continue
    forms = [main]
    pr = partner(cr)
    pf = make_form(pr) if pr else None
    if pf: forms.append(pf)
    order = {'raw': 0, 'cooked': 1, 'other': 2}
    forms.sort(key=lambda x: order[x['form']])
    out[i] = {'how': how, 'default': [x['form'] for x in forms].index(main['form']), 'forms': forms}

def fmt(o): return json.dumps(o, ensure_ascii=False, separators=(', ', ': '))
lines = ["// Generated by scripts/build-food-nutrition.py from the Canadian Nutrient File 2026 (Health Canada) and USDA FoodData Central SR Legacy. Do not edit by hand.",
         "// Values are per 100 g, exactly as published. Serving amounts are calculated at display time. Foods missing here show \"Needs review\".",
         "export type Nutrient = 'sodiumMg' | 'potassiumMg' | 'phosphorusMg' | 'proteinG';",
         "export type Per100 = Partial<Record<Nutrient, number>>;",
         "export type NutrientClass = 'analysed' | 'usda' | 'calculated' | 'review';",
         "export type FormKind = 'raw' | 'cooked' | 'other';",
         "export type NutritionForm = {",
         "  form: FormKind; servingG: number; servingLabel: string;",
         "  cnf: { code: number; name: string; per100: Per100; src: Partial<Record<Nutrient, number>>; cls: Partial<Record<Nutrient, NutrientClass>> };",
         "  usda?: { fdcId: number; name: string; file: string; per100: Per100 };",
         "};",
         "// forms are sorted raw, cooked, other. default is the index of the form that matched the food name.",
         "export type FoodNutrition = { how: 'name' | 'picked'; default: number; forms: NutritionForm[] };",
         f"export const NUTRITION_CHECKED_ON = '{a.checked}';",
         "export const FOOD_NUTRITION: Record<string, FoodNutrition> = {"]
for i in sorted(out): lines.append(f"  '{i}': {fmt(out[i])},")
lines.append("};")
open(os.path.join(APP, 'foodNutrition.ts'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print('matched', len(matches), 'loaded', len(out), 'skipped', skipped)
print('foods with two forms', sum(1 for v in out.values() if len(v['forms']) == 2), collections.Counter(v['how'] for v in out.values()))
print(collections.Counter(c for v in out.values() for f in v['forms'] for c in f['cnf']['cls'].values()))
