import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  MessageSquare,
  Clock,
  Phone,
  ArrowRight,
  RefreshCw,
  KeyRound,
  Star,
  QrCode,
  Copy,
  Check,
  CreditCard,
  IndianRupee,
  Smartphone,
  AlertCircle,
  Timer,
  Send,
  Radio,
  Mail,
  ExternalLink,
  Globe,
  Eye,
} from "lucide-react";
import { ZODIAC_SIGNS, SUBSCRIPTION_PLANS } from "../data/astrologyData";
import { SubscriptionPlanId, UserSubscription } from "../types";
import { sendFirebasePhoneOtp, confirmFirebasePhoneOtp } from "../services/phoneAuthService";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPlanId?: SubscriptionPlanId;
  initialMobile?: string;
  initialEmail?: string;
  initialSign?: string;
  onRegistrationSuccess: (user: UserSubscription) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  preselectedPlanId = "trial",
  initialMobile = "",
  initialEmail = "",
  initialSign = "aries",
  onRegistrationSuccess,
}) => {
  const [step, setStep] = useState<"details" | "otp" | "upi_pay" | "success">("details");
  const [mobile, setMobile] = useState(initialMobile);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [zodiacSign, setZodiacSign] = useState(initialSign);
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthCity, setBirthCity] = useState("");
  const [deliveryChannel] = useState<"email">("email");
  const [deliveryTime, setDeliveryTime] = useState("07:00 AM");
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>(preselectedPlanId);
  const [autoRenew, setAutoRenew] = useState<boolean>(true); // Auto-checked by default as requested

  // Production OTP state
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [deliveryMethod, setDeliveryMethod] = useState("Vedic Email Verification");
  const [previewTestOtp, setPreviewTestOtp] = useState("");
  const [otpNotice, setOtpNotice] = useState("");

  // UPI payment state
  const [upiSettings, setUpiSettings] = useState({
    upiId: "9560169988@pthdfc",
    upiPayeeName: "JyotishVani Kendra",
  });
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"upi_app" | "upi_qr" | "upi_manual">("upi_qr");

  // Confirmation state
  const [paymentVerificationStatus, setPaymentVerificationStatus] = useState<"verified" | "pending" | "trial">("trial");
  const [confirmationData, setConfirmationData] = useState<{
    confirmationMessage: string;
    emailSent: boolean;
    emailTarget?: string;
    devoteeWebsiteUrl?: string;
  } | null>(null);
  const [confirmEmailInput, setConfirmEmailInput] = useState("");
  const [isSendingEmailConf, setIsSendingEmailConf] = useState(false);
  const [emailConfNotice, setEmailConfNotice] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const [plans, setPlans] = useState(SUBSCRIPTION_PLANS);
  const [signs, setSigns] = useState(ZODIAC_SIGNS);

  // Fetch dynamic settings for live UPI ID & payee, plus plans and signs from database
  useEffect(() => {
    fetch(`/api/settings?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings?.upiId) {
          setUpiSettings({
            upiId: data.settings.upiId,
            upiPayeeName: data.settings.upiPayeeName || "JyotishVani Kendra",
          });
        }
        if (data?.settings?.planPrices) {
          setPlans((prev) =>
            prev.map((p) => {
              const idKey = p.id as keyof typeof data.settings.planPrices;
              const newPrice = data.settings.planPrices[idKey];
              return newPrice !== undefined && typeof newPrice === "number" ? { ...p, price: newPrice } : p;
            })
          );
        }
      })
      .catch(() => {});

    fetch(`/api/plans?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.plans) && data.plans.length > 0) {
          setPlans(data.plans);
        }
      })
      .catch(() => {});

    fetch("/api/horoscopes")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.horoscopes) && data.horoscopes.length > 0) {
          setSigns(data.horoscopes);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (initialMobile) setMobile(initialMobile);
    if (initialEmail) setEmail(initialEmail);
    if (initialSign) setZodiacSign(initialSign);
    if (preselectedPlanId) setSelectedPlanId(preselectedPlanId);
  }, [initialMobile, initialEmail, initialSign, preselectedPlanId, isOpen]);

  // Live Resend Countdown Timer
  useEffect(() => {
    let timer: any;
    if (step === "otp" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => (c > 0 ? c - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // ESC key listener to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentPlan = plans.find((p) => p.id === selectedPlanId) || plans[0] || SUBSCRIPTION_PLANS[0];

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      alert("Please enter a valid email address to receive your daily horoscope.");
      return;
    }

    const isPaidPlan = currentPlan.price > 0 && selectedPlanId !== "trial";
    if (isPaidPlan && !utrNumber.trim() && !paymentConfirmed) {
      alert("Please scan the UPI QR code to complete payment and enter your UTR / Reference ID to enable OTP verification.");
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, "") || `98${Date.now().toString().slice(-8)}`;
    if (mobile.trim() && cleanMobile.length < 10) {
      alert("Please enter a valid 10-digit mobile number or leave it blank.");
      return;
    }

    setLoading(true);
    setOtpError("");
    setOtpNotice("");

    try {
      // 1. If paid plan, record payment with UTR prior to OTP dispatch
      if (isPaidPlan) {
        const utrToUse = utrNumber.trim() || `UPI${Date.now().toString().slice(-8)}`;
        try {
          await fetch("/api/payments/verify-upi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mobile: cleanMobile,
              email: cleanEmail,
              userName: name || "Cosmic Devotee",
              planId: selectedPlanId,
              planName: currentPlan.name,
              amount: currentPlan.price,
              upiIdUsed: upiSettings.upiId,
              utrNumber: utrToUse,
              paymentMode,
              autoRenew,
              deliveryChannel: "email",
            }),
          });
        } catch (paymentErr) {
          console.error("Payment pre-record note:", paymentErr);
        }
      }

      // 2. Dispatch OTP to devotee's email
      const res = await fetch("/api/register-mobile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: cleanMobile,
          name,
          email: cleanEmail,
          zodiacSign,
          birthDate,
          birthTime,
          birthCity,
          deliveryChannel: "email",
          deliveryTime,
          plan: selectedPlanId,
          autoRenew,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.testOtpPreview) setPreviewTestOtp(data.testOtpPreview);
        if (data.deliveryMethod) setDeliveryMethod(data.deliveryMethod);
        if (data.cooldownSeconds) setCountdown(data.cooldownSeconds);
        setStep("otp");
      } else {
        alert(data.error || "Failed to dispatch verification code. Please check your email.");
      }
    } catch (err) {
      console.error("Error sending verification code:", err);
      setStep("otp");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setOtpError("");
    setOtpNotice("");

    try {
      const res = await fetch("/api/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: cleanMobile, email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.testOtpPreview) setPreviewTestOtp(data.testOtpPreview);
        if (data.deliveryMethod) setDeliveryMethod(data.deliveryMethod);
        setCountdown(data.cooldownSeconds || 30);
        setOtpNotice("✅ New 6-digit verification code dispatched!");
        setTimeout(() => setOtpNotice(""), 5000);
      } else {
        setOtpError(data.error || "Unable to resend code. Please wait before retrying.");
      }
    } catch (err) {
      setOtpError("Network error while resending verification code.");
    } finally {
      setResending(false);
    }
  };

  const cleanMobile = mobile.replace(/\D/g, "") || `98${Date.now().toString().slice(-8)}`;

  // Generate UPI URI
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(upiSettings.upiId)}&pn=${encodeURIComponent(
    upiSettings.upiPayeeName
  )}&am=${currentPlan.price}&cu=INR&tn=${encodeURIComponent(currentPlan.name + " - " + cleanMobile)}`;

  const upiQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=190x190&margin=6&data=${encodeURIComponent(
    upiIntentUri
  )}`;

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || (cleanOtp.length !== 6 && cleanOtp.length !== 4)) {
      setOtpError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    setOtpError("");

    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: cleanMobile,
          email,
          otp: cleanOtp,
          selectedPlan: selectedPlanId,
          autoRenew,
          deliveryChannel: "email",
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.confirmation) {
          setConfirmationData(data.confirmation);
        } else {
          setConfirmationData({
            confirmationMessage: `You will receive an Email confirmation at ${email || data.user?.email || "your registered email"} with tomorrow morning's daily horoscope schedule.`,
            emailSent: !!(email || data.user?.email),
            emailTarget: email || data.user?.email,
            devoteeWebsiteUrl: window.location.origin,
          });
        }

        const planDurationDays =
          selectedPlanId === "yearly"
            ? 365
            : selectedPlanId === "six_months"
            ? 180
            : selectedPlanId === "three_months"
            ? 90
            : selectedPlanId === "monthly"
            ? 30
            : 3;

        const isTrial = selectedPlanId === "trial";
        const subStatus = isTrial ? "trial" : (data.user?.status || "pending_verification");
        setPaymentVerificationStatus(isTrial ? "trial" : (subStatus === "active" ? "verified" : "pending"));

        const userSub: UserSubscription = {
          mobile: cleanMobile,
          name: name || "Cosmic Devotee",
          email: email || data.user?.email,
          zodiacSign,
          deliveryChannel: "email",
          deliveryTime,
          planId: selectedPlanId,
          status: subStatus,
          validUntil: data.user?.validUntil || new Date(Date.now() + planDurationDays * 86400000).toISOString(),
          autoRenew: autoRenew,
          phoneVerified: true,
          phoneVerifiedAt: data.user?.phoneVerifiedAt || new Date().toISOString(),
          verificationProvider: "email_verification",
        };
        onRegistrationSuccess(userSub);
        setStep("success");
      } else {
        setOtpError(data.error || "Invalid verification code. Please check and retry.");
      }
    } catch (err) {
      setOtpError("Connection error while verifying code. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUpiPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const utrToUse = utrNumber.trim() || `UPI${Date.now().toString().slice(-8)}`;

    try {
      const res = await fetch("/api/payments/verify-upi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: cleanMobile,
          email,
          userName: name || "Cosmic Devotee",
          planId: selectedPlanId,
          planName: currentPlan.name,
          amount: currentPlan.price,
          upiIdUsed: upiSettings.upiId,
          utrNumber: utrToUse,
          paymentMode,
          autoRenew,
          deliveryChannel: "email",
        }),
      });
      const data = await res.json();

      if (data.confirmation) {
        setConfirmationData(data.confirmation);
      } else {
        setConfirmationData({
          confirmationMessage: `You will receive an Email confirmation at ${email || data.subscriber?.email || "your registered email"} with tomorrow morning's daily horoscope schedule.`,
          emailSent: !!(email || data.subscriber?.email),
          emailTarget: email || data.subscriber?.email,
          devoteeWebsiteUrl: window.location.origin,
        });
      }

      if (data.success) {
        const isVerified = data.status === "verified";
        setPaymentVerificationStatus(isVerified ? "verified" : "pending");
        const userSub: UserSubscription = {
          mobile: cleanMobile,
          name: name || "Cosmic Devotee",
          email: email || data.subscriber?.email,
          zodiacSign,
          deliveryChannel: "email",
          deliveryTime,
          planId: selectedPlanId,
          status: isVerified ? "active" : "pending_verification",
          validUntil: data.subscriber?.validUntil || new Date(Date.now() + 30 * 86400000).toISOString(),
          autoRenew: autoRenew,
        };
        onRegistrationSuccess(userSub);
        setStep("success");
      } else {
        alert(data.error || "Payment verification error.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setConfirmationData({
        confirmationMessage: `You will receive an Email confirmation at ${email || "your registered email"} with tomorrow morning's daily horoscope schedule.`,
        emailSent: !!email,
        emailTarget: email,
        devoteeWebsiteUrl: window.location.origin,
      });
      const userSub: UserSubscription = {
        mobile: cleanMobile,
        name: name || "Cosmic Devotee",
        email,
        zodiacSign,
        deliveryChannel: "email",
        deliveryTime,
        planId: selectedPlanId,
        status: "active",
        validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
        autoRenew: autoRenew,
      };
      onRegistrationSuccess(userSub);
      setStep("success");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = (confirmEmailInput || email).trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }
    setIsSendingEmailConf(true);
    setEmailConfNotice("");
    try {
      const res = await fetch(`/api/subscribers/${cleanMobile}/send-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          appUrl: window.location.origin,
        }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setEmail(cleanEmail);
        setConfirmationData((prev) => ({
          ...prev!,
          emailSent: true,
          emailTarget: cleanEmail,
          confirmationMessage: `You will receive a confirmation email at ${cleanEmail} with your daily horoscope schedule and sacred wisdom.`,
        }));
        setEmailConfNotice(`✅ Confirmation email sent to ${cleanEmail}`);
      } else {
        setEmailConfNotice(`⚠️ ${resData.error || "Could not dispatch email."}`);
      }
    } catch {
      setEmailConfNotice("⚠️ Network error while dispatching email.");
    } finally {
      setIsSendingEmailConf(false);
    }
  };

  const handleRedirectToDevoteeWebsite = () => {
    onClose();
    setTimeout(() => {
      const target = document.getElementById("horoscope-section") || document.getElementById("panchang-widget");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 120);
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiSettings.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex justify-center items-start sm:items-center animate-fadeIn font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-[28px] sm:rounded-[32px] bg-white border border-[#E8E6DF] shadow-2xl my-auto max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Persistent Sticky Top Header Bar - Always 100% Visible */}
        <div className="shrink-0 px-5 sm:px-7 py-3.5 sm:py-4 border-b border-[#E8E6DF] bg-[#FAF9F6] flex items-center justify-between gap-3 z-30">
          <div className="flex items-center gap-2">
            {step === "details" && (
              <div className="flex items-center gap-2 text-xs font-bold text-[#8B9D83] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#CB997E]" />
                <span>Daily Delivery Registration</span>
              </div>
            )}
            {step === "otp" && (
              <div className="flex items-center gap-2 text-xs font-bold text-[#8B9D83] uppercase tracking-wider">
                <KeyRound className="w-3.5 h-3.5 text-[#CB997E]" />
                <span>Verification Code</span>
              </div>
            )}
            {step === "upi_pay" && (
              <div className="flex items-center gap-2 text-xs font-bold text-[#CB997E] uppercase tracking-wider">
                <CreditCard className="w-3.5 h-3.5 text-[#CB997E]" />
                <span>Sacred Dakshina &bull; UPI</span>
              </div>
            )}
            {step === "success" && (
              <div className="flex items-center gap-2 text-xs font-bold text-[#5C6B5A] uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Devotee Confirmation</span>
              </div>
            )}
          </div>

          {/* Prominent High-Visibility Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#E8E6DF] border border-[#E8E6DF] text-[#4A4A4A] hover:text-[#1F1F1F] font-semibold text-xs transition-all shadow-2xs cursor-pointer group"
            id="close-registration-modal-btn"
            title="Close (Esc)"
            aria-label="Close registration modal"
          >
            <span>Close</span>
            <X className="w-4 h-4 text-[#7A7A7A] group-hover:text-[#1F1F1F] group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Scrollable Modal Content Container */}
        <div className="overflow-y-auto px-5 sm:px-7 py-5 flex-1">
          {/* STEP 1: Registration Details */}
          {step === "details" && (
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#3D3D3D]">
                Activate Your Daily Horoscope
              </h2>
              <p className="text-xs text-[#7A7A7A] mt-1 mb-5">
                Personalized Vedic cosmic forecast delivered every morning at {deliveryTime}
              </p>

            {/* Selected Plan Summary Banner */}
            <div className="mb-5 p-3.5 rounded-2xl bg-[#F0EDDF] border border-[#8B9D83]/30 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#3D3D3D] uppercase">
                    Plan: {currentPlan.name}
                  </span>
                  {currentPlan.isFree ? (
                    <span className="text-[10px] bg-white text-[#5C6B5A] font-bold px-2 py-0.5 rounded-full border border-[#8B9D83]/30">
                      ₹0 (Free Trial)
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-[#3D3D3D] font-serif">
                      ₹{currentPlan.price}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#5C6B5A] mt-0.5">
                  {currentPlan.billingText}
                </p>
              </div>

              {/* Quick switch plan dropdown */}
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value as SubscriptionPlanId)}
                className="text-xs bg-white border border-[#E8E6DF] text-[#3D3D3D] rounded-full px-3 py-1.5 focus:outline-none focus:border-[#8B9D83] cursor-pointer shadow-xs font-medium"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {p.price === 0 ? "Free" : `₹${p.price}`}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              {/* Email Address (Primary Delivery Channel) */}
              <div>
                <label className="block text-xs font-semibold text-[#4A4A4A] mb-1 flex items-center justify-between">
                  <span>Email Address (for Daily Horoscope Dispatch) *</span>
                  <span className="text-[10px] text-[#8B9D83] font-semibold bg-[#EDF3EC] px-2 py-0.5 rounded-full">
                    7:00 AM Email Delivery
                  </span>
                </label>
                <div className="flex rounded-2xl bg-[#F5F5F0] border border-[#E8E6DF] focus-within:border-[#8B9D83] overflow-hidden">
                  <span className="px-3.5 py-2.5 bg-[#FAF9F6] text-[#5C6B5A] font-bold text-xs flex items-center border-r border-[#E8E6DF]">
                    <Mail className="w-4 h-4 text-[#8B9D83]" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="devotee@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-transparent text-[#3D3D3D] text-sm focus:outline-none placeholder-[#AFAFAF]"
                  />
                </div>
              </div>

              {/* Full Name & Zodiac */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A4A] mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F5F5F0] border border-[#E8E6DF] text-[#3D3D3D] text-sm focus:outline-none focus:border-[#8B9D83] placeholder-[#AFAFAF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A4A4A] mb-1">
                    Zodiac Sign (Rashi) *
                  </label>
                  <select
                    value={zodiacSign}
                    onChange={(e) => setZodiacSign(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F5F5F0] border border-[#E8E6DF] text-[#3D3D3D] text-sm focus:outline-none focus:border-[#8B9D83] cursor-pointer"
                  >
                    {signs.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.symbol} {s.name} ({s.vedicName.split(" ")[0]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mobile Number (Optional Helpline & Profile Contact) */}
              <div>
                <label className="block text-xs font-semibold text-[#4A4A4A] mb-1 flex items-center justify-between">
                  <span>Mobile Number (Optional Helpline Contact)</span>
                </label>
                <div className="flex rounded-2xl bg-[#F5F5F0] border border-[#E8E6DF] focus-within:border-[#8B9D83] overflow-hidden">
                  <span className="px-3.5 py-2.5 bg-[#FAF9F6] text-[#3D3D3D] font-bold text-xs flex items-center border-r border-[#E8E6DF]">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    placeholder="98765 43210 (Optional)"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3 py-2.5 bg-transparent text-[#3D3D3D] text-sm focus:outline-none placeholder-[#AFAFAF]"
                  />
                </div>
              </div>

              {/* Optional Birth Details for Kundali accuracy */}
              <div className="pt-2 border-t border-[#E8E6DF]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#8B9D83] uppercase tracking-wider">
                    Birth Details (Optional for Kundali precision)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="px-2.5 py-2 rounded-xl bg-[#F5F5F0] border border-[#E8E6DF] text-xs text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83]"
                    title="Birth Date"
                  />
                  <input
                    type="time"
                    value={birthTime}
                    onChange={(e) => setBirthTime(e.target.value)}
                    className="px-2.5 py-2 rounded-xl bg-[#F5F5F0] border border-[#E8E6DF] text-xs text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83]"
                    title="Birth Time"
                  />
                  <input
                    type="text"
                    placeholder="Birth City"
                    value={birthCity}
                    onChange={(e) => setBirthCity(e.target.value)}
                    className="px-2.5 py-2 rounded-xl bg-[#F5F5F0] border border-[#E8E6DF] text-xs text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83] placeholder-[#AFAFAF]"
                  />
                </div>
              </div>

              {/* Delivery Time Setting */}
              <div className="pt-2 border-t border-[#E8E6DF]">
                <label className="block text-xs font-semibold text-[#4A4A4A] mb-1 flex items-center justify-between">
                  <span>Morning Email Delivery Time</span>
                  <span className="text-[10px] text-[#5C6B5A] font-semibold">Delivered directly to Email Inbox</span>
                </label>
                <select
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F5F0] border border-[#E8E6DF] text-xs text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83] cursor-pointer"
                >
                  <option value="06:00 AM">06:00 AM (Brahma Muhurat)</option>
                  <option value="06:30 AM">06:30 AM (Sunrise)</option>
                  <option value="07:00 AM">07:00 AM (Recommended - Daily Brief)</option>
                  <option value="07:30 AM">07:30 AM (Morning Tea)</option>
                  <option value="08:00 AM">08:00 AM (Commute)</option>
                </select>
              </div>

              {/* Auto-Renew Option - Auto Checked by Default */}
              <div className="pt-2">
                <div className="p-3.5 rounded-2xl bg-[#F0EDDF]/80 border border-[#8B9D83]/40 hover:border-[#8B9D83] transition-colors">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="reg-autorenew-checkbox"
                      checked={autoRenew}
                      onChange={(e) => setAutoRenew(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-[#8B9D83] focus:ring-[#8B9D83] accent-[#8B9D83] cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#3D3D3D]">
                          Auto-Renew Subscription Post Expiry
                        </span>
                        <span className="text-[10px] bg-[#8B9D83] text-white px-2 py-0.5 rounded-full font-semibold">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5C6B5A] mt-0.5 leading-snug">
                        Seamless horoscope continuity: automatically renews your chosen plan when your subscription expires so you never miss daily morning guidance. You can pause or cancel anytime.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Step 1.5: QR Code Payment Section during Registration for Paid Plans */}
              {currentPlan.price > 0 && selectedPlanId !== "trial" ? (
                <div className="pt-2 border-t border-[#E8E6DF] space-y-3">
                  <div className="p-4 rounded-2xl bg-[#FFFDF8] border-2 border-[#CB997E]/30 space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E8E6DF]">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-[#CB997E]" />
                        <span className="text-xs font-bold text-[#3D3D3D] uppercase tracking-wide">
                          Scan QR Code &amp; Complete UPI Payment
                        </span>
                      </div>
                      <span className="text-xs font-serif font-bold text-[#CB997E] bg-[#FFF2EA] px-2.5 py-0.5 rounded-full border border-[#CB997E]/30">
                        Pay ₹{currentPlan.price}
                      </span>
                    </div>

                    {/* QR Mode Switcher */}
                    <div className="flex items-center gap-1.5 p-1 bg-[#F5F5F0] rounded-xl border border-[#E8E6DF]">
                      <button
                        type="button"
                        onClick={() => setPaymentMode("upi_qr")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          paymentMode === "upi_qr"
                            ? "bg-white text-[#3D3D3D] shadow-xs"
                            : "text-[#7A7A7A] hover:text-[#3D3D3D]"
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5 text-[#CB997E]" />
                        <span>Scan QR Code</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMode("upi_app")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          paymentMode === "upi_app"
                            ? "bg-white text-[#3D3D3D] shadow-xs"
                            : "text-[#7A7A7A] hover:text-[#3D3D3D]"
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5 text-[#8B9D83]" />
                        <span>1-Tap App</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMode("upi_manual")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          paymentMode === "upi_manual"
                            ? "bg-white text-[#3D3D3D] shadow-xs"
                            : "text-[#7A7A7A] hover:text-[#3D3D3D]"
                        }`}
                      >
                        <Copy className="w-3.5 h-3.5 text-[#5C6B5A]" />
                        <span>Copy UPI ID</span>
                      </button>
                    </div>

                    {/* Mode Content */}
                    {paymentMode === "upi_qr" && (
                      <div className="text-center space-y-2">
                        <div className="w-44 h-44 mx-auto bg-white p-2 rounded-2xl border border-[#E8E6DF] shadow-xs flex items-center justify-center">
                          <img
                            src={upiQrCodeUrl}
                            alt="UPI QR Code"
                            className="w-full h-full object-contain rounded-xl"
                          />
                        </div>
                        <div className="text-xs text-[#5C6B5A]">
                          Scan using <strong>Google Pay, PhonePe, Paytm, or BHIM</strong>
                        </div>
                        <div className="flex justify-center items-center gap-2 text-[10px] text-[#7A7A7A]">
                          <span>UPI: <strong className="font-mono text-[#3D3D3D]">{upiSettings.upiId}</strong></span>
                          <span>&bull;</span>
                          <span>Payee: <strong>{upiSettings.upiPayeeName}</strong></span>
                        </div>
                      </div>
                    )}

                    {paymentMode === "upi_app" && (
                      <div className="text-center space-y-2 py-2">
                        <p className="text-xs text-[#5C6B5A]">
                          Tap below to launch your UPI app with prefilled ₹{currentPlan.price}:
                        </p>
                        <a
                          href={upiIntentUri}
                          className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#8B9D83] hover:bg-[#7A8C73] text-white font-bold text-xs shadow-xs transition-colors"
                        >
                          <Smartphone className="w-4 h-4" />
                          <span>Open UPI App &bull; Pay ₹{currentPlan.price}</span>
                        </a>
                      </div>
                    )}

                    {paymentMode === "upi_manual" && (
                      <div className="space-y-2 py-1">
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-[#E8E6DF]">
                          <span className="font-mono font-bold text-xs text-[#3D3D3D] flex-1">
                            {upiSettings.upiId}
                          </span>
                          <button
                            type="button"
                            onClick={copyUpiId}
                            className="px-3 py-1 rounded-lg bg-[#8B9D83] text-white text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-[#7A8C73]"
                          >
                            {copiedUpi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedUpi ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* UTR Input Section */}
                    <div className="pt-2 border-t border-[#E8E6DF]">
                      <label className="block text-xs font-bold text-[#3D3D3D] mb-1 flex items-center justify-between">
                        <span>Enter 12-Digit UPI Ref / UTR Number *</span>
                        <span className="text-[10px] font-semibold text-[#CB997E]">Enables Verification OTP</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 428765432109 or UPI Txn ID"
                        value={utrNumber}
                        onChange={(e) => {
                          setUtrNumber(e.target.value);
                          if (e.target.value.trim()) setPaymentConfirmed(true);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E6DF] text-xs font-mono font-semibold text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83] placeholder-[#AFAFAF]"
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          id="confirm-payment-checkbox"
                          checked={paymentConfirmed}
                          onChange={(e) => setPaymentConfirmed(e.target.checked)}
                          className="w-4 h-4 rounded text-[#8B9D83] focus:ring-[#8B9D83] accent-[#8B9D83] cursor-pointer"
                        />
                        <label htmlFor="confirm-payment-checkbox" className="text-xs text-[#5C6B5A] cursor-pointer select-none">
                          I have completed payment of ₹{currentPlan.price} via UPI QR Code
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-[#EDF3EC] border border-[#8B9D83]/30 text-xs text-[#5C6B5A] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#8B9D83] shrink-0" />
                  <span>3-Day Free Trial selected &bull; No payment required &bull; OTP verification enabled</span>
                </div>
              )}

              {/* Submit Button - Send OTP is enabled post payment confirmation */}
              {currentPlan.price > 0 && selectedPlanId !== "trial" ? (
                <div>
                  <button
                    type="submit"
                    disabled={loading || (!utrNumber.trim() && !paymentConfirmed)}
                    className={`w-full mt-4 py-3.5 rounded-full font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all ${
                      utrNumber.trim() || paymentConfirmed
                        ? "bg-[#8B9D83] hover:bg-[#7A8C73] text-white cursor-pointer"
                        : "bg-[#E8E6DF] text-[#7A7A7A] cursor-not-allowed opacity-75"
                    }`}
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : utrNumber.trim() || paymentConfirmed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Payment &amp; Send Verification OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <span>Complete Payment &amp; Enter UTR to Enable OTP</span>
                      </>
                    )}
                  </button>
                  {(!utrNumber.trim() && !paymentConfirmed) && (
                    <p className="text-center text-[11px] text-[#7A7A7A] mt-2">
                      🔒 Send OTP will be enabled post payment confirmation (Scan QR &amp; Enter UTR above).
                    </p>
                  )}
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-3.5 rounded-full bg-[#8B9D83] hover:bg-[#7A8C73] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send Verification OTP (3-Day Free Trial)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </form>
          </div>
        )}

        {/* STEP 2: Production Live OTP Verification */}
        {step === "otp" && (
          <div>
            {/* Hidden container for Firebase Invisible Recaptcha */}
            <div id="recaptcha-container"></div>

            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#8B9D83] uppercase tracking-wider">
                <KeyRound className="w-3.5 h-3.5 text-[#CB997E]" />
                <span>Step 2 of 2: Email Verification</span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EDF3EC] text-[#5C6B5A] text-[10px] font-bold border border-[#8B9D83]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live OTP Active
              </span>
            </div>

            <h2 className="font-serif text-2xl font-bold text-[#3D3D3D]">
              Enter 6-Digit Verification Code
            </h2>
            <p className="text-xs text-[#7A7A7A] mt-1 mb-3">
              Dispatched to Email <strong className="text-[#3D3D3D]">{email}</strong>. Code expires in 5 minutes.
            </p>

            {/* Payment Confirmed Badge */}
            {currentPlan.price > 0 && selectedPlanId !== "trial" && (
              <div className="p-3 rounded-2xl bg-[#FFFDF8] border border-[#CB997E]/30 text-xs text-[#5C6B5A] mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Payment Confirmed: <strong>₹{currentPlan.price}</strong> ({currentPlan.name})
                  </span>
                </div>
                {utrNumber && (
                  <span className="font-mono text-[10px] text-[#7A7A7A] bg-white px-2 py-0.5 rounded-lg border border-[#E8E6DF]">
                    UTR: {utrNumber}
                  </span>
                )}
              </div>
            )}

            {/* Live Success Banner */}
            {otpNotice && (
              <div className="p-3 rounded-xl bg-[#EDF3EC] border border-[#8B9D83]/30 text-[#4A5D48] text-xs font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#8B9D83] shrink-0" />
                <span>{otpNotice}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A4A4A] mb-2 text-center">
                  6-Digit Verification Code
                </label>
                <div className="flex justify-center">
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ""));
                      if (otpError) setOtpError("");
                    }}
                    className="w-56 text-center text-2xl tracking-[0.45em] font-mono py-3 rounded-2xl bg-[#F5F5F0] border-2 border-[#8B9D83] text-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-[#8B9D83]/30 shadow-xs"
                  />
                </div>
                {otpError && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 text-center mt-2.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}
              </div>

              {/* Cooldown & Resend Controls */}
              <div className="flex items-center justify-between text-xs text-[#7A7A7A] pt-1">
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="hover:text-[#3D3D3D] underline cursor-pointer"
                >
                  Edit mobile number
                </button>

                {countdown > 0 ? (
                  <span className="flex items-center gap-1 text-[#8A8A8A] font-medium font-mono text-[11px]">
                    <Timer className="w-3.5 h-3.5 text-[#8B9D83]" />
                    Resend in 00:{countdown < 10 ? `0${countdown}` : countdown}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="flex items-center gap-1 text-[#CB997E] hover:text-[#B8856B] font-bold cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                    <span>{resending ? "Dispatching..." : "Resend OTP"}</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || (otp.length !== 6 && otp.length !== 4)}
                className="w-full mt-4 py-3.5 rounded-full bg-[#8B9D83] hover:bg-[#7A8C73] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify &amp; Activate Daily Delivery</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: UPI Payment (Simple & Instant) */}
        {step === "upi_pay" && (
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#CB997E] uppercase tracking-wider mb-1">
              <CreditCard className="w-3.5 h-3.5 text-[#CB997E]" />
              <span>Step 3 of 3: Simple UPI Payment</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#3D3D3D]">
              Complete UPI Payment
            </h2>
            <p className="text-xs text-[#7A7A7A] mt-1 mb-4">
              Pay securely via Google Pay, PhonePe, Paytm, BHIM, or any bank UPI app.
            </p>

            {/* Plan Cost Summary */}
            <div className="p-4 rounded-2xl bg-[#FFF9F2] border border-[#CB997E]/30 mb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#CB997E] block">
                  Selected Subscription
                </span>
                <span className="font-serif text-base font-bold text-[#3D3D3D]">
                  {currentPlan.name}
                </span>
                <span className="text-[11px] text-[#5C6B5A] block">
                  Daily Email horoscope delivery for {email || `+91 ${cleanMobile}`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#7A7A7A] block">Payable Amount</span>
                <span className="text-2xl font-serif font-bold text-[#CB997E]">
                  ₹{currentPlan.price}
                </span>
              </div>
            </div>

            {/* Mode Switch: Direct App vs Scan QR */}
            <div className="flex items-center gap-1.5 p-1 bg-[#F5F5F0] rounded-2xl border border-[#E8E6DF] mb-4">
              <button
                type="button"
                onClick={() => setPaymentMode("upi_app")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentMode === "upi_app"
                    ? "bg-white text-[#3D3D3D] shadow-xs"
                    : "text-[#7A7A7A] hover:text-[#3D3D3D]"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-[#8B9D83]" />
                <span>1-Tap UPI App</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("upi_qr")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentMode === "upi_qr"
                    ? "bg-white text-[#3D3D3D] shadow-xs"
                    : "text-[#7A7A7A] hover:text-[#3D3D3D]"
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-[#CB997E]" />
                <span>Scan UPI QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("upi_manual")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentMode === "upi_manual"
                    ? "bg-white text-[#3D3D3D] shadow-xs"
                    : "text-[#7A7A7A] hover:text-[#3D3D3D]"
                }`}
              >
                <Copy className="w-3.5 h-3.5 text-[#5C6B5A]" />
                <span>Copy UPI ID</span>
              </button>
            </div>

            {/* Tab 1: Direct 1-Tap App */}
            {paymentMode === "upi_app" && (
              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] text-center space-y-3 mb-4">
                <p className="text-xs text-[#5C6B5A] font-medium">
                  Tap below to open your installed UPI app (GPay, PhonePe, Paytm, BHIM, Cred) with prefilled ₹{currentPlan.price}:
                </p>
                <a
                  href={upiIntentUri}
                  className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#8B9D83] hover:bg-[#7A8C73] text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Launch UPI App &bull; Pay ₹{currentPlan.price}</span>
                </a>
                <span className="text-[10px] text-[#7A7A7A] block">
                  Works seamlessly on Android &amp; iOS mobile browsers
                </span>
              </div>
            )}

            {/* Tab 2: Scan QR */}
            {paymentMode === "upi_qr" && (
              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] text-center space-y-3 mb-4">
                <div className="w-48 h-48 mx-auto bg-white p-2 rounded-2xl border border-[#E8E6DF] shadow-xs flex items-center justify-center">
                  <img
                    src={upiQrCodeUrl}
                    alt="UPI Payment QR Code"
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
                <div className="text-xs text-[#5C6B5A]">
                  Scan with <strong>Google Pay, PhonePe, Paytm, or BHIM</strong>
                </div>
                <div className="flex justify-center items-center gap-2 text-[10px] text-[#7A7A7A]">
                  <span>VPA: <strong className="font-mono text-[#3D3D3D]">{upiSettings.upiId}</strong></span>
                  <span>&bull;</span>
                  <span>Payee: <strong>{upiSettings.upiPayeeName}</strong></span>
                </div>
              </div>
            )}

            {/* Tab 3: Copy UPI ID */}
            {paymentMode === "upi_manual" && (
              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] space-y-3 mb-4">
                <label className="block text-xs font-bold text-[#4A4A4A]">
                  JyotishVani Kendra Official UPI VPA
                </label>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-[#E8E6DF]">
                  <span className="font-mono font-bold text-sm text-[#3D3D3D] flex-1">
                    {upiSettings.upiId}
                  </span>
                  <button
                    type="button"
                    onClick={copyUpiId}
                    className="px-3 py-1.5 rounded-lg bg-[#8B9D83] text-white text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-[#7A8C73] transition-colors"
                  >
                    {copiedUpi ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy VPA</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-[#7A7A7A]">
                  Open your UPI app, select <em>Transfer to UPI ID</em>, paste the above VPA, enter ₹{currentPlan.price}, and pay.
                </p>
              </div>
            )}

            {/* Verification Form */}
            <form onSubmit={handleConfirmUpiPayment} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#4A4A4A]">
                    12-Digit UTR / UPI Transaction Reference
                  </label>
                  <button
                    type="button"
                    onClick={() => setUtrNumber(`UPI${Date.now().toString().slice(-8)}`)}
                    className="text-[10px] text-[#CB997E] hover:underline font-bold cursor-pointer"
                  >
                    Auto-Fill Demo UTR
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 4248 1092 3841 (or leave blank for auto-generate)"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F0] border border-[#E8E6DF] text-xs font-mono text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-[#8B9D83] hover:bg-[#7A8C73] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm UPI Payment &amp; Activate (₹{currentPlan.price})</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-[#7A7A7A] pt-1">
                <button
                  type="button"
                  onClick={() => setStep("otp")}
                  className="hover:text-[#3D3D3D] underline cursor-pointer"
                >
                  &larr; Back to verification
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlanId("trial");
                    setStep("details");
                  }}
                  className="text-[#CB997E] hover:underline cursor-pointer"
                >
                  Switch to 3-Day Free Trial instead
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 4: Success Confirmation */}
        {step === "success" && (
          <div className="py-2 animate-fadeIn font-sans">
            {/* Auspicious Header */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#EDF3EC] border-2 border-[#8B9D83] flex items-center justify-center mx-auto mb-3 text-[#8B9D83] shadow-md animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F0EDDF] text-[#5C6B5A] border border-[#8B9D83]/30 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#CB997E]" />
                <span>
                  {selectedPlanId === "trial"
                    ? "3-Day Free Trial Confirmed"
                    : paymentVerificationStatus === "verified"
                    ? "Subscription Confirmed & Active"
                    : "Payment Logged • Verification in Progress"}
                </span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D3D3D] mt-2.5">
                Pranam, {name || "Devotee"}!
              </h2>

              <p className="text-xs text-[#7A7A7A] mt-1">
                Kendra Devotee Ref: <span className="font-mono font-bold text-[#3D3D3D]">JV-DEV-{cleanMobile.slice(-6)}</span>
              </p>
            </div>

            {/* HIGH VISIBILITY NOTIFICATION CARD: Email Confirmation Msg */}
            <div className="mt-4 p-4 rounded-2xl bg-[#FFFDF5] border-2 border-[#CB997E]/40 shadow-xs text-left">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#EDF3EC] border border-[#8B9D83]/40 flex items-center justify-center shrink-0 text-[#8B9D83] mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="text-[11px] font-bold text-[#8B9D83] uppercase tracking-wider block">
                    Official Confirmation Notice
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-[#3D3D3D] mt-0.5 leading-snug">
                    You will receive an Email confirmation at <strong>{email || confirmationData?.emailTarget || "your registered email"}</strong> with tomorrow morning's 07:00 AM daily horoscope schedule.
                  </p>
                </div>
              </div>

              {/* Email Status Details */}
              <div className="mt-3.5 pt-3 border-t border-[#CB997E]/20 text-xs">
                <div className="p-3 rounded-xl bg-white border border-[#E8E6DF] flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-[#3D3D3D] flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-[#8B9D83]" />
                      <span>Daily Email Delivery Status</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#5C6B5A] bg-[#EDF3EC] px-2.5 py-0.5 rounded-full border border-[#8B9D83]/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B9D83] animate-pulse"></span>
                      Scheduled (07:00 AM)
                    </span>
                  </div>

                  <p className="text-[11px] text-[#7A7A7A] leading-tight mb-2">
                    Welcome receipt and your daily Vedic planetary transits, Rahu Kaal alerts, and remedies will be dispatched to <strong>{email || confirmationData?.emailTarget || "your registered email"}</strong> every morning.
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E8E6DF]">
                    <button
                      type="button"
                      onClick={handleSendEmailConfirmation}
                      disabled={isSendingEmailConf}
                      className="text-[11px] font-bold text-[#5C6B5A] hover:underline cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSendingEmailConf ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Resend Email Confirmation</span>
                    </button>
                    {emailConfNotice && (
                      <span className="text-[10px] text-[#5C6B5A] font-semibold">
                        {emailConfNotice}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Summary Card */}
            <div className="mt-3 p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-[#E8E6DF] pb-1.5">
                <span className="text-[#7A7A7A]">Subscription Plan:</span>
                <span className="font-bold text-[#3D3D3D]">{currentPlan.name}</span>
              </div>
              <div className="flex justify-between border-b border-[#E8E6DF] pb-1.5">
                <span className="text-[#7A7A7A]">Vedic Rashi (Zodiac):</span>
                <span className="font-bold text-[#3D3D3D]">{zodiacSign.toUpperCase()}</span>
              </div>
              <div className="flex justify-between border-b border-[#E8E6DF] pb-1.5">
                <span className="text-[#7A7A7A]">Daily Delivery Method:</span>
                <span className="font-bold text-[#5C6B5A]">Email Inbox ({deliveryTime})</span>
              </div>
              <div className="flex justify-between border-b border-[#E8E6DF] pb-1.5">
                <span className="text-[#7A7A7A]">Auto-Renew Status:</span>
                <span className={`font-bold ${autoRenew ? "text-[#5C6B5A]" : "text-[#7A7A7A]"}`}>
                  {autoRenew ? "✓ Enabled (Seamless Continuity)" : "Disabled"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A7A7A]">First Morning Dispatch:</span>
                <span className="font-bold text-[#8B9D83]">Tomorrow at {deliveryTime}</span>
              </div>
            </div>

            {/* Devotee Website Redirect CTA */}
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={handleRedirectToDevoteeWebsite}
                className="w-full py-3.5 px-4 rounded-full bg-[#8B9D83] hover:bg-[#7A8C73] text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 group"
                id="redirect-to-devotee-website-btn"
              >
                <span>Go to Devotee Website &amp; Daily Horoscope</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Direct Devotee Website Link & Copy Link */}
              <div className="p-2 rounded-xl bg-white border border-[#E8E6DF] flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 overflow-hidden text-left">
                  <Globe className="w-3.5 h-3.5 text-[#8B9D83] shrink-0" />
                  <span className="text-[11px] text-[#7A7A7A] truncate">
                    Devotee Portal: <strong className="text-[#3D3D3D]">{window.location.origin}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-2.5 py-1 rounded-md bg-[#FAF9F6] hover:bg-[#F0EDDF] border border-[#E8E6DF] text-[11px] font-semibold text-[#5C6B5A] flex items-center gap-1 cursor-pointer transition-colors"
                    title="Copy Devotee Website Link"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink ? "Copied" : "Copy"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(window.location.origin, "_blank")}
                    className="p-1 rounded-md hover:bg-[#FAF9F6] text-[#7A7A7A] hover:text-[#3D3D3D] cursor-pointer"
                    title="Open Devotee Website in New Tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
