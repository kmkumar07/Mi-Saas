import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { Password } from '../../../domain/value-objects/password.value-object';
import { TokenResponseDto } from '../../dtos/auth/token-response.dto';
import { JwtService } from '@nestjs/jwt';

/**
 * Login Use Case
 * Handles user authentication and token generation
 */
@Injectable()
export class LoginUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
        private readonly jwtService: JwtService,
    ) { }

    async execute(email: string, password: string): Promise<TokenResponseDto> {
        // Find user by email and tenant
        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password
        const passwordObj = Password.fromHash(user.passwordHash);
        const isValid = await passwordObj.compare(password);

        if (!isValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if user is active
        if (!user.isActive) {
            throw new UnauthorizedException('Account is inactive');
        }

        // Generate tokens
        const payload = {
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId
        };

        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

        // Update last login
        user.recordLogin();
        await this.userRepository.update(user);

        return new TokenResponseDto(accessToken, refreshToken, 900); // 15 minutes
    }
}
