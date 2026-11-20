import { HashUtility, HashAlgorithmType } from "../utilities/hash";
import { FirebaseService } from "./firebase.service";
import { PickPalUser } from "../types";
import { LoginAttemptService } from "./LoginAttemptService";

export class PasswordMigrationService {
  /**
   * Transparently inspect user document upon login, verify legacy credentials if applicable,
   * upgrade to bcrypt (cost factor = 12), update database with `passwordHash`,
   * and delete legacy `password` or `plainPassword` fields.
   */
  public static async checkAndMigratePassword(
    userProfile: PickPalUser & { passwordHash?: string; password?: string; plainPassword?: string },
    inputPassword: string
  ): Promise<{ success: boolean; newHash?: string }> {
    const storedVal = userProfile.passwordHash || userProfile.password || userProfile.plainPassword || "";
    if (!storedVal) {
      return { success: false };
    }

    const algo: HashAlgorithmType = HashUtility.detectAlgorithm(storedVal);

    let isValid = false;

    if (algo === "bcrypt_12_plus" || algo === "weak_bcrypt") {
      isValid = await HashUtility.verifyPassword(inputPassword, storedVal);
    } else {
      isValid = HashUtility.verifyLegacyFormat(inputPassword, storedVal, algo);
    }

    if (!isValid) {
      return { success: false };
    }

    // If algorithm is weak or legacy (plain, md5, sha1, weak bcrypt), perform transparent upgrade
    if (algo !== "bcrypt_12_plus" || userProfile.password || userProfile.plainPassword) {
      const newHash = await HashUtility.hashPassword(inputPassword, 12);

      // Update Firestore document with passwordHash and delete legacy fields
      const updateData: Record<string, any> = {
        passwordHash: newHash,
        updatedAt: new Date().toISOString(),
      };

      // Remove legacy fields if present
      if ("password" in userProfile) {
        updateData.password = null;
      }
      if ("plainPassword" in userProfile) {
        updateData.plainPassword = null;
      }

      await FirebaseService.updateDocument("users", userProfile.id, updateData);

      LoginAttemptService.logSecurityEvent({
        event: "account_unlocked",
        timestamp: new Date().toISOString(),
        ip: "Internal System",
        target: userProfile.email || userProfile.phone || userProfile.id,
        details: `Migrated legacy password (${algo}) to bcrypt 12+ hash`,
      });

      return { success: true, newHash };
    }

    return { success: true, newHash: storedVal };
  }
}
