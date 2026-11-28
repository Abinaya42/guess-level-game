import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models.dart';

class ApiService {
  static const String _baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'https://find11-game-1.onrender.com/api',
  );

  late final Dio _dio;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 60),
      receiveTimeout: const Duration(seconds: 60),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final user = FirebaseAuth.instance.currentUser;
        if (user != null) {
          final token = await user.getIdToken();
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) {
        handler.next(error);
      },
    ));
  }

  Future<UserModel> verifyAndCreateUser({String? username}) async {
    final res = await _dio.post('/auth/verify', data: {'username': username});
    return UserModel.fromJson(res.data['user'] as Map<String, dynamic>);
  }

  Future<UserModel> updateProfile(String username) async {
    final res = await _dio.post('/auth/update-profile', data: {'username': username});
    return UserModel.fromJson(res.data['user'] as Map<String, dynamic>);
  }

  Future<GameStats> getUserStats(String userId) async {
    final res = await _dio.get('/users/$userId/stats');
    return GameStats.fromJson(res.data['stats'] as Map<String, dynamic>);
  }

  Future<List<Map<String, dynamic>>> getUserHistory(String userId, {int page = 1}) async {
    final res = await _dio.get('/users/$userId/history', queryParameters: {'page': page});
    return (res.data['history'] as List<dynamic>)
        .cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> getRoom(String code) async {
    final res = await _dio.get('/rooms/$code');
    return res.data['room'] as Map<String, dynamic>;
  }
}