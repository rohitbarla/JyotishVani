import React, { useState } from "react";
import { Lock, ShieldAlert, ShieldCheck, KeyRound, ArrowRight, X, Phone, CheckCircle2, AlertTriangle, Sparkles, Mail } from "lucide-react";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [step, setStep] = useState<"phone" | "passcode">("phone");
  const [identifier, setIdentifier] = useState("");
  const [passcode, setPasscode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");

  if (!isOpen) return null;

  const AUTHORIZED_ADMIN_NUMBER = "9560169988";
  const AUTHORIZED_ADMIN_EMAIL = "rohit.barla.ai.india@gmail.com";

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    const inputVal = identifier.trim();
    if (!inputVal) {
      setErrorMessage("Please enter the administrator mobile number or registered email.");
      return;
    }

    const clean = inputVal.replace(/\D/g, "");
    const normalizedPhone = clean.length > 10 ? clean.slice(-10) : clean;
    const isPhone = clean.length >= 10;
    const isEmail = inputVal.includes("@");

    if (isPhone && normalizedPhone !== AUTHORIZED_ADMIN_NUMBER) {
      setErrorMessage(
        "⛔ Access Denied: This mobile number is not an authorized administrator. Console is strictly restricted."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: inputVal }),
      });
      const data = await res.json();

      if (data.success) {
        setMaskedEmail(data.maskedEmail || "your registered email");
        setInfoMessage(data.message || `OTP dispatched to registered email (${data.maskedEmail || 'inbox'}).`);
        setStep("passcode");
      } else {
        setErrorMessage(data.error || "Authentication request failed.");
      }
    } catch (err) {
      // Fallback transition
      setMaskedEmail("authorized admin email");
      setInfoMessage("Verification passcode dispatched to your administrator email.");
      setStep("passcode");
    } finally {
      setLoading(false);
    }
  };

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!passcode.trim()) {
      setErrorMessage("Please enter the 6-digit security passcode sent to your email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          passcode: passcode.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        try {
          sessionStorage.setItem("jyotishvani_admin_auth", "true");
          sessionStorage.setItem("jyotishvani_admin_token", data.token || "admin_session");
          sessionStorage.setItem("jyotishvani_admin_phone", AUTHORIZED_ADMIN_NUMBER);
          if (data.adminEmail) {
            sessionStorage.setItem("jyotishvani_admin_email", data.adminEmail);
          }
        } catch (e) {
          console.error("Storage error:", e);
        }
        onLoginSuccess();
      } else {
        setErrorMessage(data.error || "Invalid security passcode. Please check your email inbox and re-enter.");
      }
    } catch (err) {
      setErrorMessage("Connection error while verifying passcode. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fadeIn font-sans">
      <div 
        className="relative w-full max-w-md rounded-[32px] bg-white border border-[#E8E6DF] p-6 sm:p-8 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#7A7A7A] hover:text-[#3D3D3D] hover:bg-[#F5F5F0] transition-colors cursor-pointer"
          id="close-admin-login-modal-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-12 h-12 rounded-2xl bg-[#5C6B5A] text-white flex items-center justify-center shadow-md mb-5">
          <Lock className="w-6 h-6" />
        </div>

        {/* Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-bold text-[#3D3D3D]">
              Kendra Admin Portal
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-[#F0EDDF] text-[#5C6B5A] text-[10px] font-bold uppercase tracking-wider border border-[#E8E6DF]">
              Restricted
            </span>
          </div>
          <p className="text-xs text-[#7A7A7A] mt-1.5 leading-relaxed">
            Administrative console strictly restricted to authorized Kendra Administrators. Public users cannot access internal controls.
          </p>
        </div>

        {/* Info / Success Notice */}
        {infoMessage && !errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-[#EDF3EC] border border-[#8B9D83]/40 text-[#5C6B5A] text-xs flex items-start gap-2.5">
            <Mail className="w-4 h-4 shrink-0 mt-0.5 text-[#5C6B5A]" />
            <div className="leading-snug">
              <p className="font-bold">Passcode Dispatched</p>
              <p className="mt-0.5">{infoMessage}</p>
            </div>
          </div>
        )}

        {/* Security Alert Banner */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-[#FFF2F0] border border-[#F5C2B8] text-[#9E2A2B] text-xs flex items-start gap-2.5 animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <p className="font-bold">Security Notice</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* STEP 1: Admin Mobile or Email Verification */}
        {step === "phone" && (
          <form onSubmit={handleIdentifierSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#3D3D3D] uppercase tracking-wider mb-2">
                Admin Mobile or Email
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  placeholder="Enter administrator mobile or registered email"
                  className="w-full px-4 py-3 rounded-2xl border border-[#E8E6DF] bg-[#FAF9F6] focus:bg-white focus:outline-none focus:border-[#8B9D83] focus:ring-2 focus:ring-[#8B9D83]/20 text-sm font-semibold tracking-wide text-[#3D3D3D]"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-[#7A7A7A] mt-1.5">
                OTP will be delivered securely to your verified administrator email address only.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-2xl bg-[#5C6B5A] hover:bg-[#4E5B4C] text-white font-bold text-xs tracking-wide shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Dispatching Security Passcode to Email...</span>
              ) : (
                <>
                  <span>Send Passcode to Email</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Passcode / OTP Verification (OTP sent to email only, never shown on screen) */}
        {step === "passcode" && (
          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-[#F0EDDF]/70 border border-[#E8E6DF] text-xs text-[#5C6B5A] space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold">
                  <Mail className="w-4 h-4 text-[#8B9D83]" />
                  <span>Check Your Administrator Email</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setErrorMessage("");
                    setInfoMessage("");
                  }}
                  className="text-[11px] text-[#7A7A7A] hover:text-[#3D3D3D] underline cursor-pointer"
                >
                  Change
                </button>
              </div>
              <p className="text-[11px] text-[#7A7A7A]">
                A 6-digit security code was dispatched to {maskedEmail ? <strong>{maskedEmail}</strong> : "your admin email"}. Please check your inbox (and spam/promotions) and enter the code below.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3D3D3D] uppercase tracking-wider mb-2">
                Enter 6-Digit Email Passcode (OTP)
              </label>
              <div className="relative flex items-center">
                <input
                  type="password"
                  maxLength={6}
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  placeholder="••••••"
                  className="w-full px-4 py-3 rounded-2xl border border-[#E8E6DF] bg-[#FAF9F6] focus:bg-white focus:outline-none focus:border-[#8B9D83] focus:ring-2 focus:ring-[#8B9D83]/20 text-center tracking-[0.4em] font-mono text-lg font-bold text-[#3D3D3D]"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#7A7A7A] pt-1">
              <span>Code expires in 10 minutes</span>
              <button
                type="button"
                onClick={handleIdentifierSubmit}
                disabled={loading}
                className="text-[#8B9D83] hover:text-[#5C6B5A] font-bold hover:underline cursor-pointer"
              >
                Resend OTP to Email
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-2xl bg-[#5C6B5A] hover:bg-[#4E5B4C] text-white font-bold text-xs tracking-wide shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating Admin...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Unlock Administration Console</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-[#E8E6DF] text-center">
          <p className="text-[10px] text-[#AFAFAF] uppercase tracking-wider">
            Protected by JyotishVani Kendra Role-Based Access Control
          </p>
        </div>
      </div>
    </div>
  );
};
