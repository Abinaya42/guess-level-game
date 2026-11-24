import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../models.dart';

typedef SocketEventHandler = void Function(dynamic data);

class SocketService {
  static const String _serverUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:3001',
  );

  IO.Socket? _socket;
  final Map<String, List<SocketEventHandler>> _listeners = {};

  void connect(String token) {
    if (_socket?.connected == true) return;

    _socket = IO.io(
      _serverUrl,
      IO.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setAuth({'token': token})
          .enableReconnection()
          .setReconnectionAttempts(5)
          .setReconnectionDelay(1000)
          .build(),
    );

    _socket!.onConnect((_) => print('Socket connected: ${_socket!.id}'));
    _socket!.onDisconnect((_) => print('Socket disconnected'));
    _socket!.onConnectError((e) => print('Socket error: $e'));
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
    _listeners.clear();
  }

  void emit(String event, [dynamic data]) {
    _socket?.emit(event, data);
  }

  void on(String event, SocketEventHandler handler) {
    _listeners.putIfAbsent(event, () => []).add(handler);
    _socket?.on(event, handler);
  }

  void off(String event) {
    _socket?.off(event);
    _listeners.remove(event);
  }

  bool get isConnected => _socket?.connected ?? false;

  // ── Room ──────────────────────────────────────────────────────────────────
  void createRoom() => emit('room:create', {});
  void joinRoom(String code) => emit('room:join', {'code': code});
  void leaveRoom(String code) => emit('room:leave', {'code': code});
  void setReady(String code, bool ready) => emit('room:ready', {'code': code, 'ready': ready});
  void startGame(String code) => emit('room:start', {'code': code});

  // ── Game ──────────────────────────────────────────────────────────────────
  void selectWord(String roundId, String word) =>
      emit('game:word-select', {'roundId': roundId, 'word': word});
  void drawStroke(String roundId, StrokeData stroke) =>
      emit('game:draw-stroke', {'roundId': roundId, 'stroke': stroke.toJson()});
  void undoStroke(String roundId) => emit('game:undo', {'roundId': roundId});
  void redoStroke(String roundId) => emit('game:redo', {'roundId': roundId});
  void clearCanvas(String roundId) => emit('game:clear', {'roundId': roundId});
  void submitGuess(String roundId, String text) =>
      emit('game:guess', {'roundId': roundId, 'text': text});
  void requestState(String roomCode) =>
      emit('state:request', {'roomCode': roomCode});
}
