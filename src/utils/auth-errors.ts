/**
 * Auth Error Mapping Utility for PickPal.
 * Logs error.code & error.message in development without exposing sensitive data.
 * Maps Firebase error codes to friendly customer messages.
 */

export function handleAuthError(error: any): string {
  const code = error?.code || error?.name || "";
  const message = error?.message || "";

  // Log exact error code and message during development without sensitive values
  console.error("AUTH ERROR:", code, message);

  if (code === "auth/invalid-verification-code") {
    return "Incorrect verification code.";
  }
  if (code === "auth/code-expired" || code === "auth/session-expired" || code === "auth/invalid-verification-id") {
    return "Verification code expired. Please request a new code.";
  }
  if (code === "auth/billing-not-enabled") {
    return "SMS service unavailable (Firebase billing requirement). Please use a test phone number.";
  }
  if (code === "auth/quota-exceeded") {
    return "SMS quota exceeded. Please use Firebase test phone numbers (+91 99999 99999).";
  }
  if (code === "permission-denied" || code === "firestore/permission-denied") {
    return "Your account could not be created. Please try again.";
  }
  if (code === "auth/network-request-failed" || code.includes("network") || message.toLowerCase().includes("network")) {
    return "Network connection problem. Please try again.";
  }
  if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
    return "Incorrect email or password.";
  }
  if (code === "auth/email-already-in-use") {
    return "An account with this email already exists.";
  }

  if (code) {
    return `[${code}]: ${message || "Authentication failed."}`;
  }
  return message || "Unable to complete sign-in. Please try again.";
}
