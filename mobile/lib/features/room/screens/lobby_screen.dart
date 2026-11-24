import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../core/providers/providers.dart';
import '../../../core/services/socket_service.dart';
import '../../../core/models.dart';

class LobbyScreen extends ConsumerStatefulWidget {
  final String code;
  const LobbyScreen({super.key, required this.code});
  @override
  ConsumerState<LobbyScreen> createState() => _LobbyScreenState();
}

class _LobbyScreenState extends ConsumerState<LobbyScreen> {
  final _socket = SocketService();
  bool _isReady = false;
  bool _starting = false;
  String? _inviteLink;

  @override
  void initState() {
    super.initState();
    _connectAndJoin();
  }

  Future<void> _connectAndJoin() async {
    final fbUser = FirebaseAuth.instance.currentUser;
    if (fbUser == null) { context.go('/login'); return; }
    final token = await fbUser.getIdToken();
    _socket.connect(token!);

    _socket.on('room:joined', (data) {
      if (!mounted) return;
      final map = data as Map<String, dynamic>;
      final players = (map['players'] as List<dynamic>? ?? [])
          .map((p) => PlayerModel.fromJson(p as Map<String, dynamic>))
          .toList();
      ref.read(playersProvider.notifier).state = players;
      ref.read(roomProvider.notifier).state = RoomModel(
        id: map['roomId'] as String? ?? '',
        code: map['code'] as String? ?? widget.code,
        hostId: map['hostId'] as String? ?? '',
        status: 'WAITING',
        maxPlayers: 11,
        players: players,
      );
      setState(() => _inviteLink = '${_serverBase()}/join/${widget.code}');
    });

    _socket.on('room:created', (data) {
      if (!mounted) return;
      final map = data as Map<String, dynamic>;
      final players = (map['players'] as List<dynamic>? ?? [])
          .map((p) => PlayerModel.fromJson(p as Map<String, dynamic>))
          .toList();
      ref.read(playersProvider.notifier).state = players;
      setState(() => _inviteLink = map['inviteLink'] as String?);
    });

    _socket.on('room:updated', (data) {
      if (!mounted) return;
      final map = data as Map<String, dynamic>;
      final players = (map['players'] as List<dynamic>? ?? [])
          .map((p) => PlayerModel.fromJson(p as Map<String, dynamic>))
          .toList();
      ref.read(playersProvider.notifier).state = players;
      final room = ref.read(roomProvider);
      if (room != null) {
        ref.read(roomProvider.notifier).state = RoomModel(
          id: room.id, code: room.code,
          hostId: map['hostId'] as String? ?? room.hostId,
          status: room.status, maxPlayers: room.maxPlayers,
          players: players, inviteLink: room.inviteLink,
        );
      }
    });

    _socket.on('host:changed', (data) {
      if (!mounted) return;
      final map = data as Map<String, dynamic>;
      final room = ref.read(roomProvider);
      if (room != null) {
        ref.read(roomProvider.notifier).state = RoomModel(
          id: room.id, code: room.code,
          hostId: map['newHostId'] as String,
          status: room.status, maxPlayers: room.maxPlayers,
          players: room.players, inviteLink: room.inviteLink,
        );
      }
      final myId = ref.read(currentUserProvider)?.id;
      if (map['newHostId'] == myId) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('👑 You are now the host!'), backgroundColor: Colors.amber));
      }
    });

    _socket.on('player:joined', (data) {
      // room:updated handles the full list refresh
    });

    _socket.on('player:left', (_) {
      // room:updated handles the full list refresh
    });

    _socket.on('game:started', (_) {
      if (!mounted) return;
      context.go('/game/${widget.code}');
    });

    _socket.on('error', (data) {
      if (!mounted) return;
      final msg = (data as Map<String, dynamic>)['message'] as String? ?? 'Error';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
      setState(() => _starting = false);
    });

    // Check if creating vs joining
    final room = ref.read(roomProvider);
    if (room != null && room.code == widget.code) {
      // Already in room (came from create-room), no need to join again
    } else {
      _socket.joinRoom(widget.code);
    }
  }

  String _serverBase() => const String.fromEnvironment('API_URL', defaultValue: 'http://10.0.2.2:3001');

  void _toggleReady() {
    setState(() => _isReady = !_isReady);
    _socket.setReady(widget.code, _isReady);
  }

  void _startGame() {
    final players = ref.read(playersProvider);
    if (players.length < 2) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Need at least 2 players!')));
      return;
    }
    final nonHostsReady = players.where((p) => !p.isHost).every((p) => p.isReady);
    if (!nonHostsReady) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('All players must be ready!')));
      return;
    }
    setState(() => _starting = true);
    _socket.startGame(widget.code);
  }

  void _copyInvite() {
    if (_inviteLink != null) {
      Clipboard.setData(ClipboardData(text: _inviteLink!));
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invite link copied! 🔗')));
    }
  }

  void _leaveRoom() {
    _socket.leaveRoom(widget.code);
    ref.read(roomProvider.notifier).state = null;
    ref.read(playersProvider.notifier).state = [];
    context.go('/home');
  }

  @override
  void dispose() {
    _socket.off('room:joined');
    _socket.off('room:created');
    _socket.off('room:updated');
    _socket.off('host:changed');
    _socket.off('player:joined');
    _socket.off('player:left');
    _socket.off('game:started');
    _socket.off('error');
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final players = ref.watch(playersProvider);
    final room = ref.watch(roomProvider);
    final myId = ref.read(currentUserProvider)?.id;
    final isHost = room?.hostId == myId;
    final allReady = players.length >= 2 && players.where((p) => !p.isHost).every((p) => p.isReady);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF667eea), Color(0xFF764ba2)]),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Game Lobby', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4), decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(8)), child: Text(widget.code, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: 3))),
                              const SizedBox(width: 8),
                              GestureDetector(onTap: _copyInvite, child: Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(6)), child: const Text('🔗 Copy', style: TextStyle(color: Colors.white, fontSize: 12)))),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text('${players.length} / 11 players', style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 13)),
                        ],
                      ),
                    ),
                    TextButton(onPressed: _leaveRoom, style: TextButton.styleFrom(backgroundColor: Colors.white.withOpacity(0.15), foregroundColor: Colors.white), child: const Text('Leave')),
                  ],
                ),
              ),

              // Players list
              Expanded(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                  child: Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(children: [const Text('Players', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)), const Spacer(), Text('${players.length}/11', style: const TextStyle(color: Colors.grey))]),
                      ),
                      Expanded(
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          itemCount: players.length,
                          itemBuilder: (_, i) {
                            final p = players[i];
                            final isMe = p.userId == myId;
                            final isPlayerHost = p.userId == room?.hostId;
                            return Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: isMe ? const Color(0xFFEDE9FE) : Colors.grey.shade50,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: isMe ? const Color(0xFFA78BFA) : Colors.grey.shade200),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(radius: 18, backgroundColor: const Color(0xFF6366F1), child: Text(p.username[0].toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700))),
                                  const SizedBox(width: 10),
                                  Expanded(child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(children: [
                                        Text(p.username, style: const TextStyle(fontWeight: FontWeight.w600)),
                                        if (isMe) const Text(' (You)', style: TextStyle(color: Colors.grey, fontSize: 12)),
                                      ]),
                                      if (isPlayerHost) const Text('👑 Host', style: TextStyle(color: Color(0xFFF59E0B), fontSize: 11, fontWeight: FontWeight.w600)),
                                    ],
                                  )),
                                  if (!isPlayerHost) Text(p.isReady ? '✅ Ready' : '⏳ Waiting', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: p.isReady ? Colors.green : Colors.grey)),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Action buttons
              Padding(
                padding: const EdgeInsets.all(16),
                child: isHost
                    ? SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: (allReady && !_starting) ? _startGame : null,
                          style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: const Color(0xFF6366F1), padding: const EdgeInsets.symmetric(vertical: 16), disabledBackgroundColor: Colors.white.withOpacity(0.5)),
                          child: _starting
                              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                              : Text(
                                  players.length < 2 ? '⏳ Need more players' : !allReady ? '⏳ Waiting for players...' : '🚀 Start Game!',
                                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                                ),
                        ),
                      )
                    : SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _toggleReady,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _isReady ? Colors.red.shade100 : Colors.white,
                            foregroundColor: _isReady ? Colors.red : const Color(0xFF10B981),
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                          child: Text(_isReady ? '✕ Unready' : '✓ Ready', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
