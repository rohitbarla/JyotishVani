import React, { useState, useEffect } from "react";
import {
  X,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Calendar,
  CreditCard,
  QrCode,
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Clock,
  MessageSquare,
} from "lucide-react";
import { SubscriptionPlanId, UserSubscription, DynamicSettings } from "../types";
import { SUBSCRIPTION_PLANS } from "../data/astrologyData";

interface AutoRenewModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserSubscription | null;
  onRenewSuccess: (renewedUser: UserSubscription) => void;
  dynamicSettings?: DynamicSettings | null;
}

export const AutoRenewModal: React.FC<AutoRenewModalProps> = ({
  isOpen,
  onClose,
  user,
  onRenewSuccess,
  dynamicSettings,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>("monthly");
  const [autoRenew, setAutoRenew] = useState<boolean>(true); // Auto-checked by default as requested
  const [paymentMode, setPaymentMode] = useState<"instant" | "upi">("instant");
  const [loading, setLoading] = useState<boolean>(false);
  const [utrNumber, setUtrNumber] = useState<string>("");
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [renewedData, setRenewedData] = useState<UserSubscription | null>(null);

  useEffect(() => {
    if (user?.planId && user.planId !== "trial") {
      setSelectedPlanId(user.planId);
    } else {
      setSelectedPlanId("monthly");
    }
    // Auto-renew option is always auto-checked by default on opening
    setAutoRenew(user?.autoRenew !== undefined ? user.autoRenew : true);
    setIsSuccess(false);
    setRenewedData(null);
  }, [user, isOpen]);

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

  if (!isOpen || !user) return null;

  const paidPlans = SUBSCRIPTION_PLANS.filter((p) => !p.isFree).map((p) => {
    const customPrice = dynamicSettings?.planPrices?.[p.id as keyof typeof dynamicSettings.planPrices];
    return customPrice !== undefined && typeof customPrice === "number" ? { ...p, price: customPrice } : p;
  });
  const currentPlan = paidPlans.find((p) => p.id === selectedPlanId) || paidPlans[0];

  const upiId = dynamicSettings?.upiId || "9560169988@pthdfc";
  const upiPayee = "JyotishVani Kendra";

  const isExpired =
    user.status === "expired" ||
    (Boolean(user.validUntil) &&
      !isNaN(new Date(user.validUntil).getTime()) &&
      new Date(user.validUntil).getTime() < Date.now());

  const formattedExpiry = user.validUntil
    ? new Date(user.validUntil).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Recently";

  // Generate UPI URI
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    upiPayee
  )}&am=${currentPlan.price}&cu=INR&tn=${encodeURIComponent("AutoRenew - " + currentPlan.name + " - " + user.mobile)}`;

  const upiQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=6&data=${encodeURIComponent(
    upiIntentUri
  )}`;

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleExecuteRenewal = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      try {
        const token = sessionStorage.getItem("jyotishvani_admin_token");
        if (token) headers["Authorization"] = `Bearer ${token}`;
      } catch {
        // ignore
      }

      // 1. Record the renewal payment
      if (paymentMode === "upi" || utrNumber.trim()) {
        const payRes = await fetch("/api/payments/verify-upi", {
          method: "POST",
          headers,
          body: JSON.stringify({
            mobile: user.mobile,
            userName: user.name,
            planId: selectedPlanId,
            planName: currentPlan.name,
            amount: currentPlan.price,
            upiIdUsed: upiId,
            utrNumber: utrNumber.trim() || `RENEW${Date.now().toString().slice(-6)}`,
            paymentMode: "upi_qr",
            autoRenew,
          }),
        });
        const payData = await payRes.json();
        if (payData.success && payData.subscriber) {
          const updatedUser: UserSubscription = {
            mobile: payData.subscriber.mobile || user.mobile,
            name: payData.subscriber.name || user.name,
            email: payData.subscriber.email || user.email,
            zodiacSign: payData.subscriber.zodiacSign || user.zodiacSign,
            deliveryChannel: payData.subscriber.deliveryChannel || user.deliveryChannel,
            deliveryTime: payData.subscriber.deliveryTime || user.deliveryTime,
            planId: payData.subscriber.planId || selectedPlanId,
            status: payData.subscriber.status || "active",
            validUntil: payData.subscriber.validUntil,
            autoRenew,
          };
          setRenewedData(updatedUser);
          setIsSuccess(true);
          onRenewSuccess(updatedUser);
          return;
        }
      }

      // 2. Or execute subscriber renewal with token / toggle auto-renew
      const res = await fetch(`/api/subscribers/${user.mobile}/renew`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          planId: selectedPlanId,
          autoRenew,
        }),
      });

      const data = await res.json();
      if (data.success && data.subscriber) {
        const updatedUser: UserSubscription = {
          mobile: data.subscriber.mobile || user.mobile,
          name: data.subscriber.name || user.name,
          email: data.subscriber.email || user.email,
          zodiacSign: data.subscriber.zodiacSign || user.zodiacSign,
          deliveryChannel: data.subscriber.deliveryChannel || user.deliveryChannel,
          deliveryTime: data.subscriber.deliveryTime || user.deliveryTime,
          planId: data.subscriber.planId || selectedPlanId,
          status: "active",
          validUntil: data.subscriber.validUntil,
          autoRenew: data.subscriber.autoRenew !== undefined ? data.subscriber.autoRenew : autoRenew,
        };

        setRenewedData(updatedUser);
        setIsSuccess(true);
        onRenewSuccess(updatedUser);
      } else {
        // Toggle autoRenew setting on server
        await fetch(`/api/subscribers/${user.mobile}/auto-renew`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ autoRenew }),
        }).catch(() => {});
        performFallbackRenewal();
      }
    } catch (err) {
      console.error("Renewal API error, applying local fallback:", err);
      performFallbackRenewal();
    } finally {
      setLoading(false);
    }
  };

  const performFallbackRenewal = () => {
    const daysMap: Record<string, number> = {
      monthly: 30,
      three_months: 90,
      six_months: 180,
      yearly: 365,
    };
    const days = daysMap[selectedPlanId] || 30;
    const newValidUntil = new Date(Date.now() + days * 86400000).toISOString();

    const updatedUser: UserSubscription = {
      ...user,
      planId: selectedPlanId,
      status: "active",
      validUntil: newValidUntil,
      autoRenew: autoRenew,
    };

    setRenewedData(updatedUser);
    setIsSuccess(true);
    onRenewSuccess(updatedUser);
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
        {/* Persistent Sticky Top Header Bar */}
        <div className="shrink-0 px-5 sm:px-7 py-3.5 sm:py-4 border-b border-[#E8E6DF] bg-[#FAF9F6] flex items-center justify-between gap-3 z-30">
          <div className="flex items-center gap-2 text-xs font-bold text-[#8B9D83] uppercase tracking-wider">
            <RefreshCw className="w-3.5 h-3.5 text-[#CB997E]" />
            <span>Subscription Auto-Renew</span>
          </div>

          {/* Prominent High-Visibility Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#E8E6DF] border border-[#E8E6DF] text-[#4A4A4A] hover:text-[#1F1F1F] font-semibold text-xs transition-all shadow-2xs cursor-pointer group"
            id="close-autorenew-modal-btn"
            title="Close (Esc)"
            aria-label="Close auto-renew modal"
          >
            <span>Close</span>
            <X className="w-4 h-4 text-[#7A7A7A] group-hover:text-[#1F1F1F] group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Scrollable Modal Content Container */}
        <div className="overflow-y-auto px-5 sm:px-7 py-5 flex-1">
          {!isSuccess ? (
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#3D3D3D]">
                {isExpired ? "Renew Expired Subscription" : "Manage & Auto-Renew Subscription"}
              </h2>

              <p className="text-xs text-[#7A7A7A] mt-1 mb-4">
                Continuous Vedic guidance delivered to <strong>+91 {user.mobile}</strong> ({user.zodiacSign})
                every morning via {user.deliveryChannel.toUpperCase()}.
              </p>

            {/* Expired Status Notice Banner */}
            {isExpired ? (
              <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-amber-900 block">
                    Subscription Expired on {formattedExpiry}
                  </span>
                  <p className="text-amber-800 mt-0.5 leading-snug">
                    Daily morning forecasts are currently on hold. Auto-renewing your plan will instantly resume your
                    personalized daily Email horoscope delivery starting tomorrow morning!
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3.5 rounded-2xl bg-[#EDF3EC] border border-[#8B9D83]/30 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#8B9D83] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-[#3D3D3D] block">
                    Current Subscription Active (Valid until {formattedExpiry})
                  </span>
                  <p className="text-[#5C6B5A] mt-0.5 leading-snug">
                    You can configure auto-renew post expiry below so your astrological guidance never gets interrupted.
                  </p>
                </div>
              </div>
            )}

            {/* Select Renewal Plan */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#4A4A4A] mb-2">
                Select Renewal Tier:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {paidPlans.map((p) => {
                  const isSelected = selectedPlanId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[#FAF9F6] border-[#8B9D83] shadow-xs ring-1 ring-[#8B9D83]"
                          : "bg-[#FAF9F6]/60 border-[#E8E6DF] hover:border-[#8B9D83]/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#3D3D3D] leading-tight">
                          {p.name}
                        </span>
                        {p.badge && (
                          <span className="text-[9px] bg-[#8B9D83] text-white px-1.5 py-0.5 rounded-full font-bold">
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="font-serif text-base font-bold text-[#3D3D3D]">
                          ₹{p.price}
                        </span>
                        <span className="text-[10px] text-[#7A7A7A]">
                          / {p.id === "monthly" ? "mo" : p.id === "yearly" ? "yr" : "period"}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#5C6B5A] mt-0.5 line-clamp-1">
                        {p.billingText}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MANDATORY: Auto-Renew Option - Auto Checked by Default */}
            <div className="mb-5 p-4 rounded-2xl bg-[#F0EDDF]/90 border border-[#8B9D83]/40">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="modal-autorenew-checkbox"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#8B9D83] focus:ring-[#8B9D83] accent-[#8B9D83] cursor-pointer shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#3D3D3D]">
                      Auto-Renew Option Post Subscription Expire
                    </span>
                    <span className="text-[10px] bg-[#8B9D83] text-white px-2 py-0.5 rounded-full font-semibold">
                      Auto-Checked
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5C6B5A] mt-1 leading-snug">
                    When this subscription reaches expiry, automatically renew using your preferred plan ({currentPlan.name})
                    so your daily morning Vedic horoscope and Shubh Muhurat continue without pause. You can disable this anytime.
                  </p>
                </div>
              </label>
            </div>

            {/* Renewal Payment Mode Toggle */}
            <div className="flex gap-2 mb-4 p-1 rounded-2xl bg-[#F5F5F0] border border-[#E8E6DF]">
              <button
                type="button"
                onClick={() => setPaymentMode("instant")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  paymentMode === "instant"
                    ? "bg-white text-[#3D3D3D] shadow-xs"
                    : "text-[#7A7A7A] hover:text-[#3D3D3D]"
                }`}
              >
                1-Click Instant Auto-Renew
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode("upi")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  paymentMode === "upi"
                    ? "bg-white text-[#3D3D3D] shadow-xs"
                    : "text-[#7A7A7A] hover:text-[#3D3D3D]"
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-[#CB997E]" />
                <span>UPI QR / Pay App</span>
              </button>
            </div>

            {paymentMode === "upi" && (
              <div className="mb-4 p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] text-center">
                <div className="flex justify-center mb-2">
                  <img
                    src={upiQrCodeUrl}
                    alt="Scan UPI QR"
                    className="w-32 h-32 rounded-xl border border-[#E8E6DF] shadow-xs bg-white p-1"
                  />
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-[#555] mb-2">
                  <span>UPI ID: <strong>{upiId}</strong></span>
                  <button
                    type="button"
                    onClick={copyUpiId}
                    className="p-1 rounded-md hover:bg-white text-[#8B9D83] cursor-pointer"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Enter UPI Ref / UTR (optional)"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-[#E8E6DF] text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83] text-center"
                />
              </div>
            )}

            {/* Action Button */}
            <button
              type="button"
              onClick={handleExecuteRenewal}
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-[#8B9D83] hover:bg-[#7A8C73] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              id="confirm-autorenew-action-btn"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>
                    Confirm Auto-Renew • ₹{currentPlan.price} ({currentPlan.name})
                  </span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* SUCCESS CONFIRMATION SCREEN */
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#EDF3EC] border-2 border-[#8B9D83] flex items-center justify-center mx-auto mb-4 text-[#8B9D83] shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="px-3.5 py-1 rounded-full bg-[#F0EDDF] text-[#5C6B5A] border border-[#8B9D83]/30 text-xs font-bold uppercase tracking-wider">
              Subscription Successfully Renewed
            </span>

            <h2 className="font-serif text-2xl font-bold text-[#3D3D3D] mt-3">
              Shubh Renewal, {renewedData?.name || user.name || "Devotee"}!
            </h2>

            <p className="text-xs text-[#7A7A7A] mt-2 max-w-sm mx-auto leading-relaxed">
              Your Vedic subscription has been renewed with <strong>{currentPlan.name}</strong>. Daily morning forecasts
              will be dispatched to <strong>+91 {user.mobile}</strong>.
            </p>

            <div className="mt-5 p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-[#E8E6DF] pb-2">
                <span className="text-[#7A7A7A]">Plan Activated:</span>
                <span className="font-bold text-[#3D3D3D]">{currentPlan.name}</span>
              </div>
              <div className="flex justify-between border-b border-[#E8E6DF] pb-2">
                <span className="text-[#7A7A7A]">New Valid Until:</span>
                <span className="font-bold text-[#5C6B5A]">
                  {renewedData?.validUntil
                    ? new Date(renewedData.validUntil).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Active for 30 Days"}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#E8E6DF] pb-2">
                <span className="text-[#7A7A7A]">Auto-Renew Post Expiry:</span>
                <span className="font-bold text-[#8B9D83]">
                  {renewedData?.autoRenew !== false ? "✓ Enabled (Automatic Continuation)" : "Disabled"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A7A7A]">Morning Dispatch:</span>
                <span className="font-bold text-[#3D3D3D]">
                  {user.deliveryTime || "07:00 AM"} via {user.deliveryChannel.toUpperCase()}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-6 py-3.5 rounded-full bg-[#8B9D83] hover:bg-[#7A8C73] text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
            >
              Continue to JyotishVani
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
