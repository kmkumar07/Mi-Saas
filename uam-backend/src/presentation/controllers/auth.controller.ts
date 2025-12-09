import { Controller, Post, Body, HttpCode, HttpStatus, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LoginDto } from '../../application/dtos/auth/login.dto';
import { RefreshTokenDto } from '../../application/dtos/auth/refresh-token.dto';
import { TokenResponseDto } from '../../application/dtos/auth/token-response.dto';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/auth/logout.use-case';

/**
 * Authentication Controller
 * Handles authentication endpoints
 */
@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
    constructor(
        private readonly loginUseCase: LoginUseCase,
        private readonly refreshTokenUseCase: RefreshTokenUseCase,
        private readonly logoutUseCase: LogoutUseCase,
    ) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({ status: 200, description: 'Login successful', type: TokenResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
        // For now, we'll use a hardcoded tenantId. In production, this would come from the request context
        const tenantId = '00000000-0000-0000-0000-000000000001';

        return this.loginUseCase.execute(
            loginDto.email,
            loginDto.password,
            tenantId
        );
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Token refreshed successfully', type: TokenResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    async refresh(@Body() dto: RefreshTokenDto): Promise<TokenResponseDto> {
        return this.refreshTokenUseCase.execute(dto.refreshToken);
    }

    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'User logout' })
    @ApiResponse({ status: 204, description: 'Logout successful' })
    async logout(@Headers('authorization') authHeader: string): Promise<void> {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // In a real app with AuthGuard, this wouldn't be reached or would be handled there
            // For now, we just ignore or throw
            return;
        }

        const token = authHeader.split(' ')[1];
        await this.logoutUseCase.execute(token);
    }
}
