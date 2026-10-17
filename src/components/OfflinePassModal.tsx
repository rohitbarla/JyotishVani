import React from "react";
import { X, MapPin, Calendar, Clock, CheckCircle2, ShieldCheck, Printer, Phone, Navigation } from "lucide-react";
import { Astrologer, AstrologerBooking } from "../types";

interface OfflinePassModalProps {
  isOpen: boolean;
  onClose: () => void;
  astrologer: Astrologer | null;
  booking: AstrologerBooking | null;
}

export const OfflinePassModal: React.FC<OfflinePassModalProps> = ({
  isOpen,
  onClose,
  astrologer,
  booking,
}) => {
  if (!isOpen || !astrologer || !booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto font-sans">
      <div className="relative w-full max-w-lg rounded-[32px] bg-white border border-[#E8E6DF] p-6 sm:p-8 shadow-2xl my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#7A7A7A] hover:text-[#3D3D3D] hover:bg-[#F5F5F0] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Confirmation Badge */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-full bg-[#EDF3EC] border-2 border-[#8B9D83] text-[#8B9D83] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <span className="text-[11px] font-bold text-[#5C6B5A] uppercase tracking-wider bg-[#F0EDDF] px-3 py-1 rounded-full border border-[#8B9D83]/30">
            In-Person Kendra Visit Confirmed
          </span>
          <h3 className="font-serif text-2xl font-bold text-[#3D3D3D] mt-2">
            Vedic Kendra Appointment Pass
          </h3>
          <p className="text-xs text-[#7A7A7A] mt-1">
            Token ID: <strong className="text-[#8B9D83] font-mono text-sm">{booking.bookingId}</strong>
          </p>
        </div>

        {/* Pass Details Card */}
        <div className="rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] p-5 space-y-3.5 text-xs text-[#4A4A4A]">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E8E6DF]">
            <img
              src={astrologer.avatar}
              alt={astrologer.name}
              className="w-12 h-12 rounded-xl object-cover border border-[#E8E6DF] shadow-xs"
            />
            <div>
              <p className="font-serif font-bold text-sm text-[#3D3D3D]">{astrologer.name}</p>
              <p className="text-[11px] text-[#7A7A7A]">{astrologer.vedicTitle}</p>
              <p className="text-[10px] text-[#8B9D83] font-bold">Offline Consultation: ₹{astrologer.offlineFee}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 py-1 border-b border-[#E8E6DF]">
            <div>
              <span className="text-[10px] text-[#7A7A7A] uppercase block font-medium">Scheduled Date</span>
              <strong className="text-[#3D3D3D] text-xs flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-[#8B9D83]" />
                {booking.date}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-[#7A7A7A] uppercase block font-medium">Time Slot</span>
              <strong className="text-[#3D3D3D] text-xs flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-[#CB997E]" />
                {booking.timeSlot}
              </strong>
            </div>
          </div>

          {/* Physical Address */}
          <div>
            <span className="text-[10px] text-[#7A7A7A] uppercase block mb-1 font-medium">
              Center Address (Offline Kendra)
            </span>
            <div className="flex items-start gap-2 text-[#3D3D3D] leading-relaxed bg-white p-3 rounded-xl border border-[#E8E6DF]">
              <MapPin className="w-4 h-4 text-[#CB997E] shrink-0 mt-0.5" />
              <span>{astrologer.clinicAddress}</span>
            </div>
          </div>

          {/* User Details */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-[#7A7A7A]">
            <div>
              Patient / Devotee: <strong className="text-[#3D3D3D]">{booking.userName}</strong>
            </div>
            <div>
              Mobile: <strong className="text-[#3D3D3D]">+91 {booking.userMobile}</strong>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3.5 rounded-2xl bg-[#F0EDDF] border border-[#8B9D83]/30 text-[11px] text-[#4A4A4A] space-y-1">
          <p className="font-bold text-[#3D3D3D]">Important Instructions for Clinic Visit:</p>
          <ul className="list-disc pl-4 space-y-0.5 text-[#5C6B5A]">
            <li>Please arrive 10 minutes prior to your time slot with existing Kundali or birth details.</li>
            <li>Show this digital token number at the reception desk.</li>
            <li>Directions and confirmation details have also been sent to your registered email address.</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 px-4 rounded-full bg-[#F5F5F0] hover:bg-[#E8E6DF] text-[#4A4A4A] text-xs font-bold border border-[#E8E6DF] flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Appointment Pass</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-full bg-[#8B9D83] hover:bg-[#7A8C73] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
