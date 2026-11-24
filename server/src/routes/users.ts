import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyFirebaseToken, AuthRequest } from '../middleware/auth';

export function createUsersRouter(prisma: PrismaClient): Router {
  const router = Router();

  // GET /api/users/:id/stats
  router.get('/:id/stats', verifyFirebaseToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const scores = await prisma.playerScore.findMany({
        where: { userId: id },
        include: { game: true },
      });

      const gamesPlayed = scores.length;
      const totalPoints = scores.reduce((sum, s) => sum + s.totalPoints, 0);
      const avgScore = gamesPlayed > 0 ? Math.round(totalPoints / gamesPlayed) : 0;
      const bestScore = scores.length > 0 ? Math.max(...scores.map(s => s.totalPoints)) : 0;

      // Games won = ranked 1st
      let gamesWon = 0;
      for (const score of scores) {
        const allScores = await prisma.playerScore.findMany({
          where: { gameId: score.gameId },
          orderBy: { totalPoints: 'desc' },
        });
        if (allScores[0]?.userId === id) gamesWon++;
      }

      res.json({ stats: { gamesPlayed, gamesWon, totalPoints, avgScore, bestScore } });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch stats.' });
    }
  });

  // GET /api/users/:id/history
  router.get('/:id/history', verifyFirebaseToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = 10;

      const scores = await prisma.playerScore.findMany({
        where: { userId: id },
        include: {
          game: {
            include: {
              room: true,
              scores: {
                include: { user: { select: { id: true, username: true } } },
                orderBy: { totalPoints: 'desc' },
              },
            },
          },
        },
        orderBy: { game: { startedAt: 'desc' } },
        skip: (page - 1) * limit,
        take: limit,
      });

      const history = scores.map(s => {
        const rank = s.game.scores.findIndex(gs => gs.userId === id) + 1;
        return {
          gameId: s.gameId,
          playedAt: s.game.startedAt,
          endedAt: s.game.endedAt,
          myScore: s.totalPoints,
          rank,
          totalPlayers: s.game.scores.length,
          roomCode: s.game.room.code,
          topScores: s.game.scores.slice(0, 3).map(gs => ({
            username: gs.user.username,
            points: gs.totalPoints,
          })),
        };
      });

      res.json({ history, page, hasMore: scores.length === limit });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch history.' });
    }
  });

  return router;
}
