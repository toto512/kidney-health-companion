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

_ovf = json.load(open(os.path.join(HERE, 'food-match-overrides.json')))
ov = _ovf['byName']
ov_id = _ovf.get('byId', {})  # exact app food id -> CNF code, for names shared by several foods
variant_keys = set(_ovf.get('variants', []))  # app names or ids where one common variant was picked from several records
names_of = {i: nm for i, nm in foods}
matches = {}  # app id -> (cnf row, how)
for i, nm in foods:
    if i in ov_id: matches[i] = (by_code[str(ov_id[i])], 'picked'); continue
    if nm in ov: matches[i] = (by_code[str(ov[nm])], 'picked'); continue
    for suf in (' raw', ' raw with skin', ''):
        c = {r['Food_Code']: r for v in variants(nm) for r in idx.get(n(v + suf), [])}
        if len(c) == 1: matches[i] = (list(c.values())[0], 'name'); break
        if len(c) > 1: break

CORE = ('proteinG', 'phosphorusMg', 'potassiumMg', 'sodiumMg')
NUT = {'203': 'proteinG', '305': 'phosphorusMg', '306': 'potassiumMg', '307': 'sodiumMg',
       '208': 'energyKcal', '205': 'carbG', '269': 'sugarG', '606': 'satFatG', '291': 'fibreG'}  # second line: added for the plate scan
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
# Serving: a household measure first (1 medium, 1 slice, 1 small or large, 1 cup), grams in brackets on screen; the plain "N g" amount when the table lists no household measure.
PREF = [r'^1 medium( \(|$| whole)', r'^1 slice( \(|$| presliced)', r'^1 small( \(|$| whole)', r'^1 large( \(|$| whole)', r'^250 ml$', r'^\d+ g$', r'^125 ml$']
def tidy(lab):
    lab = re.sub(r'\s*\([^)]*\)', '', lab).replace(' whole', '').replace(' presliced', '').strip()  # drop sizes such as (18cm to 20cm long)
    return {'250 ml': '1 cup', '125 ml': '\u00bd cup'}.get(lab, lab.replace(' ml', ' mL'))
SMALL = {  # foods eaten by the spoon: the serving is a teaspoon, tablespoon or quarter cup, never a cup
    'tsp': ('culinary-herbs', 'spices', 'seasoning-blends', 'sugars-syrups', 'jams'),
    'tbsp': ('oils', 'animal-fats', 'sauces-condiments', 'processed-blende', 'seeds-nut-butters', 'nut-seed-butters', 'cream-butter-frozen--butter', 'cream-butter-frozen--clarified', 'heavy-whipping-cream'),
    'quarter': ('gravies',),
}
def small_kind(fid):
    for k, parts in SMALL.items():
        if any(p in fid for p in parts): return k
    return None
def serving(code, fid=''):
    ms = meas.get(code, [])
    kind = small_kind(fid)
    want = {'tsp': ['5 ml', '15 ml'], 'tbsp': ['15 ml', '5 ml'], 'quarter': ['60 ml', '15 ml']}.get(kind, [])
    for w in want:
        for lab, g in ms:
            if lab == w: return {'5 ml': '1 tsp', '15 ml': '1 tbsp', '60 ml': '\u00bc cup'}[w], g
    for p in PREF[:4]:
        for lab, g in ms:
            if re.search(p, lab): return tidy(lab), g
    # A small plain gram amount (nuts, seeds) beats a cup. Mixed dishes use their plain gram serving before a cup.
    for lab, g in ms:
        if re.search(r'^\d+ g$', lab) and (g <= 60 or 'composite' in fid or 'quick-service' in fid): return tidy(lab), g
    for p in PREF[4:]:
        for lab, g in ms:
            if re.search(p, lab): return tidy(lab), g
    return None

# USDA: Foundation Foods (newer) first, then SR Legacy, both JSON, linked through the NDB number the CNF stores
def load(path, key):
    return json.load(open(path, encoding='utf-8'))[key]
def pick(food):
    d = {}
    alt = {}  # Foundation Foods records often lack 208 and 269: use 957 (energy, Atwater general factors) and 269.3 (total sugars) only when the main number is absent
    for fn in food['foodNutrients']:
        num_ = fn['nutrient'].get('number')
        k = NUT.get(num_)
        if k and 'amount' in fn: d[k] = fn['amount']
        elif num_ == '957' and 'amount' in fn: alt['energyKcal'] = fn['amount']
        elif num_ == '269.3' and 'amount' in fn: alt['sugarG'] = fn['amount']
    for k, v in alt.items(): d.setdefault(k, v)
    return d
ff = load(a.usda_foundation, 'FoundationFoods'); sr = load(a.usda_sr, 'SRLegacyFoods')
ff_by = collections.defaultdict(list); sr_by = {}
for f in ff:
    if f.get('ndbNumber'): ff_by[str(f['ndbNumber']).lstrip('0')].append(f)
for f in sr: sr_by[str(f.get('ndbNumber', '')).lstrip('0')] = f
def usda_for(nd):
    for f in ff_by.get(nd, []):
        d = pick(f)
        if all(k in d for k in CORE): return f, d, 'Foundation Foods, 2026-10-29'
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
def make_form(cr, fid=''):
    code = cr['Food_Code']; sv = serving(code, fid); am = amt.get(code, {})
    if not sv or not am: return None
    rec = {'form': form_of(cr['Food_Description_EN']), 'servingG': num(sv[1]), 'servingLabel': sv[0],
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
    main = make_form(cr, i)
    if not main: skipped.append((i, cr['Food_Description_EN'])); continue
    forms = [main]
    pr = partner(cr)
    pf = make_form(pr, i) if pr else None
    if pf: forms.append(pf)
    order = {'raw': 0, 'cooked': 1, 'other': 2}
    forms.sort(key=lambda x: order[x['form']])
    # Dried legumes and grains have no "raw" form to show: a cooked record with a dry sibling is a single-form food.
    single = False
    if main['form'] == 'cooked' and not pf:
        k = core(cr['Food_Description_EN'])
        single = any(re.search(r'\bdry\b', r2['Food_Description_EN'].lower()) and core(re.sub(r'\bdry\b', ' ', r2['Food_Description_EN'])) == core(re.sub(r'\bdry\b', ' ', cr['Food_Description_EN'])) for r2 in cnf if r2['Food_Description_EN'].lower().split(',')[0] == cr['Food_Description_EN'].lower().split(',')[0])
    out[i] = {'how': how, **({'single': True} if single else {}), **({'variant': True} if (i in variant_keys or names_of[i] in variant_keys) else {}), 'default': [x['form'] for x in forms].index(main['form']), 'forms': forms}

# Second pass: foods with no usable CNF record take a hand-picked USDA record directly (SR Legacy or Foundation), with the serving taken from its USDA portions.
usda_by_name = _ovf.get('usdaByName', {}); usda_by_id = _ovf.get('usdaById', {})
usda_all = {int(f['fdcId']): (f, 'Foundation Foods, 2026-10-29') for f in ff}
usda_all.update({int(f['fdcId']): (f, 'SR Legacy, 2018-04') for f in sr})
u_groups = collections.defaultdict(list)
for fid_, (f_, file_) in usda_all.items():
    d_ = f_['description']
    if SALT.search(d_.lower()) or form_of(d_) == 'other' or len(pick(f_)) < 1: continue
    u_groups[(file_, core(d_))].append(f_)
def u_partner(f, file):
    fo = form_of(f['description'])
    if fo == 'other': return None
    want = 'cooked' if fo == 'raw' else 'raw'
    c = [r for r in u_groups.get((file, core(f['description'])), []) if form_of(r['description']) == want]
    if not c: return None
    if want == 'cooked':
        c.sort(key=lambda r: (method_rank(r['description']), len(r['description'])))
        best = [r for r in c if method_rank(r['description']) == method_rank(c[0]['description'])]
        return best[0] if len(best) == 1 else None
    return c[0] if len(c) == 1 else None
def glabel(p):
    unit = (p.get('measureUnit') or {}).get('name', '')
    unit = '' if unit in ('undetermined', 'RACC') else unit
    mod = re.sub(r'\s*\([^)]*\)', '', p.get('modifier') or '').split(' or ')[0].strip()
    amt_ = p.get('amount') or p.get('value') or 1
    frac = {0.25: '\u00bc', 0.33: '\u2153', 0.5: '\u00bd', 0.67: '\u2154', 0.75: '\u00be'}
    amt_s = str(int(amt_)) if float(amt_).is_integer() else frac.get(round(float(amt_), 2), str(round(amt_, 2)))
    return f"{amt_s} {unit} {mod}".replace('  ', ' ').strip(), (p.get('modifier') or '').lower(), unit.lower(), amt_
def userving(f, fid):
    ps = [p for p in f.get('foodPortions', []) if p.get('gramWeight')]
    L = []
    for p in ps:
        lab, mod, unit, amt_ = glabel(p)
        if 'nlea' in mod or 'racc' in mod or mod == '' and unit == '': continue
        L.append((lab, mod, unit, amt_, float(p['gramWeight'])))
    if not L: return None
    if fid.startswith(('meat-poultry/', 'fish-seafood/')):
        # Cuts and meats: a 3 or 4 oz serving only. Whole roasts, racks and the like are never a serving.
        for lab, mod, unit, amt_, g in L:
            if 80 <= g <= 130 and ('oz' in lab.lower() or 'serving' in lab.lower()): return f"{round(g / 28.35)} oz", g
        for lab, mod, unit, amt_, g in L:
            if (unit == 'oz' or mod.startswith('oz')) and amt_ == 1 and 25 <= g <= 30: return '3 oz', g * 3
        return None
    if any(u == 'liter' or m.startswith('liter') for _, m, u, _, _ in L) and fid.startswith('drinks/'):
        return '1 cup', 250.0
    kind = small_kind(fid)
    def find(pred):
        for lab, mod, unit, amt_, g in L:
            if pred(lab.lower(), mod, unit, amt_): return tidy(lab), g
    sp = {'tsp': lambda l, m, u, x: (u in ('teaspoon', 'tsp') or m.startswith('tsp')) and x == 1, 'tbsp': lambda l, m, u, x: (u in ('tablespoon', 'tbsp') or m.startswith('tbsp')) and x == 1,
          'quarter': lambda l, m, u, x: u == 'cup' and x == 0.25}
    if kind:
        r = find(sp[kind]) or find(sp['tbsp' if kind == 'tsp' else 'tsp'])
        if r: return r
    for w in ('medium', 'slice', 'small', 'large'):
        r = find(lambda l, m, u, x, w=w: (m.startswith(w) or l.startswith('1 ' + w)) and x == 1)
        if r: return r
    r = find(lambda l, m, u, x: (u == 'cup' or m.startswith('cup')) and x == 1)
    if r: return r
    r = find(lambda l, m, u, x: (u == 'oz' or m.startswith('oz')) and x in (1, 3))
    if r: return r
    return tidy(L[0][0]), L[0][4]
def make_uform(f, file, fid):
    d = pick(f); sv = userving(f, fid)
    if not d or not sv: return None
    return {'form': form_of(f['description']), 'servingG': num(sv[1]), 'servingLabel': sv[0],
            'usda': {'fdcId': int(f['fdcId']), 'name': f['description'], 'file': file, 'per100': {k: num(v) for k, v in d.items()}}}
u_skipped = []
for i, nm in foods:
    fidn = usda_by_id.get(i, usda_by_name.get(nm))
    if fidn is None or i in out: continue
    f, file = usda_all[int(fidn)]
    main = make_uform(f, file, i)
    if not main: u_skipped.append((i, f['description'])); continue
    forms = [main]
    pr = u_partner(f, file)
    pf = make_uform(pr, file, i) if pr else None
    if pf: forms.append(pf)
    forms.sort(key=lambda x: {'raw': 0, 'cooked': 1, 'other': 2}[x['form']])
    out[i] = {'how': 'usda', **({'variant': True} if (i in variant_keys or nm in variant_keys) else {}), 'default': [x['form'] for x in forms].index(main['form']), 'forms': forms}
print('usda second pass skipped (no portion)', u_skipped)

def fmt(o): return json.dumps(o, ensure_ascii=False, separators=(', ', ': '))
lines = ["// Generated by scripts/build-food-nutrition.py from the Canadian Nutrient File 2026 (Health Canada) and USDA FoodData Central SR Legacy. Do not edit by hand.",
         "// Values are per 100 g, exactly as published. Serving amounts are calculated at display time. Foods missing here show \"Needs review\".",
         "export type Nutrient = 'sodiumMg' | 'potassiumMg' | 'phosphorusMg' | 'proteinG';",
         "export type Per100 = Partial<Record<Nutrient, number>>;",
         "export type NutrientClass = 'analysed' | 'usda' | 'calculated' | 'review';",
         "export type FormKind = 'raw' | 'cooked' | 'other';",
         "export type NutritionForm = {",
         "  form: FormKind; servingG: number; servingLabel: string;",
         "  cnf?: { code: number; name: string; per100: Per100; src: Partial<Record<Nutrient, number>>; cls: Partial<Record<Nutrient, NutrientClass>> };",
         "  usda?: { fdcId: number; name: string; file: string; per100: Per100 };",
         "};",
         "// forms are sorted raw, cooked, other. default is the index of the form that matched the food name.",
         "export type FoodNutrition = { how: 'name' | 'picked' | 'usda'; single?: boolean; variant?: boolean; default: number; forms: NutritionForm[] };",
         f"export const NUTRITION_CHECKED_ON = '{a.checked}';",
         "export const FOOD_NUTRITION: Record<string, FoodNutrition> = {"]
for i in sorted(out): lines.append(f"  '{i}': {fmt(out[i])},")
lines.append("};")
open(os.path.join(APP, 'foodNutrition.ts'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print('matched', len(matches), 'loaded', len(out), 'skipped', skipped)
print('foods with two forms', sum(1 for v in out.values() if len(v['forms']) == 2), collections.Counter(v['how'] for v in out.values()))
print(collections.Counter(c for v in out.values() for f in v['forms'] if 'cnf' in f for c in f['cnf']['cls'].values()))
