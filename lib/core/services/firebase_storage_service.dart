import 'dart:io';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import 'package:flutter/foundation.dart';

class FirebaseStorageService {
  static final FirebaseStorageService _instance = FirebaseStorageService._internal();
  factory FirebaseStorageService() => _instance;
  FirebaseStorageService._internal();

  final FirebaseStorage _storage = FirebaseStorage.instance;

  /// Compresses and uploads an image to Firebase Storage.
  /// [imageFile] is the local file to upload.
  /// [folder] is the target folder (e.g., 'profile_pics', 'pets', 'community_posts').
  Future<String?> uploadImage(File imageFile, String folder) async {
    try {
      // 1. Optimization: Compress image before upload
      final compressedFile = await _compressImage(imageFile);
      if (compressedFile == null) return null;

      // 2. Security: Files are organized by folder
      final fileName = '${DateTime.now().millisecondsSinceEpoch}_${path.basename(compressedFile.path)}';
      final ref = _storage.ref().child(folder).child(fileName);

      // 3. Upload
      final uploadTask = await ref.putFile(
        compressedFile,
        SettableMetadata(contentType: 'image/jpeg'),
      );

      // 4. Get and return download URL
      return await uploadTask.ref.getDownloadURL();
    } catch (e) {
      debugPrint('[FirebaseStorageService] Error during upload: $e');
      return null;
    }
  }

  /// Compresses the image to save bandwidth and storage space.
  Future<File?> _compressImage(File file) async {
    try {
      final tempDir = await getTemporaryDirectory();
      final targetPath = path.join(tempDir.path, "compressed_${path.basename(file.path)}");

      final result = await FlutterImageCompress.compressAndGetFile(
        file.absolute.path,
        targetPath,
        quality: 70, // Balance between quality and size
        format: CompressFormat.jpeg,
      );

      if (result == null) return file; // Fallback to original if compression fails
      return File(result.path);
    } catch (e) {
      debugPrint('[FirebaseStorageService] Compression error: $e');
      return file; // Fallback to original
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
