import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:uuid/uuid.dart';
import '../../../core/providers/providers.dart';
import '../../../core/services/socket_service.dart';
import '../../../core/models.dart';

// ─── Drawing Painter ─────────────────────────────────────────────────────────

class _DrawingPainter extends CustomPainter {
  final List<StrokeData> strokes;

  const _DrawingPainter(this.strokes);

  @override
  void paint(Canvas canvas, Size size) {
    // White background
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), Paint()..color = Colors.white);

    for (final stroke in strokes) {
      if (stroke.points.length < 2) continue;
      final paint = Paint()
        ..color = stroke.isEraser ? Colors.white : _parseColor(stroke.color)
        ..strokeWidth = stroke.brushSize
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round
        ..style = PaintingStyle.stroke;

      final path = Path();
      path.moveTo(stroke.points.first.x, stroke.points.first.y);
      for (final pt in stroke.points.skip(1)) {
        path.lineTo(pt.x, pt.y);
      }
      canvas.drawPath(path, paint);
    }
  }

  Color _parseColor(String hex) {
    try {
      final h = hex.replaceFirst('#', '');
      return Color(int.parse('FF$h', radix: 16));
    } catch (_) {
      return Colors.black;
    }
  }

  @override
  bool shouldRepaint(_DrawingPainter oldDelegate) => oldDelegate.strokes != strokes;
}

// ─── Color Palette ─────────────────────────────────────────────────────────

const _kColors = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4',
  '#84cc16', '#f59e0b', '#6b7280', '#a78bfa', '#34d399',
];

// ─── Game Screen ─────────────────────────────────────────────────────────────

class GameScreen extends ConsumerStatefulWidget {
  final String code;
  const GameScreen({super.key, required this.code});

  @override
  ConsumerState<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends ConsumerState<GameScreen> {
  final _socket = SocketService();
  final _guessCtrl = TextEditingController();
  final _uuid = const Uuid();
  final _scrollCtrl = ScrollController();

  // Drawing state
  String _selectedColor = '#000000';
  double _brushSize = 4;
  bool _isEraser = false;
  List<StrokeData> _localStrokes = [];
  List<StrokeData> _undoneStrokes = [];
  List<StrokePoint> _currentPoints = [];
  bool _isDrawing = false;

  // Game state
  GamePhase _phase = GamePhase.drawing;
  dynamic _roundEndData;
  dynamic _gameEndData;

  @override
  void initState() {
    super.initState();
    _connectAndSubscribe();
  }

  Future<void> _connectAndSubscribe() async {
    final fbUser = FirebaseAuth.instance.currentUser;
    if (fbUser == null) { context.go('/login'); return; }
    final token = await fbUser.getIdToken();
    _socket.connect(token!);

    // Restore state after reconnect
    _socket.requestState(widget.code);

    _socket.on('state:restored', (data) {
      if (!mounted) return;
      final map = data as Map<String, dynamic>;
      final round = map['round'] as Map<String, dynamic>?;
      if (round != null) {
        final myId = ref.read(currentUserProvider)?.id;
        ref.read(artistIdProvider.notifier).state = round['artistId'] as String?;
        ref.read(isArtistProvider.notifier).state = round['artistId'] == myId;
        ref.read(hintProvider.notifier).state = round['hint'] as String? ?? '';
        ref.read(timerProvider.notifier).state = round['timeLeft'] as int? ?? 60;
        ref.read(roundIdProvider.notifier).state = round['id'] as String?;
        ref.read(roundNumberProvider.notifier).state = round['roundNumber'] as int? ?? 1;
        final strokes = (round['strokes'] as List<dynamic>? ?? [])
            .map((s) => StrokeData.fromJson(s as Map<String, dynamic>))
            .toList();
        setState(() => _localStrokes = strokes);
        ref.read(strokesProvider.notifier).state = strokes;

        final status = round['status'] as String? ?? '';
        if (status == 'WORD_SELECTION' && round['artistId'] == myId) {
          final choices = (round['wordChoices'] as List<dynamic>? ?? []).cast<String>();
          ref.read(wordChoicesProvider.notifier).state = choices;
          setState(() => _phase = GamePhase.wordSelection);
        } else if (status == 'IN_PROGRESS') {
          if (round['word'] != null) ref.read(currentWordProvider.notifier).state = round['word'] as String?;
          setState(() => _phase = GamePhase.drawing);
        }
      }
      final game = map['game'] as Map<String, dynamic>?;
      if (game != null) {
        ref.read(totalRoundsProvider.notifier).state = game['totalRounds'] as int? ?? 11;
        ref.read(scoresProvider.notifier).state = (game['scores'] as List<dynamic>? ?? [])
            .map((s) => ScoreEntry.fromJson(s as Map<String, dynamic>))
            .toList();
      }
    });

    _socket.on('round:started', (data) {
      if (!mounted) return;
      final map = data as Map<String, dynamic>;
      final myId = ref.read(currentUserProvider)?.id;
      final artistId = map['artistId'] as String;
      ref.read(roundIdProvider.notifier).state = map['roundId'] as String;
      ref.read(roundNumberProvider.notifier).state = map['roundNumber'] as int;
      ref.read(totalRoundsProvider.notifier).state = map['totalRounds'] as int;
      ref.read(artistIdProvider.notifier).state = artistId;
      ref.read(artistNameProvider.notifier).state = map['artistName'] as String?;
      ref.read(isArtistProvider.notifier).state = artistId == myId;
      ref.read(hintProvider.notifier).state = '';
      ref.read(timerProvider.notifier).state = 60;
      ref.read(hasGuessedCorrectlyProvider.notifier).state = false;
      ref.read(guessMessagesProvider.notifier).state = [];
      if (map['scores'] != null) {
        ref.read(scoresProvider.notifier).state = (map['scores'] as List<dynamic>)
            .map((s) => ScoreEntry.fromJson(s as Map<String, dynamic>)).toList();
      }
      setState(() { _localStrokes = []; _undoneStrokes = []; _phase = GamePhase.drawing; _roundEndData = null; });
    });

    _socket.on('round:word-choices', (data) {
      if (!mounted) return;
      final map = data as Map<String, dynamic>;
      ref.read(wordChoicesProvider.notifier).state = (map['words'] as List<dynamic>).cast<String>();
      setState(() => _phase = GamePhase.wordSelection);
    });

    _socket.on('round:drawing-start', (data) {
      if (!mounted) return;
      final map = data as Map<String, dynamic>;
      ref.read(hintProvider.notifier).state = map['hint'] as String? ?? '';
      ref.read(timerProvider.notifier).state = map['timeLeft'] as int? ?? 60;
      setState(() => _phase = GamePhase.drawing);
    });

    _socket.on('round:word', (data) {
      if (!mounted) return;
      ref.read(currentWordProvider.notifier).state = (data as Map<String, dynamic>)['word'] as String?;
    });

    _socket.on('round:timer', (data) {
      if (!mounted) return;
      ref.read(timerProvider.notifier).state = (data as Map<String, dynamic>)['timeLeft'] as int? ?? 0;
    });

    _socket.on('round:hint', (data) {
      if (!mounted) return;
      final map = data as Map<String, dynamic>;
      ref.read(hintProvider.notifier).state = map['hint'] as String? ?? '';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('💡 Hint: ${map['hint']}'), duration: const Duration(seconds: 3)));
    });

    _socket.on('round:end', (data) {
      if (!mounted) return;
      final map = data as Map<String, dynamic>;
      if (map['scores'] != null) {
        ref.read(scoresProvider.notifier).state = (map['scores'] as List<dynamic>)
            .map((s) => ScoreEntry.fromJson(s as Map<String, dynamic>)).toList();
      }
      setState(() { _roundEndData = map; _phase = GamePhase.roundEnd; });
      Future.delayed(const Duration(seconds: 5), () {
        if (mounted && _phase == GamePhase.roundEnd && map['nextRound'] != null) {
          setState(() { _phase = GamePhase.drawing; _roundEndData = null; });
        }
      });
    });

    _socket.on('game:end', (data) {
      if (!mounted) return;
      setState(() { _gameEndData = data; _phase = GamePhase.gameEnd; });
    });

    _socket.on('draw:stroke', (data) {
      if (!mounted) return;
      final map = data as Map<String, dynamic>;
      if (!ref.read(isArtistProvider)) {
        final stroke = StrokeData.fromJson(map['stroke'] as Map<String, dynamic>);
        setState(() => _localStrokes = [..._localStrokes, stroke]);
      }
    });

    _socket.on('draw:undo', (data) {
      if (!mounted) return;
      final map = data as Map<String, dynamic>;
      final strokes = (map['strokes'] as List<dynamic>)
          .map((s) => StrokeData.fromJson(s as Map<String, dynamic>)).toList();
      setState(() => _localStrokes = strokes);
    });

    _socket.on('draw:redo', (data) {
      if (!mounted) return;
      final map = data as Map<String, dynamic>;
      final strokes = (map['strokes'] as List<dynamic>)
          .map((s) => StrokeData.fromJson(s as Map<String, dynamic>)).toList();
      setState(() => _localStrokes = strokes);
    });

    _socket.on('draw:clear', (_) {
      if (!mounted) return;
      setState(() { _localStrokes = []; _undoneStrokes = []; });
    });

    _socket.on('guess:result', (data) {
      if (!mounted) return;
      final map = data as Map<String, dynamic>;
      final msg = GuessMessage(
        userId: map['userId'] as String,
        username: map['username'] as String,
        text: map['text'] as String?,
        isCorrect: map['isCorrect'] as bool,
        rank: map['rank'] as int?,
        points: map['points'] as int?,
        timestamp: DateTime.now(),
      );
      ref.read(guessMessagesProvider.notifier).update((s) => [...s, msg]);
      Future.delayed(const Duration(milliseconds: 100), () {
        if (_scrollCtrl.hasClients) _scrollCtrl.animateTo(_scrollCtrl.position.maxScrollExtent, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
      });
    });

    _socket.on('guess:correct', (data) {
      if (!mounted) return;
      final map = data as Map<String, dynamic>;
      ref.read(hasGuessedCorrectlyProvider.notifier).state = true;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('🎉 Correct! +${map['points']} points!'), backgroundColor: Colors.green, duration: const Duration(seconds: 4)));
    });

    _socket.on('error', (data) {
      if (!mounted) return;
      final msg = (data as Map<String, dynamic>)['message'] as String? ?? 'Error';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
    });
  }

  // ── Drawing Handlers ────────────────────────────────────────────────────────

  void _onPanStart(DragStartDetails d, BoxConstraints constraints) {
    if (!ref.read(isArtistProvider)) return;
    _isDrawing = true;
    _currentPoints = [_toStrokePoint(d.localPosition, constraints)];
  }

  void _onPanUpdate(DragUpdateDetails d, BoxConstraints constraints) {
    if (!_isDrawing || !ref.read(isArtistProvider)) return;
    setState(() => _currentPoints = [..._currentPoints, _toStrokePoint(d.localPosition, constraints)]);
  }

  void _onPanEnd(DragEndDetails _) {
    if (!_isDrawing || !ref.read(isArtistProvider) || _currentPoints.length < 2) {
      _isDrawing = false;
      _currentPoints = [];
      return;
    }
    _isDrawing = false;
    final stroke = StrokeData(
      id: _uuid.v4(),
      points: List.from(_currentPoints),
      color: _selectedColor,
      brushSize: _isEraser ? _brushSize * 3 : _brushSize,
      isEraser: _isEraser,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );
    setState(() {
      _localStrokes = [..._localStrokes, stroke];
      _undoneStrokes = [];
      _currentPoints = [];
    });
    final roundId = ref.read(roundIdProvider);
    if (roundId != null) _socket.drawStroke(roundId, stroke);
  }

  StrokePoint _toStrokePoint(Offset pos, BoxConstraints constraints) =>
      StrokePoint(pos.dx.clamp(0, constraints.maxWidth), pos.dy.clamp(0, constraints.maxHeight));

  void _undo() {
    if (_localStrokes.isEmpty) return;
    final last = _localStrokes.last;
    setState(() {
      _localStrokes = _localStrokes.sublist(0, _localStrokes.length - 1);
      _undoneStrokes = [..._undoneStrokes, last];
    });
    final roundId = ref.read(roundIdProvider);
    if (roundId != null) _socket.undoStroke(roundId);
  }

  void _redo() {
    if (_undoneStrokes.isEmpty) return;
    final last = _undoneStrokes.last;
    setState(() {
      _undoneStrokes = _undoneStrokes.sublist(0, _undoneStrokes.length - 1);
      _localStrokes = [..._localStrokes, last];
    });
    final roundId = ref.read(roundIdProvider);
    if (roundId != null) _socket.redoStroke(roundId);
  }

  void _clear() {
    setState(() { _localStrokes = []; _undoneStrokes = []; });
    final roundId = ref.read(roundIdProvider);
    if (roundId != null) _socket.clearCanvas(roundId);
  }

  void _submitGuess() {
    final text = _guessCtrl.text.trim();
    if (text.isEmpty) return;
    final roundId = ref.read(roundIdProvider);
    if (roundId != null) _socket.submitGuess(roundId, text);
    _guessCtrl.clear();
  }

  @override
  void dispose() {
    _guessCtrl.dispose();
    _scrollCtrl.dispose();
    for (final e in ['state:restored','round:started','round:word-choices','round:drawing-start',
        'round:word','round:timer','round:hint','round:end','game:end','draw:stroke',
        'draw:undo','draw:redo','draw:clear','guess:result','guess:correct','error']) {
      _socket.off(e);
    }
    super.dispose();
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final phase = _phase;

    if (phase == GamePhase.wordSelection) return _buildWordSelection();
    if (phase == GamePhase.roundEnd) return _buildRoundEnd();
    if (phase == GamePhase.gameEnd) return _buildGameEnd();
    return _buildGameplay();
  }

  // ── Word Selection ──────────────────────────────────────────────────────────

  Widget _buildWordSelection() {
    final isArtist = ref.watch(isArtistProvider);
    final choices = ref.watch(wordChoicesProvider);
    final roundId = ref.watch(roundIdProvider);

    if (!isArtist) {
      final artistName = ref.watch(artistNameProvider);
      return Scaffold(
        body: Container(
          color: const Color(0xFF1E293B),
          child: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            const Text('⏳', style: TextStyle(fontSize: 64)),
            const SizedBox(height: 16),
            Text('${artistName ?? 'Artist'} is choosing a word...', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            const Text('Get ready to guess!', style: TextStyle(color: Colors.white54)),
          ])),
        ),
      );
    }

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF667eea), Color(0xFF764ba2)])),
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('🎨', style: TextStyle(fontSize: 64)),
                  const SizedBox(height: 16),
                  const Text('Choose a Word to Draw!', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800)),
                  const Text('Round ${1} — You are the Artist', style: TextStyle(color: Colors.white70)),
                  const SizedBox(height: 32),
                  ...choices.map((word) => Container(
                    width: double.infinity,
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ElevatedButton(
                      onPressed: () {
                        if (roundId != null) _socket.selectWord(roundId, word);
                        setState(() => _phase = GamePhase.drawing);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: const Color(0xFF6366F1),
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(word, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                    ),
                  )),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ── Round End ───────────────────────────────────────────────────────────────

  Widget _buildRoundEnd() {
    final data = _roundEndData as Map<String, dynamic>?;
    final scores = ref.watch(scoresProvider);
    return Scaffold(
      body: Container(
        color: const Color(0xFF1E293B),
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('⏱️ Round Over!', style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 12),
                  if (data != null) Text('The word was: ${data['word']}', style: const TextStyle(color: Color(0xFF10B981), fontSize: 22, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.1), borderRadius: BorderRadius.circular(14)),
                    child: Column(
                      children: [
                        const Text('Scores', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15)),
                        const SizedBox(height: 10),
                        ...scores.take(5).map((s) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(children: [
                            Expanded(child: Text(s.username, style: const TextStyle(color: Colors.white70))),
                            Text('${s.totalPoints} pts', style: const TextStyle(color: Color(0xFF6366F1), fontWeight: FontWeight.w700)),
                          ]),
                        )),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text('Next round starting soon...', style: TextStyle(color: Colors.white54)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ── Game End ────────────────────────────────────────────────────────────────

  Widget _buildGameEnd() {
    final data = _gameEndData as Map<String, dynamic>?;
    final scores = (data?['scores'] as List<dynamic>? ?? [])
        .map((s) => ScoreEntry.fromJson(s as Map<String, dynamic>)).toList();
    final winner = data?['winner'] as Map<String, dynamic>?;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFFF093FB), Color(0xFFF5576C)])),
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('🏆', style: TextStyle(fontSize: 80)),
                  const Text('Game Over!', style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 8),
                  if (winner != null) Text('🎉 ${winner['username']} wins!', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 24),
                  Container(
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: scores.asMap().entries.map((e) {
                        final i = e.key;
                        final s = e.value;
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 6),
                          child: Row(children: [
                            Text(i == 0 ? '🥇' : i == 1 ? '🥈' : i == 2 ? '🥉' : '  ${i + 1}.', style: const TextStyle(fontSize: 16)),
                            const SizedBox(width: 8),
                            Expanded(child: Text(s.username, style: const TextStyle(fontWeight: FontWeight.w600))),
                            Text('${s.totalPoints} pts', style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF6366F1))),
                          ]),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        ref.read(roomProvider.notifier).state = null;
                        ref.read(playersProvider.notifier).state = [];
                        context.go('/home');
                      },
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: const Color(0xFF6366F1), padding: const EdgeInsets.symmetric(vertical: 14)),
                      child: const Text('🏠 Back to Home', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ── Main Gameplay ───────────────────────────────────────────────────────────

  Widget _buildGameplay() {
    final isArtist = ref.watch(isArtistProvider);
    final hint = ref.watch(hintProvider);
    final timeLeft = ref.watch(timerProvider);
    final word = ref.watch(currentWordProvider);
    final roundNum = ref.watch(roundNumberProvider);
    final totalRounds = ref.watch(totalRoundsProvider);
    final scores = ref.watch(scoresProvider);
    final guesses = ref.watch(guessMessagesProvider);
    final hasGuessed = ref.watch(hasGuessedCorrectlyProvider);
    final artistName = ref.watch(artistNameProvider);
    final myId = ref.read(currentUserProvider)?.id;

    final timerColor = timeLeft <= 10 ? Colors.red : timeLeft <= 20 ? Colors.orange : Colors.green;

    return Scaffold(
      backgroundColor: const Color(0xFF1E293B),
      body: SafeArea(
        child: Column(
          children: [
            // Top bar
            Container(
              color: const Color(0xFF0F172A),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  Text('Round $roundNum/$totalRounds', style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600)),
                  const Spacer(),
                  // Timer
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(color: timerColor.withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                    child: Text('$timeLeft', style: TextStyle(color: timerColor, fontSize: 24, fontWeight: FontWeight.w900)),
                  ),
                  const Spacer(),
                  // Word/hint
                  Flexible(
                    child: Text(
                      isArtist ? (word ?? '...') : (hint.isEmpty ? '...' : hint),
                      style: TextStyle(color: isArtist ? const Color(0xFFFBBF24) : Colors.white, fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: isArtist ? 1 : 4),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),

            // Drawing canvas
            Expanded(
              flex: 3,
              child: LayoutBuilder(builder: (ctx, constraints) {
                // Build current-stroke overlay
                List<StrokeData> allStrokes = _localStrokes;
                if (_currentPoints.length >= 2) {
                  allStrokes = [..._localStrokes, StrokeData(id: 'current', points: _currentPoints, color: _selectedColor, brushSize: _isEraser ? _brushSize * 3 : _brushSize, isEraser: _isEraser, timestamp: 0)];
                }

                return GestureDetector(
                  onPanStart: (d) => _onPanStart(d, constraints),
                  onPanUpdate: (d) => _onPanUpdate(d, constraints),
                  onPanEnd: _onPanEnd,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: CustomPaint(
                      painter: _DrawingPainter(allStrokes),
                      child: Container(color: Colors.transparent),
                    ),
                  ),
                );
              }),
            ),

            // Artist toolbar
            if (isArtist) Container(
              color: const Color(0xFF0F172A),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              child: Column(
                children: [
                  // Colors
                  SizedBox(
                    height: 32,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: _kColors.map((c) {
                        final hex = c.replaceFirst('#', '');
                        final col = Color(int.parse('FF$hex', radix: 16));
                        return GestureDetector(
                          onTap: () => setState(() { _selectedColor = c; _isEraser = false; }),
                          child: Container(
                            width: 28, height: 28,
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            decoration: BoxDecoration(
                              color: col,
                              shape: BoxShape.circle,
                              border: Border.all(color: _selectedColor == c && !_isEraser ? Colors.white : Colors.grey.shade600, width: _selectedColor == c && !_isEraser ? 3 : 1),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 6),
                  // Tools row
                  Row(
                    children: [
                      const Icon(Icons.brush, color: Colors.white54, size: 16),
                      Expanded(child: Slider(value: _brushSize, min: 1, max: 30, onChanged: (v) => setState(() => _brushSize = v), activeColor: const Color(0xFF6366F1))),
                      Text('${_brushSize.round()}', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                      const SizedBox(width: 8),
                      _toolBtn(Icons.auto_fix_normal, 'Erase', _isEraser, () => setState(() => _isEraser = !_isEraser)),
                      _toolBtn(Icons.undo, 'Undo', false, _undo),
                      _toolBtn(Icons.redo, 'Redo', false, _redo),
                      _toolBtn(Icons.delete_outline, 'Clear', false, _clear),
                    ],
                  ),
                ],
              ),
            ),

            // Scores + Chat
            Expanded(
              flex: 2,
              child: Row(
                children: [
                  // Scores
                  Container(
                    width: 110,
                    color: const Color(0xFF0F172A),
                    padding: const EdgeInsets.all(8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('SCORES', style: TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 6),
                        Expanded(
                          child: ListView.builder(
                            itemCount: scores.length,
                            itemBuilder: (_, i) {
                              final s = scores[i];
                              return Padding(
                                padding: const EdgeInsets.symmetric(vertical: 2),
                                child: Row(children: [
                                  Expanded(child: Text(s.username, style: TextStyle(color: s.userId == myId ? const Color(0xFFA78BFA) : Colors.white70, fontSize: 11), overflow: TextOverflow.ellipsis)),
                                  Text('${s.totalPoints}', style: const TextStyle(color: Color(0xFF6366F1), fontSize: 11, fontWeight: FontWeight.w700)),
                                ]),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Chat
                  Expanded(
                    child: Container(
                      color: const Color(0xFF1E293B),
                      child: Column(
                        children: [
                          Expanded(
                            child: ListView.builder(
                              controller: _scrollCtrl,
                              padding: const EdgeInsets.all(8),
                              itemCount: guesses.length,
                              itemBuilder: (_, i) {
                                final msg = guesses[i];
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 4),
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: msg.isCorrect ? const Color(0xFF065F46) : const Color(0xFF1E293B),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: RichText(
                                    text: TextSpan(
                                      children: [
                                        TextSpan(text: '${msg.username}: ', style: TextStyle(color: msg.isCorrect ? const Color(0xFF34D399) : Colors.white54, fontWeight: FontWeight.w600, fontSize: 12)),
                                        TextSpan(text: msg.isCorrect ? '✅ Correct! (+${msg.points} pts)' : (msg.text ?? ''), style: TextStyle(color: msg.isCorrect ? const Color(0xFFD1FAE5) : Colors.white, fontSize: 12)),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                          if (!isArtist && !hasGuessed)
                            Padding(
                              padding: const EdgeInsets.all(6),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: TextField(
                                      controller: _guessCtrl,
                                      style: const TextStyle(color: Colors.white, fontSize: 13),
                                      decoration: InputDecoration(
                                        hintText: 'Your guess...',
                                        hintStyle: const TextStyle(color: Colors.white38),
                                        filled: true,
                                        fillColor: const Color(0xFF0F172A),
                                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                        isDense: true,
                                      ),
                                      onSubmitted: (_) => _submitGuess(),
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  IconButton(onPressed: _submitGuess, icon: const Icon(Icons.send, color: Color(0xFF6366F1)), padding: EdgeInsets.zero, constraints: const BoxConstraints()),
                                ],
                              ),
                            ),
                          if (hasGuessed && !isArtist)
                            Container(padding: const EdgeInsets.all(10), color: const Color(0xFF065F46), child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.check_circle, color: Color(0xFF34D399), size: 16), SizedBox(width: 6), Text('🎉 You guessed it!', style: TextStyle(color: Color(0xFF34D399), fontWeight: FontWeight.w700))])),
                          if (isArtist)
                            Container(padding: const EdgeInsets.all(8), color: const Color(0xFF1E3A5F), child: const Center(child: Text('You are the artist — keep drawing!', style: TextStyle(color: Color(0xFF93C5FD), fontSize: 12)))),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _toolBtn(IconData icon, String label, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 3),
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(color: active ? const Color(0xFF6366F1) : Colors.white.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
        child: Icon(icon, color: Colors.white, size: 18),
      ),
    );
  }
}
