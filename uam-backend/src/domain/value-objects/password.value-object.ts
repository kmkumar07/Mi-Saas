import * as bcrypt from 'bcrypt';

/**
 * Password Value Object
 * Handles password validation, hashing, and comparison
 * Follows Value Object pattern with security best practices
 */
export class Password {
    private static readonly SALT_ROUNDS = 12;
    private static readonly MIN_LENGTH = 8;
    private static readonly MAX_LENGTH = 128;

    private constructor(private readonly hashedValue: string) { }

    /**
     * Create Password from plain text with validation and hashing
     * @throws Error if password doesn't meet requirements
     */
    static async createFromPlainText(plainPassword: string): Promise<Password> {
        this.validate(plainPassword);
        const hashed = await bcrypt.hash(plainPassword, this.SALT_ROUNDS);
        return new Password(hashed);
    }

    /**
     * Create Password from already hashed value (for reconstitution from DB)
     */
    static fromHash(hashedPassword: string): Password {
        if (!hashedPassword) {
            throw new Error('Hashed password is required');
        }
        return new Password(hashedPassword);
    }

    /**
     * Validate password requirements
     * - Minimum 8 characters
     * - Maximum 128 characters
     * - At least one uppercase letter
     * - At least one lowercase letter
     * - At least one number
     * - At least one special character
     */
    private static validate(plainPassword: string): void {
        if (!plainPassword) {
            throw new Error('Password is required');
        }

        if (plainPassword.length < this.MIN_LENGTH) {
            throw new Error(`Password must be at least ${this.MIN_LENGTH} characters long`);
        }

        if (plainPassword.length > this.MAX_LENGTH) {
            throw new Error(`Password must not exceed ${this.MAX_LENGTH} characters`);
        }

        const hasUpperCase = /[A-Z]/.test(plainPassword);
        const hasLowerCase = /[a-z]/.test(plainPassword);
        const hasNumber = /[0-9]/.test(plainPassword);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(plainPassword);

        if (!hasUpperCase) {
            throw new Error('Password must contain at least one uppercase letter');
        }

        if (!hasLowerCase) {
            throw new Error('Password must contain at least one lowercase letter');
        }

        if (!hasNumber) {
            throw new Error('Password must contain at least one number');
        }

        if (!hasSpecialChar) {
            throw new Error('Password must contain at least one special character');
        }
    }

    /**
     * Compare plain text password with hashed password
     */
    async compare(plainPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, this.hashedValue);
    }

    /**
     * Get hashed password value for persistence
     */
    getHashedValue(): string {
        return this.hashedValue;
    }

    /**
     * Check if password needs rehashing (e.g., if salt rounds changed)
     */
    async needsRehash(): Promise<boolean> {
        const currentRounds = await this.getRounds();
        return currentRounds < Password.SALT_ROUNDS;
    }

    /**
     * Get the number of salt rounds used for this password
     */
    private async getRounds(): Promise<number> {
        const rounds = this.hashedValue.split('$')[2];
        return parseInt(rounds, 10);
    }
}
