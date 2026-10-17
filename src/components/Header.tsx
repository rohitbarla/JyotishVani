import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Phone,
  Calendar,
  ShieldCheck,
  Sun,
  Moon,
  Database,
  Settings,
  Shield,
  LogOut,
  ChevronDown,
  User,
  Clock,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Edit,
  Smartphone,
  X,
} from "lucide-react";
import { UserSubscription, DynamicSettings } from "../types";

interface HeaderProps {
  onOpenRegister: (planId?: string) => void;
  onSelectTab: (tabId: string) => void;
  activeUser: UserSubscription | null;
  onLogout?: () => void;
  onOpenAutoRenew?: () => void;
  onUserUpdate?: (updatedUser: UserSubscription) => void;
  dynamicSettings?: DynamicSettings | null;
  onNavigateStaffPortal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenRegister,
  onSelectTab,
  activeUser,
  onLogout,
  onOpenAutoRenew,
  onUserUpdate,
  dynamicSettings,
  onNavigateStaffPortal,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isTogglingAutoRenew, setIsTogglingAutoRenew] = useState(false);
  const [isEditMobileOpen, setIsEditMobileOpen] = useState(false);
  const [newMobileInput, setNewMobileInput] = useState("");
  const [isSavingMobile, setIsSavingMobile] = useState(false);
  const [mobileError, setMobileError] = useState("");
  const [mobileSuccess, setMobileSuccess] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if active user subscription is expired
  const isExpired = Boolean(
    activeUser &&
      (activeUser.status === "expired" ||
        (Boolean(activeUser.validUntil) &&
          !isNaN(new Date(activeUser.validUntil).getTime()) &&
          new Date(activeUser.validUntil).getTime() < Date.now()))
  );

  const handleToggleAutoRenew = async () => {
    if (!activeUser) return;
    const nextState = activeUser.autoRenew === false ? true : false;
    setIsTogglingAutoRenew(true);
    try {
      const res = await fetch(`/api/subscribers/${activeUser.mobile}/auto-renew`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoRenew: nextState }),
      });
      const data = await res.json();
      if (data.success && onUserUpdate) {
        onUserUpdate({ ...activeUser, autoRenew: data.autoRenew });
      } else if (onUserUpdate) {
        onUserUpdate({ ...activeUser, autoRenew: nextState });
      }
    } catch (err) {
      console.error("Failed to toggle auto-renew:", err);
      if (onUserUpdate) {
        onUserUpdate({ ...activeUser, autoRenew: nextState });
      }
    } finally {
      setIsTogglingAutoRenew(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
        setShowLogoutConfirm(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConfirmLogout = () => {
    setIsProfileOpen(false);
    setShowLogoutConfirm(false);
    if (onLogout) {
      onLogout();
    }
  };

  const handleOpenEditMobile = () => {
    if (!activeUser) return;
    setIsProfileOpen(false);
    setNewMobileInput(activeUser.mobile.replace(/\D/g, ""));
    setMobileError("");
    setMobileSuccess("");
    setIsEditMobileOpen(true);
  };

  const handleSaveUserMobile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;

    const cleanOrig = activeUser.mobile.replace(/\D/g, "");
    const cleanNew = newMobileInput.replace(/\D/g, "");

    if (!cleanNew || cleanNew.length !== 10) {
      setMobileError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setIsSavingMobile(true);
    setMobileError("");
    setMobileSuccess("");

    try {
      const res = await fetch(`/api/subscribers/${cleanOrig}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: cleanNew,
          newMobile: cleanNew !== cleanOrig ? cleanNew : undefined,
          updatedAt: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const updatedUser: UserSubscription = {
          ...activeUser,
          mobile: cleanNew,
        };
        localStorage.setItem("jyotish_user_sub", JSON.stringify(updatedUser));
        if (onUserUpdate) {
          onUserUpdate(updatedUser);
        }
        setMobileSuccess("Mobile number updated successfully!");
        setTimeout(() => {
          setIsEditMobileOpen(false);
          setMobileSuccess("");
        }, 1500);
      } else {
        setMobileError(data.error || "Failed to update mobile number.");
      }
    } catch (err) {
      console.error("Error updating user mobile:", err);
      setMobileError("Network error: Could not reach server to update mobile number.");
    } finally {
      setIsSavingMobile(false);
    }
  };

  const helpline = dynamicSettings?.helplineNumber || "9560169988";
  const bannerText =
    dynamicSettings?.announcementBanner ||
    "✨ Today's Panchang & Shubh Muhurat Active • Offline Helpline: 9560169988 • 3 Days Free Trial";

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[#FAF9F6]/95 border-b border-[#E8E6DF]">
      {/* Top micro-announcement banner */}
      <div className="bg-[#F0EDDF] border-b border-[#E8E6DF] py-1.5 px-4 text-center text-xs text-[#5C6B5A] font-medium">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#CB997E] animate-pulse" />
          <span>
            {bannerText} • Helpline:{" "}
            <a href={`tel:${helpline}`} className="font-bold underline text-[#3D3D3D] hover:text-[#CB997E]">
              {helpline}
            </a>
          </span>
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => onSelectTab("hero")}
          className="flex items-center gap-3 cursor-pointer group select-none"
          id="brand-logo-btn"
        >
          <div className="w-9 h-9 bg-[#8B9D83] rounded-full flex items-center justify-center shadow-sm group-hover:bg-[#7A8C73] transition-colors">
            <div className="w-4 h-4 border-2 border-white rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif italic text-2xl text-[#3D3D3D] tracking-tight">
                JyotishVani
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 bg-[#F0EDDF] text-[#8B9D83] rounded-full border border-[#E8E6DF]">
                Vedic
              </span>
            </div>
            <p className="text-[10px] text-[#7A7A7A] uppercase tracking-widest font-medium">
              Daily Cosmic Wisdom Delivery
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#7A7A7A] uppercase tracking-widest">
          <button
            onClick={() => onSelectTab("panchang")}
            className="hover:text-[#CB997E] transition-colors cursor-pointer font-bold text-[#3D3D3D]"
            id="nav-panchang"
          >
            Today's Panchang
          </button>
          <button
            onClick={() => onSelectTab("horoscope")}
            className="hover:text-[#CB997E] transition-colors cursor-pointer"
            id="nav-daily-horoscope"
          >
            Daily Horoscope
          </button>
          <button
            onClick={() => onSelectTab("pricing")}
            className="hover:text-[#CB997E] transition-colors cursor-pointer flex items-center gap-1.5"
            id="nav-plans"
          >
            <span>Plans</span>
            <span className="px-2 py-0.5 text-[9px] bg-[#F0EDDF] text-[#8B9D83] rounded-full font-bold border border-[#E8E6DF]">
              3 Days Free
            </span>
          </button>
          <button
            onClick={() => onSelectTab("ai-oracle")}
            className="hover:text-[#CB997E] transition-colors cursor-pointer flex items-center gap-1.5"
            id="nav-ai-chat"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#CB997E]" />
            <span>AI Oracle</span>
          </button>
          <button
            onClick={() => onSelectTab("offline-connect")}
            className="hover:text-[#CB997E] transition-colors cursor-pointer flex items-center gap-1.5 text-[#5C6B5A]"
            id="nav-offline-connect"
          >
            <Phone className="w-3.5 h-3.5 text-[#CB997E]" />
            <span>Offline Connect</span>
          </button>
          {onNavigateStaffPortal && (
            <button
              onClick={onNavigateStaffPortal}
              className="hover:text-[#CB997E] transition-colors cursor-pointer flex items-center gap-1.5 text-[#8B9D83] font-bold"
              id="nav-staff-portal"
              title="Staff & Admin Portal: Devotee Master Directory, Panchang & Scheduler"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin / Staff</span>
            </button>
          )}
        </nav>

        {/* Right CTA / Active User Status */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {activeUser ? (
            <div className="relative flex items-center gap-2" ref={dropdownRef}>
              {/* If Expired: Prominent Auto-Renew Button */}
              {isExpired && onOpenAutoRenew && (
                <button
                  type="button"
                  onClick={onOpenAutoRenew}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#8B9D83] hover:bg-[#7A8C73] text-white text-xs font-bold shadow-xs cursor-pointer animate-pulse transition-all"
                  id="header-expired-autorenew-btn"
                  title="Your subscription has expired. Click to auto-renew."
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Auto-Renew</span>
                </button>
              )}

              {/* Profile button badge */}
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setShowLogoutConfirm(false);
                }}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full text-xs cursor-pointer transition-all shadow-2xs border ${
                  isExpired
                    ? "bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900"
                    : "bg-[#F0EDDF] hover:bg-[#E8E6DF] border-[#8B9D83] text-[#5C6B5A]"
                }`}
                id="active-user-badge"
                title="Click to view subscription details & options"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isExpired ? "bg-amber-500 animate-bounce" : "bg-[#8B9D83] animate-pulse"
                  }`}
                />
                <span className="font-semibold text-[#3D3D3D] max-w-[110px] sm:max-w-none truncate">
                  {activeUser.name || "Seeker"} ({activeUser.zodiacSign})
                </span>
                <span
                  className={`text-[10px] hidden sm:inline ${
                    isExpired ? "text-amber-700 font-bold" : "text-[#7A7A7A]"
                  }`}
                >
                  • {isExpired ? "Expired" : activeUser.planId === "trial" ? "3-Day Trial" : "Active"}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#5C6B5A] transition-transform duration-200 ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Direct Log Out Button */}
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-rose-50 border border-[#E8E6DF] hover:border-rose-300 text-xs font-semibold text-[#666] hover:text-rose-700 transition-all cursor-pointer shadow-2xs group"
                id="header-direct-logout-btn"
                title="Log out from JyotishVani"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Log Out</span>
              </button>

              {/* Profile Details Dropdown */}
              {isProfileOpen && !showLogoutConfirm && (
                <div
                  className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-[#E8E6DF] shadow-xl p-4 z-50 animate-fadeIn"
                  id="user-profile-popover"
                >
                  {/* Expired Callout */}
                  {isExpired && (
                    <div className="mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Subscription Expired</span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                        Daily Email horoscope delivery is paused. Auto-renew to resume daily dispatches.
                      </p>
                    </div>
                  )}

                  <div className="flex items-start justify-between border-b border-[#E8E6DF] pb-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#8B9D83]/15 text-[#5C6B5A] flex items-center justify-center font-serif font-bold text-sm">
                        {(activeUser.name || "S").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#3D3D3D] leading-tight">
                          {activeUser.name || "Devotee Seeker"}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-[11px] text-[#7A7A7A] font-mono">
                            +91 {activeUser.mobile}
                          </p>
                          <button
                            type="button"
                            onClick={handleOpenEditMobile}
                            className="text-[10px] text-[#25D366] hover:text-[#1E7E34] font-bold underline cursor-pointer inline-flex items-center gap-0.5"
                            title="Edit registered mobile number"
                          >
                            <Edit className="w-2.5 h-2.5" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isExpired
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : activeUser.status === "active"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {isExpired ? "Expired" : activeUser.planId === "trial" ? "Free Trial" : "Active Member"}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-[#555] mb-4">
                    <div className="flex items-center justify-between py-1 border-b border-[#F5F5F0]">
                      <span className="text-[#888]">Zodiac Sign (Rashi):</span>
                      <strong className="text-[#3D3D3D] capitalize">
                        {activeUser.zodiacSign}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[#F5F5F0]">
                      <span className="text-[#888]">Daily Delivery:</span>
                      <span className="text-[#3D3D3D] font-medium capitalize">
                        {activeUser.deliveryChannel} ({activeUser.deliveryTime || "07:00 AM"})
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[#F5F5F0]">
                      <span className="text-[#888]">Subscription Valid:</span>
                      <span className={`font-bold ${isExpired ? "text-rose-600" : "text-[#5C6B5A]"}`}>
                        {activeUser.validUntil ? (
                          isExpired ? (
                            `Expired (${new Date(activeUser.validUntil).toLocaleDateString("en-IN")})`
                          ) : (
                            new Date(activeUser.validUntil).toLocaleDateString("en-IN")
                          )
                        ) : (
                          "Active"
                        )}
                      </span>
                    </div>

                    {/* Auto-Renew Option Post Expiry Toggle */}
                    <div className="flex items-center justify-between py-2 border-b border-[#F5F5F0] bg-[#FAF9F6] px-2 rounded-xl">
                      <div>
                        <span className="text-xs text-[#3D3D3D] font-semibold block">
                          Auto-Renew Post Expiry:
                        </span>
                        <span className="text-[10px] text-[#7A7A7A]">
                          {activeUser.autoRenew !== false ? "Enabled (Seamless continuation)" : "Disabled (Manual only)"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleAutoRenew}
                        disabled={isTogglingAutoRenew}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer disabled:opacity-50 ${
                          activeUser.autoRenew !== false
                            ? "bg-[#EDF3EC] border-[#8B9D83] text-[#5C6B5A]"
                            : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
                        }`}
                        title="Click to toggle auto-renew"
                      >
                        {isTogglingAutoRenew ? "..." : activeUser.autoRenew !== false ? "ON ✓" : "OFF"}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-1 border-t border-[#E8E6DF]">
                    {/* Direct Auto-Renew Action */}
                    {onOpenAutoRenew && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          onOpenAutoRenew();
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#8B9D83] hover:bg-[#7A8C73] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                        id="dropdown-autorenew-btn"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{isExpired ? "Auto-Renew Subscription Now" : "Configure Auto-Renew"}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleOpenEditMobile}
                      className="w-full py-2 px-3 rounded-xl border border-[#25D366]/40 bg-[#E7F8EE]/60 hover:bg-[#E7F8EE] text-[#1E7E34] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      id="dropdown-update-mobile-btn"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Update Mobile Number (+91)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onOpenRegister();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-[#F0EDDF] hover:bg-[#E8E6DF] text-[#3D3D3D] text-xs font-bold transition-colors text-center cursor-pointer"
                    >
                      Change Plan / Upgrade
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowLogoutConfirm(true);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      id="dropdown-logout-btn"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-600" />
                      <span>Log Out of Account</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Logout Confirmation Dialog Popover */}
              {showLogoutConfirm && (
                <div
                  className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-rose-200 shadow-xl p-4 z-50 animate-fadeIn"
                  id="logout-confirmation-card"
                >
                  <div className="flex items-center gap-2.5 text-rose-700 mb-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <h5 className="font-bold text-xs text-[#3D3D3D]">Confirm Logout</h5>
                  </div>
                  <p className="text-xs text-[#666] leading-relaxed mb-3.5">
                    Are you sure you want to log out from <strong className="text-[#3D3D3D]">+91 {activeUser.mobile}</strong>?
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowLogoutConfirm(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#666] hover:bg-[#F5F5F0] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmLogout}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      id="confirm-logout-btn"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <a
                href={`tel:${helpline}`}
                className="hidden lg:inline-flex items-center gap-1.5 text-xs font-bold text-[#3D3D3D] hover:text-[#CB997E] px-3.5 py-2 rounded-full border border-[#E8E6DF] bg-[#F5F5F0] hover:bg-[#E8E6DF] transition-all"
                id="header-call-btn"
                title="Call Offline Consultation Helpline"
              >
                <Phone className="w-3.5 h-3.5 text-[#CB997E]" />
                <span>{helpline}</span>
              </a>
              <button
                onClick={() => onOpenRegister("trial")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#8B9D83] hover:bg-[#7A8C73] px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-sm transition-all cursor-pointer"
                id="header-free-trial-btn"
              >
                <Sparkles className="w-3.5 h-3.5 text-white/90" />
                <span>Sign In / 3 Days Free</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Devotee Profile: Edit Registered Mobile Number Modal */}
      {isEditMobileOpen && activeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-left">
          <form
            onSubmit={handleSaveUserMobile}
            className="bg-white rounded-[32px] border border-[#E8E6DF] p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E8E6DF] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#E7F8EE] text-[#1E7E34] flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#3D3D3D]">
                    Update Mobile Number
                  </h3>
                  <p className="text-[11px] text-[#7A7A7A]">
                    {activeUser.name || "Devotee"} ({activeUser.zodiacSign || "Rashi"})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditMobileOpen(false)}
                className="p-1 rounded-full text-[#7A7A7A] hover:text-[#3D3D3D] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#FAF9F6] border border-[#E8E6DF] rounded-2xl space-y-1 text-xs">
              <span className="text-[#7A7A7A] block font-medium">Currently Registered Number:</span>
              <span className="font-mono font-bold text-[#3D3D3D] text-sm block">
                +91 {activeUser.mobile}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#4A4A4A]">
                  New 10-Digit Mobile Number
                </label>
                <span className="text-[10px] font-mono text-[#7A7A7A]">
                  {newMobileInput.replace(/\D/g, "").length}/10 digits
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-[#7A7A7A]">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  autoFocus
                  value={newMobileInput}
                  onChange={(e) => setNewMobileInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="9876543210"
                  className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-sm font-mono font-bold text-[#3D3D3D] focus:outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366]"
                />
              </div>
              <p className="text-[11px] text-[#7A7A7A] mt-1">
                Your devotee account and verification records will be updated to this new number.
              </p>
            </div>

            {mobileError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{mobileError}</span>
              </div>
            )}

            {mobileSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{mobileSuccess}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E6DF]">
              <button
                type="button"
                onClick={() => setIsEditMobileOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E8E6DF] text-xs font-bold cursor-pointer hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSavingMobile ||
                  newMobileInput.replace(/\D/g, "").length !== 10
                }
                className="px-5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1E7E34] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSavingMobile ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Update</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
};
