import type { Country } from '@/lib/profile';

// Number and wording come from the linked official page. The quote is verbatim.
export type EmergencyInfo = { number: string; quote: string; source: string; url: string; pageReviewed: string | null; checkedOn: string };

export const EMERGENCY: Record<Country, EmergencyInfo> = {
  GB: { number: '999', quote: '999 is for life-threatening emergencies like serious road traffic accidents, strokes and heart attacks.', source: 'NHS', url: 'https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/', pageReviewed: '3 February 2023', checkedOn: '2026-11-15' },
  US: { number: '9-1-1', quote: 'If you notice the symptoms of a heart attack in yourself or someone else, call 9-1-1 immediately.', source: 'CDC', url: 'https://www.cdc.gov/heart-disease/about/heart-attack.html', pageReviewed: 'October 26, 2023', checkedOn: '2026-11-15' },
  CA: { number: '9-1-1', quote: 'If you or anyone you know has any of the warning signs, call 9-1-1 or your emergency number right away.', source: 'Public Health Agency of Canada (stroke page)', url: 'https://www.canada.ca/en/public-health/services/diseases/heart-health/stroke.html', pageReviewed: null, checkedOn: '2026-11-15' },
};
