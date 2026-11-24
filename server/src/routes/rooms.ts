import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyFirebaseToken, AuthRequest } from '../middleware/auth';

export function createRoomsRouter(prisma: PrismaClient): Router {
  const router = Router();

  // GET /api/rooms/:code
  router.get('/:code', verifyFirebaseToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { code } = req.params;
      const room = await prisma.room.findUnique({
        where: { code: code.toUpperCase() },
        include: {
          host: { select: { id: true, username: true, email: true } },
          players: {
            include: { user: { select: { id: true, username: true } } },
          },
          game: true,
        },
      });

      if (!room) {
        res.status(404).json({ error: 'Room not found.' });
        return;
      }

      res.json({ room });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch room.' });
    }
  });

  return router;
}
