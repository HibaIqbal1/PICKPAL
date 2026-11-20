import bcrypt from "bcryptjs";
import crypto from "crypto";

export type HashAlgorithmType = "plain" | "md5" | "sha1" | "weak_bcrypt" | "bcrypt_12_plus";

export class HashUtility {
  private static DEFAULT_SALT_ROUNDS = 12;

  /**
   * Securely hashes a password using bcrypt with cost factor = 12 (or higher).
   */
  public static async hashPassword(password: string, saltRounds = HashUtility.DEFAULT_SALT_ROUNDS): Promise<string> {
    const rounds = Math.max(saltRounds, 12);
    return bcrypt.hash(password, rounds);
  }

  /**
   * Constant-time password verification using bcrypt.compare().
   */
  public static async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) return false;
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }

  /**
   * Detect algorithm format of a stored hash/password string.
   */
  public static detectAlgorithm(storedVal: string): HashAlgorithmType {
    if (!storedVal) return "plain";

    // Standard bcrypt format: $2a$, $2b$, $2y$ followed by 2-digit cost factor
    if (/^\$2[aby]\$\d{2}\$/.test(storedVal)) {
      const parts = storedVal.split("$");
      const cost = parseInt(parts[2], 10);
      if (cost < 12) {
        return "weak_bcrypt";
      }
      return "bcrypt_12_plus";
    }

    // 32-char hex -> MD5
    if (/^[a-fA-F0-9]{32}$/.test(storedVal)) {
      return "md5";
    }

    // 40-char hex -> SHA1
    if (/^[a-fA-F0-9]{40}$/.test(storedVal)) {
      return "sha1";
    }

    // Default -> Plain Text
    return "plain";
  }

  /**
   * Verify password against legacy formats (MD5, SHA-1, plain text)
   */
  public static verifyLegacyFormat(password: string, storedVal: string, algo: HashAlgorithmType): boolean {
    if (algo === "plain") {
      // Constant-time timing attack protection for plain text comparison
      const bufA = Buffer.from(password);
      const bufB = Buffer.from(storedVal);
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    }

    if (algo === "md5") {
      const hash = crypto.createHash("md5").update(password).digest("hex");
      return hash.toLowerCase() === storedVal.toLowerCase();
    }

    if (algo === "sha1") {
      const hash = crypto.createHash("sha1").update(password).digest("hex");
      return hash.toLowerCase() === storedVal.toLowerCase();
    }

    return false;
  }
}
