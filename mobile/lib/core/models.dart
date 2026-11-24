// Core models matching the backend types

class UserModel {
  final String id;
  final String firebaseUid;
  final String email;
  final String username;
  final String? avatar;

  const UserModel({
    required this.id,
    required this.firebaseUid,
    required this.email,
    required this.username,
    this.avatar,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'] as String,
        firebaseUid: json['firebaseUid'] as String,
        email: json['email'] as String,
        username: json['username'] as String,
        avatar: json['avatar'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'firebaseUid': firebaseUid,
        'email': email,
        'username': username,
        'avatar': avatar,
      };
}

class PlayerModel {
  final String userId;
  final String username;
  final bool isReady;
  final bool isHost;
  final bool isConnected;

  const PlayerModel({
    required this.userId,
    required this.username,
    required this.isReady,
    required this.isHost,
    this.isConnected = true,
  });

  factory PlayerModel.fromJson(Map<String, dynamic> json) => PlayerModel(
        userId: json['userId'] as String,
        username: json['username'] as String,
        isReady: json['isReady'] as bool? ?? false,
        isHost: json['isHost'] as bool? ?? false,
        isConnected: json['isConnected'] as bool? ?? true,
      );

  PlayerModel copyWith({bool? isReady, bool? isHost, bool? isConnected}) =>
      PlayerModel(
        userId: userId,
        username: username,
        isReady: isReady ?? this.isReady,
        isHost: isHost ?? this.isHost,
        isConnected: isConnected ?? this.isConnected,
      );
}

class RoomModel {
  final String id;
  final String code;
  final String hostId;
  final String status;
  final int maxPlayers;
  final String? inviteLink;
  final List<PlayerModel> players;

  const RoomModel({
    required this.id,
    required this.code,
    required this.hostId,
    required this.status,
    required this.maxPlayers,
    this.inviteLink,
    required this.players,
  });

  factory RoomModel.fromJson(Map<String, dynamic> json) => RoomModel(
        id: json['id'] as String,
        code: json['code'] as String,
        hostId: json['hostId'] as String,
        status: json['status'] as String,
        maxPlayers: json['maxPlayers'] as int? ?? 11,
        inviteLink: json['inviteLink'] as String?,
        players: (json['players'] as List<dynamic>? ?? [])
            .map((p) => PlayerModel.fromJson(p as Map<String, dynamic>))
            .toList(),
      );
}

class ScoreEntry {
  final String userId;
  final String username;
  final int totalPoints;

  const ScoreEntry({
    required this.userId,
    required this.username,
    required this.totalPoints,
  });

  factory ScoreEntry.fromJson(Map<String, dynamic> json) => ScoreEntry(
        userId: json['userId'] as String,
        username: json['username'] as String,
        totalPoints: json['totalPoints'] as int? ?? 0,
      );
}

class StrokePoint {
  final double x;
  final double y;

  const StrokePoint(this.x, this.y);

  factory StrokePoint.fromJson(Map<String, dynamic> json) =>
      StrokePoint((json['x'] as num).toDouble(), (json['y'] as num).toDouble());

  Map<String, dynamic> toJson() => {'x': x, 'y': y};
}

class StrokeData {
  final String id;
  final List<StrokePoint> points;
  final String color;
  final double brushSize;
  final bool isEraser;
  final int timestamp;

  const StrokeData({
    required this.id,
    required this.points,
    required this.color,
    required this.brushSize,
    required this.isEraser,
    required this.timestamp,
  });

  factory StrokeData.fromJson(Map<String, dynamic> json) => StrokeData(
        id: json['id'] as String,
        points: (json['points'] as List<dynamic>)
            .map((p) => StrokePoint.fromJson(p as Map<String, dynamic>))
            .toList(),
        color: json['color'] as String,
        brushSize: (json['brushSize'] as num).toDouble(),
        isEraser: json['isEraser'] as bool? ?? false,
        timestamp: json['timestamp'] as int,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'points': points.map((p) => p.toJson()).toList(),
        'color': color,
        'brushSize': brushSize,
        'isEraser': isEraser,
        'timestamp': timestamp,
      };
}

class GuessMessage {
  final String userId;
  final String username;
  final String? text;
  final bool isCorrect;
  final int? rank;
  final int? points;
  final DateTime timestamp;

  const GuessMessage({
    required this.userId,
    required this.username,
    this.text,
    required this.isCorrect,
    this.rank,
    this.points,
    required this.timestamp,
  });
}

class GameStats {
  final int gamesPlayed;
  final int gamesWon;
  final int totalPoints;
  final int avgScore;
  final int bestScore;

  const GameStats({
    required this.gamesPlayed,
    required this.gamesWon,
    required this.totalPoints,
    required this.avgScore,
    required this.bestScore,
  });

  factory GameStats.fromJson(Map<String, dynamic> json) => GameStats(
        gamesPlayed: json['gamesPlayed'] as int? ?? 0,
        gamesWon: json['gamesWon'] as int? ?? 0,
        totalPoints: json['totalPoints'] as int? ?? 0,
        avgScore: json['avgScore'] as int? ?? 0,
        bestScore: json['bestScore'] as int? ?? 0,
      );
}
