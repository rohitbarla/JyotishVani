import React, { useState, useEffect, useMemo } from "react";
import { Sun, Moon, AlertTriangle, Sparkles, Clock, Calendar, CheckCircle2, Settings, Globe, RefreshCw } from "lucide-react";
import { PANCHANG_TODAY } from "../data/astrologyData";
import { StoredPanchangData } from "../types";
import { safeFetchJson } from "../utils/apiClient";

interface PanchangWidgetProps {
  onSubscribe: () => void;
  dynamicPanchang?: StoredPanchangData | null;
  onPanchangUpdated?: (panchang: StoredPanchangData) => void;
}

export const PanchangWidget: React.FC<PanchangWidgetProps> = ({
  onSubscribe,
  dynamicPanchang,
  onPanchangUpdated,
}) => {
  const [localPanchang, setLocalPanchang] = useState<StoredPanchangData | null>(dynamicPanchang || null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState("");

  useEffect(() => {
    if (dynamicPanchang) {
      setLocalPanchang(dynamicPanchang);
    } else {
      // Immediate fetch on mount to ensure live ephemeris is never stale
      safeFetchJson<{ success?: boolean; panchang?: StoredPanchangData }>(
        `/api/panchang?refresh=true&t=${Date.now()}`
      ).then((data) => {
        if (data?.panchang) {
          setLocalPanchang(data.panchang);
          onPanchangUpdated?.(data.panchang);
        }
      });
    }
  }, [dynamicPanchang]);

  const panchang = localPanchang || dynamicPanchang || PANCHANG_TODAY;

  const handleManualSync = () => {
    setIsSyncing(true);
    safeFetchJson<{ success?: boolean; panchang?: StoredPanchangData }>(
      `/api/panchang?refresh=true&t=${Date.now()}`
    )
      .then((data) => {
        if (data?.panchang) {
          setLocalPanchang(data.panchang);
          onPanchangUpdated?.(data.panchang);
          setSyncNotice("✨ Live Vedic ephemeris synchronized!");
          setTimeout(() => setSyncNotice(""), 4000);
        }
      })
      .finally(() => setIsSyncing(false));
  };

  // Local vs Kashi (IST) Timezone mode
  const [timeZoneMode, setTimeZoneMode] = useState<"local" | "ist">("local");
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Detect user's browser local time zone
  const localTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";
    } catch {
      return "Local";
    }
  }, []);

  // Format date according to local timezone
  const localDateFormatted = useMemo(() => {
    try {
      return currentTime.toLocaleDateString(undefined, {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return currentTime.toDateString();
    }
  }, [currentTime]);

  // Format date according to Indian Standard Time (IST)
  const istDateFormatted = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(currentTime);
    } catch {
      return currentTime.toDateString();
    }
  }, [currentTime]);

  // Time strings
  const localTimeFormatted = useMemo(() => {
    try {
      return currentTime.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  }, [currentTime]);

  const istTimeFormatted = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(currentTime);
    } catch {
      return "";
    }
  }, [currentTime]);

  // Dynamic Vikram Samvat calculation: Gregorian Year + 57
  const samvatString = useMemo(() => {
    const gregorianYear = currentTime.getFullYear();
    const samvatYear = gregorianYear + 57; // e.g. 2026 + 57 = 2083
    const rawSamvat = "samvat" in panchang && panchang.samvat ? panchang.samvat : undefined;
    if (rawSamvat) {
      return rawSamvat.replace("2081", String(samvatYear));
    }
    return `Vikram Samvat ${samvatYear}`;
  }, [currentTime, panchang]);

  // Authentic Hindu Date with Tithi Details
  const hinduDateDisplay = useMemo(() => {
    if (panchang.hinduDate) {
      return panchang.hinduDate;
    }
    const tithi = panchang.tithi || "Krishna Paksha Chaturdashi (until 09:36 PM, followed by Amavasya)";
    return `${tithi}, ${samvatString}`;
  }, [panchang, samvatString]);

  return (
    <section id="panchang-section" className="py-16 bg-[#FAF9F6] relative border-b border-[#E8E6DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0EDDF] border border-[#E8E6DF] text-[#8B9D83] text-xs font-bold uppercase tracking-[0.2em] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#CB997E]" />
            <span>दैनिक पंचांग &bull; Solar &amp; Lunar Ephemeris</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#3D3D3D] tracking-tight">
            Today's Auspicious Timings &amp; Panchang
          </h2>
          <p className="mt-2 text-sm text-[#7A7A7A] font-sans">
            Every subscriber receives daily Rahu Kaal and Shubh Muhurat alerts directly in their daily morning email horoscope.
          </p>
        </div>

        {/* Panchang Grid */}
        <div className="rounded-[32px] bg-white border border-[#E8E6DF] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E6DF]">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-[#8B9D83] uppercase tracking-wider font-sans flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#CB997E]" />
                  <span>{timeZoneMode === "local" ? localDateFormatted : istDateFormatted}</span>
                </span>

                {/* Timezone Switcher Pill */}
                <div className="inline-flex items-center rounded-full bg-[#F5F5F0] border border-[#E8E6DF] p-0.5 text-[11px] font-sans">
                  <button
                    type="button"
                    onClick={() => setTimeZoneMode("local")}
                    className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer font-medium ${
                      timeZoneMode === "local"
                        ? "bg-[#8B9D83] text-white shadow-2xs font-semibold"
                        : "text-[#7A7A7A] hover:text-[#3D3D3D]"
                    }`}
                    title={`Your local timezone: ${localTimeZone}`}
                  >
                    📍 Local ({localTimeFormatted})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeZoneMode("ist")}
                    className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer font-medium ${
                      timeZoneMode === "ist"
                        ? "bg-[#8B9D83] text-white shadow-2xs font-semibold"
                        : "text-[#7A7A7A] hover:text-[#3D3D3D]"
                    }`}
                    title="Kashi Vishwanath / Varanasi IST (UTC+05:30)"
                  >
                    🕉️ Kashi / IST ({istTimeFormatted})
                  </button>
                </div>
              </div>

              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#3D3D3D] mt-0.5">
                {hinduDateDisplay}
              </h3>

              {/* Vedic Calendar Attributes (Samvat, Month & Paksha) */}
              <div className="flex flex-wrap items-center gap-2 mt-2 pt-1 text-[11px] font-sans">
                <span className="px-2.5 py-0.5 rounded-md bg-[#F0EDDF] text-[#5C6B5A] font-bold border border-[#E8E6DF]">
                  Vikram Samvat: <strong>{panchang.vikramSamvat || (panchang.samvat?.includes("2083") ? "2083 (Siddharthi)" : panchang.samvat || "2083 (Siddharthi)")}</strong>
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-[#FAF9F6] text-[#7A7A7A] font-medium border border-[#E8E6DF]">
                  Shaka Samvat: <strong>{panchang.shakaSamvat || "1948 (Parabhava)"}</strong>
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-[#FAF9F6] text-[#7A7A7A] font-medium border border-[#E8E6DF]">
                  Month (Purnimanta): <strong>{panchang.monthPurnimanta || "Ashwin"}</strong>
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-[#FAF9F6] text-[#7A7A7A] font-medium border border-[#E8E6DF]">
                  Month (Amanta): <strong>{panchang.monthAmanta || "Bhadrapada"}</strong>
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-[#FAF9F6] text-[#7A7A7A] font-medium border border-[#E8E6DF]">
                  Paksha: <strong>{panchang.paksha || "Krishna Paksha"}</strong>
                </span>
              </div>

              {panchang.festivalNote && (
                <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full bg-[#FFF7ED] border border-[#FDBA74] text-[#9A3412] text-xs font-bold font-sans">
                  <Sparkles className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>{panchang.festivalNote}</span>
                </div>
              )}

              <p className="text-[11px] text-[#7A7A7A] mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#8B9D83]" />
                <span>
                  {timeZoneMode === "local"
                    ? `Synced to your device's local timezone (${localTimeZone})`
                    : "Synchronized to Kashi Vishwanath Kendram ephemeris (IST • UTC+05:30)"}
                </span>
                {panchang.moonSign && (
                  <span className="ml-1 text-[#5C6B5A] font-semibold">
                    • Chandra Rashi: {panchang.moonSign}
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-end items-start sm:items-end gap-2.5 text-xs font-sans">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F0EDDF] hover:bg-[#E8E6DF] border border-[#D9D6C9] text-xs font-semibold text-[#3D3D3D] transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                  title="Recalculate today's astronomical ephemeris"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#8B9D83] ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{isSyncing ? "Syncing Ephemeris..." : "Sync Live Panchang"}</span>
                </button>

                {panchang.isCustomized ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>Acharya Verified</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Live Ephemeris</span>
                  </div>
                )}
              </div>

              {syncNotice && (
                <div className="text-[11px] font-semibold text-[#5C6B5A] animate-fadeIn">
                  {syncNotice}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs font-sans">
                <div className="flex items-center gap-2 bg-[#F5F5F0] px-3.5 py-1.5 rounded-full border border-[#E8E6DF] text-[#4A4A4A]">
                  <Sun className="w-3.5 h-3.5 text-[#CB997E]" />
                  <span>Sunrise: <strong className="text-[#3D3D3D]">{panchang.sunrise}</strong></span>
                </div>
                <div className="flex items-center gap-2 bg-[#F5F5F0] px-3.5 py-1.5 rounded-full border border-[#E8E6DF] text-[#4A4A4A]">
                  <Moon className="w-3.5 h-3.5 text-[#8B9D83]" />
                  <span>Sunset: <strong className="text-[#3D3D3D]">{panchang.sunset}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Core Pillars of Panchang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6 font-sans">
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#7A7A7A] uppercase block font-bold tracking-wider">Tithi (Lunar Day)</span>
                {panchang.tithiStartTime && (
                  <span className="text-[10px] text-[#5C6B5A] font-bold bg-[#EDF3EC] px-2 py-0.5 rounded-full border border-[#8B9D83]/30">
                    {panchang.tithiStartTime.replace(/starts\s+at/i, (m) =>
                      /starts\s+(today|yesterday|tomorrow)\s+at/i.test(panchang.tithiStartTime || "") ? m : "Starts today at"
                    )}
                  </span>
                )}
              </div>
              <p className="font-serif text-base font-bold text-[#3D3D3D] mt-1">{panchang.tithi}</p>
              <p className="text-[11px] text-[#8B9D83] font-semibold mt-1">
                {(panchang.tithiTiming || `${panchang.tithiStartTime || "Starts today at 10:55 PM"} • Highly auspicious for ceremonies`).replace(
                  /starts\s+at/gi,
                  (m) => (/starts\s+(today|yesterday|tomorrow)\s+at/i.test(panchang.tithiTiming || "") ? m : "Starts today at")
                )}
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF]">
              <span className="text-[10px] text-[#7A7A7A] uppercase block font-bold tracking-wider">Nakshatra (Lunar Mansion)</span>
              <p className="font-serif text-base font-bold text-[#3D3D3D] mt-1">{panchang.nakshatra}</p>
              <p className="text-[11px] text-[#5C6B5A] font-semibold mt-1">Nurturing creative &amp; spiritual clarity</p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF]">
              <span className="text-[10px] text-[#7A7A7A] uppercase block font-bold tracking-wider">Yoga</span>
              <p className="font-serif text-base font-bold text-[#3D3D3D] mt-1">{panchang.yoga}</p>
              <p className="text-[11px] text-[#5C6B5A] font-semibold mt-1">Promotes enduring harmony</p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF]">
              <span className="text-[10px] text-[#7A7A7A] uppercase block font-bold tracking-wider">Karana</span>
              <p className="font-serif text-base font-bold text-[#3D3D3D] mt-1">{panchang.karana}</p>
              <p className="text-[11px] text-[#5C6B5A] font-semibold mt-1">Supportive for contracts &amp; deeds</p>
            </div>
          </div>

          {/* Rahu Kaal vs Abhijit Muhurat Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E8E6DF] font-sans">
            {/* Rahu Kaal Warning */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF0E6] border border-[#CB997E]/30 flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-white text-[#CB997E] shadow-xs shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#8C4A32] uppercase tracking-wider">
                  Rahu Kaal (Avoid New Initiatives)
                </span>
                <p className="text-base font-serif font-bold text-[#3D3D3D] mt-0.5">{panchang.rahuKaal}</p>
                <p className="text-xs text-[#7A7A7A] mt-1">
                  Avoid starting long journeys or signing vital agreements during this window.
                </p>
              </div>
            </div>

            {/* Abhijit Muhurat Golden Window */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#EDF3EC] border border-[#8B9D83]/30 flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-white text-[#8B9D83] shadow-xs shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#3F593B] uppercase tracking-wider">
                  Abhijit Muhurat (Golden Auspicious Window)
                </span>
                <p className="text-base font-serif font-bold text-[#3D3D3D] mt-0.5">{panchang.abhijitMuhurat}</p>
                <p className="text-xs text-[#7A7A7A] mt-1">
                  Ideal for business deeds, major signatures, investments, and life decisions.
                </p>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="mt-6 pt-6 border-t border-[#E8E6DF] flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
            <p className="text-xs text-[#7A7A7A] text-center sm:text-left">
              Want these daily Muhurat notifications sent to your email inbox every morning at 7:00 AM?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onSubscribe}
                className="px-6 py-2.5 rounded-full bg-[#8B9D83] hover:bg-[#7A8C73] text-white font-bold text-xs shadow-sm cursor-pointer transition-all shrink-0"
              >
                Get Daily Panchang via Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
