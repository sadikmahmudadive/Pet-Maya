import 'package:flutter_test/flutter_test.dart';
import 'package:tail_wagging_flutter/data/nearby.dart';

void main() {
  test('distances read in metres under a kilometre and kilometres above', () {
    expect(formatDistance(0), '0 m');
    expect(formatDistance(850.4), '850 m');
    expect(formatDistance(999), '999 m');
    expect(formatDistance(1000), '1.0 km');
    expect(formatDistance(3449), '3.4 km');
  });

  test('a specialist counts as nearby only with a known distance inside the radius', () {
    expect(isWithinKm(1500, 2), true);
    expect(isWithinKm(2000, 2), true); // the edge is included
    expect(isWithinKm(2001, 2), false);
    expect(isWithinKm(null, 25), false); // unknown is never nearby
  });

  test('the radius choices step up and stop at the largest', () {
    expect(nearbyRadiiKm, [2, 5, 10, 25]);
    expect(widerRadius(2), 5);
    expect(widerRadius(5), 10);
    expect(widerRadius(10), 25);
    expect(widerRadius(25), isNull);
    expect(widerRadius(7), 10);
  });
}
