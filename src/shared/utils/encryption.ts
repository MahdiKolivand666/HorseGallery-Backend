import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scrypt,
  createHmac,
} from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

/**
 * Encryption utility for sensitive data
 * Uses AES-256-GCM for encryption
 */
export class EncryptionService {
  private static algorithm = 'aes-256-gcm';
  private static keyLength = 32; // 256 bits
  private static ivLength = 16; // 128 bits
  private static saltLength = 32;
  private static tagLength = 16;

  /**
   * Derive key from password using scrypt
   */
  private static async deriveKey(
    password: string,
    salt: Buffer,
  ): Promise<Buffer> {
    return (await scryptAsync(password, salt, this.keyLength)) as Buffer;
  }

  /**
   * Encrypt data
   * @param plaintext - Data to encrypt
   * @param encryptionKey - Encryption key (from environment)
   * @returns Encrypted data in format: salt:iv:authTag:ciphertext (all base64)
   */
  static async encrypt(
    plaintext: string,
    encryptionKey: string,
  ): Promise<string> {
    if (!plaintext) {
      return plaintext;
    }

    // Generate salt and derive key
    const salt = randomBytes(this.saltLength);
    const key = await this.deriveKey(encryptionKey, salt);

    // Generate IV
    const iv = randomBytes(this.ivLength);

    // Create cipher
    const cipher = createCipheriv(this.algorithm, key, iv);

    // Encrypt
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    // Get auth tag
    const authTag = (cipher as any).getAuthTag() as Buffer;

    // Combine: salt:iv:authTag:ciphertext
    const combined = Buffer.concat([salt, iv, authTag, encrypted]);

    return combined.toString('base64');
  }

  /**
   * Decrypt data
   * @param ciphertext - Encrypted data (base64)
   * @param encryptionKey - Encryption key (from environment)
   * @returns Decrypted plaintext
   */
  static async decrypt(
    ciphertext: string,
    encryptionKey: string,
  ): Promise<string> {
    if (!ciphertext) {
      return ciphertext;
    }

    try {
      // Decode from base64
      const combined = Buffer.from(ciphertext, 'base64');

      // Extract components
      const salt = combined.subarray(0, this.saltLength);
      const iv = combined.subarray(
        this.saltLength,
        this.saltLength + this.ivLength,
      );
      const authTag = combined.subarray(
        this.saltLength + this.ivLength,
        this.saltLength + this.ivLength + this.tagLength,
      );
      const encrypted = combined.subarray(
        this.saltLength + this.ivLength + this.tagLength,
      );

      // Derive key
      const key = await this.deriveKey(encryptionKey, salt);

      // Create decipher
      const decipher = createDecipheriv(this.algorithm, key, iv);
      (decipher as any).setAuthTag(authTag);

      // Decrypt
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      // If decryption fails, might be unencrypted legacy data
      // In production, you should handle this more carefully
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt mobile number
   */
  static async encryptMobile(
    mobile: string,
    encryptionKey: string,
  ): Promise<string> {
    return this.encrypt(mobile, encryptionKey);
  }

  /**
   * Decrypt mobile number
   */
  static async decryptMobile(
    encryptedMobile: string,
    encryptionKey: string,
  ): Promise<string> {
    return this.decrypt(encryptedMobile, encryptionKey);
  }

  /**
   * Hash mobile for searching (one-way hash)
   * Used to create searchable index without exposing actual mobile
   */
  static hashMobile(mobile: string, hashKey: string): string {
    return createHmac('sha256', hashKey)
      .update(mobile)
      .digest('hex')
      .substring(0, 32);
  }
}
