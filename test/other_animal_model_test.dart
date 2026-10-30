import 'package:flutter_test/flutter_test.dart';
import 'package:tail_wagging_flutter/data/models/other_animal_model.dart';

void main() {
  const base = OtherAnimalModel(id: 'oa_1', ownerID: 'u1', createdAt: 10, lastScanAt: 20);

  test('an animal without a name is shown by its type', () {
    expect(base.displayName, 'Unnamed dog');
    expect(base.copyWith(type: 'Cat').displayName, 'Unnamed cat');
    expect(base.copyWith(name: '  Rocky ').displayName, 'Rocky');
  });

  test('the subtitle joins the type and breed, skipping an empty breed', () {
    expect(base.subtitle, 'Dog');
    expect(base.copyWith(breed: ' Labrador mix ').subtitle, 'Dog · Labrador mix');
  });

  test('saving and loading keeps every field', () {
    final animal = base.copyWith(
      name: 'Rocky',
      type: 'Cat',
      breed: 'Tabby',
      note: 'Near the market',
      photoUrl: 'https://x.test/a.jpg',
      scanCount: 3,
      lastUrgent: true,
    );
    final back = OtherAnimalModel.fromMap('oa_1', animal.toMap());
    expect(back.ownerID, 'u1');
    expect(back.name, 'Rocky');
    expect(back.type, 'Cat');
    expect(back.breed, 'Tabby');
    expect(back.note, 'Near the market');
    expect(back.photoUrl, 'https://x.test/a.jpg');
    expect(back.createdAt, 10);
    expect(back.lastScanAt, 20);
    expect(back.scanCount, 3);
    expect(back.lastUrgent, true);
  });

  test('stored data is read defensively', () {
    final a = OtherAnimalModel.fromMap('x', {'ownerID': 'u1', 'type': 'Dragon', 'photoUrl': '', 'scanCount': 2.0});
    expect(a.type, 'Other'); // an unknown type never breaks the list
    expect(a.photoUrl, isNull);
    expect(a.scanCount, 2);
    final empty = OtherAnimalModel.fromMap('y', {});
    expect(empty.displayName, 'Unnamed dog');
    expect(empty.createdAt, 0);
  });

  test('only the listed types are offered', () {
    expect(OtherAnimalModel.types, ['Dog', 'Cat', 'Bird', 'Rabbit', 'Other']);
  });

  test('an emergency in the report marks the scan urgent', () {
    expect(OtherAnimalScan.isUrgent('Urgency: EMERGENCY - see a vet now'), true);
    expect(OtherAnimalScan.isUrgent('Routine check advised'), false);
  });

  test('a scan survives saving and loading', () {
    const scan = OtherAnimalScan(id: 's1', issue: 'Limping', diagnosis: 'Rest it', urgent: true, imageUrl: 'https://x.test/s.jpg', timestamp: 5);
    final back = OtherAnimalScan.fromMap('s1', scan.toMap());
    expect(back.issue, 'Limping');
    expect(back.diagnosis, 'Rest it');
    expect(back.urgent, true);
    expect(back.imageUrl, 'https://x.test/s.jpg');
    expect(back.timestamp, 5);
    expect(OtherAnimalScan.fromMap('s2', {'imageUrl': ''}).imageUrl, isNull);
  });
}
