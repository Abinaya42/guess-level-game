import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class JoinRoomScreen extends StatefulWidget {
  const JoinRoomScreen({super.key});
  @override
  State<JoinRoomScreen> createState() => _JoinRoomScreenState();
}

class _JoinRoomScreenState extends State<JoinRoomScreen> {
  final _ctrl = TextEditingController();
  String? _error;

  void _join() {
    final code = _ctrl.text.trim().toUpperCase();
    if (code.length != 6) {
      setState(() => _error = 'Room code must be exactly 6 characters.');
      return;
    }
    setState(() => _error = null);
    context.push('/lobby/$code');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF667eea), Color(0xFF764ba2)]),
        ),
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                elevation: 20,
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('🔗', style: TextStyle(fontSize: 64)),
                      const Text('Join a Room', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 8),
                      const Text('Enter the 6-character room code', style: TextStyle(color: Colors.grey)),
                      const SizedBox(height: 28),
                      TextField(
                        controller: _ctrl,
                        textCapitalization: TextCapitalization.characters,
                        maxLength: 6,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: 8),
                        decoration: InputDecoration(
                          hintText: 'XXXXXX',
                          counterText: '',
                          errorText: _error,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(width: 2)),
                          contentPadding: const EdgeInsets.symmetric(vertical: 18),
                        ),
                        onChanged: (_) => setState(() => _error = null),
                        onSubmitted: (_) => _join(),
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _join,
                          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16)),
                          child: const Text('Join Game →', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                        ),
                      ),
                      const SizedBox(height: 10),
                      TextButton(onPressed: () => context.go('/home'), child: const Text('← Back')),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
