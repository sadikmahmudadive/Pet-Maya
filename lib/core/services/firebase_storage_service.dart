import 'dart:io';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import 'package:flutter/foundation.dart';
import '../security/upload_validator.dart';

class FirebaseStorageService {
  static final FirebaseStorageService _instance = FirebaseStorageService._internal();
  factory FirebaseStorageService() => _instance;
  FirebaseStorageService._internal();

  final FirebaseStorage _storage = FirebaseStorage.instance;

  /// Why the last [uploadImage] call returned null (user-facing text).
  String? lastError;

  /// Compresses, validates and uploads an image to Firebase Storage.
  /// [imageFile] is the local file to upload.
  /// [folder] is the target folder (e.g., 'profile_pics', 'pets', 'community_posts').
  ///
  /// Files go to `{folder}/{uid}/{file}`: storage.rules only lets a user write
  /// inside their own folder. Returns null when the file isn't a real image,
  /// is over 5 MB, or the upload fails; [lastError] says which.
  Future<String?> uploadImage(File imageFile, String folder) async {
    lastError = null;
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) {
      lastError = 'Please sign in to upload photos.';
      return null;
    }

    // 1. Optimization: Compress image before upload (also strips EXIF/GPS).
    final compressedFile = await _compressImage(imageFile);

    try {
      // 2. Security: verify it's a real image within the size limit.
      final type = await UploadValidator.validateFile(compressedFile, UploadKind.image);

      final fileName = '${DateTime.now().millisecondsSinceEpoch}.${type.extension}';
      final ref = _storage.ref().child(folder).child(uid).child(fileName);

      // 3. Upload with the sniffed content type (never the client's guess).
      final uploadTask = await ref.putFile(
        compressedFile,
        SettableMetadata(contentType: type.contentType),
      );

      // 4. Get and return download URL
      return await uploadTask.ref.getDownloadURL();
    } on UploadRejected catch (e) {
      lastError = e.message;
      return null;
    } catch (e) {
      debugPrint('[FirebaseStorageService] Error during upload: $e');
      lastError = 'Upload failed. Please try again.';
      return null;
    }
  }

  /// Compresses the image to save bandwidth and storage space.
  Future<File> _compressImage(File file) async {
    try {
      final tempDir = await getTemporaryDirectory();
      final targetPath = path.join(
        tempDir.path,
        "compressed_${DateTime.now().microsecondsSinceEpoch}.jpg",
      );

      final result = await FlutterImageCompress.compressAndGetFile(
        file.absolute.path,
        targetPath,
        quality: 70, // Balance between quality and size
        format: CompressFormat.jpeg,
      );

      // Fallback to the original; it is still validated before upload.
      if (result == null) return file;
      return File(result.path);
    } catch (e) {
      debugPrint('[FirebaseStorageService] Compression error: $e');
      return file;
    }
  }

  /// Deletes a file from Storage given its URL.
  Future<void> deleteFile(String url) async {
    try {
      final ref = _storage.refFromURL(url);
      await ref.delete();
    } catch (e) {
      debugPrint('[FirebaseStorageService] Delete error: $e');
    }
  }
}
