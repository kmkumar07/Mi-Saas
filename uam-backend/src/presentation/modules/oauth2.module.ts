import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OAuth2Controller } from '../controllers/oauth2.controller';
import { AuthorizeUseCase } from '../../application/use-cases/oauth2/authorize.use-case';
import { ExchangeAuthorizationCodeUseCase } from '../../application/use-cases/oauth2/exchange-authorization-code.use-case';
import { IssueTokenUseCase } from '../../application/use-cases/oauth2/issue-token.use-case';
import { GetUserInfoUseCase } from '../../application/use-cases/oauth2/get-user-info.use-case';
import { RegisterClientUseCase } from '../../application/use-cases/oauth2/register-client.use-case';
import { OpenIdDiscoveryService } from '../../application/services/openid-discovery.service';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from './auth.module';

/**
 * OAuth2 Module
 * Provides OAuth2/OIDC authorization server functionality
 */
@Module({
    imports: [
        DatabaseModule,
        AuthModule, // Import AuthModule for JWT and auth guards
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            signOptions: { expiresIn: '15m' },
        }),
    ],
    controllers: [OAuth2Controller],
    providers: [
        AuthorizeUseCase,
        ExchangeAuthorizationCodeUseCase,
        IssueTokenUseCase,
        GetUserInfoUseCase,
        RegisterClientUseCase,
        OpenIdDiscoveryService,
    ],
    exports: [
        AuthorizeUseCase,
        IssueTokenUseCase,
        GetUserInfoUseCase,
        RegisterClientUseCase,
        OpenIdDiscoveryService,
    ],
})
export class OAuth2Module { }

