// What kind of animal a pet is (pure, no browser). Run: node --test tests/unit/species.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { SPECIES_OPTIONS, productFitsPet, resolveSpecies, speciesKind, speciesShopPath, withUnit } from '../../web/src/lib/species.js';

const sp = (type, breed) => resolveSpecies({ type, breed });

test('the real pets in the database, all stored as type "Dog", get their true species', () => {
  assert.equal(sp('Dog', 'Ring-necked Dove'), 'Bird');   // Piku, Pikku
  assert.equal(sp('Dog', 'Maine Coon'), 'Cat');          // Micky
  assert.equal(sp('Dog', 'Calico'), 'Cat');              // pet maya
  assert.equal(sp('Dog', 'Domestic'), 'Cat');            // Sahiba
  assert.equal(sp('Dog', 'Domestic Shorthair'), 'Cat');  // Miko, Meow
});

test('a real dog stays a dog, with or without the stored type', () => {
  assert.equal(sp('Dog', 'Golden Retriever'), 'Dog');
  assert.equal(sp('', 'Labrador'), 'Dog');
  assert.equal(sp('Dog', 'Pug'), 'Dog');
  assert.equal(sp('Dog', ''), 'Dog');                    // unknown breed: trust the type
  assert.equal(sp('Dog', 'Mixed breed'), 'Dog');
});

test('dog breeds containing cat-style words are not mistaken for cats, nor "Rottweiler" for a rat', () => {
  assert.equal(sp('', 'German Shorthaired Pointer'), 'Dog');
  assert.equal(sp('', 'Longhaired Dachshund'), 'Dog');
  assert.equal(sp('Dog', 'Rottweiler'), 'Dog');
  assert.equal(sp('Dog', 'Pomeranian'), 'Dog');
});

test('other animals', () => {
  assert.equal(sp('Bird', 'Budgie'), 'Bird');
  assert.equal(sp('Dog', 'African Grey Parrot'), 'Bird');
  assert.equal(sp('', 'Angora Rabbit'), 'Rabbit');
  assert.equal(sp('', 'Turkish Angora'), 'Cat');         // bare "Angora" is the cat
  assert.equal(sp('', 'Guinea Pig'), 'Rodent');
  assert.equal(sp('Dog', 'Syrian Hamster'), 'Rodent');
  assert.equal(sp('', 'Betta'), 'Fish');
});

test('an explicit non-dog type is respected, an empty one is "Pet", and the breed is never returned as the species', () => {
  assert.equal(sp('Cat', ''), 'Cat');
  assert.equal(sp('cat', 'Persian'), 'Cat');
  assert.equal(sp('Other', 'Hedgehog'), 'Other');
  assert.equal(sp('tortoise', ''), 'Tortoise');
  assert.equal(sp('', ''), 'Pet');
  assert.equal(resolveSpecies(), 'Pet');
  assert.notEqual(sp('Dog', 'Xyz-Breed-Nobody-Knows'), 'Xyz-Breed-Nobody-Knows');
});

test('a species the owner chose explicitly wins over the old type field', () => {
  assert.equal(resolveSpecies({ type: 'Dog', species: 'Rabbit', breed: '' }), 'Rabbit');
});

test('kind: what the shop and triage switch on', () => {
  assert.equal(speciesKind({ type: 'Dog', breed: 'Ring-necked Dove' }), 'bird');
  assert.equal(speciesKind({ type: 'Dog', breed: 'Maine Coon' }), 'cat');
  assert.equal(speciesKind({ species: 'Dog', breed: '' }), 'dog');
  assert.equal(speciesKind({ type: 'Other', breed: 'Hedgehog' }), 'other');
  assert.equal(speciesKind(null), 'other');
});

test('products: dog and cat items fit dogs/cats, "both" fits only dogs and cats, never a bird', () => {
  assert.ok(productFitsPet('dog', 'dog'));
  assert.ok(!productFitsPet('dog', 'cat'));
  assert.ok(productFitsPet('both', 'dog') && productFitsPet('both', 'cat'));
  assert.ok(!productFitsPet('both', 'bird'));
  assert.ok(productFitsPet('bird', 'bird'));
  assert.ok(productFitsPet('all', 'bird') && productFitsPet('all', 'dog'));
  assert.ok(productFitsPet(undefined, 'dog'));   // no pet set = "both"
  assert.ok(!productFitsPet('cat', 'bird'));
});

test('the shop page for a pet, the add-pet options and unit formatting', () => {
  assert.equal(speciesShopPath('dog'), '/shop/dogs');
  assert.equal(speciesShopPath('cat'), '/shop/cats');
  assert.equal(speciesShopPath('bird'), '/shop');
  assert.ok(SPECIES_OPTIONS.includes('Bird') && SPECIES_OPTIONS.includes('Dog'));
  assert.equal(withUnit('0.15', 'kg'), '0.15 kg');
  assert.equal(withUnit('3 kg', 'kg'), '3 kg');
  assert.equal(withUnit('20.32', 'cm'), '20.32 cm');
  assert.equal(withUnit('', 'kg'), '');
  assert.equal(withUnit(null, 'kg'), '');
});
