// What kind of animal a pet is.
//
// Many pets are stored with type "Dog" whatever they really are: it was the default in the first versions of the app and
// of the website's add-pet form (the database holds a Maine Coon, a Calico and a Ring-necked Dove, all as "Dog"). The
// mobile app copes by also reading the breed (PetModel.resolvedSpecies); this does the same for the website, so a
// bird is shown as a bird and gets bird-appropriate suggestions instead of dog food.
//
// Pure functions, no browser or Firebase, so they can be unit-tested.

const BIRD = /\b(?:birds?|doves?|pigeons?|parrots?|parakeets?|conures?|lorikeets?|canar(?:y|ies)|finch(?:es)?|cockatiels?|cockatoos?|budgies?|budgerigars?|lovebirds?|macaws?|sparrows?|myn(?:a|ah)s?|ducks?|ducklings?|chickens?|hens?|roosters?|cockerels?|owls?|falcons?|eagles?|hawks?|peacocks?|quails?|geese|goose)\b/;
const RABBIT = /\b(?:rabbits?|bunn(?:y|ies)|hares?|lionheads?|lops?|netherland dwarf|flemish giant)\b/;
const FISH = /\b(?:fish|goldfish|bett?as?|tetras?|guppy|guppies|koi|mollys?|mollies|angelfish|cichlids?|arowanas?)\b/;
const RODENT = /\b(?:hamsters?|guinea pigs?|mice|mouse|rats?|gerbils?|chinchillas?|squirrels?)\b/;
// Specific dog breeds are tested before the cat words, so "Longhaired Dachshund" or "German Shorthaired Pointer" stay dogs.
const DOG = /\b(?:dogs?|puppy|puppies|canine|retrievers?|labradors?|shepherds?|huskies|husky|poodles?|bulldogs?|hounds?|terriers?|corgis?|pugs?|beagles?|rottweilers?|dachshunds?|chihuahuas?|pomeranians?|dobermann?s?|boxers?|spitz|mastiffs?|collies?|spaniels?|dalmatians?|shih tzu|lhasa|maltese|akita|samoyed|schnauzers?|pit ?bulls?|great danes?|saint bernards?|st\.? bernards?|pointers?|setters?|whippets?|greyhounds?|malamutes?|basenji)\b/;
const CAT = /\b(?:cats?|kittens?|felines?|persians?|siamese|bengals?|ragdolls?|(?:short|long|medium)[- ]?hair(?:ed)?|maine coon|calico|tabby|tortoiseshell|tortie|ragamuffin|sphynx|birman|burmese|abyssinian|british short\w*|scottish fold|russian blue|himalayan|angora|norwegian forest|munchkin|savannah|oriental|domestic)\b/;

const title = (s) => String(s).trim().toLowerCase().replace(/(^|[\s-])\w/g, (c) => c.toUpperCase());

/**
 * "Dog" | "Cat" | "Bird" | "Rabbit" | "Fish" | "Rodent" | another label the owner chose | "Pet".
 * `type` is what is stored on the pet; the breed corrects it when the two disagree (type "Dog" is the old default).
 */
export function resolveSpecies({ type, species, breed } = {}) {
  const stored = String(species || type || '').trim();
  const t = stored.toLowerCase();
  const b = String(breed || '').toLowerCase();
  const hint = `${t} ${b}`;

  if (BIRD.test(hint)) return 'Bird';
  if (RABBIT.test(hint)) return 'Rabbit';
  if (FISH.test(hint)) return 'Fish';
  if (RODENT.test(hint)) return 'Rodent';
  if (DOG.test(b)) return 'Dog';
  if (CAT.test(hint)) return 'Cat';
  if (t && t !== 'pet') return t === 'dog' ? 'Dog' : title(stored);
  return 'Pet';
}

/** 'dog' | 'cat' | 'bird' | 'rabbit' | 'fish' | 'rodent' | 'other' (what the shop and triage logic switches on). */
export function speciesKind(pet) {
  const s = resolveSpecies({ type: pet?.type, species: pet?.species, breed: pet?.breed });
  const k = s.toLowerCase();
  return ['dog', 'cat', 'bird', 'rabbit', 'fish', 'rodent'].includes(k) ? k : 'other';
}

/**
 * Does a product made for `productPet` ("dog" | "cat" | "both" | "all" | …) suit a pet of this kind?
 * "both" means dogs and cats, so it is not offered for a bird, a rabbit and so on.
 */
export function productFitsPet(productPet, kind) {
  const p = String(productPet || 'both').toLowerCase();
  if (p === 'all') return true;
  if (kind === 'dog' || kind === 'cat') return p === kind || p === 'both';
  return p === kind || p === 'other';
}

/** The shop page that best matches a pet: the dog or cat aisle, otherwise the whole shop. */
export const speciesShopPath = (kind) => (kind === 'dog' ? '/shop/dogs' : kind === 'cat' ? '/shop/cats' : '/shop');

/** Options for the "Species" pick-list when adding or editing a pet. */
export const SPECIES_OPTIONS = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Fish', 'Rodent', 'Other'];

/** "0.15" → "0.15 kg"; "3 kg" stays as typed (older entries have the unit, some do not). */
export function withUnit(value, unit) {
  const v = String(value ?? '').trim();
  if (!v) return '';
  return /^[\d.,]+$/.test(v) ? `${v} ${unit}` : v;
}
