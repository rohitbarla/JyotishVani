import React, { useState, useEffect } from "react";
import {
  Database,
  Users,
  Settings,
  Calendar,
  CreditCard,
  PhoneCall,
  RefreshCw,
  Search,
  Save,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit,
  Plus,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Lock,
  IndianRupee,
  Clock,
  Sparkles,
  LogOut,
  ArrowLeft,
  X,
  Phone,
  MessageSquare,
  KeyRound,
  ExternalLink,
  Send,
  Mail,
  PowerOff,
  Play,
  Ban,
  Download,
  Sun,
  Moon,
  Compass,
  RotateCcw,
  Smartphone,
  Check,
  Copy,
} from "lucide-react";
import { DynamicSettings, StoredPanchangData, UpiPaymentRecord } from "../types";
import { EmailSchedulerTab } from "../components/EmailSchedulerTab";

interface KendraStaffPortalPageProps {
  onNavigateHome: () => void;
  onSettingsUpdated?: (newSettings: DynamicSettings) => void;
  onPanchangUpdated?: (newPanchang: StoredPanchangData) => void;
}

const AUTHORIZED_ADMIN_NUMBER = "9560169988";

export const KendraStaffPortalPage: React.FC<KendraStaffPortalPageProps> = ({
  onNavigateHome,
  onSettingsUpdated,
  onPanchangUpdated,
}) => {
  // Session Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("jyotishvani_admin_auth") === "true";
    } catch {
      return false;
    }
  });

  // Login form state (when not authenticated)
  const [loginStep, setLoginStep] = useState<"phone" | "passcode">("phone");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPasscode, setLoginPasscode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginInfo, setLoginInfo] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [maskedAdminEmail, setMaskedAdminEmail] = useState("");

  // Portal tab states: settings, subscribers, payments, leads, scheduler, panchang
  const [activeTab, setActiveTab] = useState<
    "settings" | "subscribers" | "payments" | "leads" | "scheduler" | "panchang"
  >("panchang");

  // Data states
  const [loading, setLoading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [editingPayment, setEditingPayment] = useState<UpiPaymentRecord | null>(null);
  const [editPaymentStatus, setEditPaymentStatus] = useState<"verified" | "pending" | "rejected" | "failed">("verified");
  const [editPaymentUtr, setEditPaymentUtr] = useState("");
  const [editPaymentNotes, setEditPaymentNotes] = useState("");
  const [editPaymentAmount, setEditPaymentAmount] = useState<number>(0);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);
  const [broadcastModalSub, setBroadcastModalSub] = useState<any | null>(null);
  const [broadcastTargetEmail, setBroadcastTargetEmail] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);
  const [broadcastData, setBroadcastData] = useState<{
    subject?: string;
    emailHtml?: string;
    emailText?: string;
    summary?: string;
    delivered?: boolean;
    gateway?: string;
    messageId?: string;
  } | null>(null);
  const [broadcastCopied, setBroadcastCopied] = useState(false);
  const [loadingBroadcastData, setLoadingBroadcastData] = useState(false);
  const [panchangSaving, setPanchangSaving] = useState(false);
  const [panchangStatusNotice, setPanchangStatusNotice] = useState("");

  const [settings, setSettings] = useState<DynamicSettings>({
    helplineNumber: "9560169988",
    helplineWhatsApp: "9560169988",
    kendraTimings: "10:00 AM – 7:30 PM (All 7 Days)",
    kendraLocation: "Kashi Vishwanath Corridor, Varanasi & Connaught Place, New Delhi",
    kendraStatus: "open",
    upiId: "9560169988@pthdfc",
    upiPayeeName: "JyotishVani Kendra",
    trialDays: 3,
    planPrices: {
      trial: 0,
      monthly: 150,
      three_months: 400,
      six_months: 500,
      yearly: 1000,
    },
    announcementBanner: "✨ Special Shubh Muhurat Offer: Get 1 Month Daily Vedic Horoscope in your Email inbox for just ₹150!",
  });

  const [panchang, setPanchang] = useState<StoredPanchangData>({
    date: new Date().toISOString().split("T")[0],
    hinduDate: "Dwitiya (Krishna Paksha) (Starts at 10:55 PM), Vikram Samvat 2083",
    tithi: "Dwitiya (Krishna Paksha)",
    tithiStartTime: "Starts at 10:55 PM",
    tithiEndsAt: "Ends at 11:07 PM",
    tithiTiming: "Starts at 10:55 PM • Ends at 11:07 PM",
    paksha: "Krishna Paksha",
    nakshatra: "Revati (Mercury / Pushan - Divine Traveler)",
    yoga: "Dhruva Yoga (Steadfastness)",
    karana: "Taitila",
    samvat: "Vikram Samvat 2083",
    sunrise: "06:04 AM",
    sunset: "06:30 PM",
    rahuKaal: "07:30 AM - 09:00 AM (Inauspicious - Somavara)",
    abhijitMuhurat: "11:53 AM - 12:43 PM (Most Auspicious)",
    shubhMuhurat: "08:15 AM - 09:45 AM (Amrit Vela)",
    moonSign: "Meena (Pisces)",
    festivalNote: "",
  });

  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [payments, setPayments] = useState<UpiPaymentRecord[]>([]);
  const [callbacks, setCallbacks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Search & Filters
  const [subSearch, setSubSearch] = useState("");
  const [subFilter, setSubFilter] = useState<"all" | "active" | "trial" | "pending" | "expired" | "stopped">("all");

  // Modals inside portal
  const [editingSub, setEditingSub] = useState<any | null>(null);
  const [editingSubOriginalMobile, setEditingSubOriginalMobile] = useState<string | null>(null);
  const [quickEditMobileSub, setQuickEditMobileSub] = useState<{
    originalMobile: string;
    mobile: string;
    name: string;
    zodiacSign?: string;
    email?: string;
  } | null>(null);
  const [savingQuickMobile, setSavingQuickMobile] = useState(false);

  const [isNewSubModal, setIsNewSubModal] = useState(false);
  const [stopModalSub, setStopModalSub] = useState<any | null>(null);
  const [stopReason, setStopReason] = useState("");
  const [newSubForm, setNewSubForm] = useState({
    mobile: "",
    name: "",
    email: "",
    zodiacSign: "Aries (Mesha)",
    planId: "monthly",
    deliveryChannel: "email",
    deliveryTime: "07:00 AM",
    validityDays: 30,
    autoRenew: true,
  });

  // Admin token authorization headers
  const getAdminHeaders = (extraHeaders?: Record<string, string>) => {
    let token = "";
    try {
      token = sessionStorage.getItem("jyotishvani_admin_token") || "";
    } catch {}
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    };
  };

  // Fetch all administrative data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [settingsRes, panchangRes, subsRes, paymentsRes, cbRes, statsRes] = await Promise.all([
        fetch("/api/settings").then((r) => r.json()).catch(() => null),
        fetch(`/api/panchang?refresh=true&t=${Date.now()}`).then((r) => r.json()).catch(() => null),
        fetch("/api/db/subscribers", { headers: getAdminHeaders() }).then((r) => r.json()).catch(() => null),
        fetch("/api/payments", { headers: getAdminHeaders() }).then((r) => r.json()).catch(() => null),
        fetch("/api/offline-callbacks", { headers: getAdminHeaders() }).then((r) => r.json()).catch(() => null),
        fetch("/api/db/stats", { headers: getAdminHeaders() }).then((r) => r.json()).catch(() => null),
      ]);

      if (settingsRes?.settings) setSettings(settingsRes.settings);
      if (panchangRes?.panchang) setPanchang(panchangRes.panchang);
      if (subsRes?.subscribers) setSubscribers(subsRes.subscribers);
      if (paymentsRes?.payments) setPayments(paymentsRes.payments);
      if (cbRes?.callbacks) setCallbacks(cbRes.callbacks);
      if (statsRes?.stats) setStats(statsRes.stats);
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const VEDIC_TITHIS = [
    "Amavasya (Krishna Paksha)",
    "Pratipada (Shukla Paksha)",
    "Dwitiya (Shukla Paksha)",
    "Tritiya (Shukla Paksha)",
    "Chaturthi (Shukla Paksha)",
    "Panchami (Shukla Paksha)",
    "Shashti (Shukla Paksha)",
    "Saptami (Shukla Paksha)",
    "Ashtami (Shukla Paksha)",
    "Navami (Shukla Paksha)",
    "Dashami (Shukla Paksha)",
    "Ekadashi (Shukla Paksha)",
    "Dwadashi (Shukla Paksha)",
    "Trayodashi (Shukla Paksha)",
    "Chaturdashi (Shukla Paksha)",
    "Purnima (Shukla Paksha)",
    "Pratipada (Krishna Paksha)",
    "Dwitiya (Krishna Paksha)",
    "Tritiya (Krishna Paksha)",
    "Chaturthi (Krishna Paksha)",
    "Panchami (Krishna Paksha)",
    "Shashti (Krishna Paksha)",
    "Saptami (Krishna Paksha)",
    "Ashtami (Krishna Paksha)",
    "Navami (Krishna Paksha)",
    "Dashami (Krishna Paksha)",
    "Ekadashi (Krishna Paksha)",
    "Dwadashi (Krishna Paksha)",
    "Trayodashi (Krishna Paksha)",
    "Chaturdashi (Krishna Paksha)",
  ];

  const handleTithiSelect = (selectedTithi: string) => {
    const isKrishna = selectedTithi.includes("Krishna") || selectedTithi.toLowerCase().includes("amavasya");
    const derivedPaksha = isKrishna ? "Krishna Paksha" : "Shukla Paksha";
    setPanchang((prev) => {
      const startTime = prev.tithiStartTime || "Starts today at 10:55 PM";
      return {
        ...prev,
        tithi: selectedTithi,
        paksha: derivedPaksha,
        hinduDate: `${selectedTithi} (${startTime}), ${prev.samvat || "Vikram Samvat 2083"}`,
      };
    });
  };

  const applyTodayAmavasyaPreset = () => {
    setPanchang((prev) => ({
      ...prev,
      tithi: "Amavasya (Krishna Paksha)",
      paksha: "Krishna Paksha",
      hinduDate: `Amavasya (Krishna Paksha), ${prev.samvat || "Vikram Samvat 2083"}`,
      nakshatra: "Purva Phalguni (Venus / Bhaga)",
      yoga: "Sadhya Yoga (Achievable)",
      karana: "Naga",
      moonSign: "Simha (Leo)",
      sunrise: "06:04 AM",
      sunset: "06:30 PM",
      rahuKaal: "10:30 AM - 12:00 PM (Inauspicious - Shukravara)",
      abhijitMuhurat: "11:53 AM - 12:43 PM (Most Auspicious)",
      shubhMuhurat: "08:15 AM - 09:45 AM (Amrit Vela)",
      festivalNote: "भाद्रपद अमावस्या • दर्श अमावस्या / पिठोरी अमावस्या (Bhadrapada Amavasya)",
    }));
    showNotification("Applied Today's Authentic Udaya Tithi: Bhadrapada Amavasya (Krishna Paksha)!");
  };

  const applyTransitionPreset = () => {
    setPanchang((prev) => ({
      ...prev,
      tithi: "Amavasya up to 08:56 AM, then Pratipada",
      paksha: "Krishna Paksha",
      hinduDate: `Amavasya (Krishna Paksha), ${prev.samvat || "Vikram Samvat 2083"}`,
      festivalNote: "भाद्रपद अमावस्या (08:56 AM तक) • तदुपरान्त शुक्ल पक्ष आरम्भ",
    }));
    showNotification("Applied Tithi transition: Amavasya to Pratipada!");
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  const showNotification = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(""), 4500);
  };

  // --- LOGIN HANDLERS ---
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginInfo("");

    const inputVal = loginIdentifier.trim();
    if (!inputVal) {
      setLoginError("Please enter the administrator mobile number or registered email.");
      return;
    }

    const clean = inputVal.replace(/\D/g, "");
    const normalizedPhone = clean.length > 10 ? clean.slice(-10) : clean;
    const isPhone = clean.length >= 10;

    if (isPhone && normalizedPhone !== AUTHORIZED_ADMIN_NUMBER) {
      setLoginError(
        "⛔ Access Denied: This mobile number is not an authorized administrator. Administrative console is strictly restricted."
      );
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: inputVal }),
      });
      const data = await res.json();

      if (data.success) {
        setMaskedAdminEmail(data.maskedEmail || "your registered email");
        setLoginInfo(data.message || `OTP dispatched to registered email (${data.maskedEmail || 'inbox'}).`);
        setLoginStep("passcode");
      } else {
        setLoginError(data.error || "Authentication request failed.");
      }
    } catch (err) {
      setMaskedAdminEmail("authorized admin email");
      setLoginInfo("Verification passcode dispatched to your administrator email.");
      setLoginStep("passcode");
    } finally {
      setLoginLoading(false);
    }
  };

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginPasscode.trim()) {
      setLoginError("Please enter the 6-digit security passcode sent to your email.");
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          passcode: loginPasscode.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        try {
          sessionStorage.setItem("jyotishvani_admin_auth", "true");
          sessionStorage.setItem("jyotishvani_admin_token", data.token || "admin_session");
          sessionStorage.setItem("jyotishvani_admin_phone", AUTHORIZED_ADMIN_NUMBER);
          if (data.adminEmail) {
            sessionStorage.setItem("jyotishvani_admin_email", data.adminEmail);
          }
        } catch (e) {
          console.error("Storage error:", e);
        }
        setIsAuthenticated(true);
        showNotification("🛡️ Welcome Kendra Admin. Admin session active.");
      } else {
        setLoginError(data.error || "Invalid security passcode. Please check your email inbox and re-enter.");
      }
    } catch (err) {
      setLoginError("Connection error while verifying passcode. Please retry.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem("jyotishvani_admin_auth");
      sessionStorage.removeItem("jyotishvani_admin_token");
      sessionStorage.removeItem("jyotishvani_admin_phone");
    } catch (e) {
      console.error("Storage error:", e);
    }
    setIsAuthenticated(false);
    setLoginStep("phone");
    setLoginIdentifier("");
    setLoginPasscode("");
    setLoginError("");
  };

  // --- CRUD OPERATIONS ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Dynamic settings updated and saved to Kendra database!");
        if (onSettingsUpdated) onSettingsUpdated(data.settings);
      } else {
        alert(data.error || "Failed to update settings.");
      }
    } catch (err) {
      console.error("Failed to update settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePanchang = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPanchangSaving(true);
    try {
      const res = await fetch("/api/panchang", {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify(panchang),
      });
      const data = await res.json();
      if (data.success) {
        setPanchang(data.panchang);
        if (onPanchangUpdated) onPanchangUpdated(data.panchang);
        showNotification("Today's Panchang verified and saved to database!");
        setPanchangStatusNotice("Saved: Verified by Kendra Acharya");
        setTimeout(() => setPanchangStatusNotice(""), 5000);
      } else {
        alert(data.error || "Failed to update panchang.");
      }
    } catch (err) {
      console.error("Failed to update panchang:", err);
    } finally {
      setPanchangSaving(false);
    }
  };

  const handleRecalculatePanchang = async () => {
    setPanchangSaving(true);
    try {
      const res = await fetch(`/api/panchang?refresh=true&t=${Date.now()}`);
      const data = await res.json();
      if (data.success && data.panchang) {
        setPanchang(data.panchang);
        if (onPanchangUpdated) onPanchangUpdated(data.panchang);
        showNotification("Today's Panchang recalculated from Live Astronomical Ephemeris!");
        setPanchangStatusNotice("Recalculated from Live Astronomical Ephemeris");
        setTimeout(() => setPanchangStatusNotice(""), 5000);
      }
    } catch (err) {
      console.error("Failed to recalculate panchang:", err);
    } finally {
      setPanchangSaving(false);
    }
  };

  const handleResetPanchang = async () => {
    setPanchangSaving(true);
    try {
      const res = await fetch("/api/panchang/reset", {
        method: "POST",
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success && data.panchang) {
        setPanchang(data.panchang);
        if (onPanchangUpdated) onPanchangUpdated(data.panchang);
        showNotification("Panchang reset to Live Astronomical Ephemeris Engine!");
        setPanchangStatusNotice("Reset to Live Astronomical Ephemeris Engine");
        setTimeout(() => setPanchangStatusNotice(""), 5000);
      }
    } catch (err) {
      console.error("Failed to reset panchang:", err);
    } finally {
      setPanchangSaving(false);
    }
  };

  const openEditModal = (sub: any) => {
    setEditingSubOriginalMobile(sub.mobile);
    setEditingSub({ ...sub });
  };

  const handleSaveSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    const cleanOrig = editingSubOriginalMobile
      ? editingSubOriginalMobile.replace(/\D/g, "")
      : editingSub.mobile.replace(/\D/g, "");
    const cleanNew = editingSub.mobile.replace(/\D/g, "");

    if (!cleanNew || cleanNew.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...editingSub,
        mobile: cleanNew,
        newMobile: cleanNew !== cleanOrig ? cleanNew : undefined,
        updatedAt: new Date().toISOString(),
      };

      const res = await fetch(`/api/db/subscribers/${cleanOrig}`, {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(
          cleanNew !== cleanOrig
            ? `Subscriber mobile updated from +91 ${cleanOrig} to +91 ${cleanNew} successfully!`
            : `Subscriber +91 ${cleanNew} updated.`
        );
        setEditingSub(null);
        setEditingSubOriginalMobile(null);
        fetchAllData();
      } else {
        alert(data.error || "Failed to update subscriber.");
      }
    } catch (err) {
      console.error("Error updating subscriber:", err);
      alert("Network error: Could not reach server to update subscriber.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuickMobile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEditMobileSub) return;
    const cleanOrig = quickEditMobileSub.originalMobile.replace(/\D/g, "");
    const cleanNew = quickEditMobileSub.mobile.replace(/\D/g, "");

    if (!cleanNew || cleanNew.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    setSavingQuickMobile(true);
    try {
      const res = await fetch(`/api/db/subscribers/${cleanOrig}`, {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          mobile: cleanNew,
          newMobile: cleanNew !== cleanOrig ? cleanNew : undefined,
          updatedAt: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(
          cleanNew !== cleanOrig
            ? `Mobile number migrated from +91 ${cleanOrig} to +91 ${cleanNew} successfully!`
            : `Mobile number verified & saved.`
        );
        setQuickEditMobileSub(null);
        fetchAllData();
      } else {
        alert(data.error || "Failed to update subscriber mobile number.");
      }
    } catch (err) {
      console.error("Error updating subscriber mobile:", err);
      alert("Network error: Could not reach server to update mobile number.");
    } finally {
      setSavingQuickMobile(false);
    }
  };

  const handleDeleteSubscriber = async (mobile: string) => {
    if (!window.confirm(`Are you sure you want to delete subscriber +91 ${mobile}?`)) return;
    setLoading(true);
    try {
      await fetch(`/api/db/subscribers/${mobile}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      });
      showNotification(`Subscriber +91 ${mobile} removed.`);
      fetchAllData();
    } catch (err) {
      console.error("Error deleting subscriber:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubForm.mobile || newSubForm.mobile.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    try {
      const days = Number(newSubForm.validityDays) || 30;
      const validUntil = new Date(Date.now() + days * 86400000).toISOString();
      await fetch("/api/db/subscribers", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          mobile: newSubForm.mobile,
          name: newSubForm.name || "Member",
          email: newSubForm.email || "",
          zodiacSign: newSubForm.zodiacSign,
          planId: newSubForm.planId,
          deliveryChannel: newSubForm.deliveryChannel,
          deliveryTime: newSubForm.deliveryTime,
          status: newSubForm.planId === "trial" ? "trial" : "active",
          validUntil,
          autoRenew: newSubForm.autoRenew !== false,
        }),
      });
      showNotification(`New subscriber +91 ${newSubForm.mobile} registered!`);
      setIsNewSubModal(false);
      setNewSubForm({
        mobile: "",
        name: "",
        email: "",
        zodiacSign: "Aries (Mesha)",
        planId: "monthly",
        deliveryChannel: "email",
        deliveryTime: "07:00 AM",
        validityDays: 30,
        autoRenew: true,
      });
      fetchAllData();
    } catch (err) {
      console.error("Error adding subscriber:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentId: string, action: "approve" | "reject") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payments/${paymentId}/verify`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(
          action === "approve"
            ? "Payment approved & subscription activated for devotee!"
            : "Payment record rejected."
        );
        fetchAllData();
      }
    } catch (err) {
      console.error("Error updating payment:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async (
    paymentId: string,
    newStatus: "verified" | "pending" | "rejected" | "failed",
    notes?: string,
    utr?: string,
    amount?: number
  ) => {
    setUpdatingPaymentId(paymentId);
    try {
      const res = await fetch(`/api/payments/${paymentId}/status`, {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          status: newStatus,
          adminNotes: notes,
          utrNumber: utr,
          amount: amount !== undefined && !isNaN(amount) ? amount : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(
          `✅ Payment ${paymentId} status updated to "${newStatus.toUpperCase()}" and saved in database.`
        );
        setPayments((prev) =>
          prev.map((p) =>
            p.id === paymentId
              ? {
                  ...p,
                  status: newStatus,
                  adminNotes: notes !== undefined ? notes : p.adminNotes,
                  utrNumber: utr !== undefined ? utr : p.utrNumber,
                  amount: amount !== undefined && !isNaN(amount) ? amount : p.amount,
                  updatedAt: new Date().toISOString(),
                }
              : p
          )
        );
        if (editingPayment?.id === paymentId) {
          setEditingPayment(null);
        }
        fetchAllData();
      } else {
        alert(data.error || "Failed to update payment status.");
      }
    } catch (err) {
      console.error("Error updating payment status:", err);
      alert("Network error updating payment status.");
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const handleUpdateCallback = async (id: string, status: "pending" | "connected" | "scheduled", notes?: string) => {
    try {
      await fetch(`/api/offline-callbacks/${id}`, {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({ status, notes }),
      });
      showNotification("Helpline lead status updated.");
      fetchAllData();
    } catch (err) {
      console.error("Error updating callback:", err);
    }
  };

  const handleSimulateBroadcast = async (sub: any) => {
    setBroadcastModalSub(sub);
    setBroadcastTargetEmail(sub.email || "");
    setBroadcastSuccess(null);
    setBroadcastData(null);
    setBroadcastCopied(false);
    setLoadingBroadcastData(true);

    try {
      const res = await fetch(`/api/email-scheduler/preview`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          zodiacSign: sub.zodiacSign,
          name: sub.name,
          email: sub.email || "devotee@example.com",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBroadcastData({
          subject: data.subject || `🕉️ Dainik Vedic Rashifal • ${sub.zodiacSign}`,
          emailHtml: data.html,
          emailText: data.text || data.plainText,
          summary: data.summary,
        });
      } else {
        // Fallback preview
        const origin = window.location.origin;
        setBroadcastData({
          subject: `🕉️ Dainik Vedic Rashifal & Shubh Muhurat • ${sub.zodiacSign}`,
          emailText: `Pranam ${sub.name} Ji,\n\nHere is your daily Vedic Rashifal for ${sub.zodiacSign}.\nToday's Shubh Muhurat: ${panchang.shubhMuhurat || panchang.abhijitMuhurat}\nRahu Kaal (Avoid): ${panchang.rahuKaal}\n\nSattvic Upaya: Perform Surya Namaskar and chant Gayatri Mantra.\n\n📅 Book Appointment with Astrologer: ${origin}/#offline-connect\nDirect Kendra Helpline: +91 9560169988\n\n— JyotishVani Kendra`,
        });
      }
    } catch {
      const origin = window.location.origin;
      setBroadcastData({
        subject: `🕉️ Dainik Vedic Rashifal & Shubh Muhurat • ${sub.zodiacSign}`,
        emailText: `Pranam ${sub.name} Ji,\n\nHere is your daily Vedic Rashifal for ${sub.zodiacSign}.\nToday's Shubh Muhurat: ${panchang.shubhMuhurat || panchang.abhijitMuhurat}\nRahu Kaal (Avoid): ${panchang.rahuKaal}\n\nSattvic Upaya: Perform Surya Namaskar and chant Gayatri Mantra.\n\n📅 Book Appointment with Astrologer: ${origin}/#offline-connect\nDirect Kendra Helpline: +91 9560169988\n\n— JyotishVani Kendra`,
      });
    } finally {
      setLoadingBroadcastData(false);
    }
  };

  const handleSendBroadcastMessage = async () => {
    if (!broadcastModalSub) return;
    const cleanEmail = broadcastTargetEmail.trim();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setBroadcastSuccess("⚠️ Please enter a valid email address.");
      return;
    }

    setBroadcastSending(true);
    setBroadcastSuccess(null);
    try {
      const res = await fetch(`/api/email-scheduler/send-test`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          email: cleanEmail,
          zodiacSign: broadcastModalSub.zodiacSign,
          name: broadcastModalSub.name,
        }),
      });
      const data = await res.json();
      setBroadcastSending(false);
      if (res.ok && data.success) {
        setBroadcastSuccess(
          `✅ Daily Horoscope Email successfully dispatched to ${cleanEmail}! (ID: ${data.messageId || "email_dispatched"}).`
        );
        fetchAllData();
      } else {
        setBroadcastSuccess(`⚠️ ${data.error || "Failed to dispatch email."}`);
      }
    } catch {
      setBroadcastSending(false);
      setBroadcastSuccess("⚠️ Network error while dispatching email.");
    }
  };

  const handleRenewSubscriber = async (sub: any) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subscribers/${sub.mobile}/renew`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({ planId: sub.planId || "monthly", autoRenew: true }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`🎉 Devotee +91 ${sub.mobile} subscription renewed & auto-renew enabled!`);
        fetchAllData();
      } else {
        showNotification(`Failed to renew: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error renewing subscriber:", err);
      showNotification("Error renewing subscription.");
    } finally {
      setLoading(false);
    }
  };

  const handleStopSubscriber = (sub: any) => {
    setStopModalSub(sub);
    setStopReason("Devotee requested stop");
  };

  const handleConfirmStopSubscriber = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!stopModalSub) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/subscribers/${stopModalSub.mobile}/stop`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({ reason: stopReason || "Administrative decision" }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`🛑 Subscription for +91 ${stopModalSub.mobile} (${stopModalSub.name}) stopped.`);
        setStopModalSub(null);
        setStopReason("");
        fetchAllData();
      } else {
        showNotification(data.error || "Failed to stop subscription.");
      }
    } catch (err) {
      console.error("Error stopping subscription:", err);
      showNotification("Error stopping subscription.");
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSubscriber = async (sub: any) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subscribers/${sub.mobile}/resume`, {
        method: "POST",
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`✅ Subscription for +91 ${sub.mobile} (${sub.name}) resumed.`);
        fetchAllData();
      } else {
        showNotification(data.error || "Failed to resume subscription.");
      }
    } catch (err) {
      console.error("Error resuming subscription:", err);
      showNotification("Error resuming subscription.");
    } finally {
      setLoading(false);
    }
  };

  // Filtered subscribers
  const filteredSubscribers = subscribers.filter((s) => {
    const q = subSearch.toLowerCase();
    const matchesSearch =
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.mobile && s.mobile.includes(q)) ||
      (s.zodiacSign && s.zodiacSign.toLowerCase().includes(q)) ||
      (s.planName && s.planName.toLowerCase().includes(q));

    if (subFilter === "all") return matchesSearch;
    if (subFilter === "active") return matchesSearch && s.status === "active";
    if (subFilter === "trial") return matchesSearch && s.status === "trial";
    if (subFilter === "stopped") return matchesSearch && s.status === "stopped";
    if (subFilter === "pending") return matchesSearch && (s.status === "pending_verification" || s.status === "pending");
    if (subFilter === "expired") {
      const isExp =
        s.status === "expired" ||
        (Boolean(s.validUntil) && new Date(s.validUntil).getTime() < Date.now());
      return matchesSearch && isExp && s.status !== "stopped";
    }
    return matchesSearch;
  });

  // =========================================================================
  // VIEW 1: NOT AUTHENTICATED -> FULL PAGE STAFF LOGIN
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#4A4A4A] flex flex-col font-sans">
        {/* Top Navbar */}
        <header className="border-b border-[#E8E6DF] bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="p-2 rounded-xl border border-[#E8E6DF] hover:bg-[#F5F5F0] text-[#5C6B5A] flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Devotee Website</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#8B9D83] rounded-full flex items-center justify-center text-white font-serif font-bold text-sm">
              ॐ
            </div>
            <span className="font-serif italic text-lg font-bold text-[#3D3D3D]">
              JyotishVani Kendra
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF2F0] border border-[#F5C2B8] text-[11px] font-bold text-[#9E2A2B]">
            <Lock className="w-3.5 h-3.5" />
            <span>Kendra Staff Restricted</span>
          </div>
        </header>

        {/* Login Body */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md bg-white border border-[#E8E6DF] rounded-[32px] p-6 sm:p-10 shadow-xl relative overflow-hidden">
            {/* Top Accent Icon */}
            <div className="w-14 h-14 rounded-2xl bg-[#5C6B5A] text-white flex items-center justify-center shadow-md mb-6 mx-auto sm:mx-0">
              <Lock className="w-7 h-7" />
            </div>

            {/* Title */}
            <div className="mb-6 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D3D3D]">
                  Kendra Staff Portal
                </h1>
                <span className="px-2.5 py-0.5 rounded-md bg-[#F0EDDF] text-[#5C6B5A] text-[10px] font-bold uppercase tracking-wider border border-[#E8E6DF]">
                  Staff
                </span>
              </div>
              <p className="text-xs text-[#7A7A7A] mt-2 leading-relaxed">
                Dedicated management console strictly restricted to Kendra Administrator (Phone:{" "}
                <span className="font-bold text-[#3D3D3D]">+91 {AUTHORIZED_ADMIN_NUMBER}</span>).
                Public users and devotees must use the main portal.
              </p>
            </div>

            {/* Info Notice */}
            {loginInfo && !loginError && (
              <div className="mb-5 p-3.5 rounded-2xl bg-[#EDF3EC] border border-[#8B9D83]/40 text-[#5C6B5A] text-xs flex items-start gap-2.5">
                <Mail className="w-4 h-4 shrink-0 mt-0.5 text-[#5C6B5A]" />
                <div className="leading-snug">
                  <p className="font-bold">Passcode Dispatched</p>
                  <p className="mt-0.5">{loginInfo}</p>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {loginError && (
              <div className="mb-5 p-3.5 rounded-2xl bg-[#FFF2F0] border border-[#F5C2B8] text-[#9E2A2B] text-xs flex items-start gap-2.5 animate-shake">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <p className="font-bold">Security Alert</p>
                  <p className="mt-0.5">{loginError}</p>
                </div>
              </div>
            )}

            {/* STEP 1: Mobile or Email Verification */}
            {loginStep === "phone" && (
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#3D3D3D] uppercase tracking-wider mb-2">
                    Admin Mobile or Email
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => {
                        setLoginIdentifier(e.target.value);
                        if (loginError) setLoginError("");
                      }}
                      placeholder="Enter administrator mobile or registered email"
                      className="w-full px-4 py-3 rounded-2xl border border-[#E8E6DF] bg-[#FAF9F6] focus:bg-white focus:outline-none focus:border-[#8B9D83] focus:ring-2 focus:ring-[#8B9D83]/20 text-sm font-semibold tracking-wide text-[#3D3D3D]"
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-[#7A7A7A] mt-1.5">
                    Security Passcode (OTP) will be delivered to the administrator email inbox only.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full mt-2 py-3.5 rounded-2xl bg-[#5C6B5A] hover:bg-[#4E5B4C] text-white font-bold text-xs tracking-wide shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {loginLoading ? (
                    <span>Dispatching Passcode to Email...</span>
                  ) : (
                    <>
                      <span>Send Passcode to Email</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: Passcode Verification (Sent to email only, never displayed on screen) */}
            {loginStep === "passcode" && (
              <form onSubmit={handlePasscodeSubmit} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-[#F0EDDF]/70 border border-[#E8E6DF] text-xs text-[#5C6B5A] space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Mail className="w-4 h-4 text-[#8B9D83]" />
                      <span>Check Administrator Email</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginStep("phone");
                        setLoginError("");
                        setLoginInfo("");
                      }}
                      className="text-[11px] text-[#7A7A7A] hover:text-[#3D3D3D] underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                  <p className="text-[11px] text-[#7A7A7A]">
                    A 6-digit security code was dispatched to {maskedAdminEmail ? <strong>{maskedAdminEmail}</strong> : "your admin email"}. Please check your inbox and enter the code below.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3D3D3D] uppercase tracking-wider mb-2">
                    Enter 6-Digit Email Passcode (OTP)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="password"
                      maxLength={6}
                      value={loginPasscode}
                      onChange={(e) => {
                        setLoginPasscode(e.target.value);
                        if (loginError) setLoginError("");
                      }}
                      placeholder="••••••"
                      className="w-full px-4 py-3 rounded-2xl border border-[#E8E6DF] bg-[#FAF9F6] focus:bg-white focus:outline-none focus:border-[#8B9D83] focus:ring-2 focus:ring-[#8B9D83]/20 text-center tracking-[0.4em] font-mono text-lg font-bold text-[#3D3D3D]"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#7A7A7A] pt-1">
                  <span>Single-use code • Valid for 10 minutes</span>
                  <button
                    type="button"
                    onClick={handlePhoneSubmit}
                    disabled={loginLoading}
                    className="text-[#8B9D83] hover:text-[#5C6B5A] font-bold hover:underline cursor-pointer"
                  >
                    Resend Code to Email
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full mt-2 py-3.5 rounded-2xl bg-[#5C6B5A] hover:bg-[#4E5B4C] text-white font-bold text-xs tracking-wide shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {loginLoading ? (
                    <span>Authenticating Admin...</span>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Unlock Kendra Staff Console</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-[#E8E6DF] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={onNavigateHome}
                className="text-[#7A7A7A] hover:text-[#3D3D3D] flex items-center gap-1 text-xs cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Devotee Website</span>
              </button>
              <span className="text-[10px] text-[#AFAFAF] uppercase tracking-wider">
                RBAC Level 1
              </span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED -> FULL DEDICATED KENDRA STAFF PORTAL PAGE
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3D3D3D] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#E8E6DF] px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#8B9D83] text-white flex items-center justify-center shadow-xs">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg sm:text-xl font-bold text-[#3D3D3D]">
                JyotishVani Kendra Staff Portal
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EDF3EC] text-[#5C6B5A] text-[10px] font-bold border border-[#8B9D83]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B9D83] animate-pulse" />
                Live Database Active
              </span>
            </div>
            <p className="text-xs text-[#7A7A7A]">
              Central management for dynamic pricing, devotees, UPI ledger &amp; callbacks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin Identity Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F0EDDF] border border-[#E8E6DF] text-xs font-semibold text-[#5C6B5A]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8B9D83]" />
            <span>Admin: <strong>+91 9560169988</strong></span>
          </div>

          {/* Reload Data Button */}
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="p-2 rounded-xl border border-[#E8E6DF] hover:bg-[#F0EDDF] text-[#7A7A7A] hover:text-[#3D3D3D] transition-colors cursor-pointer"
            title="Reload all records from database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#8B9D83]" : ""}`} />
          </button>

          {/* Download Codebase ZIP */}
          <a
            href="/api/download-zip"
            download="jyotishvani-source-code.zip"
            className="px-3.5 py-1.5 rounded-xl border border-[#8B9D83] bg-[#EDF3EC] hover:bg-[#dbe7d7] text-[#5C6B5A] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Download Complete Application Source Code as ZIP"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Download Code (ZIP)</span>
          </a>

          {/* Return to Devotee Website */}
          <button
            onClick={onNavigateHome}
            className="px-3.5 py-1.5 rounded-xl border border-[#E8E6DF] hover:bg-[#F0EDDF] text-[#5C6B5A] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            title="Return to Public Devotee Website"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View Devotee Website</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 rounded-xl border border-[#F5C2B8] bg-[#FFF2F0] hover:bg-[#FEE4E2] text-[#9E2A2B] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            title="Log out of Admin Console"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </header>

      {/* Save Success Banner */}
      {saveSuccessMsg && (
        <div className="bg-[#EDF3EC] text-[#5C6B5A] px-6 py-2.5 text-xs font-semibold flex items-center justify-between border-b border-[#8B9D83]/30 animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#8B9D83]" />
            <span>{saveSuccessMsg}</span>
          </span>
          <button onClick={() => setSaveSuccessMsg("")} className="text-[#5C6B5A] hover:text-[#3D3D3D] cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white border border-[#E8E6DF] shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7A7A] block">Total Devotees</span>
            <span className="text-2xl font-serif font-bold text-[#3D3D3D] mt-1 block">
              {stats?.totalSubscribers ?? subscribers.length}
            </span>
            <span className="text-[10px] text-[#8B9D83] font-semibold">Registered in system</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E8E6DF] shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7A7A] block">Active Paid</span>
            <span className="text-2xl font-serif font-bold text-[#5C6B5A] mt-1 block">
              {stats?.activePaid ?? subscribers.filter((s) => s.status === "active").length}
            </span>
            <span className="text-[10px] text-[#5C6B5A] font-semibold">Monthly / Yearly members</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E8E6DF] shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7A7A] block">Pending UPI</span>
            <span className="text-2xl font-serif font-bold text-[#CB997E] mt-1 block">
              {payments.filter((p) => p.status === "pending").length}
            </span>
            <span className="text-[10px] text-[#CB997E] font-semibold">Awaiting UTR verify</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E8E6DF] shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7A7A] block">Total Collections</span>
            <span className="text-2xl font-serif font-bold text-[#3D3D3D] mt-1 block">
              ₹{stats?.totalRevenue ?? payments.filter((p) => p.status === "verified").reduce((acc, p) => acc + (p.amount || 0), 0)}
            </span>
            <span className="text-[10px] text-[#8B9D83] font-semibold">Via {settings.upiId || "9560169988@pthdfc"}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E8E6DF] shadow-xs col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7A7A] block">Helpline Leads</span>
            <span className="text-2xl font-serif font-bold text-[#3D3D3D] mt-1 block">
              {callbacks.length}
            </span>
            <span className="text-[10px] text-[#7A7A7A] font-semibold">Inquiries on 9560169988</span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#E8E6DF] bg-white rounded-2xl p-1.5 shadow-xs overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "settings"
                ? "bg-[#5C6B5A] text-white shadow-xs"
                : "text-[#7A7A7A] hover:text-[#3D3D3D] hover:bg-[#F5F5F0]"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Kendra Configuration &amp; Pricing</span>
          </button>

          <button
            onClick={() => setActiveTab("subscribers")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "subscribers"
                ? "bg-[#5C6B5A] text-white shadow-xs"
                : "text-[#7A7A7A] hover:text-[#3D3D3D] hover:bg-[#F5F5F0]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Devotee Subscribers ({subscribers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("payments")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "payments"
                ? "bg-[#5C6B5A] text-white shadow-xs"
                : "text-[#7A7A7A] hover:text-[#3D3D3D] hover:bg-[#F5F5F0]"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>UPI Payments ({payments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("leads")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "leads"
                ? "bg-[#5C6B5A] text-white shadow-xs"
                : "text-[#7A7A7A] hover:text-[#3D3D3D] hover:bg-[#F5F5F0]"
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span>Offline Consultation Leads ({callbacks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("scheduler")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "scheduler"
                ? "bg-[#5C6B5A] text-white shadow-xs"
                : "text-[#7A7A7A] hover:text-[#3D3D3D] hover:bg-[#F5F5F0]"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Daily Email Scheduler Job</span>
            <span className="w-2 h-2 rounded-full bg-[#8B9D83] animate-pulse" />
          </button>

          <button
            onClick={() => setActiveTab("panchang")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "panchang"
                ? "bg-[#5C6B5A] text-white shadow-xs"
                : "text-[#7A7A7A] hover:text-[#3D3D3D] hover:bg-[#F5F5F0]"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Today's Panchang &amp; Ephemeris</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>

        {/* TAB 1: KENDRA SETTINGS & PRICING */}
        {activeTab === "settings" && (
          <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-[#E8E6DF] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#E8E6DF] pb-4">
              <div>
                <h2 className="font-serif font-bold text-lg text-[#3D3D3D]">
                  Kendra Helpline, UPI ID &amp; Subscription Pricing
                </h2>
                <p className="text-xs text-[#7A7A7A]">
                  Changes made here update the public landing page, UPI payment links, and helpline prompts immediately.
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-2xl bg-[#5C6B5A] hover:bg-[#4E5B4C] text-white font-bold text-xs tracking-wide shadow-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save All Settings</span>
              </button>
            </div>

            {/* Helpline & UPI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1.5">
                  Helpline Mobile Number
                </label>
                <input
                  type="text"
                  value={settings.helplineNumber}
                  onChange={(e) => setSettings({ ...settings, helplineNumber: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold text-[#3D3D3D]"
                />
                <span className="text-[11px] text-[#7A7A7A] mt-1 block">Default Kendra Helpline: 9560169988</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1.5">
                  Support &amp; Devotee Care Helpline
                </label>
                <input
                  type="text"
                  value={settings.helplineWhatsApp}
                  onChange={(e) => setSettings({ ...settings, helplineWhatsApp: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold text-[#3D3D3D]"
                />
                <span className="text-[11px] text-[#7A7A7A] mt-1 block">Devotee care contact number for offline connect</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1.5">
                  Kendra UPI VPA (For Direct QR Payments)
                </label>
                <input
                  type="text"
                  value={settings.upiId}
                  onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold text-[#3D3D3D]"
                />
                <span className="text-[11px] text-[#7A7A7A] mt-1 block">UPI ID displayed to devotees: {settings.upiId || "9560169988@pthdfc"}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1.5">
                  UPI Payee Name
                </label>
                <input
                  type="text"
                  value={settings.upiPayeeName}
                  onChange={(e) => setSettings({ ...settings, upiPayeeName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold text-[#3D3D3D]"
                />
                <span className="text-[11px] text-[#7A7A7A] mt-1 block">Official merchant/kendra title</span>
              </div>
            </div>

            {/* Pricing Matrix */}
            <div className="pt-4 border-t border-[#E8E6DF]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#3D3D3D] mb-3">
                Devotee Subscription Pricing Matrix (₹)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF]">
                  <span className="text-xs font-bold text-[#5C6B5A] block">1 Month Plan</span>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="text-xs font-bold text-[#7A7A7A]">₹</span>
                    <input
                      type="number"
                      value={settings.planPrices.monthly}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          planPrices: { ...settings.planPrices, monthly: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2 py-1 rounded-lg bg-white border border-[#E8E6DF] text-sm font-bold text-[#3D3D3D]"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF]">
                  <span className="text-xs font-bold text-[#5C6B5A] block">3 Months Plan</span>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="text-xs font-bold text-[#7A7A7A]">₹</span>
                    <input
                      type="number"
                      value={settings.planPrices.three_months}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          planPrices: { ...settings.planPrices, three_months: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2 py-1 rounded-lg bg-white border border-[#E8E6DF] text-sm font-bold text-[#3D3D3D]"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF]">
                  <span className="text-xs font-bold text-[#5C6B5A] block">6 Months Plan</span>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="text-xs font-bold text-[#7A7A7A]">₹</span>
                    <input
                      type="number"
                      value={settings.planPrices.six_months}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          planPrices: { ...settings.planPrices, six_months: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2 py-1 rounded-lg bg-white border border-[#E8E6DF] text-sm font-bold text-[#3D3D3D]"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF]">
                  <span className="text-xs font-bold text-[#5C6B5A] block">1 Year Pass</span>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="text-xs font-bold text-[#7A7A7A]">₹</span>
                    <input
                      type="number"
                      value={settings.planPrices.yearly}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          planPrices: { ...settings.planPrices, yearly: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2 py-1 rounded-lg bg-white border border-[#E8E6DF] text-sm font-bold text-[#3D3D3D]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Announcement Banner */}
            <div className="pt-4 border-t border-[#E8E6DF]">
              <label className="block text-xs font-bold text-[#4A4A4A] mb-1.5">
                Top Website Announcement Banner
              </label>
              <input
                type="text"
                value={settings.announcementBanner}
                onChange={(e) => setSettings({ ...settings, announcementBanner: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs text-[#3D3D3D]"
              />
            </div>

            {/* Physical Kendra Locations */}
            <div className="pt-4 border-t border-[#E8E6DF] grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1.5">
                  Offline Kendra Centres
                </label>
                <input
                  type="text"
                  value={settings.kendraLocation}
                  onChange={(e) => setSettings({ ...settings, kendraLocation: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs text-[#3D3D3D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1.5">
                  Kendra Operating Hours
                </label>
                <input
                  type="text"
                  value={settings.kendraTimings}
                  onChange={(e) => setSettings({ ...settings, kendraTimings: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs text-[#3D3D3D]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-2xl bg-[#5C6B5A] hover:bg-[#4E5B4C] text-white font-bold text-xs tracking-wide shadow-sm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save All Changes to Live Website</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: DEVOTEES & SUBSCRIBERS */}
        {activeTab === "subscribers" && (
          <div className="bg-white rounded-3xl border border-[#E8E6DF] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E6DF] pb-4">
              <div>
                <h2 className="font-serif font-bold text-lg text-[#3D3D3D]">
                  Devotee Subscriber Master Directory
                </h2>
                <p className="text-xs text-[#7A7A7A]">
                  Manage all seekers receiving daily 7:00 AM Vedic Horoscopes via Email.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewSubModal(true)}
                  className="px-4 py-2 rounded-2xl bg-[#5C6B5A] hover:bg-[#4E5B4C] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Subscriber</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A7A7A]" />
                <input
                  type="text"
                  placeholder="Search by name, mobile, rashi, or plan..."
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-semibold focus:outline-none focus:border-[#8B9D83]"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                <button
                  onClick={() => setSubFilter("all")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    subFilter === "all" ? "bg-[#5C6B5A] text-white" : "bg-[#FAF9F6] border border-[#E8E6DF] text-[#7A7A7A]"
                  }`}
                >
                  All ({subscribers.length})
                </button>
                <button
                  onClick={() => setSubFilter("active")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    subFilter === "active" ? "bg-[#5C6B5A] text-white" : "bg-[#FAF9F6] border border-[#E8E6DF] text-[#7A7A7A]"
                  }`}
                >
                  Active ({subscribers.filter((s) => s.status === "active").length})
                </button>
                <button
                  onClick={() => setSubFilter("trial")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    subFilter === "trial" ? "bg-[#5C6B5A] text-white" : "bg-[#FAF9F6] border border-[#E8E6DF] text-[#7A7A7A]"
                  }`}
                >
                  Trial ({subscribers.filter((s) => s.status === "trial").length})
                </button>
                <button
                  onClick={() => setSubFilter("pending")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    subFilter === "pending" ? "bg-[#B8856B] text-white" : "bg-[#FAF9F6] border border-[#E8E6DF] text-[#7A7A7A]"
                  }`}
                >
                  Pending ({subscribers.filter((s) => s.status === "pending_verification" || s.status === "pending").length})
                </button>
                <button
                  onClick={() => setSubFilter("expired")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    subFilter === "expired" ? "bg-amber-600 text-white" : "bg-[#FAF9F6] border border-[#E8E6DF] text-[#7A7A7A]"
                  }`}
                >
                  Expired (
                  {
                    subscribers.filter(
                      (s) =>
                        s.status !== "stopped" &&
                        (s.status === "expired" ||
                          (Boolean(s.validUntil) && new Date(s.validUntil).getTime() < Date.now()))
                    ).length
                  }
                  )
                </button>
                <button
                  onClick={() => setSubFilter("stopped")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    subFilter === "stopped" ? "bg-rose-700 text-white" : "bg-[#FAF9F6] border border-[#E8E6DF] text-[#7A7A7A]"
                  }`}
                >
                  Stopped ({subscribers.filter((s) => s.status === "stopped").length})
                </button>
              </div>
            </div>

            {/* Subscribers Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#E8E6DF]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF9F6] text-[#7A7A7A] uppercase text-[10px] tracking-wider border-b border-[#E8E6DF]">
                  <tr>
                    <th className="py-3 px-4 font-bold">Member &amp; Mobile</th>
                    <th className="py-3 px-4 font-bold">Rashi / Sign</th>
                    <th className="py-3 px-4 font-bold">Plan &amp; Auto-Renew</th>
                    <th className="py-3 px-4 font-bold">Channel &amp; Time</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6DF]">
                  {filteredSubscribers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#7A7A7A]">
                        No matching subscribers found in database.
                      </td>
                    </tr>
                  ) : (
                    filteredSubscribers.map((sub) => {
                      const isSubStopped = sub.status === "stopped";
                      const isSubExpired =
                        !isSubStopped &&
                        (sub.status === "expired" ||
                          (Boolean(sub.validUntil) && new Date(sub.validUntil).getTime() < Date.now()));

                      return (
                        <tr
                          key={sub.mobile}
                          className={`transition-colors ${
                            isSubStopped
                              ? "bg-rose-50/40 hover:bg-rose-50/70"
                              : isSubExpired
                              ? "bg-amber-50/40 hover:bg-amber-50/70"
                              : "hover:bg-[#FAF9F6]"
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span className="font-bold text-[#3D3D3D] block">{sub.name || "Seeker"}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[#7A7A7A] font-mono font-bold text-[11px] block">+91 {sub.mobile}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setQuickEditMobileSub({
                                    originalMobile: sub.mobile,
                                    mobile: sub.mobile,
                                    name: sub.name || "Devotee",
                                    zodiacSign: sub.zodiacSign,
                                    email: sub.email || "",
                                  })
                                }
                                className="p-1 rounded-md text-[#5C6B5A] hover:text-[#25D366] hover:bg-[#E7F8EE] transition-colors cursor-pointer"
                                title="Edit Mobile Number (+91)"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            </div>
                            {sub.email ? (
                              <span className="text-[10px] text-[#5C6B5A] font-mono block">
                                ✉ {sub.email}
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#CB997E] font-medium block">
                                ⚠ No email registered
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-[#5C6B5A] bg-[#F0EDDF] px-2 py-0.5 rounded-md border border-[#E8E6DF]">
                              {sub.zodiacSign}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-[#3D3D3D] block">{sub.planName || sub.planId}</span>
                            <span className="text-[10px] text-[#7A7A7A] block">
                              Valid to: {sub.validUntil ? sub.validUntil.split("T")[0] : "Lifetime"}
                            </span>
                            {isSubStopped ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold mt-1 bg-rose-100 text-rose-800 border border-rose-200">
                                <Ban className="w-2.5 h-2.5" />
                                <span>Stopped by Admin</span>
                              </span>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold mt-1 ${
                                  sub.autoRenew !== false
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : "bg-gray-100 text-gray-500 border border-gray-200"
                                }`}
                              >
                                <RefreshCw className="w-2.5 h-2.5" />
                                <span>Auto-Renew: {sub.autoRenew !== false ? "ON" : "OFF"}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="capitalize font-semibold text-[#3D3D3D] block">
                              {sub.deliveryChannel}
                            </span>
                            <span className="text-[10px] text-[#7A7A7A]">{sub.deliveryTime || "07:00 AM"}</span>
                          </td>
                          <td className="py-3 px-4">
                            {isSubStopped ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                                <span>Stopped</span>
                              </span>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  isSubExpired
                                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                                    : sub.status === "active"
                                    ? "bg-[#EDF3EC] text-[#5C6B5A] border border-[#8B9D83]/30"
                                    : "bg-[#FFF4E5] text-[#B8856B] border border-[#CB997E]/30"
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                <span>{isSubExpired ? "Expired" : sub.status}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Stop Subscription / Resume Subscription (Admin Power) */}
                              {isSubStopped ? (
                                <button
                                  onClick={() => handleResumeSubscriber(sub)}
                                  title="Resume Subscription (Reactivate Daily Horoscope)"
                                  className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 cursor-pointer transition-colors"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStopSubscriber(sub)}
                                  title="Stop Any Subscription At Any Time (Admin Action)"
                                  className="p-1.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer transition-colors"
                                >
                                  <PowerOff className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Direct Renew / Auto-Renew Action */}
                              <button
                                onClick={() => handleRenewSubscriber(sub)}
                                title={isSubExpired ? "Auto-Renew Expired Subscription" : "Renew / Extend Subscription"}
                                className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                                  isSubExpired
                                    ? "bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900"
                                    : "bg-white hover:bg-[#EDF3EC] border-[#E8E6DF] text-[#5C6B5A]"
                                }`}
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleSimulateBroadcast(sub)}
                                title="Test Send Daily Horoscope Broadcast"
                                className="p-1.5 rounded-lg border border-[#E8E6DF] bg-white hover:bg-[#EDF3EC] text-[#5C6B5A] cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setQuickEditMobileSub({
                                    originalMobile: sub.mobile,
                                    mobile: sub.mobile,
                                    name: sub.name || "Devotee",
                                    zodiacSign: sub.zodiacSign,
                                    email: sub.email || "",
                                  })
                                }
                                title="Edit Devotee Mobile Number (+91)"
                                className="px-2.5 py-1 rounded-lg border border-[#25D366]/50 bg-[#E7F8EE] hover:bg-[#25D366] text-[#1E7E34] hover:text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                              >
                                <Smartphone className="w-3 h-3" />
                                <span>Edit Mo</span>
                              </button>
                              <button
                                onClick={() => openEditModal(sub)}
                                title="Edit Devotee (Full Account Details)"
                                className="p-1.5 rounded-lg border border-[#E8E6DF] bg-white hover:bg-[#F5F5F0] text-[#7A7A7A] hover:text-[#3D3D3D] cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSubscriber(sub.mobile)}
                                title="Delete Devotee"
                                className="p-1.5 rounded-lg border border-[#F5C2B8] bg-white hover:bg-[#FFF2F0] text-[#9E2A2B] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: UPI PAYMENTS */}
        {activeTab === "payments" && (
          <div className="bg-white rounded-3xl border border-[#E8E6DF] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#E8E6DF] pb-4">
              <div>
                <h2 className="font-serif font-bold text-lg text-[#3D3D3D]">
                  UPI Payment Transactions &amp; Verification Ledger
                </h2>
                <p className="text-xs text-[#7A7A7A]">
                  Devotee transfers made via QR Scan or Intent to <span className="font-bold text-[#3D3D3D]">{settings.upiId}</span>. Approve or reject transaction IDs.
                </p>
              </div>
              <span className="text-xs font-bold text-[#5C6B5A] bg-[#EDF3EC] px-3.5 py-1.5 rounded-full border border-[#8B9D83]/30">
                Merchant VPA: {settings.upiId}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#E8E6DF]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF9F6] text-[#7A7A7A] uppercase text-[10px] tracking-wider border-b border-[#E8E6DF]">
                  <tr>
                    <th className="py-3 px-4 font-bold">Transaction / UTR ID</th>
                    <th className="py-3 px-4 font-bold">Devotee Mobile</th>
                    <th className="py-3 px-4 font-bold">Plan &amp; Amount</th>
                    <th className="py-3 px-4 font-bold">Method</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6DF]">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#7A7A7A]">
                        No UPI payment records logged yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-[#FAF9F6] transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-[#3D3D3D] block">
                            {pay.utrNumber || (pay as any).txnId || pay.id}
                          </span>
                          <span className="text-[10px] text-[#7A7A7A] block">
                            {new Date(pay.timestamp).toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-[#3D3D3D] block">
                            {pay.userName || (pay as any).payerName || "Devotee"}
                          </span>
                          <span className="font-mono text-[#7A7A7A]">
                            +91 {pay.mobile || (pay as any).userMobile}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-[#5C6B5A] text-sm">₹{pay.amount}</span>
                          <span className="text-[10px] text-[#7A7A7A] block capitalize">{pay.planId}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize font-semibold text-[#7A7A7A]">
                            {pay.paymentMode === "upi_qr" ? "QR Code Scan" : "UPI App Intent"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="relative inline-flex items-center gap-1.5">
                            <select
                              value={pay.status}
                              disabled={updatingPaymentId === pay.id}
                              onChange={(e) =>
                                handleUpdatePaymentStatus(
                                  pay.id,
                                  e.target.value as "verified" | "pending" | "rejected" | "failed"
                                )
                              }
                              className={`text-[11px] font-bold py-1 px-2.5 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#8B9D83] transition-all ${
                                pay.status === "verified"
                                  ? "text-[#5C6B5A] bg-[#EDF3EC] border-[#8B9D83]/40"
                                  : (pay.status as string) === "rejected"
                                  ? "text-[#9E2A2B] bg-[#FFF2F0] border-[#F5C2B8]"
                                  : (pay.status as string) === "failed"
                                  ? "text-[#7A7A7A] bg-[#F5F5F0] border-[#E8E6DF]"
                                  : "text-[#B8856B] bg-[#FFF4E5] border-[#CB997E]/40"
                              }`}
                            >
                              <option value="verified">🟢 Verified (Active)</option>
                              <option value="pending">🟡 Pending Review</option>
                              <option value="rejected">🔴 Rejected</option>
                              <option value="failed">⚪ Failed</option>
                            </select>
                            {updatingPaymentId === pay.id && (
                              <RefreshCw className="w-3 h-3 text-[#5C6B5A] animate-spin" />
                            )}
                          </div>
                          {pay.adminNotes && (
                            <span
                              className="text-[10px] text-[#7A7A7A] block mt-0.5 truncate max-w-[160px]"
                              title={pay.adminNotes}
                            >
                              💬 {pay.adminNotes}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {pay.status === "pending" && (
                              <button
                                onClick={() => handleUpdatePaymentStatus(pay.id, "verified")}
                                className="px-2.5 py-1 rounded-xl bg-[#5C6B5A] text-white font-bold text-[11px] hover:bg-[#4E5B4C] cursor-pointer"
                                title="Approve & Activate Subscription"
                              >
                                Approve
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingPayment(pay);
                                setEditPaymentStatus(pay.status);
                                setEditPaymentUtr(pay.utrNumber || "");
                                setEditPaymentNotes(pay.adminNotes || "");
                                setEditPaymentAmount(pay.amount);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-[#FAF9F6] text-[#5C6B5A] border border-[#E8E6DF] hover:bg-[#F0EDDF] font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                              title="Edit Payment Status & Details"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: LEADS & OFFLINE CALLBACKS */}
        {activeTab === "leads" && (
          <div className="bg-white rounded-3xl border border-[#E8E6DF] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#E8E6DF] pb-4">
              <div>
                <h2 className="font-serif font-bold text-lg text-[#3D3D3D]">
                  Helpline 9560169988 Consultation Callback Leads
                </h2>
                <p className="text-xs text-[#7A7A7A]">
                  Devotees requesting astrologer callbacks or in-person visits to Kendra centres.
                </p>
              </div>
              <span className="text-xs font-bold text-[#8B9D83] bg-[#EDF3EC] px-3.5 py-1.5 rounded-full border border-[#8B9D83]/30">
                Helpline: {settings.helplineNumber}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {callbacks.length === 0 ? (
                <div className="col-span-2 py-8 text-center text-[#7A7A7A]">
                  No consultation leads currently recorded.
                </div>
              ) : (
                callbacks.map((cb) => (
                  <div key={cb.id} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm text-[#3D3D3D] block">{cb.callerName}</span>
                        <a href={`tel:${cb.callerPhone}`} className="text-xs font-mono font-bold text-[#CB997E] hover:underline">
                          +91 {cb.callerPhone}
                        </a>
                      </div>
                      <select
                        value={cb.status}
                        onChange={(e) => handleUpdateCallback(cb.id, e.target.value as any, cb.notes)}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white border border-[#E8E6DF] focus:outline-none cursor-pointer"
                      >
                        <option value="pending">Pending</option>
                        <option value="connected">Connected</option>
                        <option value="scheduled">Scheduled Visit</option>
                      </select>
                    </div>

                    <div className="text-xs bg-white p-2.5 rounded-xl border border-[#E8E6DF] text-[#5C6B5A]">
                      <span className="text-[10px] text-[#7A7A7A] block font-bold uppercase">Topic:</span>
                      {cb.preferredTopic}
                    </div>

                    {cb.notes && (
                      <div className="text-[11px] text-[#7A7A7A] bg-white/70 p-2 rounded-xl border border-[#E8E6DF]">
                        <strong>Notes:</strong> {cb.notes}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-[#7A7A7A] pt-1 border-t border-[#E8E6DF]">
                      <span>Target: <strong>{cb.helplineCalled}</strong></span>
                      <span>{new Date(cb.requestedAt).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 6: DAILY HOROSCOPE EMAIL SCHEDULER JOB */}
        {activeTab === "scheduler" && (
          <EmailSchedulerTab
            subscribers={subscribers}
            onSubscribersUpdated={fetchAllData}
          />
        )}

        {/* TAB 7: TODAY'S PANCHANG & EPHEMERIS MANAGEMENT */}
        {activeTab === "panchang" && (
          <div className="space-y-6">
            {/* Top Ephemeris Status & Action Bar */}
            <div className="bg-white rounded-3xl border border-[#E8E6DF] p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-[#E8E6DF]">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-[#8B9D83] uppercase tracking-wider font-sans flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#CB997E]" />
                      <span>Kashi Vishwanath Astronomical Ephemeris</span>
                    </span>

                    {panchang.isCustomized ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Acharya Verified (Customized)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Astronomical Ephemeris (Auto-Calculated)
                      </span>
                    )}

                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#F5F5F0] border border-[#E8E6DF] text-[#7A7A7A] font-medium">
                      Date: {panchang.date || new Date().toISOString().split("T")[0]}
                    </span>
                  </div>

                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D3D3D]">
                    Today's Vedic Panchang &amp; Muhurat Management
                  </h2>
                  <p className="text-xs sm:text-sm text-[#7A7A7A] mt-1.5 max-w-2xl leading-relaxed">
                    Astronomical coordinates are calibrated for Kashi / Varanasi (IST • UTC+05:30). You can review today's automatically computed Tithi, Nakshatra, Rahu Kaal, and Auspicious Muhurats, annotate special Vrats/Festivals, or edit any field to match local Kendra almanacs.
                  </p>
                </div>

                {/* Top Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleRecalculatePanchang}
                    disabled={panchangSaving}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F0EDDF] hover:bg-[#E8E6DF] border border-[#D9D6C9] text-xs font-bold text-[#3D3D3D] transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                    title="Recalculate today's astronomical coordinates from the ephemeris engine"
                  >
                    <RefreshCw className={`w-4 h-4 text-[#8B9D83] ${panchangSaving ? "animate-spin" : ""}`} />
                    <span>Recalculate Live Ephemeris</span>
                  </button>

                  {panchang.isCustomized && (
                    <button
                      type="button"
                      onClick={handleResetPanchang}
                      disabled={panchangSaving}
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold text-[#7A7A7A] transition-all cursor-pointer disabled:opacity-50"
                      title="Reset back to pure astronomical engine calculation"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset to Engine</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSavePanchang()}
                    disabled={panchangSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5C6B5A] hover:bg-[#4D5A4B] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>{panchangSaving ? "Saving..." : "Save & Publish"}</span>
                  </button>
                </div>
              </div>

              {panchangStatusNotice && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{panchangStatusNotice}</span>
                </div>
              )}

              {/* Form to Edit Panchang */}
              <form onSubmit={handleSavePanchang} className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Pillar 1: Tithi */}
                  <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] space-y-2">
                    <label className="text-xs font-bold text-[#8B9D83] uppercase tracking-wider block">
                      1. Tithi (तिथी)
                    </label>
                    <input
                      type="text"
                      value={panchang.tithi}
                      onChange={(e) => {
                        const val = e.target.value;
                        const startTime = panchang.tithiStartTime || "Starts at 10:55 PM";
                        setPanchang({
                          ...panchang,
                          tithi: val,
                          hinduDate: `${val} (${startTime}), ${panchang.samvat || "Vikram Samvat 2083"}`,
                        });
                      }}
                      placeholder="e.g. Dwitiya (Krishna Paksha)"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E6DF] text-xs text-[#3D3D3D] font-semibold focus:outline-none focus:border-[#8B9D83]"
                    />
                    <div>
                      <label className="text-[10px] font-bold text-[#7A7A7A] uppercase tracking-wider block mb-1">
                        Tithi Start Time
                      </label>
                      <input
                        type="text"
                        value={panchang.tithiStartTime || ""}
                        onChange={(e) => {
                          const startTime = e.target.value;
                          setPanchang({
                            ...panchang,
                            tithiStartTime: startTime,
                            hinduDate: `${panchang.tithi} (${startTime}), ${panchang.samvat || "Vikram Samvat 2083"}`,
                          });
                        }}
                        placeholder="e.g. Starts today at 05:46 PM"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E8E6DF] text-[11px] text-[#3D3D3D] font-semibold focus:outline-none focus:border-[#8B9D83]"
                      />
                    </div>
                  </div>

                  {/* Pillar 2: Nakshatra */}
                  <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] space-y-2">
                    <label className="text-xs font-bold text-[#8B9D83] uppercase tracking-wider block">
                      2. Nakshatra (नक्षत्र)
                    </label>
                    <input
                      type="text"
                      value={panchang.nakshatra}
                      onChange={(e) => setPanchang({ ...panchang, nakshatra: e.target.value })}
                      placeholder="e.g. Uttara Phalguni (Sun / Aryaman)"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E6DF] text-xs text-[#3D3D3D] font-semibold focus:outline-none focus:border-[#8B9D83]"
                    />
                    <p className="text-[10px] text-[#7A7A7A]">Active lunar constellation</p>
                  </div>

                  {/* Pillar 3: Yoga */}
                  <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] space-y-2">
                    <label className="text-xs font-bold text-[#8B9D83] uppercase tracking-wider block">
                      3. Yoga (योग)
                    </label>
                    <input
                      type="text"
                      value={panchang.yoga}
                      onChange={(e) => setPanchang({ ...panchang, yoga: e.target.value })}
                      placeholder="e.g. Shubha Yoga (Benefic)"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E6DF] text-xs text-[#3D3D3D] font-semibold focus:outline-none focus:border-[#8B9D83]"
                    />
                    <p className="text-[10px] text-[#7A7A7A]">Solar-lunar longitudinal union</p>
                  </div>

                  {/* Pillar 4: Karana */}
                  <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] space-y-2">
                    <label className="text-xs font-bold text-[#8B9D83] uppercase tracking-wider block">
                      4. Karana (करण)
                    </label>
                    <input
                      type="text"
                      value={panchang.karana}
                      onChange={(e) => setPanchang({ ...panchang, karana: e.target.value })}
                      placeholder="e.g. Kintughna"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E6DF] text-xs text-[#3D3D3D] font-semibold focus:outline-none focus:border-[#8B9D83]"
                    />
                    <p className="text-[10px] text-[#7A7A7A]">Half-tithi interval activity</p>
                  </div>
                </div>

                {/* Muhurats & Solar Timings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] space-y-2">
                    <label className="text-xs font-bold text-[#B8856B] uppercase tracking-wider block flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#B8856B]" />
                      <span>Rahu Kaal (राहुकाल - Inauspicious)</span>
                    </label>
                    <input
                      type="text"
                      value={panchang.rahuKaal}
                      onChange={(e) => setPanchang({ ...panchang, rahuKaal: e.target.value })}
                      placeholder="e.g. 10:30 AM - 12:00 PM"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E6DF] text-xs text-[#3D3D3D] font-semibold focus:outline-none focus:border-[#B8856B]"
                    />
                    <p className="text-[10px] text-[#7A7A7A]">Avoid new initiatives during this 90-minute window</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] space-y-2">
                    <label className="text-xs font-bold text-[#5C6B5A] uppercase tracking-wider block flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#8B9D83]" />
                      <span>Abhijit Muhurat (अभिजित मुहूर्त)</span>
                    </label>
                    <input
                      type="text"
                      value={panchang.abhijitMuhurat}
                      onChange={(e) => setPanchang({ ...panchang, abhijitMuhurat: e.target.value })}
                      placeholder="e.g. 11:54 AM - 12:44 PM (Most Auspicious)"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E6DF] text-xs text-[#3D3D3D] font-semibold focus:outline-none focus:border-[#5C6B5A]"
                    />
                    <p className="text-[10px] text-[#7A7A7A]">Supreme mid-day auspicious muhurat</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] space-y-2">
                    <label className="text-xs font-bold text-[#5C6B5A] uppercase tracking-wider block flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#8B9D83]" />
                      <span>Shubh Muhurat / Amrit Vela</span>
                    </label>
                    <input
                      type="text"
                      value={panchang.shubhMuhurat || ""}
                      onChange={(e) => setPanchang({ ...panchang, shubhMuhurat: e.target.value })}
                      placeholder="e.g. 08:15 AM - 09:45 AM (Amrit Vela)"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E6DF] text-xs text-[#3D3D3D] font-semibold focus:outline-none focus:border-[#5C6B5A]"
                    />
                    <p className="text-[10px] text-[#7A7A7A]">Morning Choghadiya auspicious window</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] space-y-2">
                    <label className="text-xs font-bold text-[#7A7A7A] uppercase tracking-wider block flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-[#CB997E]" />
                      <span>Sunrise (सूर्योदय)</span>
                    </label>
                    <input
                      type="text"
                      value={panchang.sunrise}
                      onChange={(e) => setPanchang({ ...panchang, sunrise: e.target.value })}
                      placeholder="e.g. 06:15 AM"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E6DF] text-xs text-[#3D3D3D] font-semibold focus:outline-none focus:border-[#8B9D83]"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] space-y-2">
                    <label className="text-xs font-bold text-[#7A7A7A] uppercase tracking-wider block flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-[#8B9D83]" />
                      <span>Sunset (सूर्यास्त)</span>
                    </label>
                    <input
                      type="text"
                      value={panchang.sunset}
                      onChange={(e) => setPanchang({ ...panchang, sunset: e.target.value })}
                      placeholder="e.g. 06:34 PM"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E6DF] text-xs text-[#3D3D3D] font-semibold focus:outline-none focus:border-[#8B9D83]"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] space-y-2">
                    <label className="text-xs font-bold text-[#7A7A7A] uppercase tracking-wider block flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-[#5C6B5A]" />
                      <span>Moon Sign (चन्द्र राशि)</span>
                    </label>
                    <input
                      type="text"
                      value={panchang.moonSign || ""}
                      onChange={(e) => setPanchang({ ...panchang, moonSign: e.target.value })}
                      placeholder="e.g. Kanya (Virgo)"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E6DF] text-xs text-[#3D3D3D] font-semibold focus:outline-none focus:border-[#8B9D83]"
                    />
                  </div>
                </div>

                {/* Samvat & Festival / Vrat Notes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] space-y-2">
                    <label className="text-xs font-bold text-[#7A7A7A] uppercase tracking-wider block">
                      Vikram Samvat Era
                    </label>
                    <input
                      type="text"
                      value={panchang.samvat}
                      onChange={(e) => setPanchang({ ...panchang, samvat: e.target.value })}
                      placeholder="e.g. Vikram Samvat 2083"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E6DF] text-xs text-[#3D3D3D] font-semibold focus:outline-none focus:border-[#8B9D83]"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] space-y-2">
                    <label className="text-xs font-bold text-[#7A7A7A] uppercase tracking-wider block">
                      Paksha (पक्ष)
                    </label>
                    <select
                      value={panchang.paksha || "Shukla Paksha"}
                      onChange={(e) => setPanchang({ ...panchang, paksha: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E6DF] text-xs text-[#3D3D3D] font-semibold focus:outline-none focus:border-[#8B9D83] cursor-pointer"
                    >
                      <option value="Shukla Paksha">Shukla Paksha (शुक्ल पक्ष - Waxing Moon)</option>
                      <option value="Krishna Paksha">Krishna Paksha (कृष्ण पक्ष - Waning Moon)</option>
                    </select>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] space-y-2">
                    <label className="text-xs font-bold text-[#CB997E] uppercase tracking-wider block flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#CB997E]" />
                      <span>Special Vrat / Festival Annotation</span>
                    </label>
                    <input
                      type="text"
                      value={panchang.festivalNote || ""}
                      onChange={(e) => setPanchang({ ...panchang, festivalNote: e.target.value })}
                      placeholder="e.g. भाद्रपद शुक्ल पक्ष आरम्भ • Auspicious New Moon / Pratipada"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E6DF] text-xs text-[#3D3D3D] font-semibold focus:outline-none focus:border-[#CB997E]"
                    />
                    <p className="text-[10px] text-[#7A7A7A]">Appears in gold banner on devotee homepage</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E6DF]">
                  <button
                    type="button"
                    onClick={handleRecalculatePanchang}
                    disabled={panchangSaving}
                    className="px-4 py-2.5 rounded-xl border border-[#D9D6C9] text-xs font-bold text-[#3D3D3D] hover:bg-[#F5F5F0] transition-all cursor-pointer"
                  >
                    Discard Changes &amp; Recalculate
                  </button>

                  <button
                    type="submit"
                    disabled={panchangSaving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#5C6B5A] hover:bg-[#4D5A4B] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{panchangSaving ? "Saving..." : "Save Today's Panchang"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Live Devotee & Broadcast Previews */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Devotee Web Preview */}
              <div className="bg-white rounded-3xl border border-[#E8E6DF] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#3D3D3D] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#8B9D83]" />
                    <span>Public Website Banner Preview</span>
                  </h3>
                  <span className="text-[11px] text-[#7A7A7A]">Live on Homepage</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E8E6DF] pb-2">
                    <span className="text-xs font-serif font-bold text-[#3D3D3D]">
                      {panchang.hinduDate || `${panchang.tithi} (${panchang.tithiStartTime || "Starts at 10:55 PM"}), ${panchang.samvat}`}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Live Ephemeris
                    </span>
                  </div>

                  {panchang.festivalNote && (
                    <div className="text-xs font-bold text-[#9A3412] bg-[#FFF7ED] p-2 rounded-xl border border-[#FDBA74]">
                      ✨ {panchang.festivalNote}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-white border border-[#E8E6DF]">
                      <span className="text-[10px] text-[#7A7A7A] block font-bold">Nakshatra</span>
                      <strong className="text-[#3D3D3D]">{panchang.nakshatra}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-[#E8E6DF]">
                      <span className="text-[10px] text-[#7A7A7A] block font-bold">Yoga</span>
                      <strong className="text-[#3D3D3D]">{panchang.yoga}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-[#E8E6DF]">
                      <span className="text-[10px] text-[#B8856B] block font-bold">Rahu Kaal</span>
                      <strong className="text-[#3D3D3D]">{panchang.rahuKaal}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-[#E8E6DF]">
                      <span className="text-[10px] text-[#5C6B5A] block font-bold">Abhijit Muhurat</span>
                      <strong className="text-[#3D3D3D]">{panchang.abhijitMuhurat}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Morning Email Text Preview */}
              <div className="bg-white rounded-3xl border border-[#E8E6DF] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#3D3D3D] flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#5C6B5A]" />
                    <span>Daily 7:00 AM Email Newsletter Format</span>
                  </h3>
                  <span className="text-[11px] text-[#7A7A7A]">Devotee Email Format</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#EDF3EC] border border-[#8B9D83]/30 text-xs font-mono text-[#3D3D3D] space-y-1.5 text-[11px]">
                  <p className="font-bold text-[#5C6B5A]">🕉️ ॐ सुप्रभातम्! आज का पञ्चाङ्ग व मुहूर्त:</p>
                  <p>📅 <strong>दिनांक:</strong> {new Date().toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p>✨ <strong>तिथि:</strong> {panchang.tithi}</p>
                  <p>⭐ <strong>नक्षत्र:</strong> {panchang.nakshatra}</p>
                  <p>☀️ <strong>सूर्योदय:</strong> {panchang.sunrise} | <strong>सूर्यास्त:</strong> {panchang.sunset}</p>
                  <p>⏳ <strong>अभिजित मुहूर्त:</strong> {panchang.abhijitMuhurat}</p>
                  <p>⚠️ <strong>राहुकाल (वर्ज्य):</strong> {panchang.rahuKaal}</p>
                  {panchang.festivalNote && <p>🌸 <strong>विशेष पर्व/व्रत:</strong> {panchang.festivalNote}</p>}
                  <p className="text-[10px] text-[#7A7A7A] pt-2 border-t border-[#8B9D83]/20">
                    — ज्योतिर्वाणी वैदिक अनुसन्धान केन्द्र, काशी विश्वनाथ (हेल्पलाइन: 9560169988)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER OF STAFF PORTAL */}
      <footer className="border-t border-[#E8E6DF] bg-white/60 py-4 px-6 text-center text-xs text-[#7A7A7A] mt-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
          <span>JyotishVani Kendra Administration &amp; Astrological Staff Console</span>
          <button
            onClick={onNavigateHome}
            className="text-[#5C6B5A] hover:underline cursor-pointer font-semibold"
          >
            ← Back to Public Devotee Website
          </button>
        </div>
      </footer>

      {/* --- SUB-MODAL 1: EDIT SUBSCRIBER --- */}
      {editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <form
            onSubmit={handleSaveSubscriber}
            className="bg-white rounded-[32px] border border-[#E8E6DF] p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E8E6DF] pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-[#3D3D3D]">
                  Edit Member Account
                </h3>
                <span className="text-[11px] text-[#7A7A7A] font-mono">
                  Originally: +91 {editingSubOriginalMobile || editingSub.mobile}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingSub(null);
                  setEditingSubOriginalMobile(null);
                }}
                className="p-1 rounded-full text-[#7A7A7A] hover:text-[#3D3D3D] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#4A4A4A]">
                  Primary Mobile Number (+91)
                </label>
                <span className="text-[10px] text-[#5C6B5A] font-semibold flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  Devotee Contact Number
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
                  value={editingSub.mobile || ""}
                  onChange={(e) =>
                    setEditingSub({
                      ...editingSub,
                      mobile: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="9876543210"
                  className="w-full pl-12 pr-3.5 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-mono font-bold text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83]"
                />
              </div>
              {editingSubOriginalMobile && editingSub.mobile.replace(/\D/g, "") !== editingSubOriginalMobile.replace(/\D/g, "") && (
                <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl mt-1.5 border border-amber-200 leading-relaxed">
                  ⚠️ Changing mobile from <strong className="font-mono">+91 {editingSubOriginalMobile}</strong> to <strong className="font-mono text-emerald-800">+91 {editingSub.mobile}</strong>. All subscription history and schedules will be updated automatically.
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A4A4A] mb-1">Full Name</label>
              <input
                type="text"
                value={editingSub.name || ""}
                onChange={(e) => setEditingSub({ ...editingSub, name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs text-[#3D3D3D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                Email Address (for Daily Horoscope Dispatch)
              </label>
              <input
                type="email"
                value={editingSub.email || ""}
                onChange={(e) => setEditingSub({ ...editingSub, email: e.target.value })}
                placeholder="devotee@example.com"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-mono text-[#3D3D3D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A4A4A] mb-1">Zodiac Sign</label>
              <input
                type="text"
                value={editingSub.zodiacSign || ""}
                onChange={(e) => setEditingSub({ ...editingSub, zodiacSign: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold text-[#3D3D3D]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1">Status</label>
                <select
                  value={editingSub.status}
                  onChange={(e) => setEditingSub({ ...editingSub, status: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="expired">Expired</option>
                  <option value="stopped">Stopped by Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1">Channel</label>
                <select
                  value={editingSub.deliveryChannel}
                  onChange={(e) => setEditingSub({ ...editingSub, deliveryChannel: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold cursor-pointer"
                >
                  <option value="email">Email</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                Valid Until Date (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={editingSub.validUntil ? editingSub.validUntil.split("T")[0] : ""}
                onChange={(e) =>
                  setEditingSub({ ...editingSub, validUntil: new Date(e.target.value).toISOString() })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold text-[#3D3D3D]"
              />
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#3D3D3D] block">Auto-Renew Post Expiry</span>
                <span className="text-[10px] text-[#7A7A7A]">Automatically extend subscription upon expiry</span>
              </div>
              <input
                type="checkbox"
                checked={editingSub.autoRenew !== false}
                onChange={(e) => setEditingSub({ ...editingSub, autoRenew: e.target.checked })}
                className="w-4 h-4 accent-[#8B9D83] cursor-pointer"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setEditingSub(null)}
                className="px-4 py-2 rounded-xl border border-[#E8E6DF] text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#5C6B5A] text-white text-xs font-bold cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- QUICK EDIT MOBILE MODAL --- */}
      {quickEditMobileSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <form
            onSubmit={handleSaveQuickMobile}
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
                    {quickEditMobileSub.name} ({quickEditMobileSub.zodiacSign || "Devotee"})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickEditMobileSub(null)}
                className="p-1 rounded-full text-[#7A7A7A] hover:text-[#3D3D3D] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#FAF9F6] border border-[#E8E6DF] rounded-2xl space-y-1 text-xs">
              <span className="text-[#7A7A7A] block font-medium">Currently Registered Number:</span>
              <span className="font-mono font-bold text-[#3D3D3D] text-sm block">
                +91 {quickEditMobileSub.originalMobile}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#4A4A4A]">
                  New 10-Digit Mobile Number
                </label>
                <span className="text-[10px] font-mono text-[#7A7A7A]">
                  {quickEditMobileSub.mobile.replace(/\D/g, "").length}/10 digits
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
                  value={quickEditMobileSub.mobile}
                  onChange={(e) =>
                    setQuickEditMobileSub({
                      ...quickEditMobileSub,
                      mobile: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="9876543210"
                  className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-sm font-mono font-bold text-[#3D3D3D] focus:outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366]"
                />
              </div>
            </div>

            {quickEditMobileSub.mobile.replace(/\D/g, "") !== quickEditMobileSub.originalMobile.replace(/\D/g, "") &&
              quickEditMobileSub.mobile.replace(/\D/g, "").length === 10 && (
                <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 leading-snug">
                  ✓ Ready to migrate account from <strong>+91 {quickEditMobileSub.originalMobile}</strong> to <strong>+91 {quickEditMobileSub.mobile}</strong>. All daily horoscopes and history will continue seamlessly.
                </div>
              )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E6DF]">
              <button
                type="button"
                onClick={() => setQuickEditMobileSub(null)}
                className="px-4 py-2 rounded-xl border border-[#E8E6DF] text-xs font-bold cursor-pointer hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  savingQuickMobile ||
                  quickEditMobileSub.mobile.replace(/\D/g, "").length !== 10
                }
                className="px-5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1E7E34] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {savingQuickMobile ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Update Mobile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- SUB-MODAL 2: ADD NEW SUBSCRIBER --- */}
      {isNewSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <form
            onSubmit={handleAddSubscriber}
            className="bg-white rounded-[32px] border border-[#E8E6DF] p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E8E6DF] pb-3">
              <h3 className="font-serif font-bold text-base text-[#3D3D3D]">
                Add Devotee Manually
              </h3>
              <button
                type="button"
                onClick={() => setIsNewSubModal(false)}
                className="p-1 rounded-full text-[#7A7A7A] hover:text-[#3D3D3D] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A4A4A] mb-1">Mobile Number (10 digits)</label>
              <input
                type="tel"
                maxLength={10}
                required
                value={newSubForm.mobile}
                onChange={(e) => setNewSubForm({ ...newSubForm, mobile: e.target.value.replace(/\D/g, "") })}
                placeholder="9876543210"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold text-[#3D3D3D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A4A4A] mb-1">Devotee Name</label>
              <input
                type="text"
                value={newSubForm.name}
                onChange={(e) => setNewSubForm({ ...newSubForm, name: e.target.value })}
                placeholder="Seeker Name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs text-[#3D3D3D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                Email Address (for Daily Horoscope Dispatch)
              </label>
              <input
                type="email"
                value={newSubForm.email}
                onChange={(e) => setNewSubForm({ ...newSubForm, email: e.target.value })}
                placeholder="devotee@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-mono text-[#3D3D3D]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1">Rashi / Sign</label>
                <select
                  value={newSubForm.zodiacSign}
                  onChange={(e) => setNewSubForm({ ...newSubForm, zodiacSign: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold cursor-pointer"
                >
                  <option value="Aries (Mesha)">Aries (Mesha)</option>
                  <option value="Taurus (Vrishabha)">Taurus (Vrishabha)</option>
                  <option value="Gemini (Mithuna)">Gemini (Mithuna)</option>
                  <option value="Cancer (Karka)">Cancer (Karka)</option>
                  <option value="Leo (Simha)">Leo (Simha)</option>
                  <option value="Virgo (Kanya)">Virgo (Kanya)</option>
                  <option value="Libra (Tula)">Libra (Tula)</option>
                  <option value="Scorpio (Vrischika)">Scorpio (Vrischika)</option>
                  <option value="Sagittarius (Dhanu)">Sagittarius (Dhanu)</option>
                  <option value="Capricorn (Makara)">Capricorn (Makara)</option>
                  <option value="Aquarius (Kumbha)">Aquarius (Kumbha)</option>
                  <option value="Pisces (Meena)">Pisces (Meena)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1">Plan</label>
                <select
                  value={newSubForm.planId}
                  onChange={(e) => setNewSubForm({ ...newSubForm, planId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold cursor-pointer"
                >
                  <option value="monthly">Monthly (₹150)</option>
                  <option value="three_months">3 Months (₹400)</option>
                  <option value="six_months">6 Months (₹500)</option>
                  <option value="yearly">1 Year (₹1000)</option>
                  <option value="trial">3-Day Free Trial</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1">Channel</label>
                <select
                  value={newSubForm.deliveryChannel}
                  onChange={(e) => setNewSubForm({ ...newSubForm, deliveryChannel: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold cursor-pointer"
                >
                  <option value="email">Email</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1">Validity (Days)</label>
                <input
                  type="number"
                  value={newSubForm.validityDays}
                  onChange={(e) => setNewSubForm({ ...newSubForm, validityDays: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold text-[#3D3D3D]"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#3D3D3D] block">Auto-Renew Post Expiry</span>
                <span className="text-[10px] text-[#7A7A7A]">Pre-select auto-renew for this devotee</span>
              </div>
              <input
                type="checkbox"
                checked={newSubForm.autoRenew}
                onChange={(e) => setNewSubForm({ ...newSubForm, autoRenew: e.target.checked })}
                className="w-4 h-4 accent-[#8B9D83] cursor-pointer"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsNewSubModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E8E6DF] text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#5C6B5A] text-white text-xs font-bold cursor-pointer"
              >
                Register Devotee
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- SUB-MODAL 3: EMAIL HOROSCOPE DISPATCH SIMULATOR --- */}
      {broadcastModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-[32px] border border-[#E8E6DF] p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E8E6DF] pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#8B9D83]" />
                <h3 className="font-serif font-bold text-base text-[#3D3D3D]">
                  Daily Horoscope Email Dispatcher
                </h3>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F0EDDF] rounded-xl text-xs font-bold text-[#5C6B5A]">
                <Mail className="w-3.5 h-3.5" />
                <span>Email Active</span>
              </div>

              <button
                type="button"
                onClick={() => setBroadcastModalSub(null)}
                className="p-1 rounded-full text-[#7A7A7A] hover:text-[#3D3D3D] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs space-y-2 shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div><span className="text-[#7A7A7A]">Devotee:</span> <strong>{broadcastModalSub.name}</strong></div>
                <div><span className="text-[#7A7A7A]">Mobile:</span> <strong>+91 {broadcastModalSub.mobile}</strong></div>
                <div><span className="text-[#7A7A7A]">Rashi:</span> <strong className="text-[#5C6B5A]">{broadcastModalSub.zodiacSign}</strong></div>
              </div>
              <div className="pt-2 border-t border-[#E8E6DF]/60 flex items-center gap-2">
                <label className="text-[11px] font-bold text-[#4A4A4A] shrink-0">Dispatch Email:</label>
                <input
                  type="email"
                  value={broadcastTargetEmail}
                  onChange={(e) => setBroadcastTargetEmail(e.target.value)}
                  placeholder="devotee@example.com"
                  className="flex-1 px-2.5 py-1 rounded-lg bg-white border border-[#E8E6DF] text-xs font-mono text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83]"
                />
              </div>
            </div>

            {/* Email Message Preview */}
            <div className="flex-1 overflow-y-auto space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#5C6B5A] uppercase tracking-wider flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Vedic Email Preview</span>
                </span>
                {broadcastData?.emailText && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(broadcastData.emailText || "");
                      setBroadcastCopied(true);
                      setTimeout(() => setBroadcastCopied(false), 2000);
                    }}
                    className="text-[11px] font-bold text-[#5C6B5A] hover:text-[#3D3D3D] flex items-center gap-1 cursor-pointer"
                  >
                    {broadcastCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{broadcastCopied ? "Copied!" : "Copy Text"}</span>
                  </button>
                )}
              </div>

              {loadingBroadcastData ? (
                <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] text-center text-xs text-[#7A7A7A] flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#8B9D83]" />
                  <span>Generating Vedic Rashifal with today's Panchang...</span>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-[#EDF3EC] border border-[#8B9D83]/30 text-xs text-[#3D3D3D] font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto shadow-inner select-text">
                  <div className="font-bold text-[#5C6B5A] pb-1.5 mb-1.5 border-b border-[#8B9D83]/20">
                    Subject: {broadcastData?.subject || `🕉️ Dainik Vedic Rashifal • ${broadcastModalSub.zodiacSign}`}
                  </div>
                  {broadcastData?.emailText || `Pranam ${broadcastModalSub.name} Ji,\n\nHere is your daily Vedic Rashifal for ${broadcastModalSub.zodiacSign}.\nToday's Shubh Muhurat: ${panchang.shubhMuhurat || panchang.abhijitMuhurat}\nRahu Kaal (Avoid): ${panchang.rahuKaal}\n\nSattvic Upaya: Perform Surya Namaskar and chant Gayatri Mantra.\n\n— JyotishVani Kendra`}
                </div>
              )}
            </div>

            {broadcastSuccess && (
              <div className="p-2.5 rounded-2xl bg-[#EDF3EC] text-[#5C6B5A] text-xs font-bold text-center border border-[#8B9D83]/30 shrink-0">
                {broadcastSuccess}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E8E6DF] shrink-0">
              <button
                type="button"
                onClick={() => setBroadcastModalSub(null)}
                className="px-3.5 py-2 rounded-xl border border-[#E8E6DF] text-xs font-bold text-[#7A7A7A] hover:text-[#3D3D3D] cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleSendBroadcastMessage}
                disabled={broadcastSending || !broadcastTargetEmail.trim()}
                className="px-5 py-2 rounded-xl bg-[#8B9D83] hover:bg-[#7A8C73] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-all"
                title="Dispatches sample daily horoscope email to devotee"
              >
                {broadcastSending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{broadcastSending ? "Transmitting..." : "Send Test Horoscope Email"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-MODAL 4: ADMIN STOP SUBSCRIPTION CONFIRMATION --- */}
      {stopModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <form
            onSubmit={handleConfirmStopSubscriber}
            className="bg-white rounded-[32px] border border-[#E8E6DF] p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700">
                  <PowerOff className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#3D3D3D]">
                    Stop Devotee Subscription
                  </h3>
                  <p className="text-[10px] text-rose-600 font-semibold">Immediate Administrative Action</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStopModalSub(null)}
                className="p-1 rounded-full text-[#7A7A7A] hover:text-[#3D3D3D] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs space-y-1">
              <div><strong>Devotee:</strong> {stopModalSub.name || "Seeker"}</div>
              <div><strong>Mobile:</strong> +91 {stopModalSub.mobile}</div>
              <div><strong>Plan:</strong> {stopModalSub.planName || stopModalSub.planId}</div>
              <div><strong>Current Status:</strong> <span className="font-semibold uppercase text-[#5C6B5A]">{stopModalSub.status}</span></div>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Ban className="w-3.5 h-3.5 shrink-0" />
                What happens when you stop this subscription:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-rose-700">
                <li>Daily morning 07:00 AM Vedic horoscope broadcasts will immediately halt.</li>
                <li>Auto-renewal post expiration is permanently turned off.</li>
                <li>Devotee status will be marked as <strong>Stopped</strong> in the directory.</li>
                <li>You can resume or reactivate this subscription at any time with one click.</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                Reason for Stopping (Optional)
              </label>
              <select
                value={stopReason}
                onChange={(e) => setStopReason(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-semibold cursor-pointer mb-2"
              >
                <option value="Devotee requested stop">Devotee requested to stop service</option>
                <option value="Payment refund / dispute">Payment refund or chargeback</option>
                <option value="Non-responsive devotee / wrong number">Non-responsive devotee / invalid phone</option>
                <option value="Duplicate devotee account">Duplicate devotee account</option>
                <option value="Administrative hold by Kendra">Administrative hold by Kendra</option>
                <option value="Custom">Other / Custom Reason</option>
              </select>
              {stopReason === "Custom" && (
                <input
                  type="text"
                  placeholder="Specify custom reason..."
                  onChange={(e) => setStopReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs text-[#3D3D3D]"
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStopModalSub(null)}
                className="px-4 py-2 rounded-xl border border-[#E8E6DF] text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <PowerOff className="w-3.5 h-3.5" />
                <span>{loading ? "Stopping..." : "Stop Subscription Now"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- SUB-MODAL 5: ADMIN EDIT UPI PAYMENT STATUS & DETAILS --- */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-sans">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdatePaymentStatus(
                editingPayment.id,
                editPaymentStatus,
                editPaymentNotes,
                editPaymentUtr,
                editPaymentAmount
              );
            }}
            className="bg-white rounded-[32px] border border-[#E8E6DF] p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E8E6DF] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-[#5C6B5A] text-white flex items-center justify-center shadow-xs">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#3D3D3D]">
                    Edit UPI Payment Status &amp; Ledger
                  </h3>
                  <p className="text-[11px] text-[#7A7A7A]">
                    Transaction ID: <span className="font-mono font-bold text-[#3D3D3D]">{editingPayment.id}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPayment(null)}
                className="p-1 rounded-full text-[#7A7A7A] hover:text-[#3D3D3D] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Devotee & Transaction Info Card */}
            <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[#7A7A7A] block text-[10px] uppercase font-bold">Devotee Member</span>
                  <strong className="text-[#3D3D3D]">{editingPayment.userName}</strong>
                  <span className="text-[#7A7A7A] block font-mono text-[11px]">+91 {editingPayment.mobile}</span>
                </div>
                <div>
                  <span className="text-[#7A7A7A] block text-[10px] uppercase font-bold">Plan &amp; Amount</span>
                  <strong className="text-[#5C6B5A] text-sm">₹{editPaymentAmount || editingPayment.amount}</strong>
                  <span className="text-[#7A7A7A] block text-[11px]">{editingPayment.planName}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-[#E8E6DF]/60 flex items-center justify-between text-[11px] text-[#7A7A7A]">
                <span>Method: <strong>{editingPayment.paymentMode === "upi_qr" ? "QR Code Scan" : "1-Tap UPI App"}</strong></span>
                <span>Date: {new Date(editingPayment.timestamp).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Payment Status Dropdown */}
            <div>
              <label className="block text-xs font-bold text-[#3D3D3D] mb-1.5 uppercase tracking-wider">
                Payment Verification Status *
              </label>
              <select
                value={editPaymentStatus}
                onChange={(e) =>
                  setEditPaymentStatus(
                    e.target.value as "verified" | "pending" | "rejected" | "failed"
                  )
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E6DF] text-xs font-bold focus:outline-none focus:border-[#8B9D83] cursor-pointer"
              >
                <option value="verified">🟢 Verified (Active - Activates Horoscope)</option>
                <option value="pending">🟡 Pending (Under Review)</option>
                <option value="rejected">🔴 Rejected (Invalid / Unpaid)</option>
                <option value="failed">⚪ Failed (Transaction Incomplete)</option>
              </select>
              <p className="text-[10px] text-[#7A7A7A] mt-1">
                Setting status to <strong>Verified</strong> automatically activates devotee subscription in the database &amp; Firestore.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* UTR Number */}
              <div>
                <label className="block text-xs font-bold text-[#3D3D3D] mb-1.5 uppercase tracking-wider">
                  UPI Reference / UTR Number
                </label>
                <input
                  type="text"
                  value={editPaymentUtr}
                  onChange={(e) => setEditPaymentUtr(e.target.value)}
                  placeholder="e.g. 428765432109"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E6DF] text-xs font-mono font-semibold text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83]"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-[#3D3D3D] mb-1.5 uppercase tracking-wider">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={editPaymentAmount}
                  onChange={(e) => setEditPaymentAmount(Number(e.target.value))}
                  min="0"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E6DF] text-xs font-bold text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83]"
                />
              </div>
            </div>

            {/* Admin Notes */}
            <div>
              <label className="block text-xs font-bold text-[#3D3D3D] mb-1.5 uppercase tracking-wider">
                Admin Audit Notes / Remarks
              </label>
              <textarea
                rows={2}
                value={editPaymentNotes}
                onChange={(e) => setEditPaymentNotes(e.target.value)}
                placeholder="e.g. Verified with Kendra HDFC bank statement / devotee confirmed UTR on WhatsApp..."
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E6DF] text-xs text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83] placeholder-[#AFAFAF]"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E6DF]">
              <button
                type="button"
                onClick={() => setEditingPayment(null)}
                className="px-4 py-2.5 rounded-xl border border-[#E8E6DF] text-xs font-bold text-[#7A7A7A] hover:bg-[#FAF9F6] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingPaymentId === editingPayment.id}
                className="px-5 py-2.5 rounded-xl bg-[#5C6B5A] hover:bg-[#4E5B4C] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {updatingPaymentId === editingPayment.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Payment Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
