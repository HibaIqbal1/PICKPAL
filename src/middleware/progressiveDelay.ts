import { Request, Response, NextFunction } from "express";
import { LoginAttemptService } from "../services/LoginAttemptService";

/**
 * Progressive Delay Middleware
 * Introduces exponential delay (0ms, 500ms, 1s, 2s, 4s, max 5s) based on failed attempt count
 * before checking credentials.
 */
export async function progressiveDelay(req: Request, _res: Response, next: NextFunction) {
  const { email, phone } = req.body ?? {};
  const target = (email || phone || "").toLowerCase().trim();

  if (target) {
    const failedCount = await LoginAttemptService.getFailedAttempts(target);
    const delayMs = LoginAttemptService.calculateProgressiveDelay(failedCount);

    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  next();
}
