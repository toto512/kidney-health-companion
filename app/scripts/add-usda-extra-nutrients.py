#!/usr/bin/env python3
"""Adds energy, carbohydrate, sugars, saturated fat and fibre to the USDA records already in src/content/foodNutrition.ts.

Why it exists: build-food-nutrition.py needs the Canadian Nutrient File CSVs (Health Canada), which the cloud build machine cannot download.
The USDA records already in the file name an FDC ID and a file, so their extra nutrients can be read from the same official JSON without touching
the CNF part. Run build-food-nutrition.py on a machine with the CNF CSVs to fill the CNF side too (it now reads the same five nutrients).
Values are per 100 g, unmodified. A nutrient the record does not publish is left out, never filled in.
Run: python3 -I scripts/add-usda-extra-nutrients.py --usda-sr FILE --usda-foundation FILE
"""
import argparse, json, os, re
ap = argparse.ArgumentParser(); ap.add_argument('--usda-sr', required=True); ap.add_argument('--usda-foundation', required=True); a = ap.parse_args()
PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'content', 'foodNutrition.ts')
MORE = {'208': 'energyKcal', '205': 'carbG', '269': 'sugarG', '606': 'satFatG', '291': 'fibreG'}
ALT = {'957': 'energyKcal', '269.3': 'sugarG'}  # Foundation Foods: used only when 208 / 269 are absent
def index(path, key):
    return {int(f['fdcId']): f for f in json.load(open(path, encoding='utf-8'))[key]}
files = {'SR Legacy, 2018-04': index(a.usda_sr, 'SRLegacyFoods'), 'Foundation Foods, 2026-10-29': index(a.usda_foundation, 'FoundationFoods')}
def extra(food):
    d, alt = {}, {}
    for fn in food['foodNutrients']:
        num, amount = fn['nutrient'].get('number'), fn.get('amount')
        if amount is None: continue
        if num in MORE: d[MORE[num]] = round(amount, 3)
        elif num in ALT: alt[ALT[num]] = round(amount, 3)
    for k, v in alt.items(): d.setdefault(k, v)
    return d
text = open(PATH, encoding='utf-8').read()
count = 0
def fix(m):
    global count
    obj = json.loads(m.group(2))
    for form in obj['forms']:
        u = form.get('usda')
        if not u: continue
        food = files[u['file']][u['fdcId']]
        u['per100'].update(extra(food)); count += 1
    return m.group(1) + json.dumps(obj, ensure_ascii=False) + ','
text = re.sub(r"^(  '[^']+': )(\{.*\}),$", fix, text, flags=re.M)
open(PATH, 'w', encoding='utf-8').write(text)
print('USDA records updated:', count)
