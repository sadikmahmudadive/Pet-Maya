import { functions, httpsCallable } from '../config/firebase';

// Hard red flags always win over AI output — these need a vet now.
const RED_FLAGS = [
  [/breath|chok|gasp|blue gum|pale gum/i, 'Breathing difficulty or abnormal gum colour'],
  [/collaps|unconscious|can.?t stand|seiz|fit\b|convuls/i, 'Collapse or seizure'],
  [/poison|ate (chocolate|grape|raisin|xylitol|rat|onion)|antifreeze|paracetamol|ibuprofen/i, 'Possible poisoning'],
  [/bloat|swollen (belly|stomach)|retch(ing)? (without|but nothing)/i, 'Possible bloat'],
  [/hit by|road accident|fell from|bleed(ing)? (a lot|heavily)|broken bone/i, 'Trauma or heavy bleeding'],
  [/can.?t (pee|urinate)|straining to (pee|urinate)/i, 'Unable to urinate'],
];

export const REGIONS = [
  { k: 'gi', label: 'Tummy & digestion', sub: 'Vomiting, diarrhoea, appetite', icon: 'pulse' },
  { k: 'eyes', label: 'Head, eyes & ears', sub: 'Discharge, squinting, shaking', icon: 'eye' },
  { k: 'oral', label: 'Mouth & teeth', sub: 'Drooling, bad breath, gums', icon: 'smile' },
  { k: 'skin', label: 'Skin & coat', sub: 'Itching, hair loss, rash', icon: 'paw' },
  { k: 'msk', label: 'Legs & joints', sub: 'Limping, stiffness', icon: 'bone' },
  { k: 'resp', label: 'Breathing', sub: 'Cough, sneezing, panting', icon: 'wind' },
];

export const DURATIONS = ['Under 2h', '2 – 12h', '12 – 48h', 'Over 2 days'];
export const GUMS = [
  { k: 'brisk', label: 'Under 2 seconds', sub: 'Normal' },
  { k: 'delayed', label: '2 – 3 seconds', sub: 'Possibly dehydrated' },
  { k: 'slow', label: 'Over 3 seconds', sub: 'Needs a vet now', urgent: true },
];

export const TIERS = {
  emergency: { label: 'Emergency — see a vet now', short: 'Emergency', tone: 'red', icon: 'alert' },
  soon: { label: 'See a vet within 24–48 h', short: 'See a vet soon', tone: 'yellow', icon: 'clock' },
  home: { label: 'Monitor at home', short: 'Home care', tone: 'teal', icon: 'shield' },
};

function ruleTier({ text, region, duration, gums, rate, species }) {
  const flags = RED_FLAGS.filter(([re]) => re.test(text)).map(([, l]) => l);
  const maxRate = species === 'cat' ? 40 : 35;
  if (gums === 'slow') flags.push('Slow capillary refill');
  if (rate > maxRate) flags.push(`Resting breathing rate ${rate}/min`);
  if (flags.length) return { tier: 'emergency', flags };
  if (region === 'resp' || gums === 'delayed' || duration === 'Over 2 days' || /blood|lethargic|not eating|won.?t eat/i.test(text)) return { tier: 'soon', flags };
  return { tier: 'home', flags };
}

const HOME_STEPS = {
  gi: ['Rest the stomach: no food for 4–6 hours (puppies and kittens: ask a vet first).', 'Offer small sips of water often.', 'Then feed small portions of plain boiled chicken and rice.'],
  eyes: ['Gently wipe discharge with cooled boiled water on cotton wool.', 'Stop scratching or rubbing with a cone if you have one.', 'Don’t use human eye drops.'],
  oral: ['Check for anything stuck between teeth or on the roof of the mouth.', 'Offer soft food for a day.', 'Book a dental check if bad breath or drooling continues.'],
  skin: ['Check for fleas and ticks along the back and tail base.', 'Stop licking or scratching at sore spots.', 'Note any new food, shampoo or bedding.'],
  msk: ['Restrict to short lead walks only — no running or stairs.', 'Check paws for thorns, cuts or broken nails.', 'Don’t give human painkillers; many are toxic to pets.'],
  resp: ['Keep them calm and cool in a well-ventilated room.', 'Count breaths per minute while asleep.', 'Avoid collars that press on the throat; use a harness.'],
};

export async function runTriage(input) {
  const rules = ruleTier(input);
  const region = REGIONS.find((r) => r.k === input.region);
  let ai = '';
  if (rules.tier !== 'emergency' && functions) {
    try {
      const call = httpsCallable(functions, 'openai_proxy');
      const prompt = [
        `Species: ${input.species || 'pet'}. Area: ${region?.label || 'general'}.`,
        `Duration: ${input.duration}. Gum refill: ${input.gums}. Resting breaths/min: ${input.rate}.`,
        `Owner says: ${input.text || 'no description'}.`,
        'Reply in 2–3 short plain-English sentences: what this might be and what to watch for. Do not diagnose definitively or name prescription drugs.',
      ].join(' ');
      const res = await Promise.race([
        call({ method: 'health_diagnosis', petName: input.petName || 'Pet', prompt, image: input.imageBase64 || undefined }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 15000)),
      ]);
      const txt = res?.data?.response;
      if (typeof txt === 'string' && !/^AI (Connection|Configuration) Error/.test(txt)) ai = txt.trim();
    } catch { /* fall back to rules */ }
  }
  const summary = ai || ({
    emergency: `These signs can be serious: ${rules.flags.join(', ').toLowerCase()}. Please contact a vet now.`,
    soon: `${region?.label || 'This'} problems like this usually aren’t an emergency, but they should be checked by a vet in the next day or two — sooner if things get worse.`,
    home: `Nothing here points to an emergency. Try the steps below and keep an eye on ${input.petName || 'your pet'} for the next 24 hours.`,
  })[rules.tier];
  return { tier: rules.tier, flags: rules.flags, summary, steps: HOME_STEPS[input.region] || HOME_STEPS.gi, fromAi: !!ai };
}
