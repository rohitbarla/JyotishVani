import React, { useState, useEffect } from "react";
import { Sparkles, Heart, Briefcase, IndianRupee, Activity, Compass, Shield, Bell, Check, Database, RefreshCw, Share2, Copy } from "lucide-react";
import { ZODIAC_SIGNS } from "../data/astrologyData";
import { ZodiacSign } from "../types";
import { safeFetchJson } from "../utils/apiClient";

interface HoroscopePreviewProps {
  onSubscribeSign: (signId: string) => void;
}

export const HoroscopePreview: React.FC<HoroscopePreviewProps> = ({
  onSubscribeSign,
}) => {
  const [signs, setSigns] = useState<ZodiacSign[]>(ZODIAC_SIGNS);
  const [selectedId, setSelectedId] = useState<string>("aries");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string>("");
  const [lastUpdatedDate, setLastUpdatedDate] = useState<string>("");
  const [shareCopiedSign, setShareCopiedSign] = useState<string | null>(null);
  const [copySuccessSign, setCopySuccessSign] = useState<string | null>(null);

  const fetchLiveHoroscopes = (forceRefresh: boolean = true) => {
    setIsSyncing(true);
    safeFetchJson<{ success?: boolean; horoscopes?: ZodiacSign[]; date?: string }>(
      `/api/horoscopes?refresh=${forceRefresh}&t=${Date.now()}`
    )
      .then((data) => {
        if (data?.success && Array.isArray(data.horoscopes) && data.horoscopes.length > 0) {
          setSigns(data.horoscopes);
          if (data.date) setLastUpdatedDate(data.date);
          if (forceRefresh) {
            setSyncNotice("✨ Live Vedic Gochara transit synchronized for today!");
            setTimeout(() => setSyncNotice(""), 4000);
          }
        }
      })
      .finally(() => {
        setIsSyncing(false);
      });
  };

  useEffect(() => {
    // Auto-refresh daily horoscopes from live ephemeris every time component loads
    fetchLiveHoroscopes(true);
  }, []);

  const sign: ZodiacSign = signs.find((s) => s.id === selectedId) || signs[0] || ZODIAC_SIGNS[0];

  const generateWhatsAppShareText = (targetSign: ZodiacSign) => {
    const today = new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const portalUrl = typeof window !== "undefined" ? window.location.origin : "https://jyotishvani.com";

    return `🕉️ *JYOTISHVANI KENDRA - DAINIK VEDIC RASHIFAL* 🕉️
✨ *${targetSign.name} (${targetSign.vedicName})* ${targetSign.symbol}
📅 *${today}*

🪐 *Cosmic Overview for Today:*
${targetSign.prediction.summary}

💖 *Love & Relationships:* ${targetSign.prediction.love}
💼 *Career & Karma:* ${targetSign.prediction.career}
💰 *Wealth & Financial Fortune:* ${targetSign.prediction.finance}
🌿 *Health & Vitality:* ${targetSign.prediction.health}

🪔 *Vedic Remedy (दैनिक उपाय):*
"${targetSign.prediction.remedy}"

✨ *Auspicious Factors:*
• Lucky Number: ${targetSign.luckyNumber}
• Lucky Color: ${targetSign.luckyColor}
• Gemstone: ${targetSign.gemstone}
• Best Muhurat: ${targetSign.favorableTime}
• Ruling Planet: ${targetSign.rulingPlanet}

━━━━━━━━━━━━━━━━━━━━
🌟 *Read full astrological forecast & subscribe:* ${portalUrl}
_May Surya and the Navagrahas illuminate your path with peace and prosperity!_ 🌺`;
  };

  const handleShareClick = async (e: React.MouseEvent, targetSign: ZodiacSign) => {
    e.preventDefault();
    const text = generateWhatsAppShareText(targetSign);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `🕉️ JyotishVani Daily Horoscope • ${targetSign.name}`,
          text: text,
          url: window.location.origin,
        });
        return;
      } catch (_) {}
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
    } catch (_) {}

    setShareCopiedSign(targetSign.id);
    setTimeout(() => setShareCopiedSign(null), 2500);
  };

  const handleCopyReading = (targetSign: ZodiacSign) => {
    const text = generateWhatsAppShareText(targetSign);
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          setCopySuccessSign(targetSign.id);
          setTimeout(() => setCopySuccessSign(null), 2500);
        }).catch(() => {});
      }
    } catch (_) {}
  };

  return (
    <section id="horoscope-section" className="py-16 sm:py-20 bg-[#FAF9F6] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0EDDF] border border-[#E8E6DF] text-[#8B9D83] text-xs font-bold uppercase tracking-[0.2em] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#CB997E]" />
            <span>Today's Planetary Gochara (Transit)</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#3D3D3D] tracking-tight">
            Explore Your Daily Horoscope
          </h2>
          <p className="mt-3 text-sm text-[#7A7A7A] max-w-2xl mx-auto font-sans">
            Select your celestial sign below to preview today's detailed predictions. The exact same depth is delivered directly to your Email inbox every morning.
          </p>

          {/* Live Sync Controls & Status */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E8E6DF] text-xs text-[#5C6B5A] shadow-2xs font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold">Live Transit Synchronized</span>
              {lastUpdatedDate && (
                <span className="text-[#8B9D83] border-l border-[#E8E6DF] pl-2 font-mono">
                  {lastUpdatedDate}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fetchLiveHoroscopes(true)}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0EDDF] hover:bg-[#E8E6DF] border border-[#D9D6C9] text-xs font-semibold text-[#3D3D3D] transition-all cursor-pointer disabled:opacity-50"
              title="Recalculate and synchronize all 12 zodiac predictions with live cosmic transit"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#8B9D83] ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing Ephemeris..." : "Refresh Today's Horoscopes"}</span>
            </button>
          </div>

          {syncNotice && (
            <div className="mt-2 text-xs font-semibold text-[#5C6B5A] animate-fadeIn">
              {syncNotice}
            </div>
          )}
        </div>

        {/* 12 Sign Navigation Carousel / Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2 sm:gap-2.5 mb-8">
          {signs.map((s) => {
            const isSelected = s.id === selectedId;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`flex flex-col items-center p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#F0EDDF] border-2 border-[#8B9D83] text-[#3D3D3D] shadow-sm scale-105"
                    : "bg-white border-[#E8E6DF] text-[#7A7A7A] hover:text-[#3D3D3D] hover:border-[#CB997E]"
                }`}
              >
                <span className="text-2xl mb-1">{s.symbol}</span>
                <span className="text-xs font-bold leading-tight truncate w-full text-center">
                  {s.name}
                </span>
                <span className="text-[10px] text-[#8B9D83] truncate w-full text-center font-semibold">
                  {s.vedicName.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Sign Detailed Reading Card */}
        <div className="rounded-[32px] bg-white border border-[#E8E6DF] p-6 sm:p-8 shadow-sm">
          {/* Sign Header & Meta */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E6DF]">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#F0EDDF] border border-[#E8E6DF] flex items-center justify-center text-4xl shadow-inner text-[#5C6B5A]">
                {sign.symbol}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D3D3D]">
                    {sign.name}
                  </h3>
                  <span className="text-xs font-bold text-[#8B9D83] bg-[#F0EDDF] px-2.5 py-0.5 rounded-full border border-[#E8E6DF]">
                    {sign.vedicName}
                  </span>
                </div>
                <p className="text-xs text-[#7A7A7A] mt-1 font-sans">
                  {sign.dates} &bull; Ruler: <strong className="text-[#3D3D3D]">{sign.rulingPlanet}</strong> &bull; Element: <strong className="text-[#3D3D3D]">{sign.element}</strong>
                </p>
              </div>
            </div>

            {/* Lucky Factor Pills & Share Action */}
            <div className="flex flex-wrap items-center gap-2 sm:justify-end text-xs font-medium">
              <div className="px-3 py-1.5 rounded-full bg-[#F5F5F0] border border-[#E8E6DF] text-[#4A4A4A]">
                Lucky No: <strong className="text-[#3D3D3D]">{sign.luckyNumber}</strong>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-[#F5F5F0] border border-[#E8E6DF] text-[#4A4A4A]">
                Lucky Color: <strong className="text-[#3D3D3D]">{sign.luckyColor}</strong>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-[#F5F5F0] border border-[#E8E6DF] text-[#4A4A4A]">
                Gemstone: <strong className="text-[#3D3D3D]">{sign.gemstone}</strong>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-[#F0EDDF] border border-[#8B9D83]/40 text-[#5C6B5A] font-bold">
                Best Muhurat: <strong>{sign.favorableTime}</strong>
              </div>

              {/* Header Quick Share Button */}
              <button
                type="button"
                id={`quick-share-btn-${sign.id}`}
                onClick={(e) => handleShareClick(e, sign)}
                className="px-3.5 py-1.5 rounded-full bg-[#8B9D83] hover:bg-[#7A8C73] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                title={`Share today's ${sign.name} reading`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{shareCopiedSign === sign.id ? "Copied!" : "Share"}</span>
              </button>
            </div>
          </div>

          {/* Daily Summary */}
          <div className="my-6 p-4 sm:p-5 rounded-2xl bg-[#F5F5F0] border border-[#E8E6DF]">
            <h4 className="text-xs uppercase tracking-wider font-bold text-[#8B9D83] mb-1.5 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#8B9D83]" />
              <span>Cosmic Overview for Today</span>
            </h4>
            <p className="text-sm text-[#4A4A4A] leading-relaxed font-sans">
              {sign.prediction.summary}
            </p>
          </div>

          {/* 4 Life Spheres: Love, Career, Finance, Health */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            {/* Love */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF]">
              <div className="flex items-center gap-2 mb-2 text-[#CB997E]">
                <Heart className="w-4 h-4" />
                <h5 className="font-serif text-sm font-bold text-[#3D3D3D]">Love &amp; Relationships</h5>
              </div>
              <p className="text-xs text-[#7A7A7A] leading-relaxed font-sans">
                {sign.prediction.love}
              </p>
            </div>

            {/* Career */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF]">
              <div className="flex items-center gap-2 mb-2 text-[#8B9D83]">
                <Briefcase className="w-4 h-4" />
                <h5 className="font-serif text-sm font-bold text-[#3D3D3D]">Career &amp; Professional Karma</h5>
              </div>
              <p className="text-xs text-[#7A7A7A] leading-relaxed font-sans">
                {sign.prediction.career}
              </p>
            </div>

            {/* Finance */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF]">
              <div className="flex items-center gap-2 mb-2 text-[#CB997E]">
                <IndianRupee className="w-4 h-4" />
                <h5 className="font-serif text-sm font-bold text-[#3D3D3D]">Wealth &amp; Financial Fortune</h5>
              </div>
              <p className="text-xs text-[#7A7A7A] leading-relaxed font-sans">
                {sign.prediction.finance}
              </p>
            </div>

            {/* Health */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF]">
              <div className="flex items-center gap-2 mb-2 text-[#8B9D83]">
                <Activity className="w-4 h-4" />
                <h5 className="font-serif text-sm font-bold text-[#3D3D3D]">Health, Prana &amp; Vitality</h5>
              </div>
              <p className="text-xs text-[#7A7A7A] leading-relaxed font-sans">
                {sign.prediction.health}
              </p>
            </div>
          </div>

          {/* Vedic Remedy (Upaya) & CTA Bar */}
          <div className="pt-6 border-t border-[#E8E6DF] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1 bg-[#F0EDDF] p-3.5 rounded-2xl border border-[#8B9D83]/30 w-full lg:w-auto">
              <div className="flex items-center gap-2 text-[#8B9D83] text-xs font-bold mb-1">
                <Shield className="w-4 h-4" />
                <span>Today's Vedic Remedy (दैनिक उपाय)</span>
              </div>
              <p className="text-xs text-[#4A4A4A] italic font-sans">
                "{sign.prediction.remedy}"
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto shrink-0">
              {/* Share Reading Button */}
              <button
                type="button"
                id={`share-forecast-btn-${sign.id}`}
                onClick={(e) => handleShareClick(e, sign)}
                className="flex-1 sm:flex-initial px-5 py-3.5 rounded-full bg-[#5C6B5A] hover:bg-[#4E5B4C] text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all hover:shadow-md active:scale-98"
                title={`Share today's ${sign.name} horoscope reading`}
              >
                {shareCopiedSign === sign.id ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied &amp; Ready to Share!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Share Reading</span>
                  </>
                )}
              </button>

              {/* Copy Reading Button */}
              <button
                type="button"
                id={`copy-reading-btn-${sign.id}`}
                onClick={() => handleCopyReading(sign)}
                className="px-4 py-3.5 rounded-full bg-white hover:bg-[#FAF9F6] border border-[#E8E6DF] text-[#4A4A4A] hover:text-[#3D3D3D] font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
                title="Copy formatted daily horoscope reading to clipboard"
              >
                {copySuccessSign === sign.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#7A7A7A]" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>

              {/* Deliver Daily Subscription Button */}
              <button
                type="button"
                id={`subscribe-horoscope-btn-${sign.id}`}
                onClick={() => onSubscribeSign(sign.id)}
                className="flex-1 sm:flex-initial px-6 py-3.5 rounded-full bg-[#8B9D83] hover:bg-[#7A8C73] text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all hover:shadow-md active:scale-98"
              >
                <Bell className="w-4 h-4" />
                <span>Deliver Daily</span>
              </button>
            </div>
          </div>

          {/* Feedback Notice on Share or Copy */}
          {(shareCopiedSign === sign.id || copySuccessSign === sign.id) && (
            <div className="mt-3.5 p-2.5 rounded-xl bg-[#E7F8EE] border border-[#C3E6CB] text-xs font-semibold text-[#155724] text-center flex items-center justify-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 text-[#1E7E34]" />
              <span>
                {copySuccessSign === sign.id
                  ? `Today's ${sign.name} Vedic reading copied to clipboard! You can paste it anywhere.`
                  : `Today's ${sign.name} reading copied to clipboard and ready to share!`}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
