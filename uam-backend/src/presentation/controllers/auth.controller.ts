import { Controller, Post, Body, HttpCode, HttpStatus, Headers, Get, Req, Res, UnauthorizedException, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, RefreshTokenDto, RegisterTenantDto } from '../../application/dtos/auth';
import { TokenResponseDto } from '../../application/dtos/auth/token-response.dto';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/auth/logout.use-case';
import { RegisterTenantUseCase } from '../../application/use-cases/auth/register-tenant.use-case';
import { RegisterTenantResponseDto } from '../../application/dtos/auth/register-tenant-response.dto';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserMapper } from '../../application/mappers/user.mapper';
import { UserResponseDto } from '../../application/dtos/users/user-response.dto';

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
        private readonly jwtService: JwtService,
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
    ) { }

    private setAuthCookie(res: Response, accessToken: string): void {
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('uam_access_token', accessToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: isProd,
            path: '/',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });
    }

    private clearAuthCookie(res: Response): void {
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('uam_access_token', '', {
            httpOnly: true,
            sameSite: 'lax',
            secure: isProd,
            path: '/',
            maxAge: 0,
        });
    }

    private extractTokenFromRequest(req: Request): string | null {
        // 1) Try HttpOnly cookie
        const cookieHeader = req.headers['cookie'];
        if (cookieHeader) {
            const cookies = cookieHeader.split(';').map((c) => c.trim());
            const prefix = 'uam_access_token=';
            for (const cookie of cookies) {
                if (cookie.startsWith(prefix)) {
                    return decodeURIComponent(cookie.substring(prefix.length));
                }
            }
        }

        // 2) Fallback to Authorization header
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        if (authHeader && !Array.isArray(authHeader) && authHeader.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
        }

        return null;
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({ status: 200, description: 'Login successful', type: TokenResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<TokenResponseDto> {
        // UPDATED: Login now requires tenantId for organization membership resolution
        // Authentication flow: auth_account → identity → organization_members → JWT with organizationMemberId
        const tokens = await this.loginUseCase.execute(
            loginDto.email,
            loginDto.password,
            loginDto.tenantId,
        );

        this.setAuthCookie(res, tokens.accessToken);
        return tokens;
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Token refreshed successfully', type: TokenResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    async refresh(
        @Body() dto: RefreshTokenDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<TokenResponseDto> {
        const tokens = await this.refreshTokenUseCase.execute(dto.refreshToken);
        this.setAuthCookie(res, tokens.accessToken);
        return tokens;
    }

    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'User logout' })
    @ApiResponse({ status: 204, description: 'Logout successful' })
    async logout(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
        @Headers('authorization') authHeader: string,
    ): Promise<void> {
        const tokenFromReq = this.extractTokenFromRequest(req);
        const token =
            tokenFromReq ||
            (authHeader && authHeader.startsWith('Bearer ')
                ? authHeader.split(' ')[1]
                : null);

        if (token) {
            await this.logoutUseCase.execute(token);
        }

        this.clearAuthCookie(res);
    }

    @Get('me')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current authenticated user from token/cookie' })
    @ApiResponse({ status: 200, description: 'Current user', type: UserResponseDto })
    @ApiResponse({ status: 401, description: 'Not authenticated' })
    async me(@Req() req: Request): Promise<UserResponseDto> {
        const token = this.extractTokenFromRequest(req);

        if (!token) {
            throw new UnauthorizedException('Not authenticated');
        }

        let payload: any;
        try {
            payload = this.jwtService.verify(token);
        } catch {
            throw new UnauthorizedException('Invalid token');
        }

        // UPDATED: JWT sub is now organization_members.id (tenant-scoped), not user.id
        const organizationMemberId = payload?.sub as string | undefined;
        if (!organizationMemberId) {
            throw new UnauthorizedException('Invalid token payload - missing organization member ID');
        }

        // TODO: Update this to use organization member repository instead of user repository
        // For now, keeping user repository for backward compatibility during migration
        // In the new model, we should return organization member info, not user info
        const user = await this.userRepository.findById(organizationMemberId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return UserMapper.toResponseDto(user);
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
