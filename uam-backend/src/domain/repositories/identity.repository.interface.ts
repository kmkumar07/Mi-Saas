import { Identity } from '../entities/identity.entity';

/**
 * Identity Repository Interface
 * Defines contract for identity persistence operations
 * Follows Interface Segregation Principle and Dependency Inversion Principle
 */
export interface IIdentityRepository {
    findById(id: string): Promise<Identity | null>;
    findByEmail(email: string): Promise<Identity | null>;
    create(identity: Identity): Promise<Identity>;
    update(identity: Identity): Promise<Identity>;
    delete(id: string): Promise<void>;
    existsByEmail(email: string): Promise<boolean>;
}

