import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { PickPalUser, UserRole } from "../types";
import { User, Briefcase, Mail, Lock, Zap, Eye, EyeOff, Phone, MapPin, ChevronDown, CheckSquare, Square } from "lucide-react";
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

export default function Signup() {
  const [authMethod, setAuthMethod]   = useState<"phone" | "email">("phone");
  const [role, setRole]               = useState<UserRole>("customer");
  const [name, setName]               = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone]             = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [confirmPw, setConfirmPw]     = useState("");
  const [location, setLocation]       = useState("");
  const [agreeTerms, setAgreeTerms]   = useState(true);

  const [showPw, setShowPw]           = useState(false);
  const [showCPw, setShowCPw]         = useState(false);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);

  // Firebase Phone Auth State
  const [step, setStep]                           = useState<"form" | "otp">("form");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpTarget, setOtpTarget]                 = useState("");

  const { sendPhoneOtp, confirmPhoneOtpAndLogin, signupCustomerWithEmail, signupWorkerWithEmail } = useAuth();
  const navigate = useNavigate();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (authMethod === "email") {
      if (!email.trim() || !email.includes("@")) {
        setError("Please enter a valid email address.");
        return;
      }
      if (!password || password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPw) {
        setError("Passwords do not match.");
        return;
      }
    }
    if (!agreeTerms) {
      setError("Please agree to the Terms of Service & Privacy Policy to continue.");
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = OtpService.formatE164Phone(phone, countryCode);

      if (authMethod === "phone") {
        // Setup Firebase RecaptchaVerifier
        const verifier = createRecaptchaVerifier("recaptcha-container");
        const confirmResult = await sendPhoneOtp(formattedPhone, verifier);

        setConfirmationResult(confirmResult);
        setOtpTarget(formattedPhone);
        setStep("otp");
      } else {
        // Email + Password signup
        if (role === "customer") {
          await signupCustomerWithEmail(name.trim(), formattedPhone, email.trim(), password, location.trim());
          navigate("/customer");
        } else {
          await signupWorkerWithEmail({
            name: name.trim(),
            email: email.trim(),
            password,
            phone: formattedPhone,
            city: location.trim(),
          });
          navigate("/worker/onboarding");
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
      const formattedPhone = OtpService.formatE164Phone(phone, countryCode);
      const additionalProfileData: Partial<PickPalUser> = {};
      if (name && name.trim()) additionalProfileData.name = name.trim();
      if (formattedPhone) additionalProfileData.phone = formattedPhone;
      if (role) additionalProfileData.role = role;
      if (email && email.trim()) additionalProfileData.email = email.trim().toLowerCase();
      if (location && location.trim()) additionalProfileData.area = location.trim();

      const user = await confirmPhoneOtpAndLogin(confirmationResult, otpCode, additionalProfileData);

      if (user.role === "worker") {
        navigate("/worker/onboarding");
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

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden select-none"
      style={{
        background: "radial-gradient(ellipse 90% 70% at 15% 10%, rgba(233,30,99,.18) 0%, transparent 65%), radial-gradient(ellipse 80% 70% at 85% 90%, rgba(255,183,197,.16) 0%, transparent 65%), #FCFBFD",
      }}
    >
      {/* Hidden reCAPTCHA container for Firebase Phone Auth */}
      <div id="recaptcha-container"></div>

      {/* Ambient decorative blobs */}
      <div
        className="auth-blob"
        style={{ width: "min(60vw, 520px)", height: "min(60vw, 520px)", background: "rgba(99,102,241,.12)", top: "-10%", right: "-10%", filter: "blur(90px)" }}
      />
      <div
        className="auth-blob"
        style={{ width: "min(50vw, 420px)", height: "min(50vw, 420px)", background: "rgba(233,30,99,.14)", bottom: "-8%", left: "-8%", filter: "blur(90px)" }}
      />

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 my-auto shadow-2xl"
        style={{
          width: "min(92vw, 520px)",
          maxWidth: 520,
          background: "#FFFFFF",
          borderRadius: 28,
          border: "1px solid rgba(0,0,0,.05)",
          boxShadow: "0 30px 80px rgba(25,20,40,.12)",
          padding: "clamp(24px, 5vw, 40px)",
        }}
      >
        <AnimatePresence mode="wait">
          {step === "otp" ? (
            <OtpVerificationScreen
              key="otp-step"
              target={otpTarget}
              type="phone"
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
              onBack={() => {
                setStep("form");
                setError("");
              }}
              loading={loading}
              error={error}
            />
          ) : (
            <motion.div
              key="form-step"
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
                  width: 60, height: 60,
                  borderRadius: 18,
                  background: "linear-gradient(145deg, #C4166B 0%, #E91E63 100%)",
                  boxShadow: "0 12px 32px rgba(233,30,99,.30)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <Zap size={26} color="#fff" fill="#fff" />
              </motion.div>

              {/* Heading */}
              <div style={{ marginBottom: 20 }}>
                <h1
                  style={{
                    fontSize: "clamp(24px, 4.5vw, 30px)",
                    fontWeight: 800,
                    color: "#1D1B26",
                    lineHeight: 1.15,
                    letterSpacing: "-0.5px",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  Create an account
                </h1>
                <p style={{ fontSize: "14px", color: "#888", marginTop: 4 }}>
                  Join PickPal as a customer or service partner.
                </p>
              </div>

              {/* Role Toggle Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#F4F3F8] dark:bg-zinc-800 rounded-2xl mb-4">
                <button
                  type="button"
                  onClick={() => setRole("customer")}
                  className={`py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                    role === "customer"
                      ? "bg-white text-brand-600 shadow-xs"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  <User size={15} /> Customer
                </button>
                <button
                  type="button"
                  onClick={() => setRole("worker")}
                  className={`py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                    role === "worker"
                      ? "bg-white text-brand-600 shadow-xs"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  <Briefcase size={15} /> Service Partner / Worker
                </button>
              </div>

              {/* Auth Method Toggle */}
              <div className="flex items-center justify-center gap-4 text-xs font-semibold text-ink-soft mb-5">
                <button
                  type="button"
                  onClick={() => { setAuthMethod("phone"); setError(""); }}
                  className={`pb-1 border-b-2 transition-colors ${
                    authMethod === "phone" ? "border-brand-500 text-brand-600 font-bold" : "border-transparent"
                  }`}
                >
                  Phone + OTP Signup
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => { setAuthMethod("email"); setError(""); }}
                  className={`pb-1 border-b-2 transition-colors ${
                    authMethod === "email" ? "border-brand-500 text-brand-600 font-bold" : "border-transparent"
                  }`}
                >
                  Email + Password Signup
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-3">
                {/* Full Name */}
                <InputField
                  icon={<User size={18} />}
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={setName}
                  autoComplete="name"
                />

                {/* Phone input with country code */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="h-[52px] pl-2.5 pr-6 bg-[#FAFAFA] border border-[#E9E9EF] rounded-2xl text-xs font-bold text-ink outline-none appearance-none cursor-pointer focus:border-brand-500"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none" />
                  </div>
                  <div className="flex-1">
                    <InputField
                      icon={<Phone size={18} />}
                      type="tel"
                      placeholder="Mobile Number"
                      value={phone}
                      onChange={setPhone}
                      autoComplete="tel-national"
                    />
                  </div>
                </div>

                {/* Email (Required for email auth, optional for phone auth) */}
                {(authMethod === "email" || role === "worker") && (
                  <InputField
                    icon={<Mail size={18} />}
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                  />
                )}

                {/* Password fields for email auth */}
                {authMethod === "email" && (
                  <>
                    <InputField
                      icon={<Lock size={18} />}
                      type={showPw ? "text" : "password"}
                      placeholder="Create Password (min 6 chars)"
                      value={password}
                      onChange={setPassword}
                      suffix={
                        <button type="button" onClick={() => setShowPw(!showPw)}>
                          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />

                    <InputField
                      icon={<Lock size={18} />}
                      type={showCPw ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={confirmPw}
                      onChange={setConfirmPw}
                      suffix={
                        <button type="button" onClick={() => setShowCPw(!showCPw)}>
                          {showCPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />
                  </>
                )}

                {/* City / Area */}
                <InputField
                  icon={<MapPin size={18} />}
                  type="text"
                  placeholder="City / Area (e.g. Indiranagar, Bangalore)"
                  value={location}
                  onChange={setLocation}
                />

                {/* Terms agreement */}
                <div className="flex items-center gap-2 pt-1 pb-1 cursor-pointer" onClick={() => setAgreeTerms(!agreeTerms)}>
                  {agreeTerms ? (
                    <CheckSquare size={18} className="text-brand-600 flex-shrink-0" />
                  ) : (
                    <Square size={18} className="text-ink-soft flex-shrink-0" />
                  )}
                  <span className="text-xs text-ink-soft">
                    I agree to the <span className="font-bold text-ink underline">Terms of Service</span> & <span className="font-bold text-ink underline">Privacy Policy</span>
                  </span>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="text-xs px-3.5 py-2.5 rounded-xl bg-error-50 text-error-600 border border-error-100 text-center font-medium">
                    {error}
                  </div>
                )}

                {/* Submit button */}
                <div className="pt-2">
                  <PrimaryButton type="submit" disabled={loading}>
                    {loading ? "Processing..." : authMethod === "phone" ? "Send Firebase OTP" : "Create Account"}
                  </PrimaryButton>
                </div>
              </form>

              {/* Footer Link */}
              <p style={{ textAlign: "center", fontSize: 14, color: "#999", marginTop: 20 }}>
                Already have an account?{" "}
                <Link
                  to="/login"
                  style={{ fontWeight: 700, color: "#E91E63", textDecoration: "none" }}
                  className="hover:opacity-80"
                >
                  Log in
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ── Shared helper sub-components ─────────────────────────────────── */

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
        gap: 10,
        height: 52,
        padding: "0 16px",
        borderRadius: 16,
        background: focused ? "#FFFFFF" : "#FAFAFA",
        border: focused ? "2px solid #E91E63" : "1.5px solid #E9E9EF",
        transition: "all 0.2s ease",
      }}
    >
      <span style={{ color: focused ? "#E91E63" : "#ADADB8", lineHeight: 0, flexShrink: 0 }}>
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
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: 14,
          color: "#1D1B26",
          fontFamily: "var(--font-sans)",
        }}
      />
      {suffix && <span style={{ flexShrink: 0 }}>{suffix}</span>}
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
      whileHover={!disabled ? { y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      style={{
        width: "100%",
        height: 52,
        borderRadius: 16,
        border: "none",
        background: disabled ? "#DDD" : "linear-gradient(135deg, #C4166B 0%, #E91E63 100%)",
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      {children}
    </motion.button>
  );
}
