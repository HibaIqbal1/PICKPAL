import { z } from "zod";

/**
 * Server-Side Input Sanitization Helper
 * Cleans string inputs of HTML, scripts, control characters, and excess whitespace.
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== "string") return "";

  let str = input;

  // 1. Remove control characters
  str = str.replace(/[\x00-\x1F\x7F-\x9F]/g, "");

  // 2. Remove script tags, inline js, html tags
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  str = str.replace(/javascript:[^\s"]+/gi, "");
  str = str.replace(/<[^>]*>?/gm, "");

  // 3. Trim and normalize multiple whitespace to single space
  str = str.trim().replace(/\s+/g, " ");

  // 4. Escape remaining dangerous html characters
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Reusable Zod Validation Schemas
 */

// Email: Valid email format, max 150 chars
export const emailSchema = z
  .string()
  .transform((val) => sanitizeInput(val).toLowerCase())
  .pipe(
    z
      .string()
      .email("Invalid email format")
      .max(150, "Email must not exceed 150 characters")
  );

// Phone: Digits only, length 10-15
export const phoneSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ""))
  .pipe(
    z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number must not exceed 15 digits")
      .regex(/^\d+$/, "Phone number must contain digits only")
  );

// Password: Min 8, Max 128, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must not exceed 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// Full Name / Display Name: 2-100 chars, sanitized, no HTML
export const fullNameSchema = z
  .string()
  .transform((val) => sanitizeInput(val))
  .pipe(
    z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must not exceed 100 characters")
  );

// Username: 3-30 chars, letters, numbers, underscores only
export const usernameSchema = z
  .string()
  .transform((val) => sanitizeInput(val))
  .pipe(
    z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must not exceed 30 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
  );

/**
 * Reusable Application Schemas
 */

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const phoneLoginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z
  .object({
    name: fullNameSchema,
    phone: phoneSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    location: z.string().optional().transform((val) => (val ? sanitizeInput(val) : "")),
    agreeTerms: z.boolean().refine((val) => val === true, "Must agree to terms"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const otpSchema = z.object({
  target: z.string().min(1, "Target is required"),
  type: z.enum(["phone", "email"]),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain digits only"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Standard Error Response Helper (HTTP 400 - { success: false, message: "Invalid request." })
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  response?: {
    success: false;
    message: string;
  };
  errorMsg?: string;
}

export class AuthValidationService {
  /**
   * Sanitizes and validates payload against given Zod schema.
   * Returns clean payload or generic "Invalid request." error payload.
   */
  public static validate<T>(schema: z.ZodSchema<T>, payload: unknown): ValidationResult<T> {
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      return {
        success: false,
        response: {
          success: false,
          message: "Incorrect email or password.",
        },
        errorMsg: "Incorrect email or password.",
      };
    }
    return {
      success: true,
      data: parsed.data,
    };
  }

  public static sanitize(text: string): string {
    return sanitizeInput(text);
  }
}
