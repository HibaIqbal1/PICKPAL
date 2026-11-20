import { Request, Response, NextFunction } from "express";
import { AuthValidationService, passwordSchema } from "../services/auth-validation.service";

/**
 * Middleware: Validates new password strength before registration or password updates.
 * Requires minimum 8 chars, 1 uppercase, 1 lowercase, 1 number, and 1 special character.
 */
export function validatePasswordSecurity(req: Request, res: Response, next: NextFunction) {
  const { password, newPassword } = req.body ?? {};
  const targetPassword = password || newPassword;

  if (targetPassword) {
    const valid = AuthValidationService.validate(passwordSchema, targetPassword);
    if (!valid.success) {
      return res.status(400).json({
        success: false,
        message: "Incorrect email or password.",
      });
    }
  }

  next();
}
