import { RedisClient } from "../cache/RedisClient";
import { SecurityEmailService } from "./SecurityEmailService";

export interface SecurityLogEvent {
  event: "failed_login" | "rate_limit_exceeded" | "account_locked" | "account_unlocked" | "password_reset_requested";
  timestamp: string;
  ip: string;
  userAgent?: string;
  target?: string;
  requestId?: string;
  details?: string;
}

export class LoginAttemptService {
  private static MAX_FAILED_ATTEMPTS = 5;
  private static LOCKOUT_TTL_SECONDS = 15 * 60; // 15 minutes

  /**
   * Log security events (without passwords)
   */
  public static logSecurityEvent(eventData: SecurityLogEvent): void {
    const { event, timestamp, ip, userAgent = "Unknown", target = "N/A", requestId, details } = eventData;
    console.log(`[SECURITY LOG] ${timestamp} | EVENT: ${event.toUpperCase()} | Target: ${target} | IP: ${ip} | ReqId: ${requestId || "N/A"} | UA: ${userAgent} | ${details || ""}`);
  }

  /**
   * Get consecutive failed login count for target account
   */
  public static async getFailedAttempts(target: string): Promise<number> {
    const key = `failed_attempts:${target.toLowerCase().trim()}`;
    const raw = await RedisClient.get(key);
    return raw ? parseInt(raw, 10) : 0;
  }

  /**
   * Calculate progressive exponential delay (ms) before checking credentials.
   * Attempt 1 -> 0ms, 2 -> 500ms, 3 -> 1000ms, 4 -> 2000ms, 5 -> 4000ms (capped at 5000ms)
   */
  public static calculateProgressiveDelay(attemptCount: number): number {
    if (attemptCount <= 1) return 0;
    const delay = 250 * Math.pow(2, attemptCount - 1);
    return Math.min(delay, 5000);
  }

  /**
   * Check if target account is currently locked out.
   */
  public static async isAccountLocked(target: string): Promise<{ isLocked: boolean; remainingSeconds: number }> {
    const key = `account_lockout:${target.toLowerCase().trim()}`;
    const locked = await RedisClient.get(key);
    if (!locked) {
      return { isLocked: false, remainingSeconds: 0 };
    }
    const ttl = await RedisClient.ttl(key);
    return { isLocked: true, remainingSeconds: Math.max(0, ttl) };
  }

  /**
   * Record a failed login attempt.
   * If 5 attempts reached, trigger 15-minute account lockout & security email alert.
   */
  public static async recordFailedAttempt(
    target: string,
    ip: string,
    userAgent?: string,
    requestId?: string
  ): Promise<{ isNowLocked: boolean; attemptCount: number }> {
    const cleanTarget = target.toLowerCase().trim();
    const attemptsKey = `failed_attempts:${cleanTarget}`;
    const count = await RedisClient.incr(attemptsKey, this.LOCKOUT_TTL_SECONDS);

    const timestamp = new Date().toISOString();

    this.logSecurityEvent({
      event: "failed_login",
      timestamp,
      ip,
      userAgent,
      target: cleanTarget,
      requestId,
      details: `Failed attempt ${count}/${this.MAX_FAILED_ATTEMPTS}`,
    });

    if (count >= this.MAX_FAILED_ATTEMPTS) {
      // Lock account for 15 minutes
      const lockKey = `account_lockout:${cleanTarget}`;
      await RedisClient.set(lockKey, "locked", this.LOCKOUT_TTL_SECONDS);

      this.logSecurityEvent({
        event: "account_locked",
        timestamp,
        ip,
        userAgent,
        target: cleanTarget,
        requestId,
        details: `Account locked for ${this.LOCKOUT_TTL_SECONDS / 60} minutes after ${count} failed attempts`,
      });

      // Send security alert email
      await SecurityEmailService.sendLockoutAlert({
        accountTarget: cleanTarget,
        ipAddress: ip,
        userAgent,
        lockoutDurationMinutes: 15,
      });

      return { isNowLocked: true, attemptCount: count };
    }

    return { isNowLocked: false, attemptCount: count };
  }

  /**
   * On successful authentication, reset failed attempts & lockout status
   */
  public static async resetAttempts(target: string, ip: string, userAgent?: string, requestId?: string): Promise<void> {
    const cleanTarget = target.toLowerCase().trim();
    const attemptsKey = `failed_attempts:${cleanTarget}`;
    const lockKey = `account_lockout:${cleanTarget}`;

    const wasLocked = await RedisClient.get(lockKey);

    await RedisClient.del(attemptsKey);
    await RedisClient.del(lockKey);
    await RedisClient.del(`lockout_email_sent:${cleanTarget}`);

    if (wasLocked) {
      this.logSecurityEvent({
        event: "account_unlocked",
        timestamp: new Date().toISOString(),
        ip,
        userAgent,
        target: cleanTarget,
        requestId,
        details: "Account unlocked after successful authentication",
      });
    }
  }
}
