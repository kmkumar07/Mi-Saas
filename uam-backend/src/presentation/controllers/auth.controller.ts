import { Controller, Post, Body, HttpCode, HttpStatus, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LoginDto, RefreshTokenDto, RegisterTenantDto } from '../../application/dtos/auth';
import { TokenResponseDto } from '../../application/dtos/auth/token-response.dto';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/auth/logout.use-case';
import { RegisterTenantUseCase } from '../../application/use-cases/auth/register-tenant.use-case';
import { RegisterTenantResponseDto } from '../../application/dtos/auth/register-tenant-response.dto';

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
        private readonly registerTenantUseCase: RegisterTenantUseCase,
    ) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({ status: 200, description: 'Login successful', type: TokenResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
        // For now, we'll use a hardcoded tenantId. In production, this would come from the request context

        return this.loginUseCase.execute(
            loginDto.email,
            loginDto.password
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

    @Post('register-tenant')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register a new tenant and its admin user' })
    @ApiResponse({
        status: 201,
        description: 'Tenant and admin user created successfully',
        type: RegisterTenantResponseDto,
    })
    async registerTenant(@Body() dto: RegisterTenantDto): Promise<RegisterTenantResponseDto> {
        return this.registerTenantUseCase.execute(dto);
    }
}
