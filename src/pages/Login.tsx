import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Zap, Eye, EyeOff, Phone, ChevronDown } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { createRecaptchaVerifier, ConfirmationResult } from "../lib/firebase";
import { OtpService } from "../services/otp.service";
import { handleAuthError } from "../utils/auth-errors";
import { OtpVerificationScreen } from "../components/shared/OtpVerificationScreen";

const COUNTRY_CODES = [
  { code: "+91", label: "India (+91)", flag: "🇮🇳" },
  { code: "+1",  label: "US (+1)",     flag: "🇺🇸" },
  { code: "+44", label: "UK (+44)",     flag: "🇬🇧" },
  { code: "+971",label: "UAE (+971)",   flag: "🇦🇪" },
  { code: "+65", label: "SG (+65)",     flag: "🇸🇬" },
];

export default function Login() {
  const [loginMethod, setLoginMethod] = useState<"phone" | "email">("phone");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone]             = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPw, setShowPw]           = useState(false);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);

  // Firebase Phone Auth confirmation state
  const [step, setStep]                           = useState<"credentials" | "otp">("credentials");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpTarget, setOtpTarget]                 = useState("");

  const { sendPhoneOtp, confirmPhoneOtpAndLogin, loginWithEmail, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (loginMethod === "phone") {
        if (!phone || phone.trim().length < 7) {
          setError("Please enter a valid phone number.");
          setLoading(false);
          return;
        }

        const formattedPhone = OtpService.formatE164Phone(phone, countryCode);

        // Setup Firebase RecaptchaVerifier on hidden container
        const verifier = createRecaptchaVerifier("recaptcha-container");
        const confirmResult = await sendPhoneOtp(formattedPhone, verifier);

        setConfirmationResult(confirmResult);
        setOtpTarget(formattedPhone);
        setStep("otp");
      } else {
        if (!email || !email.includes("@")) {
          setError("Please enter a valid email address.");
          setLoading(false);
          return;
        }
        if (!password) {
          setError("Please enter your password.");
          setLoading(false);
          return;
        }

        const user = await loginWithEmail(email.trim(), password);
        if (user?.role === "worker") {
          navigate(user.status === "pendingApproval" ? "/worker/onboarding" : "/worker");
        } else if (user?.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/customer");
        }
      }
    } catch (err: any) {
      setError(handleAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otpCode: string) => {
    if (!confirmationResult) {
      setError("Session expired. Please request a new OTP.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const user = await confirmPhoneOtpAndLogin(confirmationResult, otpCode);
      if (user.role === "worker") {
        navigate(user.status === "pendingApproval" ? "/worker/onboarding" : "/worker");
      } else if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/customer");
      }
    } catch (err: any) {
      setError(handleAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!phone) return;
    setError("");
    try {
      const formattedPhone = OtpService.formatE164Phone(phone, countryCode);
      const verifier = createRecaptchaVerifier("recaptcha-container");
      const confirmResult = await sendPhoneOtp(formattedPhone, verifier);
      setConfirmationResult(confirmResult);
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP code.");
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address to reset password.");
      return;
    }
    try {
      await resetPassword(email);
      setError("If that email is registered, you'll receive a password reset link.");
    } catch {
      setError("If that email is registered, you'll receive a password reset link.");
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden select-none"
      style={{
        background: "radial-gradient(ellipse 90% 70% at 15% 10%, rgba(233,30,99,.18) 0%, transparent 65%), radial-gradient(ellipse 80% 70% at 85% 90%, rgba(255,183,197,.16) 0%, transparent 65%), #FCFBFD",
      }}
    >
      {/* Hidden reCAPTCHA container for Firebase Phone Auth */}
      <div id="recaptcha-container"></div>

      {/* Ambient background blobs */}
      <div
        className="auth-blob"
        style={{ width: "min(60vw, 520px)", height: "min(60vw, 520px)", background: "rgba(233,30,99,.12)", top: "-10%", left: "-10%", filter: "blur(90px)" }}
      />
      <div
        className="auth-blob"
        style={{ width: "min(50vw, 420px)", height: "min(50vw, 420px)", background: "rgba(255,183,197,.14)", bottom: "-8%", right: "-8%", filter: "blur(90px)" }}
      />

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 my-auto shadow-2xl"
        style={{
          width: "min(92vw, 500px)",
          maxWidth: 500,
          background: "#FFFFFF",
          borderRadius: 28,
          border: "1px solid rgba(0,0,0,.05)",
          boxShadow: "0 30px 80px rgba(25,20,40,.12)",
          padding: "clamp(28px, 6vw, 44px)",
        }}
      >
        <AnimatePresence mode="wait">
          {step === "otp" ? (
            <OtpVerificationScreen
              key="otp-step"
              target={otpTarget}
              type={loginMethod}
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
              onBack={() => {
                setStep("credentials");
                setError("");
              }}
              loading={loading}
              error={error}
            />
          ) : (
            <motion.div
              key="credentials-step"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3 }}
            >
              {/* Logo */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 380, damping: 22 }}
                style={{
                  width: 68, height: 68,
                  borderRadius: 20,
                  background: "linear-gradient(145deg, #C4166B 0%, #E91E63 100%)",
                  boxShadow: "0 12px 32px rgba(233,30,99,.30), inset 0 1px 0 rgba(255,255,255,.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 24,
                }}
              >
                <Zap size={28} color="#fff" fill="#fff" />
              </motion.div>

              {/* Heading */}
              <div style={{ marginBottom: 24 }}>
                <h1
                  style={{
                    fontSize: "clamp(26px, 5vw, 34px)",
                    fontWeight: 800,
                    color: "#1D1B26",
                    lineHeight: 1.15,
                    letterSpacing: "-0.5px",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  Welcome back
                </h1>
                <p style={{ fontSize: "clamp(14px, 2.5vw, 15px)", color: "#888", marginTop: 6, lineHeight: 1.4 }}>
                  Log in to book or fulfill local PickPal services.
                </p>
              </div>

              {/* Login Method Toggle */}
              <div
                className="grid grid-cols-2 gap-1 p-1 bg-[#F4F3F8] dark:bg-zinc-800 rounded-2xl mb-6"
                style={{ borderRadius: 18 }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod("phone");
                    setError("");
                  }}
                  className={`py-3 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ${
                    loginMethod === "phone"
                      ? "bg-white text-brand-600 shadow-sm"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  <Phone size={15} /> Phone + OTP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod("email");
                    setError("");
                  }}
                  className={`py-3 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ${
                    loginMethod === "email"
                      ? "bg-white text-brand-600 shadow-sm"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  <Mail size={15} /> Email + Password
                </button>
              </div>

              <form onSubmit={handleCredentialsSubmit}>
                {/* Phone Field */}
                {loginMethod === "phone" ? (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-2">
                      {/* Country Code Dropdown */}
                      <div className="relative">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="h-[60px] pl-3 pr-7 bg-[#FAFAFA] border border-[#E9E9EF] rounded-2xl text-sm font-bold text-ink outline-none appearance-none cursor-pointer focus:border-brand-500 transition-colors"
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.flag} {c.code}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none" />
                      </div>

                      {/* Phone Input */}
                      <div className="flex-1">
                        <InputField
                          icon={<Phone size={20} />}
                          type="tel"
                          placeholder="Indian Phone (e.g. 99999 99999)"
                          value={phone}
                          onChange={setPhone}
                          autoComplete="tel-national"
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* Email & Password Fields */
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <InputField
                      icon={<Mail size={20} />}
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={setEmail}
                      autoComplete="email"
                    />

                    <InputField
                      icon={<Lock size={20} />}
                      type={showPw ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={setPassword}
                      autoComplete="current-password"
                      suffix={
                        <button
                          type="button"
                          onClick={() => setShowPw(!showPw)}
                          style={{ color: "#AAA", lineHeight: 0 }}
                          className="hover:text-ink transition-colors"
                        >
                          {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      }
                    />

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleResetPassword}
                        className="text-xs font-bold text-brand-600 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Error Banner */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        fontSize: 13,
                        padding: "10px 14px",
                        borderRadius: 12,
                        marginTop: 16,
                        marginBottom: 8,
                        background: error.includes("sent") || error.includes("Reset")
                          ? "rgba(20,168,102,.08)"
                          : "rgba(233,30,99,.07)",
                        color: error.includes("sent") || error.includes("Reset")
                          ? "#14A866"
                          : "#C4166B",
                        border: error.includes("sent") || error.includes("Reset")
                          ? "1px solid rgba(20,168,102,.2)"
                          : "1px solid rgba(233,30,99,.2)",
                      }}
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <div style={{ marginTop: 20 }}>
                  <PrimaryButton type="submit" disabled={loading}>
                    {loading ? "Processing..." : loginMethod === "phone" ? "Send Firebase OTP" : "Log In"}
                  </PrimaryButton>
                </div>
              </form>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
                <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,.08)" }} />
                <span style={{ fontSize: 13, color: "#AAA", fontWeight: 500, whiteSpace: "nowrap" }}>or continue with</span>
                <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,.08)" }} />
              </div>

              {/* Google Login */}
              <GoogleButton
                onClick={() => loginWithGoogle("customer").then(() => navigate("/"))}
              />

              {/* Footer */}
              <p style={{ textAlign: "center", fontSize: 14, color: "#999", marginTop: 24 }}>
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  style={{ fontWeight: 700, color: "#E91E63", textDecoration: "none", cursor: "pointer" }}
                  className="hover:opacity-80 transition-opacity inline-block"
                >
                  Sign up free
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ── Shared sub-components ─────────────────────────────────────────── */

function InputField({
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
  suffix,
}: {
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  suffix?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        height: 60,
        padding: "0 18px",
        borderRadius: 18,
        background: focused ? "#FFFFFF" : "#FAFAFA",
        border: focused
          ? "2px solid #E91E63"
          : "1.5px solid #E9E9EF",
        boxShadow: focused ? "0 0 0 6px rgba(233,30,99,.08)" : "none",
        transition: "border 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
      }}
    >
      <span style={{ color: focused ? "#E91E63" : "#ADADB8", lineHeight: 0, flexShrink: 0, transition: "color 0.2s ease" }}>
        {icon}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        required
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: 16,
          color: "#1D1B26",
          fontFamily: "var(--font-sans)",
        }}
        className="placeholder:text-[#BBBBC8]"
      />
      {suffix && <span style={{ flexShrink: 0, lineHeight: 0 }}>{suffix}</span>}
    </div>
  );
}

function PrimaryButton({
  children,
  type,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={!disabled ? { y: -2, boxShadow: "0 22px 48px rgba(233,30,99,.34)" } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      transition={{ duration: 0.2 }}
      style={{
        width: "100%",
        height: 60,
        borderRadius: 18,
        border: "none",
        background: disabled ? "#DDD" : "linear-gradient(135deg, #C4166B 0%, #E91E63 100%)",
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: 700,
        fontFamily: "var(--font-sans)",
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : "0 18px 40px rgba(233,30,99,.28)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "box-shadow 0.25s ease",
        letterSpacing: "-0.1px",
      }}
    >
      {children}
    </motion.button>
  );
}

function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2, background: "#FAFAFA" }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2 }}
      style={{
        width: "100%",
        height: 56,
        borderRadius: 18,
        border: "1.5px solid #E9E9EF",
        background: "#FFFFFF",
        color: "#1D1B26",
        fontSize: 14,
        fontWeight: 600,
        fontFamily: "var(--font-sans)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,.05)",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      Continue with Google
    </motion.button>
  );
}
