import { AuthenticationAccount } from '../entities/authentication-account.entity';

/**
 * Authentication Account Repository Interface
 * Defines contract for authentication account persistence operations
 * Follows Interface Segregation Principle and Dependency Inversion Principle
 */
export interface IAuthenticationAccountRepository {
    findById(id: string): Promise<AuthenticationAccount | null>;
    findByIdentityId(identityId: string): Promise<AuthenticationAccount[]>;
    findByEmail(email: string): Promise<AuthenticationAccount | null>;
    findByProviderAndAccountId(provider: string, providerAccountId: string): Promise<AuthenticationAccount | null>;
    findByIdentityIdAndProvider(identityId: string, provider: string): Promise<AuthenticationAccount | null>;
    create(account: AuthenticationAccount): Promise<AuthenticationAccount>;
    update(account: AuthenticationAccount): Promise<AuthenticationAccount>;
    delete(id: string): Promise<void>;
    existsByIdentityIdAndProvider(identityId: string, provider: string): Promise<boolean>;
}

