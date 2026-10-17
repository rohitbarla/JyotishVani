import React, { useState } from "react";
import { Phone, MessageSquare, MapPin, Clock, Calendar, CheckCircle2, ShieldCheck, Sparkles, User, ArrowRight, Mail } from "lucide-react";

interface OfflineConnectProps {
  userMobile?: string;
  userName?: string;
  dynamicHelpline?: string;
}

export const OfflineConnect: React.FC<OfflineConnectProps> = ({
  userMobile = "",
  userName = "",
  dynamicHelpline,
}) => {
  const [callerName, setCallerName] = useState(userName || "");
  const [callerPhone, setCallerPhone] = useState(userMobile || "");
  const [preferredTopic, setPreferredTopic] = useState("Kundali Milan & Matchmaking");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const phoneNumber = dynamicHelpline || "9560169988";
  const formattedPhone = `+91 ${phoneNumber}`;

  const handleCallbackRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callerPhone) return;
    setIsSubmitting(true);
    try {
      await fetch("/api/offline-callbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerName,
          callerPhone,
          preferredTopic,
        }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting callback:", err);
      // Still show success for devotee
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setSubmitted(false);
        setCallerName("");
        setCallerPhone("");
      }, 7000);
    }
  };

  return (
    <section id="offline-connect-section" className="py-16 sm:py-20 bg-[#FAF9F6] relative border-b border-[#E8E6DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0EDDF] border border-[#E8E6DF] text-[#8B9D83] text-xs font-bold uppercase tracking-[0.2em] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#CB997E]" />
            <span>Direct Vedic Kendra Connect</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#3D3D3D] tracking-tight">
            Offline Astrology Consultation
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#7A7A7A] font-sans">
            Connect directly with our Vedic Kendra for offline in-person consultations, Kundali matching, and sacred remedies.
          </p>
        </div>

        {/* Main Connect Card */}
        <div className="rounded-[32px] bg-white border border-[#E8E6DF] p-6 sm:p-10 shadow-sm max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Direct Phone & Email Consultation CTA */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDF3EC] text-[#5C6B5A] text-xs font-bold border border-[#8B9D83]/30">
                <span className="w-2 h-2 rounded-full bg-[#8B9D83] animate-ping" />
                <span>Dedicated Consultation Helpline Active</span>
              </div>

              <div>
                <span className="text-xs text-[#7A7A7A] uppercase tracking-wider font-bold block mb-1">
                  Direct Offline Helpline Number
                </span>
                <a
                  href={`tel:${phoneNumber}`}
                  className="group inline-flex items-center gap-3 text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#3D3D3D] hover:text-[#CB997E] transition-colors"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#F0EDDF] group-hover:bg-[#CB997E] group-hover:text-white text-[#8B9D83] flex items-center justify-center transition-all shadow-xs shrink-0">
                    <Phone className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <span>{phoneNumber}</span>
                </a>
              </div>

              <p className="text-sm text-[#7A7A7A] leading-relaxed">
                Call our Kendra Central Helpline directly at <strong className="text-[#3D3D3D]">{phoneNumber}</strong> to schedule an offline meeting, book an in-person Janam Patri review, or request personalized horoscope consultation.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={`tel:${phoneNumber}`}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#8B9D83] hover:bg-[#7A8C73] text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call {phoneNumber}</span>
                </a>

                <a
                  href="mailto:support@jyotishvani.live"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#F0EDDF] hover:bg-[#E8E6DF] border border-[#8B9D83]/40 text-[#5C6B5A] font-bold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-[#8B9D83]" />
                  <span>Email Support Desk</span>
                </a>
              </div>

              {/* Key Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#E8E6DF] text-xs text-[#4A4A4A]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#8B9D83] shrink-0" />
                  <span>Face-to-Face Kundali Milan</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#8B9D83] shrink-0" />
                  <span>Birth Chart &amp; Dosha Nivaran</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#8B9D83] shrink-0" />
                  <span>Shubh Muhurat &amp; Gemstone Advice</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#8B9D83] shrink-0" />
                  <span>Confidential &amp; Authentic Vedic Guidance</span>
                </div>
              </div>
            </div>

            {/* Right Column: Callback Request or Clinic Timing Info */}
            <div className="lg:col-span-5 bg-[#FAF9F6] rounded-2xl border border-[#E8E6DF] p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E6DF]">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#3D3D3D]">
                    Request an Offline Callback
                  </h3>
                  <p className="text-xs text-[#7A7A7A]">
                    We will call you back within 15 minutes
                  </p>
                </div>
                <Clock className="w-5 h-5 text-[#CB997E]" />
              </div>

              {submitted ? (
                <div className="p-4 rounded-xl bg-[#EDF3EC] border border-[#8B9D83]/30 text-center space-y-2 animate-fadeIn">
                  <div className="w-10 h-10 rounded-full bg-[#8B9D83] text-white flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#3D3D3D]">
                    Callback Request Received!
                  </h4>
                  <p className="text-xs text-[#5C6B5A]">
                    Our Vedic Kendra coordinator will call you back shortly on <strong>{callerPhone}</strong>. You can also dial <strong>{phoneNumber}</strong> directly anytime.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCallbackRequest} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#4A4A4A] uppercase tracking-wider mb-1">
                      Your Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Sharma"
                        value={callerName}
                        onChange={(e) => setCallerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E6DF] text-xs text-[#3D3D3D] placeholder-[#AFAFAF] focus:outline-none focus:border-[#8B9D83]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4A4A4A] uppercase tracking-wider mb-1">
                      Your Mobile Number *
                    </label>
                    <div className="relative flex rounded-xl bg-white border border-[#E8E6DF] focus-within:border-[#8B9D83] overflow-hidden">
                      <span className="px-3 py-2.5 bg-[#F5F5F0] text-xs font-bold text-[#5C6B5A] border-r border-[#E8E6DF]">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="98765 43210"
                        value={callerPhone}
                        onChange={(e) => setCallerPhone(e.target.value)}
                        className="w-full px-3 py-2.5 text-xs text-[#3D3D3D] placeholder-[#AFAFAF] focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4A4A4A] uppercase tracking-wider mb-1">
                      Consultation Purpose
                    </label>
                    <select
                      value={preferredTopic}
                      onChange={(e) => setPreferredTopic(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E6DF] text-xs text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83]"
                    >
                      <option>Kundali Milan &amp; Matchmaking</option>
                      <option>Career, Business &amp; Wealth Forecast</option>
                      <option>Health, Graha Dosha &amp; Shanti Pooja</option>
                      <option>New Born Name &amp; Janam Kundali</option>
                      <option>General Life Guidance</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#8B9D83] hover:bg-[#7A8C73] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Request Callback from {phoneNumber}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}

              {/* Kendra Working Hours */}
              <div className="pt-3 border-t border-[#E8E6DF] text-[11px] text-[#7A7A7A] space-y-1">
                <div className="flex items-center justify-between">
                  <span>Kendra Visit Timings:</span>
                  <strong className="text-[#3D3D3D]">10:00 AM – 7:30 PM (All 7 Days)</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Direct Dial:</span>
                  <strong className="text-[#CB997E] font-mono font-bold text-xs">{phoneNumber}</strong>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
