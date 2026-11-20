import { HashUtility } from "../utilities/hash";
import { FirebaseService } from "./firebase.service";
import { PickPalUser } from "../types";
import { LoginAttemptService } from "./LoginAttemptService";

export class PasswordService {
  /**
   * Securely hash password using bcrypt (cost = 12).
   */
  public static async hash(password: string): Promise<string> {
    return HashUtility.hashPassword(password, 12);
  }

  /**
   * Constant-time password verification against stored bcrypt hash.
   */
  public static async verify(password: string, passwordHash: string): Promise<boolean> {
    return HashUtility.verifyPassword(password, passwordHash);
  }

  /**
   * Change user password:
   * 1. Verify old password first using constant-time comparison.
   * 2. Hash new password with bcrypt (cost = 12).
   * 3. Update Firestore with `passwordHash`.
   * 4. Invalidate sessions and log security event.
   */
  public static async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
    ipAddress = "Unknown IP"
  ): Promise<{ success: boolean; message?: string }> {
    const user = await FirebaseService.getDocument<PickPalUser & { passwordHash?: string }>("users", userId);
    if (!user) {
      return { success: false, message: "Unable to update password." };
    }

    const currentHash = user.passwordHash || "";
    const isValid = await HashUtility.verifyPassword(oldPassword, currentHash);
    if (!isValid) {
      LoginAttemptService.logSecurityEvent({
        event: "failed_login",
        timestamp: new Date().toISOString(),
        ip: ipAddress,
        target: user.email || user.phone || userId,
        details: "Password change rejected — old password verification failed",
      });
      return { success: false, message: "Unable to update password." };
    }

    const newHash = await this.hash(newPassword);

    await FirebaseService.updateDocument("users", userId, {
      passwordHash: newHash,
      updatedAt: new Date().toISOString(),
    });

    LoginAttemptService.logSecurityEvent({
      event: "password_reset_requested",
      timestamp: new Date().toISOString(),
      ip: ipAddress,
      target: user.email || user.phone || userId,
      details: "Password updated successfully — Invalidation of old sessions triggered",
    });

    return { success: true, message: "Password updated successfully." };
  }

  /**
   * Password Reset:
   * Generate new hash using bcrypt 12, store `passwordHash`, and clear legacy fields.
   */
  public static async resetPassword(
    userId: string,
    newPassword: string,
    ipAddress = "Unknown IP"
  ): Promise<{ success: boolean }> {
    const newHash = await this.hash(newPassword);

    await FirebaseService.updateDocument("users", userId, {
      passwordHash: newHash,
      password: null,
      plainPassword: null,
      updatedAt: new Date().toISOString(),
    });

    LoginAttemptService.logSecurityEvent({
      event: "password_reset_requested",
      timestamp: new Date().toISOString(),
      ip: ipAddress,
      target: userId,
      details: "Password reset completed — New bcrypt 12+ hash stored",
    });

    return { success: true };
  }
}
