import 'dart:io';
import 'dart:typed_data';

/// What a file upload is allowed to be.
enum UploadKind {
  /// JPEG / PNG / WebP / HEIC photos, up to [UploadValidator.maxImageBytes].
  image,

  /// PDF or photo of a document, up to [UploadValidator.maxDocumentBytes].
  document,
}

/// A file was refused before upload; [message] is safe to show to the user.
class UploadRejected implements Exception {
  final String message;
  const UploadRejected(this.message);
  @override
  String toString() => message;
}

/// The checked type of an accepted file.
class UploadType {
  final String contentType;
  final String extension;
  const UploadType(this.contentType, this.extension);
}

/// Validates files before they're uploaded to Cloud Storage.
///
/// The real type comes from the file's leading "magic" bytes, never from its
/// name or the picker, so a renamed .html/.exe/.svg is refused. storage.rules
/// enforces the same size and type limits server-side.
class UploadValidator {
  UploadValidator._();

  static const int maxImageBytes = 5 * 1024 * 1024;
  static const int maxDocumentBytes = 15 * 1024 * 1024;

  static Future<UploadType> validateFile(File file, UploadKind kind) async {
    final length = await file.length();
    final raf = await file.open();
    try {
      final head = await raf.read(16);
      return validateBytes(head, length, kind);
    } finally {
      await raf.close();
    }
  }

  /// Pure check on the first bytes and total size (unit-tested).
  static UploadType validateBytes(Uint8List head, int length, UploadKind kind) {
    final max = kind == UploadKind.image ? maxImageBytes : maxDocumentBytes;
    if (length <= 0) throw const UploadRejected('That file is empty.');
    if (length > max) {
      throw UploadRejected(
        'That file is too large (max ${max ~/ (1024 * 1024)} MB).',
      );
    }
    final image = sniffImage(head);
    if (image != null) return image;
    if (kind == UploadKind.document && _isPdf(head)) {
      return const UploadType('application/pdf', 'pdf');
    }
    throw UploadRejected(
      kind == UploadKind.image
          ? 'Please choose a JPEG, PNG, WebP or HEIC photo.'
          : 'Please choose a PDF or a photo (JPEG, PNG, WebP, HEIC).',
    );
  }

  static UploadType? sniffImage(Uint8List h) {
    bool at(int offset, List<int> sig) {
      if (h.length < offset + sig.length) return false;
      for (var i = 0; i < sig.length; i++) {
        if (h[offset + i] != sig[i]) return false;
      }
      return true;
    }

    if (at(0, [0xFF, 0xD8, 0xFF])) return const UploadType('image/jpeg', 'jpg');
    if (at(0, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) {
      return const UploadType('image/png', 'png');
    }
    if (at(0, 'RIFF'.codeUnits) && at(8, 'WEBP'.codeUnits)) {
      return const UploadType('image/webp', 'webp');
    }
    if (at(4, 'ftyp'.codeUnits)) {
      final brand = String.fromCharCodes(h.sublist(8, 12));
      if (const ['heic', 'heix', 'hevc', 'mif1', 'msf1'].contains(brand)) {
        return const UploadType('image/heic', 'heic');
      }
    }
    return null;
  }

  static bool _isPdf(Uint8List h) =>
      h.length >= 5 && String.fromCharCodes(h.sublist(0, 5)) == '%PDF-';
}

/// Only opens links that point at our own Cloud Storage bucket over HTTPS,
/// so a tampered record can't send users to a phishing or `javascript:` URL.
bool isTrustedFileUrl(String? url) {
  if (url == null || url.isEmpty) return false;
  final uri = Uri.tryParse(url);
  if (uri == null || uri.scheme != 'https') return false;
  return uri.host == 'firebasestorage.googleapis.com' ||
      uri.host.endsWith('.firebasestorage.app') ||
      uri.host == 'storage.googleapis.com';
}
