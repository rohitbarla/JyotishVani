import React, { useState, useEffect, useRef } from "react";
import { X, Video, VideoOff, Mic, MicOff, PhoneOff, MessageSquare, Shield, Clock, Award, Star } from "lucide-react";
import { Astrologer, AstrologerBooking } from "../types";

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  astrologer: Astrologer | null;
  booking: AstrologerBooking | null;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  astrologer,
  booking,
}) => {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [callStatus, setCallStatus] = useState<"connecting" | "connected" | "ended">("connecting");
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [notes, setNotes] = useState(
    "Astrologer's Vedic Remedies: Chant Surya Gayatri on Sundays; wear light yellow on Thursdays for Jupiter blessings."
  );

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCallStatus("connecting");
      setSessionSeconds(0);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      return;
    }

    // Connect call after 2 seconds
    const timer = setTimeout(() => {
      setCallStatus("connected");
    }, 1800);

    // Try camera access gracefully
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        mediaStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (e) {
        // Camera access optional in iframe
        console.log("User camera preview unavailable or permission denied, using avatar preview.");
      }
    }
    initCamera();

    return () => {
      clearTimeout(timer);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  // Session timer
  useEffect(() => {
    if (callStatus !== "connected") return;
    const interval = setInterval(() => {
      setSessionSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  if (!isOpen || !astrologer) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
  };

  const handleEndCall = () => {
    setCallStatus("ended");
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn font-sans">
      <div className="relative w-full max-w-4xl rounded-[32px] bg-white border border-[#E8E6DF] overflow-hidden shadow-2xl flex flex-col h-[90vh] max-h-[700px]">
        {/* Top Header */}
        <div className="bg-[#FAF9F6] px-5 py-3.5 border-b border-[#E8E6DF] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#8B9D83] shadow-xs">
              <img src={astrologer.avatar} alt={astrologer.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-serif text-sm sm:text-base font-bold text-[#3D3D3D] flex items-center gap-2">
                <span>{astrologer.name}</span>
                <span className="text-[10px] bg-[#F0EDDF] text-[#5C6B5A] px-2 py-0.5 rounded-full font-bold border border-[#8B9D83]/30">
                  Live 1-on-1 Video
                </span>
              </h3>
              <p className="text-[11px] text-[#7A7A7A]">{astrologer.vedicTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F5F0] border border-[#E8E6DF] text-[#3D3D3D] text-xs font-mono font-bold">
              <Clock className="w-3.5 h-3.5 text-[#8B9D83]" />
              <span>{formatTime(sessionSeconds)}</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#7A7A7A] hover:text-[#3D3D3D] hover:bg-[#F5F5F0] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Area Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 bg-[#F5F5F0] relative p-3.5 gap-3.5 overflow-hidden">
          {/* Main Feed: Astrologer */}
          <div className="md:col-span-8 relative rounded-2xl overflow-hidden bg-[#FAF9F6] border border-[#E8E6DF] flex flex-col items-center justify-center shadow-xs">
            {callStatus === "connecting" && (
              <div className="text-center p-6">
                <div className="w-16 h-16 rounded-full border-4 border-[#8B9D83]/40 border-t-[#8B9D83] animate-spin mx-auto mb-4" />
                <p className="font-serif text-base font-bold text-[#3D3D3D]">
                  Establishing Secure Vedic Video Link...
                </p>
                <p className="text-xs text-[#7A7A7A] mt-1">
                  Connecting with {astrologer.name}
                </p>
              </div>
            )}

            {callStatus === "connected" && (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                {/* High quality video presence of the Acharya */}
                <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-[#8B9D83] shadow-lg mb-4 relative">
                  <img
                    src={astrologer.avatar}
                    alt={astrologer.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] text-white font-bold whitespace-nowrap">
                    Acharyaji Speaking
                  </div>
                </div>

                <div className="text-center px-4">
                  <p className="font-serif text-sm sm:text-base font-bold text-[#3D3D3D]">
                    "{astrologer.name}" is reviewing your birth charts &amp; Dasha cycle.
                  </p>
                  <p className="text-xs text-[#7A7A7A] mt-1 max-w-md italic font-serif">
                    "I am studying your 10th and 7th houses. Brihaspati and Surya transits are creating auspicious opportunities."
                  </p>
                </div>

                {/* Audio wave indicator */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] text-[#5C6B5A] border border-[#E8E6DF] shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#8B9D83] animate-ping" />
                  <span className="font-medium">Encrypted &bull; 100% Private</span>
                </div>
              </div>
            )}

            {callStatus === "ended" && (
              <div className="text-center p-6">
                <div className="w-14 h-14 rounded-full bg-[#EDF3EC] text-[#8B9D83] flex items-center justify-center mx-auto mb-3">
                  <Award className="w-7 h-7" />
                </div>
                <h4 className="font-serif text-lg font-bold text-[#3D3D3D]">Consultation Completed</h4>
                <p className="text-xs text-[#7A7A7A] mt-1 mb-4">
                  A summary and Vedic prescription have been logged for your mobile number.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full bg-[#8B9D83] text-white text-xs font-bold hover:bg-[#7A8C73] cursor-pointer shadow-xs"
                >
                  Return to Dashboard
                </button>
              </div>
            )}

            {/* Self Camera Picture-in-Picture */}
            {callStatus === "connected" && (
              <div className="absolute top-3 right-3 w-28 sm:w-36 h-20 sm:h-28 rounded-2xl bg-white border-2 border-[#8B9D83] overflow-hidden shadow-md z-20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${videoEnabled ? "block" : "hidden"}`}
                />
                {!videoEnabled && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-[#7A7A7A] p-2 text-center bg-[#FAF9F6]">
                    <VideoOff className="w-4 h-4 mb-1 text-[#8B9D83]" />
                    <span>Camera Off</span>
                  </div>
                )}
                <span className="absolute bottom-1 left-1 px-1.5 py-0.2 bg-black/60 rounded text-[9px] text-white">
                  You
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Live Astrological Notepad & Remedies */}
          <div className="md:col-span-4 rounded-2xl bg-white border border-[#E8E6DF] p-4 flex flex-col justify-between overflow-y-auto shadow-xs">
            <div>
              <h4 className="text-xs font-bold text-[#8B9D83] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#CB997E]" />
                <span>Acharya's Live Notes &amp; Remedies</span>
              </h4>

              <div className="p-3.5 rounded-xl bg-[#F0EDDF] border border-[#8B9D83]/30 mb-3 text-xs text-[#4A4A4A] leading-relaxed">
                <p className="font-bold text-[#3D3D3D] mb-1">Session Insights:</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#5C6B5A]">
                  <li>Current Mahadasha: Brihaspati (Jupiter)</li>
                  <li>Antardasha: Budha (Mercury)</li>
                  <li>Favorable direction for work: North-East</li>
                  <li>Avoid major partnerships during Rahu transit</li>
                </ul>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4A4A4A] mb-1">
                  Your Personal Consultation Notes
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F5F5F0] border border-[#E8E6DF] text-xs text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83] leading-relaxed resize-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#E8E6DF] mt-3">
              <div className="flex items-center justify-between text-[11px] text-[#7A7A7A]">
                <span>Appointment Ref:</span>
                <span className="font-mono text-[#3D3D3D] font-bold">{booking?.bookingId || "JV-LIVE"}</span>
              </div>
              <p className="text-[10px] text-[#AFAFAF] mt-1">
                A PDF copy of this session will be sent to your registered email address.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Call Control Bar */}
        <div className="bg-[#FAF9F6] px-6 py-3.5 border-t border-[#E8E6DF] flex items-center justify-center gap-4">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-3 rounded-full border transition-all cursor-pointer ${
              audioEnabled
                ? "bg-white border-[#E8E6DF] text-[#3D3D3D] hover:bg-[#F5F5F0] shadow-xs"
                : "bg-rose-50 border-rose-300 text-rose-600"
            }`}
            title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
          >
            {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setVideoEnabled(!videoEnabled)}
            className={`p-3 rounded-full border transition-all cursor-pointer ${
              videoEnabled
                ? "bg-white border-[#E8E6DF] text-[#3D3D3D] hover:bg-[#F5F5F0] shadow-xs"
                : "bg-rose-50 border-rose-300 text-rose-600"
            }`}
            title={videoEnabled ? "Turn Off Camera" : "Turn On Camera"}
          >
            {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            onClick={handleEndCall}
            className="px-6 py-3 rounded-full bg-[#CB997E] hover:bg-[#B8856B] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Consultation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
