import 'package:flutter_test/flutter_test.dart';
import 'package:tail_wagging_flutter/data/models/pet_model.dart';

// The stored `type` is often the old default "Dog"; the breed has to correct it. These are the real pets in the
// database (all saved as type "Dog"), plus the cases that used to go wrong.
String species(String type, String breed) =>
    PetModel(petID: 'p', ownerID: 'o', name: 'x', type: type, breed: breed, gender: '', age: '', dob: '').resolvedSpecies;

void main() {
  test('pets saved as "Dog" get their real species from the breed', () {
    expect(species('Dog', 'Ring-necked Dove'), 'Bird');
    expect(species('Dog', 'Maine Coon'), 'Cat');
    expect(species('Dog', 'Calico'), 'Cat');
    expect(species('Dog', 'Domestic'), 'Cat');
    expect(species('Dog', 'Domestic Shorthair'), 'Cat');
  });

  test('real dogs stay dogs, and an unknown breed is never returned as the species', () {
    expect(species('Dog', 'Golden Retriever'), 'Dog');
    expect(species('', 'Labrador'), 'Dog');
    expect(species('Dog', 'Rottweiler'), 'Dog'); // not a rat
    expect(species('', 'German Shorthaired Pointer'), 'Dog');
    expect(species('Dog', 'Xyz Mystery Breed'), 'Dog');
  });

  test('other animals, explicit types and empty values', () {
    expect(species('Dog', 'Syrian Hamster'), 'Rodent');
    expect(species('', 'Angora Rabbit'), 'Rabbit');
    expect(species('Cat', ''), 'Cat');
    expect(species('Other', 'Hedgehog'), 'Other');
    expect(species('', ''), 'Pet');
  });
}
