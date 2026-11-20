import { Request, Response, NextFunction } from "express";
import { RedisClient } from "../cache/RedisClient";
import { LoginAttemptService } from "../services/LoginAttemptService";

/**
 * Rate Limiter Middleware
 * Max 10 requests per IP per minute. Returns HTTP 429 with uniform response.
 */
export async function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
  const cleanIp = ip.split(",")[0].trim();
  const rateKey = `rate_limit_ip:${cleanIp}`;

  const currentRequests = await RedisClient.incr(rateKey, 60); // 60s window

  if (currentRequests > 10) {
    LoginAttemptService.logSecurityEvent({
      event: "rate_limit_exceeded",
      timestamp: new Date().toISOString(),
      ip: cleanIp,
      userAgent: req.headers["user-agent"],
      requestId: (req.headers["x-request-id"] as string) || Math.random().toString(36).substring(2, 9),
      details: `Exceeded 10 req/min (${currentRequests} requests)`,
    });

    // Return HTTP 429 with identical generic error response to prevent enumeration
    return res.status(429).json({
      success: false,
      message: "Incorrect email or password.",
    });
  }

  next();
}
