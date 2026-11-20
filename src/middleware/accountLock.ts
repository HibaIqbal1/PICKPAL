import { Request, Response, NextFunction } from "express";
import { LoginAttemptService } from "../services/LoginAttemptService";

/**
 * Account Lockout Middleware
 * Rejects login immediately with HTTP 401 if account has 5 consecutive failed attempts (15-min lockout).
 * Prevents checking password while locked out.
 */
export async function accountLock(req: Request, res: Response, next: NextFunction) {
  const { email, phone } = req.body ?? {};
  const target = (email || phone || "").toLowerCase().trim();

  if (target) {
    const { isLocked } = await LoginAttemptService.isAccountLocked(target);

    if (isLocked) {
      const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";

      LoginAttemptService.logSecurityEvent({
        event: "failed_login",
        timestamp: new Date().toISOString(),
        ip: ip.split(",")[0].trim(),
        userAgent: req.headers["user-agent"],
        target,
        requestId: (req.headers["x-request-id"] as string) || Math.random().toString(36).substring(2, 9),
        details: "Attempt rejected — Account is currently locked out for 15 minutes",
      });

      // Return HTTP 401 with generic error response (never reveal locked status)
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password.",
      });
    }
  }

  next();
}
