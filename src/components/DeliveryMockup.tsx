import React, { useState, useEffect } from "react";
import { Mail, Clock, CheckCheck, Sparkles, Send, Bell, X, RefreshCw, Check, Inbox, ShieldCheck, Star, Calendar } from "lucide-react";
import { ZODIAC_SIGNS, PANCHANG_TODAY } from "../data/astrologyData";
import { StoredPanchangData } from "../types";

interface DeliveryMockupProps {
  onStartFreeTrial: () => void;
  dynamicPanchang?: StoredPanchangData | null;
}

export const DeliveryMockup: React.FC<DeliveryMockupProps> = ({
  onStartFreeTrial,
  dynamicPanchang,
}) => {
  const [activeSignIndex, setActiveSignIndex] = useState(0);
  const [signs, setSigns] = useState(ZODIAC_SIGNS);
  const [panchangData, setPanchangData] = useState<StoredPanchangData | null>(dynamicPanchang || null);
  const [viewMode, setViewMode] = useState<"newsletter" | "brief">("newsletter");

  // Test Email state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState("");

  useEffect(() => {
    if (dynamicPanchang) {
      setPanchangData(dynamicPanchang);
    } else {
      fetch("/api/panchang")
        .then((res) => res.json())
        .then((data) => {
          if (data?.panchang) setPanchangData(data.panchang);
        })
        .catch(() => {});
    }
  }, [dynamicPanchang]);

  useEffect(() => {
    fetch("/api/horoscopes")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.horoscopes) && data.horoscopes.length > 0) {
          setSigns(data.horoscopes);
        }
      })
      .catch(() => {});
  }, []);

  const sign = signs[activeSignIndex] || signs[0] || ZODIAC_SIGNS[0];
  const panchang = panchangData || dynamicPanchang || PANCHANG_TODAY;

  const handleSendTestEmail = async () => {
    const clean = testEmail.trim();
    if (!clean || !clean.includes("@") || !clean.includes(".")) {
      setTestError("Please enter a valid devotee email address.");
      return;
    }
    setTestSending(true);
    setTestError("");
    setTestResult(null);
    try {
      const res = await fetch("/api/email-scheduler/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: clean,
          zodiacSign: sign.name,
          name: "Devotee",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult(data);
      } else {
        setTestError(data.error || "Failed to dispatch preview email.");
      }
    } catch {
      setTestError("Network error while transmitting test email.");
    } finally {
      setTestSending(false);
    }
  };

  return (
    <section className="py-16 sm:py-20 bg-[#F5F5F0] relative border-t border-b border-[#E8E6DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left info column */}
          <div className="lg:col-span-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0EDDF] border border-[#E8E6DF] text-[#8B9D83] text-xs font-bold uppercase tracking-[0.2em] mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[#CB997E]" />
              <span>Daily Email Morning Delivery</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#3D3D3D] tracking-tight leading-tight">
              Wake Up to Cosmic Wisdom <br />
              <span className="text-[#CB997E] italic">Every Morning at 7:00 AM</span>
            </h2>

            <p className="mt-4 text-sm sm:text-base text-[#7A7A7A] leading-relaxed font-sans">
              No distracting popups or noisy pings. Your personalized Vedic horoscope, Shubh Muhurat, Rahu Kaal warnings, and Sattvic remedies arrive peacefully in your email inbox every morning before your day begins.
            </p>

            {/* Feature highlights */}
            <div className="mt-6 space-y-3.5 text-xs sm:text-sm text-[#4A4A4A] max-w-md mx-auto lg:mx-0">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F0EDDF] text-[#8B9D83] border border-[#8B9D83]/30 flex items-center justify-center shrink-0 text-xs font-bold">
                  ✓
                </div>
                <div>
                  <strong className="text-[#3D3D3D]">Planetary Gochara:</strong> Daily movements of Surya, Chandra, and Brihaspati calculated at sunrise.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F0EDDF] text-[#8B9D83] border border-[#8B9D83]/30 flex items-center justify-center shrink-0 text-xs font-bold">
                  ✓
                </div>
                <div>
                  <strong className="text-[#3D3D3D]">Rahu Kaal &amp; Muhurat:</strong> Exact inauspicious hours to avoid for signatures, negotiations, or travels.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F0EDDF] text-[#8B9D83] border border-[#8B9D83]/30 flex items-center justify-center shrink-0 text-xs font-bold">
                  ✓
                </div>
                <div>
                  <strong className="text-[#3D3D3D]">Sattvic Vedic Remedy (Upaya):</strong> Simple 2-minute chant or ritual to harmonize your planetary energies.
                </div>
              </div>
            </div>

            {/* View Mode & Sign selector */}
            <div className="mt-8 pt-6 border-t border-[#E8E6DF] flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <div className="flex rounded-2xl bg-[#E8E6DF]/70 p-1 border border-[#E8E6DF]">
                <button
                  type="button"
                  onClick={() => setViewMode("newsletter")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                    viewMode === "newsletter"
                      ? "bg-[#8B9D83] text-white shadow-xs"
                      : "text-[#7A7A7A] hover:text-[#3D3D3D]"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Rich Newsletter</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("brief")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                    viewMode === "brief"
                      ? "bg-[#CB997E] text-white shadow-xs"
                      : "text-[#7A7A7A] hover:text-[#3D3D3D]"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Compact Brief</span>
                </button>
              </div>

              <select
                value={activeSignIndex}
                onChange={(e) => setActiveSignIndex(Number(e.target.value))}
                className="bg-white border border-[#E8E6DF] text-[#3D3D3D] text-xs rounded-2xl px-3.5 py-2.5 focus:outline-none focus:border-[#8B9D83] cursor-pointer shadow-xs font-medium"
              >
                {signs.map((s, idx) => (
                  <option key={s.id} value={idx}>
                    Preview for {s.name} ({s.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={onStartFreeTrial}
                className="px-6 py-3.5 rounded-full bg-[#8B9D83] hover:bg-[#7A8C73] text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                <span>Begin 3-Day Complimentary Email Wisdom</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTestResult(null);
                  setTestError("");
                  setShowEmailModal(true);
                }}
                className="px-5 py-3.5 rounded-full bg-white hover:bg-[#FAF9F6] border border-[#8B9D83]/50 text-[#5C6B5A] font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
                title="Send test horoscope directly to your email inbox"
              >
                <Send className="w-4 h-4 text-[#8B9D83]" />
                <span>Send Sample Email to My Inbox</span>
              </button>
            </div>
          </div>

          {/* Right column: Simulated Email Client Mockup */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-[440px] rounded-3xl p-3.5 bg-white shadow-2xl border border-[#E8E6DF] relative">
              {/* Email Client Header Bar */}
              <div className="rounded-2xl bg-[#5C6B5A] text-white p-3.5 shadow-xs mb-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/20">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#8B9D83] border border-white/30 flex items-center justify-center text-xs font-bold text-white">
                      JV
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>JyotishVani Kendra</span>
                        <span className="text-[9px] bg-white/20 text-[#FAF9F6] px-1.5 py-0.2 rounded-full font-medium">
                          Verified Sender
                        </span>
                      </div>
                      <p className="text-[10px] text-white/80">horoscope@jyotishvani.org</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-white/80 block">Today, 07:00 AM</span>
                    <span className="text-[9px] text-amber-200">Inbox</span>
                  </div>
                </div>

                <div className="pt-2 text-xs font-serif font-bold text-[#F0EDDF] truncate">
                  🕉️ Dainik Vedic Rashifal • {sign.name} ({sign.symbol}) • Shubh Muhurat &amp; Rahu Kaal
                </div>
              </div>

              {/* Email Body Preview */}
              <div className="rounded-2xl border border-[#E8E6DF] bg-[#FAF9F6] p-4 text-[#3D3D3D] space-y-3.5 max-h-[460px] overflow-y-auto font-sans shadow-inner text-xs">
                {/* Greeting banner */}
                <div className="p-3 bg-white rounded-xl border border-[#E8E6DF] flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-[#7A7A7A]">Pranam Devotee Ji 🙏</p>
                    <h4 className="font-serif font-bold text-sm text-[#5C6B5A]">
                      Vedic Horoscope for {sign.name}
                    </h4>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#F0EDDF] border border-[#8B9D83]/30 flex items-center justify-center text-sm font-bold text-[#5C6B5A]">
                    {sign.symbol}
                  </div>
                </div>

                {/* Panchang Highlights */}
                <div className="p-3 bg-[#F0EDDF]/80 rounded-xl border border-[#E8E6DF] space-y-1.5 text-[11px]">
                  <div className="font-bold text-[#5C6B5A] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#CB997E]" />
                    <span>Today's Sacred Panchang Alignment</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-[#4A4A4A]">
                    <div>⏳ <strong>Shubh Muhurat:</strong> {panchang.shubhMuhurat || panchang.abhijitMuhurat || sign.favorableTime}</div>
                    <div>⚠️ <strong>Rahu Kaal:</strong> {panchang.rahuKaal}</div>
                    <div>✨ <strong>Nakshatra:</strong> {panchang.nakshatra}</div>
                    <div>🌙 <strong>Tithi:</strong> {panchang.tithi}</div>
                  </div>
                </div>

                {/* Forecast section */}
                <div className="p-3.5 bg-white rounded-xl border border-[#E8E6DF] space-y-2">
                  <div className="font-serif font-bold text-xs text-[#3D3D3D] flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Daily Planetary Guidance</span>
                  </div>
                  <p className="text-[11px] text-[#4A4A4A] leading-relaxed">
                    {sign.prediction.summary}
                  </p>

                  {viewMode === "newsletter" && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E8E6DF] text-[10px]">
                      <div className="bg-[#FAF9F6] p-2 rounded-lg border border-[#E8E6DF]">
                        <span className="font-bold text-[#5C6B5A] block mb-0.5">❤️ Love</span>
                        <p className="text-[#7A7A7A] line-clamp-2">{sign.prediction.love}</p>
                      </div>
                      <div className="bg-[#FAF9F6] p-2 rounded-lg border border-[#E8E6DF]">
                        <span className="font-bold text-[#5C6B5A] block mb-0.5">💼 Career</span>
                        <p className="text-[#7A7A7A] line-clamp-2">{sign.prediction.career}</p>
                      </div>
                      <div className="bg-[#FAF9F6] p-2 rounded-lg border border-[#E8E6DF]">
                        <span className="font-bold text-[#5C6B5A] block mb-0.5">💰 Wealth</span>
                        <p className="text-[#7A7A7A] line-clamp-2">{sign.prediction.finance}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Daily Remedy */}
                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 text-[11px] text-[#3D3D3D]">
                  <strong className="text-amber-900 block mb-1">🪔 Daily Sattvic Remedy (Upaya):</strong>
                  <p className="text-[#4A4A4A] leading-relaxed">{sign.prediction.remedy}</p>
                  <div className="mt-2 pt-1.5 border-t border-amber-200/60 flex items-center justify-between text-[10px] text-amber-900/80 font-medium">
                    <span>Lucky No: <strong>{sign.luckyNumber}</strong></span>
                    <span>Lucky Color: <strong>{sign.luckyColor}</strong></span>
                    <span>Direction: <strong>East / Ishanya</strong></span>
                  </div>
                </div>

                {/* 1-on-1 Astrologer Consultation CTA Banner with Direct Booking Link */}
                <div className="p-3 bg-gradient-to-br from-[#FFF9F2] to-[#F5EFEB] rounded-xl border border-[#CB997E]/60 text-center space-y-1.5 shadow-2xs">
                  <div className="text-base leading-none">🪐 🕉️ 🪔</div>
                  <h5 className="font-serif font-bold text-xs text-[#3D3D3D]">
                    Need Deep Birth Chart (Kundali) Guidance?
                  </h5>
                  <p className="text-[10px] text-[#666] leading-relaxed">
                    Consult senior Vedic Acharyas for personalized Kundali Milan, Career &amp; Marriage Forecasts.
                  </p>
                  <div className="pt-1">
                    <a
                      href="#offline-connect"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#CB997E] hover:bg-[#B8856B] text-white font-bold text-[11px] shadow-xs cursor-pointer transition-colors"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>Book Appointment with Astrologer &rarr;</span>
                    </a>
                  </div>
                  <div className="text-[9px] text-[#7A7A7A] pt-0.5">
                    Or call Kendra Helpline: <a href="tel:9560169988" className="font-bold text-[#5C6B5A]">+91 9560169988</a>
                  </div>
                </div>

                {/* Email Footer Notice */}
                <div className="text-center pt-2 text-[10px] text-[#AFAFAF] space-y-1">
                  <p>JyotishVani Kendra • Dedicated to Authentic Vedic Wisdom</p>
                  <p className="text-[9px]">Delivered daily to your registered devotee email address. 1-click unsubscribe anytime.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Email Dispatch Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E8E6DF] shadow-2xl overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="p-4 bg-[#5C6B5A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#8B9D83] flex items-center justify-center text-white font-bold text-sm shadow-xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-white">Send Sample Email Horoscope</h4>
                  <p className="text-[11px] text-[#F0EDDF]/80">Delivered directly to your email inbox</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3D3D3D] mb-1.5">
                  Your Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[#7A7A7A]">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="devotee@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-semibold text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83]"
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[11px]">
                  <span className="text-[#7A7A7A]">Selected Rashi: <strong>{sign.name}</strong></span>
                  <span className="text-[#8B9D83] font-medium">Free instant preview</span>
                </div>
              </div>

              {testError && (
                <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                  {testError}
                </div>
              )}

              {testResult && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-2xl border border-emerald-200 space-y-1.5 animate-fadeIn">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Sample Vedic Horoscope Email Dispatched!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    A test email with daily planetary transits and Rahu Kaal has been dispatched to <strong>{testEmail}</strong>. Please check your inbox (or spam folder).
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E6DF]">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E6DF] text-xs font-semibold text-[#7A7A7A] hover:text-[#3D3D3D] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={testSending}
                  className="px-5 py-2 rounded-xl bg-[#8B9D83] hover:bg-[#7A8C73] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-all"
                >
                  {testSending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Sample Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
