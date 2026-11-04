// The pet "aisles" of the shop (Dogs, Cats, Birds, Rabbits, Small pets, Fish) and what a product's `pet` field may hold.
//
// A product's `pet` is one of: 'dog' | 'cat' | 'both' (dogs and cats) | 'bird' | 'rabbit' | 'rodent' (hamsters, guinea
// pigs and other small pets) | 'fish' | 'other' (suits any pet that is not a dog or a cat) | 'all'. The kinds match
// speciesKind() in species.js, so "show products for my pet" and the aisles agree.
//
// Pure functions, no browser or Firebase, so they can be unit-tested.
import { productFitsPet } from './species.js';

export const PET_AISLES = [
  { slug: 'dogs', pet: 'dog', label: 'Dogs' },
  { slug: 'cats', pet: 'cat', label: 'Cats' },
  { slug: 'birds', pet: 'bird', label: 'Birds' },
  { slug: 'rabbits', pet: 'rabbit', label: 'Rabbits' },
  { slug: 'small-pets', pet: 'rodent', label: 'Small pets', hint: 'Hamsters, guinea pigs' },
  { slug: 'fish', pet: 'fish', label: 'Fish' },
];

export const aisleBySlug = (slug) => PET_AISLES.find((a) => a.slug === slug) || null;
export const aisleForPet = (pet) => PET_AISLES.find((a) => a.pet === String(pet || '').toLowerCase()) || null;

/** Choices for the admin "Pet type" picker. */
export const PET_OPTIONS = [
  ['both', 'Dogs & Cats'],
  ['dog', 'Dogs'],
  ['cat', 'Cats'],
  ['bird', 'Birds'],
  ['rabbit', 'Rabbits'],
  ['rodent', 'Small pets (hamsters, guinea pigs)'],
  ['fish', 'Fish'],
  ['all', 'All pets'],
];

const SYNONYMS = [
  [/^(dogs?|puppy|puppies|canine)$/, 'dog'],
  [/^(cats?|kittens?|feline)$/, 'cat'],
  [/^(both|dogs? ?(&|and|\/|,) ?cats?|cats? ?(&|and|\/|,) ?dogs?)$/, 'both'],
  [/^(birds?|parrots?|budgies?|budgerigars?|cockatiels?|parakeets?|lovebirds?|finch(es)?|canar(y|ies)|pigeons?|doves?)$/, 'bird'],
  [/^(rabbits?|bunn(y|ies)|hares?)$/, 'rabbit'],
  [/^(rodents?|hamsters?|guinea pigs?|gerbils?|mice|mouse|rats?|chinchillas?|small pets?|small animals?|small mammals?)$/, 'rodent'],
  [/^(fish(es)?|aquarium|goldfish|betta)$/, 'fish'],
  [/^(other|others|exotic|exotics|other pets?)$/, 'other'],
  [/^(all|all pets?|any|every pet)$/, 'all'],
];

/** Turns whatever was typed or imported ("Birds", "Hamster", "Dogs and Cats") into one of the stored values. */
export function normalizePet(raw) {
  const s = String(raw ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!s) return 'both';
  for (const [re, value] of SYNONYMS) if (re.test(s)) return value;
  return s; // a value this code does not know is kept as typed rather than lost
}

const LABELS = { dog: 'Dogs', cat: 'Cats', both: 'Dogs & Cats', bird: 'Birds', rabbit: 'Rabbits', rodent: 'Small pets', fish: 'Fish', other: 'Other pets', all: 'All pets' };

/** "Dogs", "Birds", "Dogs & Cats", … for a product's `pet` value. */
export function petLabel(pet) {
  const p = normalizePet(pet);
  return LABELS[p] || p.replace(/(^|\s)\w/g, (c) => c.toUpperCase());
}

/** Does a product belong in this aisle? Same rule as "suits my pet": 'both' covers dogs and cats, 'other' covers the rest. */
export const fitsAisle = (productPet, aisle) => !!aisle && productFitsPet(normalizePet(productPet), aisle.pet);

/** The aisle page a product's breadcrumb should point to (the dog aisle for 'both', as before). */
export const aisleSlugForProduct = (pet) => (aisleForPet(normalizePet(pet)) || PET_AISLES[0]).slug;
