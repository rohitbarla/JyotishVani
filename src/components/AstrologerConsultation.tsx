import React, { useState } from "react";
import { Video, MapPin, Star, ShieldCheck, Calendar, Clock, Phone, Award, UserCheck, ArrowRight, MessageSquare } from "lucide-react";
import { VERIFIED_ASTROLOGERS } from "../data/astrologyData";
import { Astrologer, AstrologerBooking } from "../types";
import { VideoCallModal } from "./VideoCallModal";
import { OfflinePassModal } from "./OfflinePassModal";

interface AstrologerConsultationProps {
  userMobile?: string;
  userName?: string;
}

export const AstrologerConsultation: React.FC<AstrologerConsultationProps> = ({
  userMobile = "",
  userName = "",
}) => {
  const [selectedMode, setSelectedMode] = useState<"video" | "offline">("video");
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [bookingAstrologer, setBookingAstrologer] = useState<Astrologer | null>(null);

  // Booking form state
  const [bookingDate, setBookingDate] = useState("Tomorrow");
  const [bookingTime, setBookingTime] = useState("10:30 AM - 11:15 AM");
  const [mobileInput, setMobileInput] = useState(userMobile || "9876543210");
  const [nameInput, setNameInput] = useState(userName || "Seeker");
  const [notesInput, setNotesInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active session modals
  const [activeVideoCall, setActiveVideoCall] = useState<{ astrologer: Astrologer; booking: AstrologerBooking } | null>(null);
  const [activeOfflinePass, setActiveOfflinePass] = useState<{ astrologer: Astrologer; booking: AstrologerBooking } | null>(null);

  const cities = ["All", "New Delhi", "Mumbai", "Bengaluru", "Varanasi", "Pune", "Kolkata", "Chennai"];

  const filteredAstrologers = VERIFIED_ASTROLOGERS.filter((astro) => {
    if (selectedMode === "offline" && selectedCity !== "All") {
      return astro.cities.some((c) => c.toLowerCase() === selectedCity.toLowerCase());
    }
    return true;
  });

  const handleOpenBooking = (astro: Astrologer, mode: "video" | "offline") => {
    setSelectedMode(mode);
    setBookingAstrologer(astro);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingAstrologer) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/book-astrologer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          astrologerId: bookingAstrologer.id,
          astrologerName: bookingAstrologer.name,
          mode: selectedMode,
          date: bookingDate,
          timeSlot: bookingTime,
          userMobile: mobileInput,
          userName: nameInput,
          city: selectedMode === "offline" ? bookingAstrologer.cities[0] : undefined,
          notes: notesInput,
        }),
      });

      const data = await res.json();
      const bookingData: AstrologerBooking = data.booking || {
        bookingId: "JV-" + Math.floor(100000 + Math.random() * 900000),
        astrologerId: bookingAstrologer.id,
        astrologerName: bookingAstrologer.name,
        mode: selectedMode,
        date: bookingDate,
        timeSlot: bookingTime,
        userMobile: mobileInput,
        userName: nameInput,
        clinicAddress: bookingAstrologer.clinicAddress,
        status: "Confirmed",
      };

      const astroRef = bookingAstrologer;
      setBookingAstrologer(null);

      if (selectedMode === "video") {
        setActiveVideoCall({ astrologer: astroRef, booking: bookingData });
      } else {
        setActiveOfflinePass({ astrologer: astroRef, booking: bookingData });
      }
    } catch (err) {
      console.error("Booking error:", err);
      // Fallback direct confirmation
      const bookingData: AstrologerBooking = {
        bookingId: "JV-" + Math.floor(100000 + Math.random() * 900000),
        astrologerId: bookingAstrologer.id,
        astrologerName: bookingAstrologer.name,
        mode: selectedMode,
        date: bookingDate,
        timeSlot: bookingTime,
        userMobile: mobileInput,
        userName: nameInput,
        clinicAddress: bookingAstrologer.clinicAddress,
        status: "Confirmed",
      };
      const astroRef = bookingAstrologer;
      setBookingAstrologer(null);
      if (selectedMode === "video") {
        setActiveVideoCall({ astrologer: astroRef, booking: bookingData });
      } else {
        setActiveOfflinePass({ astrologer: astroRef, booking: bookingData });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="astrologers-section" className="py-16 sm:py-20 bg-[#FAF9F6] relative border-b border-[#E8E6DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0EDDF] border border-[#E8E6DF] text-[#8B9D83] text-xs font-bold uppercase tracking-[0.2em] mb-3">
            <UserCheck className="w-3.5 h-3.5 text-[#CB997E]" />
            <span>Verified Acharyas &bull; 1-on-1 Consultations</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#3D3D3D] tracking-tight">
            Consult Senior Vedic Astrologers
          </h2>
          <p className="mt-3 text-sm text-[#7A7A7A] max-w-xl mx-auto font-sans">
            Connect face-to-face via private <strong>Video Call</strong> from the comfort of your home, or book an <strong>Offline Visit</strong> to our verified Vedic Kendras in your city.
          </p>
        </div>

        {/* Modality Selector Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-[#F5F5F0] p-3 sm:p-4 rounded-3xl border border-[#E8E6DF]">
          {/* Video vs Offline Toggle */}
          <div className="flex rounded-2xl bg-white p-1 border border-[#E8E6DF] w-full sm:w-auto shadow-xs">
            <button
              onClick={() => setSelectedMode("video")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                selectedMode === "video"
                  ? "bg-[#8B9D83] text-white shadow-xs"
                  : "text-[#7A7A7A] hover:text-[#3D3D3D]"
              }`}
            >
              <Video className="w-4 h-4" />
              <span>1-on-1 Video Call</span>
            </button>

            <button
              onClick={() => setSelectedMode("offline")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                selectedMode === "offline"
                  ? "bg-[#CB997E] text-white shadow-xs"
                  : "text-[#7A7A7A] hover:text-[#3D3D3D]"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Offline Kendra Visit</span>
            </button>
          </div>

          {/* City Filter (Shown especially for Offline Visit) */}
          <div className="flex items-center gap-2 w-full sm:w-auto font-sans">
            <span className="text-xs text-[#7A7A7A] shrink-0 font-medium">
              {selectedMode === "offline" ? "Select Kendra City:" : "Filter Kendra City:"}
            </span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-white border border-[#E8E6DF] text-[#3D3D3D] text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-[#8B9D83] cursor-pointer w-full sm:w-auto shadow-xs font-medium"
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city === "All" ? "All Major Cities" : city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Astrologers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAstrologers.map((astro) => (
            <div
              key={astro.id}
              className="rounded-[32px] bg-white border border-[#E8E6DF] hover:border-[#CB997E] p-6 sm:p-7 transition-all duration-200 flex flex-col justify-between shadow-sm"
            >
              <div>
                {/* Top Astrologer Profile */}
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={astro.avatar}
                      alt={astro.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#E8E6DF] shadow-xs"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-[#8B9D83] text-white p-0.5 rounded-full border border-white" title="Verified Astrologer">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-serif text-base sm:text-lg font-bold text-[#3D3D3D] truncate">
                        {astro.name}
                      </h3>
                      <div className="flex items-center gap-1 bg-[#F0EDDF] px-2.5 py-0.5 rounded-full text-xs text-[#5C6B5A] font-bold border border-[#8B9D83]/30 shrink-0">
                        <Star className="w-3 h-3 fill-[#CB997E] text-[#CB997E]" />
                        <span>{astro.rating}</span>
                        <span className="text-[#7A7A7A] font-normal">({astro.reviewsCount})</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#8B9D83] font-semibold mt-0.5">
                      {astro.vedicTitle}
                    </p>
                    <p className="text-[11px] text-[#7A7A7A] mt-0.5 font-sans">
                      {astro.education} &bull; <strong>{astro.experience}+ yrs exp</strong>
                    </p>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-xs text-[#7A7A7A] mt-4 leading-relaxed line-clamp-2 font-sans">
                  {astro.bio}
                </p>

                {/* Specializations Tags */}
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {astro.specializations.map((spec, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#F5F5F0] text-[#5C6B5A] border border-[#E8E6DF] font-medium"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Languages & Location info */}
                <div className="mt-3.5 pt-3 border-t border-[#E8E6DF] flex flex-wrap items-center justify-between text-xs text-[#7A7A7A] gap-2 font-sans">
                  <div>
                    Languages: <strong className="text-[#3D3D3D]">{astro.languages.join(", ")}</strong>
                  </div>
                  <div className="flex items-center gap-1 text-[#8B9D83] font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{astro.availableNext}</span>
                  </div>
                </div>

                {/* Offline address if in offline mode */}
                {selectedMode === "offline" && (
                  <div className="mt-3.5 p-3 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] flex items-start gap-2 text-[11px] text-[#4A4A4A] font-sans">
                    <MapPin className="w-3.5 h-3.5 text-[#CB997E] shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{astro.clinicAddress}</span>
                  </div>
                )}
              </div>

              {/* Booking Action Bottom Bar */}
              <div className="mt-6 pt-4 border-t border-[#E8E6DF] flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-[#7A7A7A] uppercase tracking-wider block font-sans">
                    {selectedMode === "video" ? "Video Consultation" : "Offline Kendra Visit"}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-[#3D3D3D] font-serif">
                      ₹{selectedMode === "video" ? astro.videoFee : astro.offlineFee}
                    </span>
                    <span className="text-[10px] text-[#7A7A7A] font-sans">/ 30 min</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenBooking(astro, "video")}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedMode === "video"
                        ? "bg-[#8B9D83] hover:bg-[#7A8C73] text-white border-[#8B9D83] shadow-xs"
                        : "bg-[#F5F5F0] text-[#4A4A4A] border-[#E8E6DF] hover:border-[#8B9D83]"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video Call</span>
                  </button>

                  <button
                    onClick={() => handleOpenBooking(astro, "offline")}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedMode === "offline"
                        ? "bg-[#CB997E] hover:bg-[#B8856B] text-white border-[#CB997E] shadow-xs"
                        : "bg-[#F5F5F0] text-[#4A4A4A] border-[#E8E6DF] hover:border-[#CB997E]"
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Offline Visit</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Booking Form Modal */}
        {bookingAstrologer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
            <div className="relative w-full max-w-lg rounded-[32px] bg-white border border-[#E8E6DF] p-6 sm:p-8 shadow-2xl my-8">
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E6DF] mb-5">
                <div>
                  <span className="text-[11px] font-bold text-[#8B9D83] uppercase tracking-wider font-sans">
                    {selectedMode === "video" ? "1-on-1 Video Consultation" : "In-Person Kendra Appointment"}
                  </span>
                  <h3 className="font-serif text-xl font-bold text-[#3D3D3D] mt-0.5">
                    Book {bookingAstrologer.name}
                  </h3>
                </div>
                <button
                  onClick={() => setBookingAstrologer(null)}
                  className="p-1.5 text-[#7A7A7A] hover:text-[#3D3D3D] rounded-full cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleConfirmBooking} className="space-y-4 text-xs font-sans">
                {/* Mode summary */}
                <div className="p-3.5 rounded-2xl bg-[#F0EDDF] border border-[#8B9D83]/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedMode === "video" ? (
                      <Video className="w-4 h-4 text-[#8B9D83]" />
                    ) : (
                      <MapPin className="w-4 h-4 text-[#CB997E]" />
                    )}
                    <span className="text-[#3D3D3D] font-medium">
                      Mode: <strong className="text-[#5C6B5A]">{selectedMode === "video" ? "Private HD Video Call" : "Offline Kendra Visit"}</strong>
                    </span>
                  </div>
                  <span className="font-bold text-[#3D3D3D] font-serif text-sm">
                    ₹{selectedMode === "video" ? bookingAstrologer.videoFee : bookingAstrologer.offlineFee}
                  </span>
                </div>

                {/* Clinic address note if offline */}
                {selectedMode === "offline" && (
                  <div className="p-3.5 rounded-2xl bg-[#F5F5F0] border border-[#E8E6DF] text-[#4A4A4A] space-y-1">
                    <span className="font-bold text-[#3D3D3D] block">Kendra Address:</span>
                    <p>{bookingAstrologer.clinicAddress}</p>
                  </div>
                )}

                {/* Date & Time Slot selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#4A4A4A] font-semibold mb-1">
                      Appointment Date *
                    </label>
                    <select
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F5F5F0] border border-[#E8E6DF] text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83] cursor-pointer"
                    >
                      <option value="Today (Urgent)">Today (Next Available)</option>
                      <option value="Tomorrow">Tomorrow</option>
                      <option value="This Weekend (Saturday)">This Saturday</option>
                      <option value="This Weekend (Sunday)">This Sunday</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#4A4A4A] font-semibold mb-1">
                      Preferred Time Slot *
                    </label>
                    <select
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F5F5F0] border border-[#E8E6DF] text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83] cursor-pointer"
                    >
                      <option value="10:30 AM - 11:15 AM">10:30 AM - 11:15 AM</option>
                      <option value="02:00 PM - 02:45 PM">02:00 PM - 02:45 PM</option>
                      <option value="04:30 PM - 05:15 PM">04:30 PM - 05:15 PM</option>
                      <option value="06:30 PM - 07:15 PM">06:30 PM - 07:15 PM</option>
                    </select>
                  </div>
                </div>

                {/* Name & Mobile Number */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#4A4A4A] font-semibold mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F5F5F0] border border-[#E8E6DF] text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#4A4A4A] font-semibold mb-1">
                      Mobile Number (+91) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={mobileInput}
                      onChange={(e) => setMobileInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F5F5F0] border border-[#E8E6DF] text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83]"
                    />
                  </div>
                </div>

                {/* Specific Question / Briefing notes */}
                <div>
                  <label className="block text-[#4A4A4A] font-semibold mb-1">
                    What would you like to consult about? (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Career promotion timing, Kundali matching, health remedies..."
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F5F0] border border-[#E8E6DF] text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83] resize-none placeholder-[#AFAFAF]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3 rounded-full bg-[#8B9D83] hover:bg-[#7A8C73] text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Confirming Appointment...</span>
                  ) : (
                    <>
                      <span>
                        {selectedMode === "video" ? "Confirm & Launch Video Room" : "Confirm & Get Clinic Pass"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Video Call Modal */}
        {activeVideoCall && (
          <VideoCallModal
            isOpen={true}
            onClose={() => setActiveVideoCall(null)}
            astrologer={activeVideoCall.astrologer}
            booking={activeVideoCall.booking}
          />
        )}

        {/* Offline Visit Pass Modal */}
        {activeOfflinePass && (
          <OfflinePassModal
            isOpen={true}
            onClose={() => setActiveOfflinePass(null)}
            astrologer={activeOfflinePass.astrologer}
            booking={activeOfflinePass.booking}
          />
        )}
      </div>
    </section>
  );
};
