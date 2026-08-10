import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as path;
import 'package:flutter/foundation.dart';

class CloudinaryService {
  static final CloudinaryService _instance = CloudinaryService._internal();
  factory CloudinaryService() => _instance;
  CloudinaryService._internal();

  final String cloudName = 'dhm0edatk';
  final String uploadPreset = 'tail_wagging';

  /// Uploads an image to Cloudinary using unsigned upload preset.
  /// [imageFile] is the local file to upload.
  /// [folder] is the target folder in Cloudinary (e.g., 'profile_pics', 'pets', 'community_posts').
  Future<String?> uploadImage(File imageFile, String folder) async {
    try {
      final url = Uri.parse('https://api.cloudinary.com/v1_1/$cloudName/image/upload');
      
      final request = http.MultipartRequest('POST', url)
        ..fields['upload_preset'] = uploadPreset
        ..fields['folder'] = folder
        ..files.add(await http.MultipartFile.fromPath(
          'file',
          imageFile.path,
          filename: path.basename(imageFile.path),
        ));

      final response = await request.send();
      final responseData = await response.stream.bytesToString();

      if (response.statusCode == 200 || response.statusCode == 201) {
        final jsonResponse = jsonDecode(responseData);
        return jsonResponse['secure_url'] as String;
      } else {
        debugPrint('[CloudinaryService] Upload failed with status: ${response.statusCode}');
        debugPrint('[CloudinaryService] Error response: $responseData');
        return null;
      }
    } catch (e) {
      debugPrint('[CloudinaryService] Error during upload: $e');
      return null;
    }
  }
}
