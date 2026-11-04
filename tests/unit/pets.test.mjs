// Shop pet aisles (pure). Run: node --test tests/unit/pets.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { PET_AISLES, PET_OPTIONS, aisleBySlug, aisleForPet, normalizePet, petLabel, fitsAisle, aisleSlugForProduct } from '../../web/src/lib/pets.js';

test('the aisles are dogs, cats, birds, rabbits, small pets and fish, each with a unique slug', () => {
  assert.deepEqual(PET_AISLES.map((a) => a.slug), ['dogs', 'cats', 'birds', 'rabbits', 'small-pets', 'fish']);
  assert.equal(new Set(PET_AISLES.map((a) => a.slug)).size, PET_AISLES.length);
  assert.equal(aisleBySlug('birds').pet, 'bird');
  assert.equal(aisleBySlug('small-pets').pet, 'rodent');
  assert.equal(aisleBySlug('medicine'), null);
  assert.equal(aisleForPet('rabbit').slug, 'rabbits');
  assert.equal(aisleForPet('both'), null);
});

test('typed or imported pet names become the stored values', () => {
  const cases = { Birds: 'bird', Parrot: 'bird', Rabbit: 'rabbit', Bunnies: 'rabbit', Hamster: 'rodent', 'Guinea Pigs': 'rodent', 'small pets': 'rodent', Fish: 'fish', 'Dogs and Cats': 'both', 'dogs & cats': 'both', Dogs: 'dog', cats: 'cat', Other: 'other', 'All pets': 'all', '': 'both', undefined: 'both' };
  for (const [input, want] of Object.entries(cases)) assert.equal(normalizePet(input === 'undefined' ? undefined : input), want, input);
  assert.equal(normalizePet('tortoise'), 'tortoise'); // unknown values are kept, not lost
});

test('labels read well for every stored value', () => {
  assert.equal(petLabel('dog'), 'Dogs');
  assert.equal(petLabel('both'), 'Dogs & Cats');
  assert.equal(petLabel('Bird'), 'Birds');
  assert.equal(petLabel('rodent'), 'Small pets');
  assert.equal(petLabel('tortoise'), 'Tortoise');
  assert.equal(petLabel(undefined), 'Dogs & Cats');
});

test('a product shows in its own aisle; dogs-and-cats items stay out of the bird aisle', () => {
  const dogs = aisleBySlug('dogs'), cats = aisleBySlug('cats'), birds = aisleBySlug('birds'), small = aisleBySlug('small-pets');
  assert.equal(fitsAisle('both', dogs), true);
  assert.equal(fitsAisle('both', cats), true);
  assert.equal(fitsAisle('both', birds), false);
  assert.equal(fitsAisle('dog', cats), false);
  assert.equal(fitsAisle('bird', birds), true);
  assert.equal(fitsAisle('Hamster', small), true);   // typed value is normalised first
  assert.equal(fitsAisle('other', birds), true);     // generic small-animal items suit every non-dog/cat aisle
  assert.equal(fitsAisle('other', dogs), false);
  assert.equal(fitsAisle('all', dogs), true);
  assert.equal(fitsAisle('bird', null), false);
});

test('the admin picker offers every aisle and a breadcrumb has somewhere to go', () => {
  const values = PET_OPTIONS.map(([v]) => v);
  for (const a of PET_AISLES) assert.ok(values.includes(a.pet), a.pet);
  assert.ok(values.includes('both') && values.includes('all'));
  assert.equal(aisleSlugForProduct('bird'), 'birds');
  assert.equal(aisleSlugForProduct('cat'), 'cats');
  assert.equal(aisleSlugForProduct('both'), 'dogs');
});
