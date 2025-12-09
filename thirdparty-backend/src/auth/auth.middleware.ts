import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    token?: string;
  }
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const [, token] = authHeader.split(' ');
      req.token = token;
    }

    next();
  }
}


