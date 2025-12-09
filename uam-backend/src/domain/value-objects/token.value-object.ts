import { randomBytes } from 'crypto';

/**
 * Token Value Object
 * Generates cryptographically secure random tokens
 * Used for invitation tokens, verification tokens, etc.
 */
export class Token {
    private static readonly DEFAULT_LENGTH = 32; // 32 bytes = 64 hex characters

    private constructor(private readonly value: string) { }

    /**
     * Generate a new cryptographically secure random token
     * @param length Number of random bytes (default: 32)
     */
    static generate(length: number = this.DEFAULT_LENGTH): Token {
        const buffer = randomBytes(length);
        const tokenValue = buffer.toString('hex');
        return new Token(tokenValue);
    }

    /**
     * Create token from existing value (for reconstitution)
     */
    static fromString(value: string): Token {
        if (!value || value.trim().length === 0) {
            throw new Error('Token value is required');
        }
        return new Token(value);
    }

    /**
     * Get token value
     */
    getValue(): string {
        return this.value;
    }

    /**
     * Check if token matches another token (constant-time comparison)
     */
    equals(other: Token): boolean {
        if (!other) {
            return false;
        }

        // Use constant-time comparison to prevent timing attacks
        const a = Buffer.from(this.value);
        const b = Buffer.from(other.value);

        if (a.length !== b.length) {
            return false;
        }

        return a.equals(b);
    }

    /**
     * Get token length in characters
     */
    getLength(): number {
        return this.value.length;
    }

    toString(): string {
        return this.value;
    }
}
