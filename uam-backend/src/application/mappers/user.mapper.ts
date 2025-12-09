import { User } from '../../domain/entities/user.entity';
import { UserResponseDto } from '../dtos/users/user-response.dto';

/**
 * User Mapper
 * Maps User entity to UserResponseDto
 * Follows Single Responsibility Principle
 */
export class UserMapper {
    /**
     * Map User entity to UserResponseDto
     * Excludes sensitive fields like password hash
     */
    static toResponseDto(user: User): UserResponseDto {
        const dto = new UserResponseDto();
        dto.id = user.id;
        dto.tenantId = user.tenantId;
        dto.email = user.email;
        dto.firstName = user.firstName;
        dto.lastName = user.lastName;
        dto.fullName = user.fullName;
        dto.isActive = user.isActive;
        dto.isEmailVerified = user.isEmailVerified;
        dto.authProvider = user.authProvider;
        dto.accountType = user.accountType;
        dto.isCompanyOwner = user.isCompanyOwner;
        dto.emailDomain = user.emailDomain;
        dto.lastLoginAt = user.lastLoginAt;
        dto.createdAt = user.createdAt;
        dto.updatedAt = user.updatedAt;
        return dto;
    }

    /**
     * Map array of User entities to UserResponseDto array
     */
    static toResponseDtoArray(users: User[]): UserResponseDto[] {
        return users.map(user => this.toResponseDto(user));
    }
}
