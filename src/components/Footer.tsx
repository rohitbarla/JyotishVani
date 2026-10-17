import React from "react";
import { Sun, Moon, Sparkles, Heart, Shield, Phone, Mail, MessageSquare, Lock, LogOut } from "lucide-react";
import { DynamicSettings, UserSubscription } from "../types";

interface FooterProps {
  onSelectTab: (tabId: string) => void;
  onOpenRegister: () => void;
  onOpenAdminLogin?: () => void;
  onNavigateStaffPortal?: () => void;
  activeUser?: UserSubscription | null;
  onLogout?: () => void;
  dynamicSettings?: DynamicSettings | null;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectTab,
  onOpenRegister,
  onOpenAdminLogin,
  onNavigateStaffPortal,
  activeUser,
  onLogout,
  dynamicSettings,
}) => {
  const helpline = dynamicSettings?.helplineNumber || "9560169988";
  const handleStaffClick = onNavigateStaffPortal || onOpenAdminLogin;
  return (
    <footer className="bg-[#F0EDDF] text-[#7A7A7A] border-t border-[#E8E6DF] pt-16 pb-12 text-xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#E8E6DF]">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#8B9D83] flex items-center justify-center text-white shadow-xs">
                <Sun className="w-5 h-5" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-[#3D3D3D]">
                JyotishVani
              </span>
            </div>

            <p className="text-xs text-[#7A7A7A] max-w-sm leading-relaxed font-sans">
              Empowering your daily decisions through timeless Vedic astrology, delivered every morning at 7:00 AM straight to your Email inbox.
            </p>

            <div className="pt-2 flex items-center gap-4 text-xs text-[#5C6B5A] font-semibold">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#8B9D83]" />
                100% Secure &bull; No Spam
              </span>
              <span>&bull;</span>
              <span>250,000+ Active Devotees</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-sm font-bold text-[#3D3D3D] mb-3 tracking-wider uppercase">
              Horoscope &amp; Wisdom
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  onClick={() => onSelectTab("horoscope")}
                  className="hover:text-[#CB997E] transition-colors cursor-pointer text-[#5C6B5A]"
                >
                  Daily Zodiac Forecast
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab("panchang")}
                  className="hover:text-[#CB997E] transition-colors cursor-pointer text-[#5C6B5A]"
                >
                  Today's Shubh Panchang
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab("ai-oracle")}
                  className="hover:text-[#CB997E] transition-colors cursor-pointer text-[#5C6B5A]"
                >
                  Ask Jyotish AI Oracle
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab("offline-connect")}
                  className="hover:text-[#CB997E] transition-colors cursor-pointer text-[#5C6B5A]"
                >
                  Offline Connect ({helpline})
                </button>
              </li>
            </ul>
          </div>

          {/* Subscription Plans */}
          <div>
            <h4 className="font-serif text-sm font-bold text-[#3D3D3D] mb-3 tracking-wider uppercase">
              Subscription Plans
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  onClick={onOpenRegister}
                  className="hover:text-[#5C6B5A] transition-colors cursor-pointer text-[#8B9D83] font-bold"
                >
                  ★ 3-Day Free Trial (₹0)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab("pricing")}
                  className="hover:text-[#CB997E] transition-colors cursor-pointer text-[#5C6B5A]"
                >
                  Monthly Plan (₹150)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab("pricing")}
                  className="hover:text-[#CB997E] transition-colors cursor-pointer text-[#5C6B5A]"
                >
                  3 Months Plan (₹400)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab("pricing")}
                  className="hover:text-[#CB997E] transition-colors cursor-pointer text-[#5C6B5A]"
                >
                  6 Months Plan (₹500)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab("pricing")}
                  className="hover:text-[#CB997E] transition-colors cursor-pointer text-[#5C6B5A]"
                >
                  1 Year Devotee Pass (₹1,000)
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="font-serif text-sm font-bold text-[#3D3D3D] mb-3 tracking-wider uppercase">
              Devotee Support
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#8B9D83]" />
                <a href="tel:9560169988" className="text-[#5C6B5A] hover:text-[#CB997E] font-bold">Helpline: +91 9560169988</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#8B9D83]" />
                <span className="text-[#5C6B5A]">Daily Email: 07:00 AM IST</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#CB997E]" />
                <span className="text-[#5C6B5A]">support@jyotishvani.live</span>
              </li>
              <li className="text-[11px] text-[#7A7A7A] pt-1">
                Mon - Sun: 6:00 AM - 10:00 PM IST
              </li>
              {handleStaffClick && (
                <li className="pt-2 border-t border-[#E8E6DF]/70">
                  <button
                    type="button"
                    onClick={handleStaffClick}
                    className="flex items-center gap-1.5 text-[#5C6B5A] hover:text-[#3D3D3D] font-bold text-xs transition-colors cursor-pointer"
                    title="Staff Entry - Daily Horoscope Email Scheduler & Kendra Portal"
                    id="footer-support-staff-entry"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#8B9D83]" />
                    <span>Staff Entry</span>
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Footer Links Row */}
        <div className="pt-6 pb-2 border-t border-[#E8E6DF] flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#7A7A7A]">
          <button
            type="button"
            onClick={() => onSelectTab("horoscope")}
            className="hover:text-[#5C6B5A] transition-colors cursor-pointer"
          >
            Daily Horoscope
          </button>
          <span className="text-[#D6D3C7]">&bull;</span>
          <button
            type="button"
            onClick={() => onSelectTab("panchang")}
            className="hover:text-[#5C6B5A] transition-colors cursor-pointer"
          >
            Today's Panchang
          </button>
          <span className="text-[#D6D3C7]">&bull;</span>
          <button
            type="button"
            onClick={() => onSelectTab("pricing")}
            className="hover:text-[#5C6B5A] transition-colors cursor-pointer"
          >
            Subscription Plans
          </button>
          <span className="text-[#D6D3C7]">&bull;</span>
          <button
            type="button"
            onClick={() => onSelectTab("offline-connect")}
            className="hover:text-[#5C6B5A] transition-colors cursor-pointer"
          >
            Helpline ({helpline})
          </button>
          <span className="text-[#D6D3C7]">&bull;</span>
          {activeUser && (
            <>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF9F6] border border-[#E8E6DF] text-[#5C6B5A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B9D83] animate-pulse" />
                <span>Logged in: <strong>{activeUser.name || "Seeker"}</strong> (+91 {activeUser.mobile})</span>
              </span>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 hover:underline font-bold transition-colors cursor-pointer"
                  id="footer-logout-btn"
                  title="Log out of this device"
                >
                  <LogOut className="w-3 h-3 text-rose-500" />
                  <span>Log Out</span>
                </button>
              )}
              <span className="text-[#D6D3C7]">&bull;</span>
            </>
          )}
          {handleStaffClick && (
            <button
              type="button"
              onClick={handleStaffClick}
              className="inline-flex items-center gap-1.5 font-bold text-[#5C6B5A] hover:text-[#3D3D3D] hover:underline transition-colors cursor-pointer px-2.5 py-1 rounded-md bg-[#FAF9F6] border border-[#E8E6DF] shadow-2xs"
              title="Staff Entry - Daily Horoscope Scheduler & Kendra Portal"
              id="footer-staff-entry-link"
            >
              <Lock className="w-3 h-3 text-[#8B9D83]" />
              <span>Staff Entry</span>
            </button>
          )}
        </div>

        {/* Spiritual Disclaimer */}
        <div className="pt-4 text-center max-w-4xl mx-auto space-y-3">
          <p className="text-[11px] text-[#8C8C8C] leading-relaxed">
            <strong>Spiritual &amp; Cultural Disclaimer:</strong> Astrology, horoscope forecasts, and Kundali readings are rooted in ancient Vedic tradition and spiritual philosophy intended for personal reflection, philosophical understanding, and spiritual upliftment. They do not constitute medical, legal, psychological, or certified financial advice. Users are encouraged to exercise independent discernment for critical life decisions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-[11px] text-[#AFAFAF]">
            <p>
              &copy; {new Date().getFullYear()} JyotishVani. All rights reserved. Registered under Indian Spiritual &amp; Cultural Heritage Guidelines.
            </p>
            {handleStaffClick && (
              <button
                onClick={handleStaffClick}
                className="text-[#9E9E9E] hover:text-[#5C6B5A] text-[10px] transition-colors cursor-pointer inline-flex items-center gap-1 sm:border-l sm:border-[#D6D3C7] sm:pl-2.5"
                title="Staff Entry"
                id="footer-admin-portal-link"
              >
                <Lock className="w-2.5 h-2.5 opacity-60" />
                <span>Staff Entry</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
