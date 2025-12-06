import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
    user?: { id: string; role?: string };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        // Handle both 'id' and '_id' formats for backwards compatibility
        req.user = {
            id: decoded.id || decoded._id,
            role: decoded.role
        };
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};