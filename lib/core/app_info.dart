import 'package:package_info_plus/package_info_plus.dart';

/// App version read from the build itself (pubspec `version: x.y.z+build`),
/// so on-screen labels never drift from the released version.
class AppInfo {
  AppInfo._();

  static String version = '1.1.0';
  static String buildNumber = '23';

  /// e.g. "v1.1.0 (Build 23)"
  static String get label => 'v$version (Build $buildNumber)';

  /// e.g. "v1.1.0+23"
  static String get short => 'v$version+$buildNumber';

  static Future<void> load() async {
    try {
      final info = await PackageInfo.fromPlatform();
      if (info.version.isNotEmpty) version = info.version;
      if (info.buildNumber.isNotEmpty) buildNumber = info.buildNumber;
    } catch (_) {
      // Keep the compiled-in fallback above.
    }
  }
}
