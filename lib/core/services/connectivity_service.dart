import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';

class ConnectivityService {
  static final ConnectivityService _instance = ConnectivityService._internal();
  factory ConnectivityService() => _instance;
  ConnectivityService._internal();

  final Connectivity _connectivity = Connectivity();

  Future<bool> isConnected() async {
    try {
      final List<ConnectivityResult> result = await _connectivity.checkConnectivity();
      return !result.contains(ConnectivityResult.none);
    } catch (e) {
      // If plugin fails (e.g. MissingPluginException), assume connected but let API call fail naturally
      debugPrint('[ConnectivityService] Error: $e');
      return true; 
    }
  }

  Stream<List<ConnectivityResult>> get onConnectivityChanged => _connectivity.onConnectivityChanged;
}
