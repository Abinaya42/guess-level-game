import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        throw UnsupportedError('iOS is not configured.');
      default:
        throw UnsupportedError('Unsupported platform.');
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyDLZWqD9EWImOdzrBuzShe8nMs-s-2SPSc',
    appId: '1:998947238735:web:5af193331b5ec9092c4b3a',
    messagingSenderId: '998947238735',
    projectId: 'guess-level-multiplayer-game',
    authDomain: 'guess-level-multiplayer-game.firebaseapp.com',
    storageBucket: 'guess-level-multiplayer-game.firebasestorage.app',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDLZWqD9EWImOdzrBuzShe8nMs-s-2SPSc',
    appId: '1:998947238735:web:5af193331b5ec9092c4b3a',
    messagingSenderId: '998947238735',
    projectId: 'guess-level-multiplayer-game',
    storageBucket: 'guess-level-multiplayer-game.firebasestorage.app',
  );
}
