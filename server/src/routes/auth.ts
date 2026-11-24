import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import admin from 'firebase-admin';
import { verifyFirebaseToken, AuthRequest } from '../middleware/auth';

export function createAuthRouter(prisma: PrismaClient): Router {
  const router = Router();

  // POST /api/auth/verify — verify Firebase token and upsert user
  router.post('/verify', verifyFirebaseToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { uid, email } = req.user!;
      const { username } = req.body;

      // Get Firebase user for display name
      const firebaseUser = await admin.auth().getUser(uid);
      const resolvedUsername = username || firebaseUser.displayName || email?.split('@')[0] || 'Player';

      const user = await prisma.user.upsert({
        where: { firebaseUid: uid },
        create: {
          firebaseUid: uid,
          email: email || firebaseUser.email || '',
          username: resolvedUsername,
        },
        update: {
          email: email || firebaseUser.email || '',
        },
      });

      res.json({ user });
    } catch (error: any) {
      console.error('Auth verify error:', error);
      res.status(500).json({ error: 'Failed to authenticate user.' });
    }
  });

  // POST /api/auth/update-profile
  router.post('/update-profile', verifyFirebaseToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { uid } = req.user!;
      const { username } = req.body;

      if (!username || username.length < 3 || username.length > 20) {
        res.status(400).json({ error: 'Username must be between 3 and 20 characters.' });
        return;
      }

      const user = await prisma.user.update({
        where: { firebaseUid: uid },
        data: { username },
      });

      res.json({ user });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to update profile.' });
    }
  });

  return router;
}
