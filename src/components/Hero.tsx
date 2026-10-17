import React, { useState, useEffect } from "react";
import { Sparkles, Mail, ShieldCheck, CheckCircle2, ArrowRight, Star, PhoneCall, BellRing } from "lucide-react";
import { ZODIAC_SIGNS } from "../data/astrologyData";
import { DynamicSettings } from "../types";

interface HeroProps {
  onQuickRegister: (email: string, sign: string, mobile?: string) => void;
  onExplorePlans: () => void;
  onOpenAiChat: () => void;
  onOfflineConnect: () => void;
  dynamicSettings?: DynamicSettings | null;
}

export const Hero: React.FC<HeroProps> = ({
  onQuickRegister,
  onExplorePlans,
  onOpenAiChat,
  onOfflineConnect,
  dynamicSettings,
}) => {
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [selectedSign, setSelectedSign] = useState("aries");
  const [error, setError] = useState("");
  const [signs, setSigns] = useState(ZODIAC_SIGNS);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("Please enter a valid email address to receive your daily horoscope");
      return;
    }
    setError("");
    const cleanMobile = mobile.replace(/\D/g, "");
    onQuickRegister(cleanEmail, selectedSign, cleanMobile || undefined);
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24 bg-[#FAF9F6]">
      {/* Subtle organic radial glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#8B9D83]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-[#CB997E]/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Heading & Value Proposition */}
          <div className="lg:col-span-7 text-center lg:text-left">
            <div className="inline-block bg-[#F0EDDF] text-[#8B9D83] text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full mb-5 border border-[#E8E6DF]">
              Personalized Vedic Destiny
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#3D3D3D] leading-[1.12] mb-6 tracking-tight">
              Your Daily Cosmic <br />
              <span className="text-[#CB997E] italic">Blueprint &amp; Wisdom.</span>
            </h1>

            <p className="text-[#7A7A7A] text-base sm:text-lg leading-relaxed mb-6 max-w-xl mx-auto lg:mx-0 font-sans">
              Connect with timeless planetary wisdom through personalized daily email horoscopes. Begin your spiritual journey with <strong>3 days of complimentary wisdom</strong> delivered directly to your email inbox every morning at 7:00 AM.
            </p>

            {/* Feature Checkmarks */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs sm:text-sm text-[#4A4A4A] mb-8 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#8B9D83] shrink-0" />
                <span>Delivered at 7:00 AM sharp</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#8B9D83] shrink-0" />
                <span>Rahu Kaal &amp; Auspicious Timings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#8B9D83] shrink-0" />
                <span>Vedic Remedies &amp; Lucky Color</span>
              </div>
            </div>

            {/* Quick Pricing Summary Pills */}
            <div className="pt-6 border-t border-[#E8E6DF] mb-8">
              <p className="text-[10px] sm:text-xs font-bold text-[#AFAFAF] uppercase tracking-widest mb-3">
                Transparent Subscription Plans
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs">
                <button
                  onClick={onExplorePlans}
                  className="px-3.5 py-1.5 rounded-full bg-[#F0EDDF] border border-[#8B9D83] text-[#5C6B5A] font-bold hover:bg-[#E8E6DF] transition-all cursor-pointer shadow-xs"
                >
                  3-Day Free Trial (₹0)
                </button>
                <button
                  onClick={onExplorePlans}
                  className="px-3.5 py-1.5 rounded-full bg-white border border-[#E8E6DF] text-[#4A4A4A] hover:border-[#CB997E] hover:text-[#CB997E] transition-all cursor-pointer"
                >
                  Monthly: ₹{dynamicSettings?.planPrices?.monthly ?? 150}
                </button>
                <button
                  onClick={onExplorePlans}
                  className="px-3.5 py-1.5 rounded-full bg-white border border-[#E8E6DF] text-[#4A4A4A] hover:border-[#CB997E] hover:text-[#CB997E] transition-all cursor-pointer"
                >
                  3 Months: ₹{dynamicSettings?.planPrices?.three_months ?? 400}
                </button>
                <button
                  onClick={onExplorePlans}
                  className="px-3.5 py-1.5 rounded-full bg-[#F0EDDF] border-2 border-[#8B9D83] text-[#3D3D3D] font-bold hover:bg-[#E8E6DF] transition-all cursor-pointer shadow-xs"
                >
                  ★ 6 Months: ₹{dynamicSettings?.planPrices?.six_months ?? 500}
                </button>
                <button
                  onClick={onExplorePlans}
                  className="px-3.5 py-1.5 rounded-full bg-white border border-[#E8E6DF] text-[#4A4A4A] hover:border-[#CB997E] hover:text-[#CB997E] transition-all cursor-pointer"
                >
                  1 Year: ₹{(dynamicSettings?.planPrices?.yearly ?? 1000).toLocaleString("en-IN")}
                </button>
              </div>
            </div>

            {/* Dual CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <button
                onClick={onOpenAiChat}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#8B9D83] hover:bg-[#7A8C73] text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                id="hero-ask-ai-btn"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>Chat with AI Astrologer</span>
              </button>
              <button
                onClick={onOfflineConnect}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-[#F0EDDF] border border-[#E8E6DF] text-[#3D3D3D] font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
                id="hero-offline-connect-btn"
              >
                <PhoneCall className="w-4 h-4 text-[#CB997E]" />
                <span>Offline Connect: 9560169988</span>
              </button>
            </div>
          </div>

          {/* Right Column: Mobile Quick Registration Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-[32px] bg-white p-6 sm:p-8 border border-[#E8E6DF] shadow-sm">
              <div className="absolute -top-3.5 right-6 bg-[#8B9D83] text-white text-[10px] font-bold uppercase tracking-widest px-3.5 py-1 rounded-full shadow-sm">
                3-Day Free Trial
              </div>

              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2.5 rounded-2xl bg-[#F0EDDF] text-[#8B9D83]">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif italic text-xl font-bold text-[#3D3D3D]">
                    Register Your Email
                  </h3>
                  <p className="text-xs text-[#7A7A7A]">
                    Receive your morning Vedic horoscope starting tomorrow at 7:00 AM
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {/* Email Address Input (Mandatory) */}
                <div>
                  <label className="block text-xs font-bold text-[#4A4A4A] mb-1.5 uppercase tracking-wider flex items-center justify-between">
                    <span>Email Address (Daily Horoscope) *</span>
                    <span className="text-[10px] text-[#8B9D83] font-semibold bg-[#EDF3EC] px-2 py-0.5 rounded-full">
                      Inbox Delivery
                    </span>
                  </label>
                  <div className="relative flex rounded-2xl bg-[#F5F5F0] border border-[#E8E6DF] focus-within:border-[#8B9D83] transition-colors overflow-hidden">
                    <span className="inline-flex items-center px-3.5 bg-[#E8E6DF]/60 text-[#5C6B5A] font-bold text-sm border-r border-[#E8E6DF]">
                      <Mail className="w-4 h-4 text-[#8B9D83]" />
                    </span>
                    <input
                      type="email"
                      required
                      id="hero-email-input"
                      placeholder="devotee@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                      }}
                      className="w-full px-3.5 py-3 text-[#3D3D3D] placeholder-[#AFAFAF] text-sm focus:outline-none bg-transparent font-medium"
                    />
                  </div>
                  {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
                </div>

                {/* Zodiac Sign Selection */}
                <div>
                  <label className="block text-xs font-bold text-[#4A4A4A] mb-1.5 uppercase tracking-wider">
                    Your Zodiac Sign (Rashi) *
                  </label>
                  <div className="relative">
                    <select
                      id="hero-zodiac-select"
                      value={selectedSign}
                      onChange={(e) => setSelectedSign(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-2xl bg-[#F5F5F0] border border-[#E8E6DF] text-[#3D3D3D] text-sm focus:outline-none focus:border-[#8B9D83] appearance-none cursor-pointer font-medium"
                    >
                      {signs.map((s) => (
                        <option key={s.id} value={s.id} className="bg-white text-[#3D3D3D]">
                          {s.symbol} {s.name} - {s.vedicName} ({s.dates})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#7A7A7A] text-xs">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Optional Mobile for devotee contact */}
                <div>
                  <label className="block text-xs font-bold text-[#4A4A4A] mb-1.5 uppercase tracking-wider flex items-center justify-between">
                    <span>Mobile Number (Optional Helpline Contact)</span>
                  </label>
                  <div className="relative flex rounded-2xl bg-[#F5F5F0] border border-[#E8E6DF] focus-within:border-[#8B9D83] transition-colors overflow-hidden">
                    <span className="inline-flex items-center px-3.5 bg-[#E8E6DF]/60 text-[#5C6B5A] font-bold text-xs border-r border-[#E8E6DF]">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      id="hero-mobile-input"
                      placeholder="98765 43210 (Optional)"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-[#3D3D3D] placeholder-[#AFAFAF] text-xs focus:outline-none bg-transparent font-medium"
                      maxLength={14}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  id="hero-submit-trial-btn"
                  className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-[#CB997E] hover:bg-[#B8856B] text-white font-bold text-sm tracking-wide shadow-sm flex items-center justify-center gap-2 transform active:scale-[0.99] transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Join Now &bull; 3 Days Free Email Delivery</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Trust footer */}
              <div className="mt-4 pt-3.5 border-t border-[#E8E6DF] flex items-center justify-between text-[11px] text-[#7A7A7A]">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#8B9D83]" />
                  No card required
                </span>
                <span>Daily Email at 7:00 AM</span>
                <span className="flex items-center gap-1 text-[#CB997E] font-semibold">
                  <Star className="w-3 h-3 fill-[#CB997E] text-[#CB997E]" />
                  4.98/5 Rated
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
