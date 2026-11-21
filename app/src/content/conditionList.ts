// The 80 conditions a person can pick, grouped into 7 domains. Derived from the project's condition matrix (sheet "80-Condition Master Matrix"):
// only a stable id, the domain, a plain-language name, and short tracking prompts. No medicines, foods, home remedies, targets or screening advice.
// `bp: true` marks conditions whose prompts include blood pressure, the only log built so far. Everything else is "coming soon".
export const DOMAINS = ["Cardiovascular & Metabolic", "Respiratory & Allergic", "Mental Health & Neurological", "Musculoskeletal & Skeletal", "GI, Renal & Endocrine", "Blood, Skin & Systemic", "Sensory, Infectious & Immune"] as const;
export type Domain = (typeof DOMAINS)[number];
export type ConditionItem = { id: string; domain: Domain; name: string; track: string[]; bp?: true };

const c = (d: number, id: string, name: string, track: string, bp?: 'bp'): ConditionItem => ({ id, domain: DOMAINS[d], name, track: track.split(';'), ...(bp ? { bp: true as const } : {}) });

export const CONDITION_LIST: ConditionItem[] = [
  c(0, "hypertension", "High blood pressure", "Blood pressure and pulse;Salt in your food;Body weight;Stress level", "bp"),
  c(0, "ischemic-heart-disease", "Heart disease (reduced blood flow to the heart)", "Chest pain: when it happens and how often;Resting heart rate;Blood pressure;Daily steps;Medicines taken", "bp"),
  c(0, "type-2-diabetes", "Type 2 diabetes", "Blood sugar;Carbohydrate portions;Daily steps;Foot checks"),
  c(0, "obesity", "Overweight or obesity", "Weight;Waist measurement;Protein and fiber in your food;Active minutes;Sleep hours"),
  c(0, "high-cholesterol", "High cholesterol", "Fat and fiber in your food;Weekly exercise minutes;Muscle aches"),
  c(0, "stroke", "Stroke", "Blood pressure;Medicine times;Mobility and balance;Mood and sleep", "bp"),
  c(0, "fatty-liver", "Fatty liver disease", "Waist measurement;Sugar in your food;Weekly exercise minutes;Weight"),
  c(0, "coronary-artery-disease", "Coronary artery disease", "Chest pain: when it happens and how often;Blood pressure;Resting heart rate;Daily walking time", "bp"),
  c(0, "peripheral-artery-disease", "Peripheral artery disease (poor leg circulation)", "Walking distance or time before leg pain;Foot skin color and temperature;Blood pressure;Days without tobacco", "bp"),
  c(0, "heart-failure", "Heart failure", "Morning weight;Ankle swelling;Shortness of breath;Blood pressure", "bp"),
  c(0, "atrial-fibrillation", "Atrial fibrillation (irregular heartbeat)", "Pulse or heart rhythm checks;Episodes: how long they last and what set them off;Blood pressure", "bp"),
  c(0, "leg-blood-clot", "Blood clot in a leg vein (DVT)", "Calf size on both legs;Swelling and pain;Times you take blood thinners;Bruising"),
  c(1, "dental-disease", "Tooth decay and gum disease", "Brushing and flossing;Gum bleeding;Jaw clenching"),
  c(1, "pneumonia", "Pneumonia (lung infection)", "Temperature;Breathing rate at rest;Oxygen level (pulse oximeter);Color of phlegm"),
  c(1, "copd", "COPD (long-term lung disease)", "Daily breathlessness;Rescue inhaler puffs;Oxygen level;Changes in phlegm"),
  c(1, "asthma", "Asthma", "Peak flow;Rescue inhaler use;Triggers"),
  c(1, "hay-fever", "Hay fever (seasonal allergies)", "Pollen count and your symptoms;Medicine times;Indoor humidity"),
  c(1, "sleep-apnea", "Sleep apnea", "CPAP score and mask leaks;Morning headaches;Daytime sleepiness"),
  c(1, "common-cold", "Common cold", "Temperature;How many days of symptoms"),
  c(1, "chronic-sinusitis", "Long-term sinus problems", "Facial pain;Nasal spray use;Triggers such as mold and dust"),
  c(1, "influenza", "Flu (influenza)", "Temperature;Fluids and urine;Shortness of breath or chest pain"),
  c(1, "acute-bronchitis", "Chest cold (acute bronchitis)", "Days of cough;Fever;Color of phlegm;Wheezing"),
  c(1, "bronchiectasis", "Bronchiectasis (widened airways in the lungs)", "Daily phlegm amount and color;Fever;Exercise tolerance;Weight"),
  c(1, "pulmonary-fibrosis", "Lung scarring (pulmonary fibrosis)", "Oxygen level at rest and with activity;Walking tolerance;Weight;Cough"),
  c(2, "depression", "Depression", "Daily mood;Sleep hours;Exercise minutes;Medicines taken"),
  c(2, "anxiety", "Anxiety", "Daily anxiety rating;Caffeine;Sleep quality;What sets off panic"),
  c(2, "migraine-headache", "Tension headaches and migraines", "Headache diary: start time and triggers;Sleep and stress;Days you use pain relief"),
  c(2, "dementia", "Alzheimer's disease and other dementias", "Daily routine checklist;Sleep hours;Wandering and safety log;Medicine organizer"),
  c(2, "adhd", "ADHD", "Focus blocks completed;Medicine time and sleep time;Tasks completed"),
  c(2, "epilepsy", "Epilepsy", "Seizure log: date, length, warning signs;Missed medicines;Sleep hours;Medicine side effects"),
  c(2, "insomnia", "Insomnia (trouble sleeping)", "Sleep diary: bedtime, wake time, wake-ups;Caffeine and alcohol timing"),
  c(2, "ptsd", "PTSD", "Nightmares and flashbacks;Triggers;Sleep hours;Calming techniques used"),
  c(2, "bipolar", "Bipolar disorder", "Daily mood;Sleep hours;Medicines taken"),
  c(2, "autism", "Autism spectrum", "Sensory overload triggers;Sleep quality;Stomach symptoms;Daily energy"),
  c(2, "parkinsons", "Parkinson's disease", "Medicine timing and on/off periods;Tremor and stiffness;Bowel movements;Falls and near-falls"),
  c(2, "ms", "Multiple sclerosis (MS)", "Fatigue;Heat and flare triggers;Bladder habits;Mobility"),
  c(2, "ocd", "OCD", "Time spent on compulsions each day;Anxiety spikes;Exposure practice log;Sleep hours"),
  c(2, "schizophrenia", "Schizophrenia", "Medicines taken;Voices or visions check;Weight and waist;Blood sugar and blood pressure", "bp"),
  c(3, "osteoarthritis", "Osteoarthritis", "Joint pain;Morning stiffness time;Daily steps;Days you use anti-inflammatory pain relief"),
  c(3, "low-back-pain", "Long-term low back pain", "Pain;Sitting and walking tolerance;Flare triggers;Stretching streak"),
  c(3, "osteoporosis", "Osteoporosis (weak bones)", "Calcium and vitamin D in your food;Strength and balance sessions;Height once a year"),
  c(3, "gout", "Gout", "Uric acid lab results;Flare dates;Alcohol and rich-food triggers;Daily water"),
  c(3, "rheumatoid-arthritis", "Rheumatoid arthritis", "Morning stiffness time;Tender and swollen joints;Fatigue;Signs of infection"),
  c(3, "fibromyalgia", "Fibromyalgia", "Daily pain and fatigue;Sleep hours;Gentle activity minutes;Flare triggers"),
  c(3, "neck-pain", "Neck pain", "Posture breaks;Pain;Headaches;Stretching"),
  c(3, "tendon-problems", "Tendon and bursa problems (tendinopathy, bursitis)", "Pain during activity and the next day;Rehab exercises done;Repeated tasks that bother it"),
  c(3, "carpal-tunnel", "Carpal tunnel syndrome", "Night waking from hand numbness;Grip strength;Typing breaks"),
  c(3, "plantar-fasciitis", "Heel pain (plantar fasciitis)", "First-step morning pain;Daily stretching;Footwear"),
  c(3, "scoliosis", "Scoliosis in adults", "Standing tolerance;Pain location;Height once a year;Core exercises"),
  c(3, "ankylosing-spondylitis", "Ankylosing spondylitis", "Morning stiffness time;Night back pain;Posture;Flare log"),
  c(4, "acid-reflux", "Acid reflux (GERD)", "Heartburn episodes per week;Trigger foods;Time between meals and bedtime"),
  c(4, "ckd", "Chronic kidney disease", "Home blood pressure;Daily weight and swelling;Urine changes;Lab results over time", "bp"),
  c(4, "ibs", "Irritable bowel syndrome (IBS)", "Stool chart;Food and symptom diary;Stress"),
  c(4, "stomach-ulcer", "Stomach ulcer", "Pain timing around meals;Stool color;Days without anti-inflammatory pain relief"),
  c(4, "underactive-thyroid", "Underactive thyroid", "Energy level;Resting heart rate;Weight;Bowel regularity;Same medicine brand and time"),
  c(4, "ibd", "Inflammatory bowel disease (Crohn's and colitis)", "Stool count and blood;Abdominal pain;Weight;Temperature"),
  c(4, "gallstones", "Gallstones", "Pain after meals;Fat in your meals;Nausea and fever"),
  c(4, "celiac", "Celiac disease", "Gluten-free label checks;Stomach symptoms;Weight and energy"),
  c(4, "overactive-thyroid", "Overactive thyroid", "Resting heart rate;Weight;Tremor;Sleep hours;Heat intolerance"),
  c(4, "diverticular-disease", "Diverticular disease", "Fiber;Fluids;Bowel frequency;Fever and lower left belly pain"),
  c(4, "chronic-pancreatitis", "Chronic pancreatitis", "Pain after meals;Oily or floating stools;Weight;Blood sugar"),
  c(4, "polycystic-kidney", "Polycystic kidney disease", "Daily home blood pressure;Daily water;Flank pain episodes;Blood in urine", "bp"),
  c(4, "cirrhosis", "Cirrhosis (scarred liver)", "Daily weight;Belly size;Bowel movements;Confusion check"),
  c(4, "gastritis", "Gastritis (irritated stomach lining)", "Meal and pain link;Anti-inflammatory pain relief and alcohol use;Nausea"),
  c(5, "iron-anemia", "Iron deficiency anemia", "Iron supplement schedule;Tiredness and dizziness;Signs of blood loss"),
  c(5, "eczema", "Eczema (atopic dermatitis)", "Itch;Flare locations;New soaps and detergents;Sleep disruption"),
  c(5, "psoriasis", "Psoriasis", "Plaque coverage and pain;Morning joint stiffness;Alcohol-free days"),
  c(5, "cancer", "Cancer (breast, colorectal, lung, prostate)", "Symptom changes;Weight changes"),
  c(5, "venous-insufficiency", "Chronic venous insufficiency (leg vein problems)", "Evening ankle swelling;Leg heaviness;Compression stocking hours"),
  c(5, "acne", "Adult acne", "Breakouts and triggers;Treatment tolerance"),
  c(5, "hives", "Chronic hives", "Daily hive count and itch;Triggers such as heat and stress"),
  c(5, "sickle-thalassemia", "Thalassemia and sickle cell disease", "Fluids;Pain crisis triggers;Urine color;Temperature"),
  c(6, "sensory-loss", "Vision and hearing loss", "Headaches after screen time;Hearing in noisy rooms;Eyeglass prescription updates"),
  c(6, "viral-hepatitis", "Viral hepatitis (B and C)", "Medicines taken;Alcohol-free days;Fatigue"),
  c(6, "hiv", "HIV/AIDS", "Daily medicine taken;Lab trends;Blood pressure, lipids and bone health", "bp"),
  c(6, "uti", "Urinary tract infections", "Fluids;Urination frequency and burning;Fever and flank pain"),
  c(6, "glaucoma-cataracts", "Glaucoma and cataracts", "Eye drop schedule;Side vision changes;Glare and halos"),
  c(6, "lyme", "Lyme disease", "Rash size and photos;Joint pain locations;Antibiotic course finished;Energy recovery"),
  c(6, "lupus", "Lupus", "Sun exposure;Joint pain and fatigue;Foamy urine and swelling;Blood pressure", "bp"),
  c(6, "mecfs", "ME/CFS (chronic fatigue syndrome)", "Daily energy;Crash triggers;Standing heart rate;Sleep quality"),
];

export const conditionById = (id: string) => CONDITION_LIST.find((x) => x.id === id);

// Case-insensitive match on the plain name; an empty query matches everything.
export const searchConditions = (q: string): ConditionItem[] => {
  const t = q.trim().toLowerCase();
  return t ? CONDITION_LIST.filter((x) => x.name.toLowerCase().includes(t)) : CONDITION_LIST;
};

export const groupByDomain = (list: ConditionItem[]) => DOMAINS.map((d) => ({ domain: d, items: list.filter((x) => x.domain === d) })).filter((g) => g.items.length > 0);
