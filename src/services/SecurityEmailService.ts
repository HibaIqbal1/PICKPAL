import { RedisClient } from "../cache/RedisClient";

export interface SecurityAlertPayload {
  accountTarget: string; // email or phone
  ipAddress?: string;
  userAgent?: string;
  lockoutDurationMinutes?: number;
}

export class SecurityEmailService {
  /**
   * Send a security alert email when an account is locked due to 5 consecutive failed attempts.
   * Ensures only one email is sent per 15-minute lockout event.
   */
  public static async sendLockoutAlert(payload: SecurityAlertPayload): Promise<boolean> {
    const { accountTarget, ipAddress = "Unknown IP", lockoutDurationMinutes = 15 } = payload;
    const dedupeKey = `lockout_email_sent:${accountTarget.toLowerCase()}`;

    // Deduplication check to send only 1 email per lockout event
    const alreadySent = await RedisClient.get(dedupeKey);
    if (alreadySent) {
      return false; // Email already sent for this lockout
    }

    const lockTime = new Date().toLocaleString("en-US", { timeZone: "UTC" }) + " UTC";
    const resetLink = `https://pickpal.app/login?reset=${encodeURIComponent(accountTarget)}`;

    const emailSubject = "Security Alert: Your PickPal account has been temporarily locked";
    const emailBody = `
===================================================================
PICKPAL SECURITY ALERT
===================================================================

Hello,

Multiple consecutive failed login attempts were detected for your PickPal account (${accountTarget}).

For your safety, your account has been temporarily locked for ${lockoutDurationMinutes} minutes.

Lock Details:
- Target Account: ${accountTarget}
- Time of Lock: ${lockTime}
- IP Address: ${ipAddress}

What to do next:
1. If this was you, please wait ${lockoutDurationMinutes} minutes or reset your password using the link below:
   ${resetLink}

2. If you did NOT attempt to log in, someone else may be trying to access your account. Please reset your password immediately and contact PickPal security support.

Stay Safe,
The PickPal Security Team
===================================================================
    `;

    console.log("\n===================================================================");
    console.log(`[SECURITY EMAIL SENT] To: ${accountTarget}`);
    console.log(`[SUBJECT] ${emailSubject}`);
    console.log(emailBody);
    console.log("===================================================================\n");

    // Mark email as sent for 15 minutes (900s) to prevent spamming
    await RedisClient.set(dedupeKey, "1", lockoutDurationMinutes * 60);
    return true;
  }
}
