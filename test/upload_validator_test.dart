import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:tail_wagging_flutter/core/security/upload_validator.dart';

Uint8List bytes(List<int> b) => Uint8List.fromList([...b, ...List.filled(16, 0)]);

void main() {
  final jpeg = bytes([0xFF, 0xD8, 0xFF, 0xE0]);
  final png = bytes([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  final pdf = bytes('%PDF-1.7'.codeUnits);
  final html = bytes('<html><script>'.codeUnits);
  final svg = bytes('<svg onload='.codeUnits);
  final exe = bytes([0x4D, 0x5A, 0x90, 0x00]); // MZ header

  test('accepts real images and reports the sniffed type', () {
    expect(UploadValidator.validateBytes(jpeg, 1000, UploadKind.image).contentType, 'image/jpeg');
    expect(UploadValidator.validateBytes(png, 1000, UploadKind.image).extension, 'png');
  });

  test('rejects renamed scripts, SVG and executables', () {
    for (final head in [html, svg, exe]) {
      expect(() => UploadValidator.validateBytes(head, 1000, UploadKind.image), throwsA(isA<UploadRejected>()));
      expect(() => UploadValidator.validateBytes(head, 1000, UploadKind.document), throwsA(isA<UploadRejected>()));
    }
  });

  test('PDFs are documents, never images', () {
    expect(UploadValidator.validateBytes(pdf, 1000, UploadKind.document).contentType, 'application/pdf');
    expect(() => UploadValidator.validateBytes(pdf, 1000, UploadKind.image), throwsA(isA<UploadRejected>()));
  });

  test('enforces size limits', () {
    expect(() => UploadValidator.validateBytes(jpeg, 0, UploadKind.image), throwsA(isA<UploadRejected>()));
    expect(() => UploadValidator.validateBytes(jpeg, UploadValidator.maxImageBytes + 1, UploadKind.image),
        throwsA(isA<UploadRejected>()));
    expect(UploadValidator.validateBytes(jpeg, UploadValidator.maxImageBytes + 1, UploadKind.document).contentType,
        'image/jpeg');
    expect(() => UploadValidator.validateBytes(pdf, UploadValidator.maxDocumentBytes + 1, UploadKind.document),
        throwsA(isA<UploadRejected>()));
  });

  test('only opens files from our storage bucket over https', () {
    expect(isTrustedFileUrl('https://firebasestorage.googleapis.com/v0/b/pet-maya.firebasestorage.app/o/x'), isTrue);
    expect(isTrustedFileUrl('https://pet-maya.firebasestorage.app/x.pdf'), isTrue);
    for (final bad in [null, '', 'javascript:alert(1)', 'http://firebasestorage.googleapis.com/x',
                       'https://evil.com/firebasestorage.googleapis.com', 'file:///etc/passwd',
                       'https://firebasestorage.googleapis.com.evil.com/x']) {
      expect(isTrustedFileUrl(bad), isFalse, reason: '$bad');
    }
  });
}
