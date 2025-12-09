import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard {
    constructor(private jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer')) {
            throw new UnauthorizedException('No token provided');
        }

        const token = authHeader.substring(7);

        try {
            const payload = this.jwtService.verify(token);
            req.user = { id: payload.sub, email: payload.email };
            return true;
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired token');   
        }
    }
}