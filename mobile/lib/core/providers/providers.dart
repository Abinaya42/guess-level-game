import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models.dart';
import '../services/api_service.dart';

final apiServiceProvider = Provider<ApiService>((ref) => ApiService());
final firebaseAuthProvider = Provider<FirebaseAuth>((ref) => FirebaseAuth.instance);

// Auth state
final authStateProvider = StreamProvider<User?>((ref) {
  return FirebaseAuth.instance.authStateChanges();
});

// Current DB user (from our backend)
final currentUserProvider = StateProvider<UserModel?>((ref) => null);

// Room state
final roomProvider = StateProvider<RoomModel?>((ref) => null);
final playersProvider = StateProvider<List<PlayerModel>>((ref) => []);

// Game state
final isArtistProvider = StateProvider<bool>((ref) => false);
final currentWordProvider = StateProvider<String?>((ref) => null);
final wordChoicesProvider = StateProvider<List<String>>((ref) => []);
final hintProvider = StateProvider<String>((ref) => '');
final timerProvider = StateProvider<int>((ref) => 60);
final scoresProvider = StateProvider<List<ScoreEntry>>((ref) => []);
final strokesProvider = StateProvider<List<StrokeData>>((ref) => []);
final guessMessagesProvider = StateProvider<List<GuessMessage>>((ref) => []);
final hasGuessedCorrectlyProvider = StateProvider<bool>((ref) => false);

// Round info
final roundIdProvider = StateProvider<String?>((ref) => null);
final roundNumberProvider = StateProvider<int>((ref) => 0);
final totalRoundsProvider = StateProvider<int>((ref) => 11);
final artistIdProvider = StateProvider<String?>((ref) => null);
final artistNameProvider = StateProvider<String?>((ref) => null);
final gamePhaseProvider = StateProvider<GamePhase>((ref) => GamePhase.lobby);

enum GamePhase {
  lobby,
  wordSelection,
  drawing,
  roundEnd,
  gameEnd,
}
