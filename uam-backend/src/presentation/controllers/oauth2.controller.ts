import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    Headers,
    HttpCode,
    HttpStatus,
    UnauthorizedException,
    BadRequestException,
    Res,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthorizeRequestDto } from '../../application/dtos/oauth2/authorize-request.dto';
import { TokenRequestDto } from '../../application/dtos/oauth2/token-request.dto';
import { OAuth2TokenResponseDto } from '../../application/dtos/oauth2/token-response.dto';
import { UserInfoResponseDto } from '../../application/dtos/oauth2/userinfo-response.dto';
import { RegisterClientRequestDto } from '../../application/dtos/oauth2/register-client-request.dto';
import { RegisterClientResponseDto } from '../../application/dtos/oauth2/register-client-response.dto';
import { AuthorizeUseCase } from '../../application/use-cases/oauth2/authorize.use-case';
import { IssueTokenUseCase } from '../../application/use-cases/oauth2/issue-token.use-case';
import { GetUserInfoUseCase } from '../../application/use-cases/oauth2/get-user-info.use-case';
import { RegisterClientUseCase } from '../../application/use-cases/oauth2/register-client.use-case';
import { OrganizationMemberGuard } from '../guards/organization-member.guard';
import { IOAuthClientRepository } from '../../domain/repositories/oauth-client.repository.interface';
import { IOrganizationAdminRepository } from '../../domain/repositories/organization-admin.repository.interface';
import { OpenIdDiscoveryService } from '../../application/services/openid-discovery.service';
import { Inject } from '@nestjs/common';

/**
 * OAuth2 Controller
 * Implements OAuth2/OIDC authorization server endpoints
 */
@ApiTags('OAuth2')
@Controller('oauth2')
export class OAuth2Controller {
    constructor(
        private readonly authorizeUseCase: AuthorizeUseCase,
        private readonly issueTokenUseCase: IssueTokenUseCase,
        private readonly getUserInfoUseCase: GetUserInfoUseCase,
        private readonly registerClientUseCase: RegisterClientUseCase,
        private readonly jwtService: JwtService,
        @Inject('IOAuthClientRepository')
        private readonly oauthClientRepository: IOAuthClientRepository,
        @Inject('IOrganizationAdminRepository')
        private readonly organizationAdminRepository: IOrganizationAdminRepository,
        private readonly openIdDiscoveryService: OpenIdDiscoveryService,
    ) {}

    private extractTokenFromRequest(req: Request): string | null {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        if (authHeader && !Array.isArray(authHeader) && authHeader.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
        }
        return null;
    }

    private extractBasicAuth(req: Request): { clientId: string; clientSecret: string } | null {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        if (authHeader && !Array.isArray(authHeader) && authHeader.startsWith('Basic ')) {
            const credentials = Buffer.from(authHeader.substring(6), 'base64').toString('utf-8');
            const [clientId, clientSecret] = credentials.split(':');
            return { clientId, clientSecret };
        }
        return null;
    }

    @Get('authorize')
    @ApiOperation({ summary: 'OAuth2 authorization endpoint' })
    @ApiQuery({ name: 'client_id', required: true })
    @ApiQuery({ name: 'redirect_uri', required: true })
    @ApiQuery({ name: 'response_type', required: true })
    @ApiQuery({ name: 'scope', required: false })
    @ApiQuery({ name: 'state', required: false })
    @ApiResponse({ status: 302, description: 'Redirects to client with authorization code' })
    @ApiResponse({ status: 400, description: 'Invalid request' })
    @ApiResponse({ status: 401, description: 'Unauthorized - user must be authenticated' })
    @UseGuards(OrganizationMemberGuard)
    async authorize(
        @Query() query: AuthorizeRequestDto,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<void> {
        // User is authenticated via OrganizationMemberGuard
        const organizationMemberId = (req as any).organizationMemberId;
        const tenantId = (req as any).tenantId;

        const result = await this.authorizeUseCase.execute(query, organizationMemberId, tenantId);

        // Build redirect URI with code
        const redirectUri = new URL(query.redirectUri);
        redirectUri.searchParams.set('code', result.code);
        if (result.state) {
            redirectUri.searchParams.set('state', result.state);
        }

        res.redirect(redirectUri.toString());
    }

    @Post('token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'OAuth2 token endpoint' })
    @ApiBody({ type: TokenRequestDto })
    @ApiResponse({ status: 200, description: 'Token issued successfully', type: OAuth2TokenResponseDto })
    @ApiResponse({ status: 400, description: 'Invalid request' })
    @ApiResponse({ status: 401, description: 'Invalid client credentials' })
    async token(
        @Body() body: TokenRequestDto,
        @Headers('authorization') authHeader: string,
        @Req() req: Request,
    ): Promise<OAuth2TokenResponseDto> {
        // Extract client credentials from Basic Auth or body
        let clientId: string | undefined;
        let clientSecret: string | undefined;

        const basicAuth = this.extractBasicAuth(req);
        if (basicAuth) {
            clientId = basicAuth.clientId;
            clientSecret = basicAuth.clientSecret;
        } else {
            clientId = body.clientId;
            clientSecret = body.clientSecret;
        }

        if (!clientId || !clientSecret) {
            throw new BadRequestException('Client credentials required (Basic Auth or body)');
        }

        // Set client credentials in body for use case
        body.clientId = clientId;
        body.clientSecret = clientSecret;

        // Extract tenant ID from token or header (for client_credentials grant)
        let tenantId: string | undefined;
        if (body.grantType === 'client_credentials') {
            // For client_credentials, we need tenant ID
            // It should be provided in a header or we can get it from the client
            tenantId = req.headers['x-tenant-id'] as string;
            if (!tenantId) {
                throw new BadRequestException('Tenant ID required for client_credentials grant');
            }
        }

        return this.issueTokenUseCase.execute(body, tenantId);
    }

    @Get('userinfo')
    @ApiOperation({ summary: 'OpenID Connect UserInfo endpoint' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'User information', type: UserInfoResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid or expired access token' })
    async userinfo(@Headers('authorization') authHeader: string): Promise<UserInfoResponseDto> {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Bearer token required');
        }

        const accessToken = authHeader.substring(7);
        return this.getUserInfoUseCase.execute(accessToken);
    }

    @Get('.well-known/openid-configuration')
    @ApiOperation({ summary: 'OpenID Connect discovery endpoint' })
    @ApiResponse({ status: 200, description: 'OpenID Connect configuration' })
    async openidConfiguration(@Req() req: Request): Promise<any> {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        return this.openIdDiscoveryService.getDiscoveryDocument(baseUrl);
    }

    @Post('clients')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register new OAuth2 client (requires admin)' })
    @ApiBearerAuth()
    @ApiResponse({ status: 201, description: 'Client registered successfully', type: RegisterClientResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - requires organization admin' })
    @UseGuards(OrganizationMemberGuard)
    async registerClient(
        @Body() body: RegisterClientRequestDto,
        @Req() req: Request,
    ): Promise<RegisterClientResponseDto> {
        const organizationMemberId = (req as any).organizationMemberId;
        const tenantId = (req as any).tenantId;

        // Check if user is organization admin
        const isAdmin = await this.organizationAdminRepository.existsByOrganizationMemberIdAndTenantId(
            organizationMemberId,
            tenantId,
        );
        if (!isAdmin) {
            throw new UnauthorizedException('Organization admin required');
        }

        return this.registerClientUseCase.execute(body, tenantId);
    }

    @Get('clients')
    @ApiOperation({ summary: 'List OAuth2 clients for tenant (requires admin)' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'List of clients' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - requires organization admin' })
    @UseGuards(OrganizationMemberGuard)
    async listClients(@Req() req: Request): Promise<any[]> {
        const organizationMemberId = (req as any).organizationMemberId;
        const tenantId = (req as any).tenantId;

        // Check if user is organization admin
        const isAdmin = await this.organizationAdminRepository.existsByOrganizationMemberIdAndTenantId(
            organizationMemberId,
            tenantId,
        );
        if (!isAdmin) {
            throw new UnauthorizedException('Organization admin required');
        }

        const clients = await this.oauthClientRepository.findByTenantId(tenantId);
        return clients.map(client => ({
            id: client.id,
            clientId: client.clientId,
            name: client.name,
            redirectUris: client.redirectUris,
            scopes: client.scopes,
            grantTypes: client.grantTypes,
            isActive: client.isActive,
            createdAt: client.createdAt,
        }));
    }
}

