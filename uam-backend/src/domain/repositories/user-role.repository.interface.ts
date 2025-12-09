import { UserRole } from '../entities/user-role.entity';

export interface IUserRoleRepository {
    findById(id: string): Promise<UserRole | null>;
    findByUserId(userId: string): Promise<UserRole[]>;
    findByUserIdAndRoleId(userId: string, roleId: string): Promise<UserRole | null>;
    create(userRole: UserRole): Promise<UserRole>;
    bulkCreate(userRoles: UserRole[]): Promise<UserRole[]>;
    delete(id: string): Promise<void>;
    deleteByUserIdAndRoleId(userId: string, roleId: string): Promise<void>;
}
