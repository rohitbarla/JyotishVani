import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { DeliveryMockup } from "./components/DeliveryMockup";
import { HoroscopePreview } from "./components/HoroscopePreview";
import { PricingSection } from "./components/PricingSection";
import { AiAstrologyChat } from "./components/AiAstrologyChat";
import { OfflineConnect } from "./components/OfflineConnect";
import { PanchangWidget } from "./components/PanchangWidget";
import { TestimonialsAndFaq } from "./components/TestimonialsAndFaq";
import { Footer } from "./components/Footer";
import { RegistrationModal } from "./components/RegistrationModal";
import { DatabaseViewerModal } from "./components/DatabaseViewerModal";
import { AutoRenewModal } from "./components/AutoRenewModal";
import { KendraStaffPortalPage } from "./pages/KendraStaffPortalPage";
import { UserSubscription, SubscriptionPlanId, DynamicSettings, StoredPanchangData } from "./types";
import { Sparkles, Bell, CheckCircle2, LogOut, AlertTriangle, RefreshCw } from "lucide-react";
import { safeFetchJson } from "./utils/apiClient";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("home");

  // Route State: "home" (public devotee site) vs "staff" (dedicated Kendra Staff Portal page)
  const [currentRoute, setCurrentRoute] = useState<"home" | "staff">(() => {
    try {
      const p = window.location.pathname.toLowerCase();
      const h = window.location.hash.toLowerCase();
      if (p.includes("/staff") || p.includes("/admin") || h.includes("#staff") || h.includes("#admin")) {
        return "staff";
      }
    } catch {}
    return "home";
  });

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("jyotishvani_admin_auth") === "true";
    } catch {
      return false;
    }
  });

  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>("trial");
  const [preselectedSign, setPreselectedSign] = useState<string>("aries");
  const [prefilledMobile, setPrefilledMobile] = useState<string>("");
  const [prefilledEmail, setPrefilledEmail] = useState<string>("");
  const [user, setUser] = useState<UserSubscription | null>(null);
  const [isAutoRenewModalOpen, setIsAutoRenewModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check if current user subscription is expired
  const isUserExpired = Boolean(
    user &&
      (user.status === "expired" ||
        (Boolean(user.validUntil) &&
          !isNaN(new Date(user.validUntil).getTime()) &&
          new Date(user.validUntil).getTime() < Date.now()))
  );

  // Dynamic Content & Settings fetched from Kendra Database
  const [dynamicSettings, setDynamicSettings] = useState<DynamicSettings | null>(null);
  const [dynamicPanchang, setDynamicPanchang] = useState<StoredPanchangData | null>(null);

  // Guarantee that the app always loads from the very top with the Panchang section visible
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    const timer1 = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    }, 20);
    const timer2 = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    }, 120);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Browser navigation history support (popstate / hashchange)
  useEffect(() => {
    const handleRouteSync = () => {
      try {
        const p = window.location.pathname.toLowerCase();
        const h = window.location.hash.toLowerCase();
        if (p.includes("/staff") || p.includes("/admin") || h.includes("#staff") || h.includes("#admin")) {
          setCurrentRoute("staff");
        } else {
          setCurrentRoute("home");
          window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
        }
        setIsAdminAuthenticated(sessionStorage.getItem("jyotishvani_admin_auth") === "true");
      } catch (e) {
        console.error("Route sync error:", e);
      }
    };

    window.addEventListener("popstate", handleRouteSync);
    window.addEventListener("hashchange", handleRouteSync);
    return () => {
      window.removeEventListener("popstate", handleRouteSync);
      window.removeEventListener("hashchange", handleRouteSync);
    };
  }, []);

  const navigateTo = (route: "home" | "staff") => {
    setCurrentRoute(route);
    try {
      if (route === "staff") {
        window.history.pushState(null, "", "/staff");
      } else {
        window.history.pushState(null, "", "/");
      }
    } catch {}
    if (route === "home") {
      // Re-fetch dynamic settings immediately when returning to public site
      safeFetchJson<{ success?: boolean; settings?: DynamicSettings }>(`/api/settings?t=${Date.now()}`).then((data) => {
        if (data?.settings) setDynamicSettings(data.settings);
      });
      safeFetchJson<{ success?: boolean; panchang?: StoredPanchangData }>(`/api/panchang?t=${Date.now()}`).then((data) => {
        if (data?.panchang) setDynamicPanchang(data.panchang);
      });
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  };

  // Load user from localStorage if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem("jyotishvani_user");
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Could not load user profile:", e);
    }
  }, []);

  // Fetch dynamic settings and Panchang from server database with auto-retry and cache-busting
  useEffect(() => {
    safeFetchJson<{ success?: boolean; settings?: DynamicSettings }>(`/api/settings?t=${Date.now()}`).then((data) => {
      if (data?.settings) setDynamicSettings(data.settings);
    });

    // Fetch live calculated Panchang on app load with cache-busting
    safeFetchJson<{ success?: boolean; panchang?: StoredPanchangData }>(
      `/api/panchang?refresh=true&t=${Date.now()}`
    ).then((data) => {
      if (data?.panchang) setDynamicPanchang(data.panchang);
    });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleRegisterSuccess = (newUser: UserSubscription) => {
    setUser(newUser);
    try {
      localStorage.setItem("jyotishvani_user", JSON.stringify(newUser));
    } catch (e) {
      console.error("Could not persist user:", e);
    }
    const isPaid = newUser.status === "active" && newUser.planId !== "trial";
    showToast(
      isPaid
        ? `🎉 UPI Payment Verified & Subscription Activated for ${newUser.email || `+91 ${newUser.mobile}`}!`
        : `🎉 Shubh Aarambh! 3-Day Free Trial activated for ${newUser.email || `+91 ${newUser.mobile}`} - Daily 7:00 AM Vedic emails start tomorrow.`
    );
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem("jyotishvani_user");
    } catch (e) {
      console.error("Could not remove user session:", e);
    }
    showToast("🕊️ You have been safely logged out from JyotishVani.");
  };

  const handleOpenRegister = (planId?: string, signId?: string) => {
    if (planId && ["trial", "monthly", "three_months", "six_months", "yearly"].includes(planId)) {
      setSelectedPlanId(planId as SubscriptionPlanId);
    } else {
      setSelectedPlanId("trial");
    }
    if (signId) setPreselectedSign(signId);
    setIsRegisterModalOpen(true);
  };

  const handleQuickRegisterFromHero = (email: string, sign: string, mobile?: string) => {
    setPrefilledEmail(email);
    setPreselectedSign(sign);
    if (mobile) setPrefilledMobile(mobile);
    setSelectedPlanId("trial");
    setIsRegisterModalOpen(true);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home" || tabId === "hero") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (tabId === "panchang") {
      document.getElementById("panchang-section")?.scrollIntoView({ behavior: "smooth" });
    } else if (tabId === "pricing") {
      document.getElementById("pricing-section")?.scrollIntoView({ behavior: "smooth" });
    } else if (tabId === "horoscope") {
      document.getElementById("horoscope-section")?.scrollIntoView({ behavior: "smooth" });
    } else if (tabId === "ai-oracle" || tabId === "ai-chat") {
      document.getElementById("ai-oracle-section")?.scrollIntoView({ behavior: "smooth" });
    } else if (tabId === "offline-connect" || tabId === "astrologers") {
      document.getElementById("offline-connect-section")?.scrollIntoView({ behavior: "smooth" });
    } else {
      const element = document.getElementById(`${tabId}-section`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // =========================================================================
  // VIEW 1: DEDICATED SEPARATE PAGE FOR KENDRA STAFF PORTAL
  // =========================================================================
  if (currentRoute === "staff") {
    return (
      <KendraStaffPortalPage
        onNavigateHome={() => navigateTo("home")}
        onSettingsUpdated={(newSettings) => setDynamicSettings(newSettings)}
        onPanchangUpdated={(newPanchang) => setDynamicPanchang(newPanchang)}
      />
    );
  }

  // =========================================================================
  // VIEW 2: PUBLIC DEVOTEE LANDING PAGE
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#4A4A4A] font-sans selection:bg-[#CB997E]/30 selection:text-[#3D3D3D]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-[#5C6B5A] text-white px-4 py-3 rounded-2xl shadow-xl border border-[#8B9D83] flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#FAF9F6] shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Expired Subscription Alert Bar */}
      {isUserExpired && (
        <div
          className="bg-amber-100/90 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-950 flex flex-wrap items-center justify-center gap-2 text-center sticky top-0 z-40 backdrop-blur-sm"
          id="expired-subscription-banner"
        >
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Your Vedic horoscope subscription for <strong>{user?.email || `+91 ${user?.mobile}`}</strong> has expired.
            </span>
          </div>
          <button
            onClick={() => setIsAutoRenewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B9D83] hover:bg-[#7A8C73] text-white font-bold text-[11px] shadow-xs cursor-pointer transition-all ml-1"
            id="banner-autorenew-action-btn"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Auto-Renew Now &amp; Resume Delivery &rarr;</span>
          </button>
        </div>
      )}

      {/* Top Header Navigation */}
      <Header
        onSelectTab={handleTabChange}
        onOpenRegister={() => handleOpenRegister("trial")}
        activeUser={user}
        onLogout={handleLogout}
        onOpenAutoRenew={() => setIsAutoRenewModalOpen(true)}
        onUserUpdate={(updated) => {
          setUser(updated);
          try {
            localStorage.setItem("jyotishvani_user", JSON.stringify(updated));
          } catch {}
        }}
        dynamicSettings={dynamicSettings}
      />

      {/* Main Content Area */}
      <main>
        {/* 1. Today's Shubh Panchang, Rahu Kaal & Muhurat (ON TOP as requested) */}
        <PanchangWidget
          onSubscribe={() => handleOpenRegister("trial")}
          dynamicPanchang={dynamicPanchang}
          onPanchangUpdated={(updated) => {
            setDynamicPanchang(updated);
            showToast("✨ Today's Vedic Panchang synchronized with live ephemeris!");
          }}
        />

        {/* 2. Hero with instant registration form */}
        <Hero
          onQuickRegister={handleQuickRegisterFromHero}
          onExplorePlans={() => handleTabChange("pricing")}
          onOpenAiChat={() => handleTabChange("ai-oracle")}
          onOfflineConnect={() => handleTabChange("offline-connect")}
          dynamicSettings={dynamicSettings}
        />

        {/* 3. Live Daily Email 7:00 AM Delivery Experience */}
        <DeliveryMockup
          onStartFreeTrial={() => handleOpenRegister("trial")}
          dynamicPanchang={dynamicPanchang}
        />

        {/* 4. 12 Zodiac Daily Horoscope Explorer */}
        <HoroscopePreview
          onSubscribeSign={(signId) => handleOpenRegister("trial", signId)}
        />

        {/* 5. Transparent Subscription Plans */}
        <PricingSection
          activePlanId={user?.planId}
          onSelectPlan={(planId) => handleOpenRegister(planId)}
          dynamicSettings={dynamicSettings}
        />

        {/* 6. 24/7 AI Astrology Chat (Gemini API Powered) */}
        <AiAstrologyChat
          userSign={user?.zodiacSign || preselectedSign}
        />

        {/* 7. Offline Connect with Phone Number 9560169988 */}
        <OfflineConnect
          userMobile={user?.mobile}
          userName={user?.name}
          dynamicHelpline={dynamicSettings?.helplineNumber}
        />

        {/* 8. Devotee Testimonials & Comprehensive FAQ */}
        <TestimonialsAndFaq />
      </main>

      {/* Footer */}
      <Footer
        onSelectTab={handleTabChange}
        onOpenRegister={() => handleOpenRegister("trial")}
        onNavigateStaffPortal={() => navigateTo("staff")}
        onOpenAdminLogin={() => navigateTo("staff")}
        activeUser={user}
        onLogout={handleLogout}
        dynamicSettings={dynamicSettings}
      />

      {/* Floating Bottom Action Banner on Mobile */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-t border-[#E8E6DF] p-2.5 sm:hidden flex items-center justify-between gap-2 shadow-lg">
        <a 
          href={`tel:${dynamicSettings?.helplineNumber || "9560169988"}`}
          className="flex items-center gap-1.5 pl-2 text-xs font-bold text-[#3D3D3D]"
        >
          <span className="w-2 h-2 rounded-full bg-[#8B9D83] animate-ping" />
          <span>Call: {dynamicSettings?.helplineNumber || "9560169988"}</span>
        </a>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleTabChange("ai-oracle")}
            className="px-3 py-1.5 rounded-full bg-[#F0EDDF] text-[#5C6B5A] text-xs font-semibold border border-[#E8E6DF] flex items-center gap-1 cursor-pointer hover:bg-[#E8E6DF]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#CB997E]" />
            <span>AI Chat</span>
          </button>

          {user ? (
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
              title="Log out"
              id="mobile-bar-logout-btn"
            >
              <LogOut className="w-3 h-3 text-rose-500" />
              <span>Log Out</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenRegister("trial")}
              className="px-3.5 py-1.5 rounded-full bg-[#CB997E] hover:bg-[#B8856B] text-white text-xs font-bold shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>3 Days Free</span>
            </button>
          )}
        </div>
      </div>

      {/* Registration & Verification Modal */}
      <RegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        preselectedPlanId={selectedPlanId}
        initialMobile={prefilledMobile}
        initialEmail={prefilledEmail}
        initialSign={preselectedSign}
        onRegistrationSuccess={handleRegisterSuccess}
      />

      {/* Central Kendra Database Viewer Modal */}
      <DatabaseViewerModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />

      {/* Auto-Renew & Post-Expiry Modal */}
      <AutoRenewModal
        isOpen={isAutoRenewModalOpen}
        onClose={() => setIsAutoRenewModalOpen(false)}
        user={user}
        onRenewSuccess={(renewedUser) => {
          setUser(renewedUser);
          try {
            localStorage.setItem("jyotishvani_user", JSON.stringify(renewedUser));
          } catch {}
          showToast(`🎉 Subscription Auto-Renewed! Valid until ${new Date(renewedUser.validUntil).toLocaleDateString('en-IN')}`);
        }}
        dynamicSettings={dynamicSettings}
      />
    </div>
  );
}
