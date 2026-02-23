import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: 'admin' | 'member';
    organizationId?: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);

    // Fetch User Profile from Firestore
    // This allows us to get the role and organizationId
    const userSnapshot = await import('../config/firebase').then(m => m.db.collection('users').doc(decodedToken.uid).get());
    
    if (!userSnapshot.exists) {
        // Fallback for initial signup/setup or if user doc missing
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
        };
    } else {
        const userData = userSnapshot.data();
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: userData?.role,
            organizationId: userData?.organizationId
        };
    }

    next();
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
