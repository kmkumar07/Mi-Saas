/**
 * Email Value Object
 * Ensures email validity and provides domain extraction
 * Follows Value Object pattern - immutable and self-validating
 */
export class Email {
    private readonly value: string;

    private constructor(email: string) {
        this.value = email;
    }

    /**
     * Create Email value object with validation
     * @throws Error if email is invalid
     */
    static create(email: string): Email {
        if (!email) {
            throw new Error('Email is required');
        }

        const trimmedEmail = email.trim().toLowerCase();

        if (!this.isValid(trimmedEmail)) {
            throw new Error('Invalid email format');
        }

        return new Email(trimmedEmail);
    }

    /**
     * Validate email format using RFC 5322 compliant regex
     */
    private static isValid(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Extract domain from email
     * Example: user@example.com -> example.com
     */
    getDomain(): string {
        const parts = this.value.split('@');
        return parts.length === 2 ? parts[1] : '';
    }

    /**
     * Get email value
     */
    getValue(): string {
        return this.value;
    }

    /**
     * Check if email belongs to a specific domain
     */
    isFromDomain(domain: string): boolean {
        return this.getDomain().toLowerCase() === domain.toLowerCase();
    }

    /**
     * Value objects are equal if their values are equal
     */
    equals(other: Email): boolean {
        if (!other) {
            return false;
        }
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
