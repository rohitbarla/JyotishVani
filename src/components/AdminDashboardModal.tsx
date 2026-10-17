import React, { useState, useEffect } from "react";
import {
  X,
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
  Lock,
  Unlock,
  QrCode,
  IndianRupee,
  Clock,
  Sparkles,
  LogOut,
  Mail,
  Phone,
  MapPin,
  User,
  FileText,
  Check,
  Smartphone,
  Send,
  RotateCcw,
  Compass,
  Sun,
  Moon,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import { DynamicSettings, StoredPanchangData, UpiPaymentRecord } from "../types";

const ZODIAC_OPTIONS = [
  { id: "Aries", en: "Aries", sa: "Mesha (मेष)", symbol: "♈", dates: "Mar 21 - Apr 19" },
  { id: "Taurus", en: "Taurus", sa: "Vrishabha (वृषभ)", symbol: "♉", dates: "Apr 20 - May 20" },
  { id: "Gemini", en: "Gemini", sa: "Mithuna (मिथुन)", symbol: "♊", dates: "May 21 - Jun 20" },
  { id: "Cancer", en: "Cancer", sa: "Karka (कर्क)", symbol: "♋", dates: "Jun 21 - Jul 22" },
  { id: "Leo", en: "Leo", sa: "Simha (सिंह)", symbol: "♌", dates: "Jul 23 - Aug 22" },
  { id: "Virgo", en: "Virgo", sa: "Kanya (कन्या)", symbol: "♍", dates: "Aug 23 - Sep 22" },
  { id: "Libra", en: "Libra", sa: "Tula (तुला)", symbol: "♎", dates: "Sep 23 - Oct 22" },
  { id: "Scorpio", en: "Scorpio", sa: "Vrishchika (वृश्चिक)", symbol: "♏", dates: "Oct 23 - Nov 21" },
  { id: "Sagittarius", en: "Sagittarius", sa: "Dhanu (धनु)", symbol: "♐", dates: "Nov 22 - Dec 21" },
  { id: "Capricorn", en: "Capricorn", sa: "Makara (मकर)", symbol: "♑", dates: "Dec 22 - Jan 19" },
  { id: "Aquarius", en: "Aquarius", sa: "Kumbha (कुम्भ)", symbol: "♒", dates: "Jan 20 - Feb 18" },
  { id: "Pisces", en: "Pisces", sa: "Meena (मीन)", symbol: "♓", dates: "Feb 19 - Mar 20" },
];

const PLAN_PRESETS = [
  { id: "trial", name: "3-Day Free Trial", price: 0, days: 3 },
  { id: "monthly", name: "1 Month Monthly Devotee", price: 150, days: 30 },
  { id: "three_months", name: "3 Months (Quarterly)", price: 400, days: 90 },
  { id: "six_months", name: "6 Months (Half-Yearly)", price: 500, days: 180 },
  { id: "yearly", name: "1 Year (Annual VIP Devotee)", price: 1000, days: 365 },
];

const DELIVERY_TIMES = [
  "05:30 AM (Brahma Muhurat)",
  "06:00 AM (Sunrise)",
  "06:30 AM",
  "07:00 AM (Standard)",
  "07:30 AM",
  "08:00 AM",
  "08:30 AM",
  "09:00 AM",
];

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
  onSettingsUpdated?: (newSettings: DynamicSettings) => void;
  onPanchangUpdated?: (newPanchang: StoredPanchangData) => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  onLogout,
  onSettingsUpdated,
  onPanchangUpdated,
}) => {
  // Tabs: settings, subscribers, payments, leads
  const [activeTab, setActiveTab] = useState<"settings" | "subscribers" | "payments" | "leads">("settings");

  // Authentication for Admin
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Default open for testing, can be toggled
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");

  // Data states
  const [loading, setLoading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
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
    hinduDate: "Ekadashi (Shukla Paksha), Vikram Samvat 2083",
    tithi: "Ekadashi (Shukla Paksha)",
    paksha: "Shukla Paksha",
    nakshatra: "Pushya (Auspicious)",
    yoga: "Saubhagya Yoga",
    karana: "Vanija",
    samvat: "Vikram Samvat 2083",
    sunrise: "06:02 AM",
    sunset: "06:36 PM",
    rahuKaal: "04:30 PM - 06:00 PM (Inauspicious)",
    abhijitMuhurat: "11:54 AM - 12:44 PM (Most Auspicious)",
    shubhMuhurat: "08:15 AM - 09:45 AM (Amrit Vela)",
    moonSign: "Karka (Cancer)",
  });

  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [payments, setPayments] = useState<UpiPaymentRecord[]>([]);
  const [callbacks, setCallbacks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Dedicated UPI Payment Edit State
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "verified" | "pending" | "rejected" | "failed">("all");
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<UpiPaymentRecord | null>(null);
  const [editPaymentStatus, setEditPaymentStatus] = useState<"verified" | "pending" | "rejected" | "failed">("verified");
  const [editPaymentUtr, setEditPaymentUtr] = useState("");
  const [editPaymentNotes, setEditPaymentNotes] = useState("");
  const [editPaymentAmount, setEditPaymentAmount] = useState<number>(0);

  // Search & Filters
  const [subSearch, setSubSearch] = useState("");
  const [subFilter, setSubFilter] = useState<"all" | "active" | "trial">("all");

  // Edit / Add Subscriber Modal State
  const [editingSub, setEditingSub] = useState<any | null>(null);
  const [editingSubOriginalMobile, setEditingSubOriginalMobile] = useState<string | null>(null);
  const [editModalTab, setEditModalTab] = useState<"profile" | "kundali" | "plan" | "delivery" | "verification">("profile");
  
  // Dedicated Quick Edit Mobile Number Modal State
  const [quickEditMobileSub, setQuickEditMobileSub] = useState<{
    originalMobile: string;
    mobile: string;
    name: string;
    zodiacSign?: string;
    email?: string;
  } | null>(null);
  const [savingQuickMobile, setSavingQuickMobile] = useState(false);

  const [isNewSubModal, setIsNewSubModal] = useState(false);
  const [newSubForm, setNewSubForm] = useState({
    mobile: "",
    name: "",
    email: "",
    zodiacSign: "Aries (Mesha)",
    planId: "monthly",
    deliveryChannel: "email",
    deliveryTime: "07:00 AM",
    validityDays: 30,
  });

  const openEditModal = (sub: any) => {
    setEditingSub({
      ...sub,
      mobile: sub.mobile || "",
      name: sub.name || "",
      email: sub.email || "",
      zodiacSign: sub.zodiacSign || "Aries (Mesha)",
      planId: sub.planId || "monthly",
      planName: sub.planName || (sub.planId === "trial" ? "3-Day Free Trial" : "1 Month Monthly Devotee"),
      price: sub.price !== undefined ? sub.price : (sub.planId === "trial" ? 0 : 150),
      status: sub.status || "active",
      deliveryChannel: sub.deliveryChannel || "email",
      deliveryTime: sub.deliveryTime || "07:00 AM",
      validUntil: sub.validUntil || new Date(Date.now() + 30 * 86400000).toISOString(),
      autoRenew: sub.autoRenew !== false,
      phoneVerified: sub.phoneVerified === true,
      phoneVerifiedAt: sub.phoneVerifiedAt || (sub.phoneVerified ? new Date().toISOString() : ""),
      verificationProvider: sub.verificationProvider || "Direct / Admin Verified",
      emailVerified: sub.emailVerified === true,
      dob: sub.dob || "",
      tob: sub.tob || "",
      pob: sub.pob || "",
      gotra: sub.gotra || "",
      nakshatra: sub.nakshatra || "",
      adminNotes: sub.adminNotes || "",
    });
    setEditingSubOriginalMobile(sub.mobile);
    setEditModalTab("profile");
  };

  const extendValidity = (days: number) => {
    if (!editingSub) return;
    const currentExpiry = editingSub.validUntil ? new Date(editingSub.validUntil).getTime() : Date.now();
    const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
    const nextDate = new Date(baseTime + days * 86400000).toISOString();
    setEditingSub({
      ...editingSub,
      validUntil: nextDate,
      status: editingSub.status === "expired" ? (editingSub.planId === "trial" ? "trial" : "active") : editingSub.status,
    });
  };

  const applyPlanPreset = (preset: (typeof PLAN_PRESETS)[0]) => {
    if (!editingSub) return;
    const targetExpiry = new Date(Date.now() + preset.days * 86400000).toISOString();
    setEditingSub({
      ...editingSub,
      planId: preset.id,
      planName: preset.name,
      price: preset.price,
      status: preset.id === "trial" ? "trial" : "active",
      validUntil:
        editingSub.validUntil && new Date(editingSub.validUntil).getTime() > Date.now()
          ? editingSub.validUntil
          : targetExpiry,
    });
  };

  const getAdminHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    try {
      const token = sessionStorage.getItem("jyotishvani_admin_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch {
      // ignore
    }
    return headers;
  };

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [settingsRes, panchangRes, subsRes, paymentsRes, cbRes, statsRes] = await Promise.all([
        fetch("/api/settings").then((r) => r.json()).catch(() => null),
        fetch("/api/panchang").then((r) => r.json()).catch(() => null),
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

  useEffect(() => {
    if (isOpen) {
      fetchAllData();
    }
  }, [isOpen]);

  const showNotification = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(""), 4000);
  };

  // Save Settings
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
        showNotification("Dynamic settings updated and saved to database!");
        if (onSettingsUpdated) onSettingsUpdated(data.settings);
      }
    } catch (err) {
      console.error("Failed to update settings:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update Subscriber
  const handleSaveSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;

    const cleanMobile = String(editingSub.mobile || "").replace(/\D/g, "");
    if (!cleanMobile || cleanMobile.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    try {
      const originalMobile = editingSubOriginalMobile
        ? editingSubOriginalMobile.replace(/\D/g, "")
        : cleanMobile;

      const payload = {
        ...editingSub,
        mobile: cleanMobile,
        newMobile: cleanMobile !== originalMobile ? cleanMobile : undefined,
        updatedAt: new Date().toISOString(),
      };

      const res = await fetch(`/api/db/subscribers/${originalMobile}`, {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(`Subscriber ${editingSub.name || "+91 " + cleanMobile} updated successfully!`);
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

  // Quick Edit Subscriber Mobile Number
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

  // Update UPI Payment Status & Details (persisted to database)
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
          `✅ UPI Payment ${paymentId} status updated to "${newStatus.toUpperCase()}" and saved in database.`
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
      alert("Network error: Could not connect to update payment status.");
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  // Delete Subscriber
  const handleDeleteSubscriber = async (mobile: string) => {
    if (!confirm(`Are you sure you want to delete subscriber +91 ${mobile}?`)) return;
    setLoading(true);
    try {
      await fetch(`/api/db/subscribers/${mobile}`, { method: "DELETE", headers: getAdminHeaders() });
      showNotification(`Subscriber +91 ${mobile} removed.`);
      fetchAllData();
    } catch (err) {
      console.error("Error deleting subscriber:", err);
    } finally {
      setLoading(false);
    }
  };

  // Add New Subscriber manually
  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = newSubForm.mobile.replace(/\D/g, "");
    if (!cleanMobile || cleanMobile.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    try {
      const days = Number(newSubForm.validityDays) || 30;
      const validUntil = new Date(Date.now() + days * 86400000).toISOString();
      const planPreset = PLAN_PRESETS.find((p) => p.id === newSubForm.planId);
      const res = await fetch("/api/db/subscribers", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          mobile: cleanMobile,
          name: newSubForm.name || "Devotee",
          email: newSubForm.email || undefined,
          zodiacSign: newSubForm.zodiacSign,
          planId: newSubForm.planId,
          planName: planPreset?.name || newSubForm.planId,
          price: planPreset?.price || 0,
          deliveryChannel: newSubForm.deliveryChannel,
          deliveryTime: newSubForm.deliveryTime,
          status: newSubForm.planId === "trial" ? "trial" : "active",
          validUntil,
          phoneVerified: true,
          phoneVerifiedAt: new Date().toISOString(),
          verificationProvider: "Admin Manual Registration",
          registeredAt: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(`New subscriber +91 ${cleanMobile} registered!`);
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
        });
        fetchAllData();
      } else {
        alert(data.error || "Failed to add subscriber.");
      }
    } catch (err) {
      console.error("Error adding subscriber:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update Callback status
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

  if (!isOpen) return null;

  // Filtered subscribers
  const filteredSubscribers = subscribers.filter((s) => {
    const q = subSearch.toLowerCase();
    const matchesSearch =
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.mobile && s.mobile.includes(q)) ||
      (s.zodiacSign && s.zodiacSign.toLowerCase().includes(q)) ||
      (s.planName && s.planName.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (subFilter === "active") return s.status === "active";
    if (subFilter === "trial") return s.status === "trial" || s.planId === "trial";
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-sans animate-fadeIn">
      <div
        className="bg-white rounded-[32px] border border-[#E8E6DF] shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp text-[#3D3D3D]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#FAF9F6] border-b border-[#E8E6DF] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8B9D83] text-white flex items-center justify-center shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#3D3D3D]">
                  JyotishVani Admin Management Portal
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EDF3EC] text-[#5C6B5A] text-[10px] font-bold border border-[#8B9D83]/30">
                  Live Database Connected
                </span>
              </div>
              <p className="text-xs text-[#7A7A7A]">
                Edit dynamic content, manage subscribers, UPI payments &amp; configure subscription plans.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0EDDF] border border-[#E8E6DF] text-xs font-semibold text-[#5C6B5A]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8B9D83]" />
              <span>Admin: <strong>+91 9560169988</strong></span>
            </div>

            <button
              onClick={fetchAllData}
              disabled={loading}
              className="p-2 rounded-xl border border-[#E8E6DF] hover:bg-[#F0EDDF] text-[#7A7A7A] hover:text-[#3D3D3D] transition-colors cursor-pointer"
              title="Reload all records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#8B9D83]" : ""}`} />
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-xl border border-[#F5C2B8] bg-[#FFF2F0] hover:bg-[#FEE4E2] text-[#9E2A2B] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                title="Log out of Admin Console"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-[#E8E6DF] hover:bg-[#F0EDDF] text-[#7A7A7A] hover:text-[#3D3D3D] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {saveSuccessMsg && (
          <div className="bg-[#EDF3EC] text-[#5C6B5A] px-6 py-2 text-xs font-semibold flex items-center justify-between border-b border-[#8B9D83]/30 animate-fadeIn">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#8B9D83]" />
              <span>{saveSuccessMsg}</span>
            </span>
            <button onClick={() => setSaveSuccessMsg("")} className="text-[#5C6B5A] hover:text-[#3D3D3D]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-4 bg-white border-b border-[#E8E6DF] text-xs">
          <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF]">
            <span className="text-[10px] uppercase font-bold text-[#7A7A7A] block">Subscribers</span>
            <span className="text-lg font-serif font-bold text-[#3D3D3D]">
              {stats?.totalSubscribers ?? subscribers.length}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#EDF3EC] border border-[#8B9D83]/30">
            <span className="text-[10px] uppercase font-bold text-[#5C6B5A] block">Active Paid</span>
            <span className="text-lg font-serif font-bold text-[#5C6B5A]">
              {stats?.paidSubscribers ?? subscribers.filter((s) => s.status === "active").length}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FFF9F2] border border-[#CB997E]/30">
            <span className="text-[10px] uppercase font-bold text-[#CB997E] block">UPI Revenue</span>
            <span className="text-lg font-serif font-bold text-[#CB997E]">
              ₹{stats?.totalRevenue ?? payments.reduce((sum, p) => sum + (p.amount || 0), 0)}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF]">
            <span className="text-[10px] uppercase font-bold text-[#7A7A7A] block">UPI Transactions</span>
            <span className="text-lg font-serif font-bold text-[#3D3D3D]">
              {stats?.totalPayments ?? payments.length}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF]">
            <span className="text-[10px] uppercase font-bold text-[#7A7A7A] block">Helpline 9560169988</span>
            <span className="text-lg font-serif font-bold text-[#8B9D83]">
              {stats?.pendingCallbacks ?? callbacks.length} Leads
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 bg-[#FAF9F6] border-b border-[#E8E6DF] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-[#E8E6DF] overflow-x-auto">
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "settings"
                  ? "bg-[#8B9D83] text-white shadow-xs"
                  : "text-[#7A7A7A] hover:text-[#3D3D3D]"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Dynamic Settings</span>
            </button>

            <button
              onClick={() => setActiveTab("subscribers")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "subscribers"
                  ? "bg-[#8B9D83] text-white shadow-xs"
                  : "text-[#7A7A7A] hover:text-[#3D3D3D]"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Subscribers ({subscribers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("payments")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "payments"
                  ? "bg-[#8B9D83] text-white shadow-xs"
                  : "text-[#7A7A7A] hover:text-[#3D3D3D]"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>UPI Payments ({payments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("leads")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "leads"
                  ? "bg-[#8B9D83] text-white shadow-xs"
                  : "text-[#7A7A7A] hover:text-[#3D3D3D]"
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Helpline Leads ({callbacks.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: DYNAMIC SETTINGS */}
        {activeTab === "settings" && (
          <form onSubmit={handleSaveSettings} className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Helpline & Kendra Offline Settings */}
              <div className="p-5 rounded-3xl bg-[#FAF9F6] border border-[#E8E6DF] space-y-4">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-[#8B9D83]" />
                  <h4 className="font-serif font-bold text-sm text-[#3D3D3D]">
                    Helpline &amp; Offline Kendra Details
                  </h4>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                    Central Helpline Number (Incoming Consultation)
                  </label>
                  <input
                    type="text"
                    value={settings.helplineNumber}
                    onChange={(e) => setSettings({ ...settings, helplineNumber: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E6DF] text-xs font-bold text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83]"
                  />
                  <span className="text-[10px] text-[#7A7A7A] mt-0.5 block">
                    Displayed prominently across offline cards, header, and click-to-call.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                    Kendra Support / Devotee Helpline
                  </label>
                  <input
                    type="text"
                    value={settings.helplineWhatsApp}
                    onChange={(e) => setSettings({ ...settings, helplineWhatsApp: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E6DF] text-xs font-bold text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                    Kendra Operating Timings
                  </label>
                  <input
                    type="text"
                    value={settings.kendraTimings}
                    onChange={(e) => setSettings({ ...settings, kendraTimings: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E6DF] text-xs text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                    Kendra Centers / Address
                  </label>
                  <input
                    type="text"
                    value={settings.kendraLocation}
                    onChange={(e) => setSettings({ ...settings, kendraLocation: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E6DF] text-xs text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                    Kendra Availability Status
                  </label>
                  <select
                    value={settings.kendraStatus}
                    onChange={(e) => setSettings({ ...settings, kendraStatus: e.target.value as "open" | "closed" })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E6DF] text-xs font-bold text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83]"
                  >
                    <option value="open">Open &bull; Accepting Calls &amp; Visits</option>
                    <option value="closed">Closed &bull; Next Day Slot</option>
                  </select>
                </div>
              </div>

              {/* UPI Payments Configuration */}
              <div className="p-5 rounded-3xl bg-[#FAF9F6] border border-[#E8E6DF] space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#CB997E]" />
                  <h4 className="font-serif font-bold text-sm text-[#3D3D3D]">
                    UPI Pay Simple Gateway Configuration
                  </h4>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                    Merchant UPI VPA / ID (e.g. GPay / PhonePe / Paytm / Bank)
                  </label>
                  <input
                    type="text"
                    value={settings.upiId}
                    onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E6DF] text-xs font-bold text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83]"
                  />
                  <span className="text-[10px] text-[#7A7A7A] mt-0.5 block">
                    All user subscriptions generate deep links and QR codes linked to this UPI ID.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                    UPI Payee Name
                  </label>
                  <input
                    type="text"
                    value={settings.upiPayeeName}
                    onChange={(e) => setSettings({ ...settings, upiPayeeName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E6DF] text-xs text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83]"
                  />
                </div>

                {/* Plan Pricing Overrides */}
                <div className="pt-2 border-t border-[#E8E6DF]">
                  <label className="block text-xs font-bold text-[#4A4A4A] mb-2">
                    Dynamic Plan Pricing (INR ₹)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-[#7A7A7A] uppercase block">Monthly Plan</span>
                      <div className="flex items-center mt-1">
                        <span className="px-2.5 py-1.5 bg-[#F0EDDF] border border-r-0 border-[#E8E6DF] rounded-l-xl text-xs font-bold">₹</span>
                        <input
                          type="number"
                          value={settings.planPrices.monthly}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              planPrices: { ...settings.planPrices, monthly: Number(e.target.value) },
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E8E6DF] rounded-r-xl text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#7A7A7A] uppercase block">3-Month Plan</span>
                      <div className="flex items-center mt-1">
                        <span className="px-2.5 py-1.5 bg-[#F0EDDF] border border-r-0 border-[#E8E6DF] rounded-l-xl text-xs font-bold">₹</span>
                        <input
                          type="number"
                          value={settings.planPrices.three_months}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              planPrices: { ...settings.planPrices, three_months: Number(e.target.value) },
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E8E6DF] rounded-r-xl text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#7A7A7A] uppercase block">6-Month Plan</span>
                      <div className="flex items-center mt-1">
                        <span className="px-2.5 py-1.5 bg-[#F0EDDF] border border-r-0 border-[#E8E6DF] rounded-l-xl text-xs font-bold">₹</span>
                        <input
                          type="number"
                          value={settings.planPrices.six_months}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              planPrices: { ...settings.planPrices, six_months: Number(e.target.value) },
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E8E6DF] rounded-r-xl text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#7A7A7A] uppercase block">1-Year Devotee</span>
                      <div className="flex items-center mt-1">
                        <span className="px-2.5 py-1.5 bg-[#F0EDDF] border border-r-0 border-[#E8E6DF] rounded-l-xl text-xs font-bold">₹</span>
                        <input
                          type="number"
                          value={settings.planPrices.yearly}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              planPrices: { ...settings.planPrices, yearly: Number(e.target.value) },
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E8E6DF] rounded-r-xl text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                    Free Trial Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={settings.trialDays}
                    onChange={(e) => setSettings({ ...settings, trialDays: Number(e.target.value) })}
                    className="w-24 px-3 py-1.5 rounded-xl bg-white border border-[#E8E6DF] text-xs font-bold"
                  />
                </div>
              </div>

            </div>

            {/* Announcement Banner Text */}
            <div className="p-5 rounded-3xl bg-[#FAF9F6] border border-[#E8E6DF]">
              <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                Website Announcement &amp; Offer Banner Text
              </label>
              <input
                type="text"
                value={settings.announcementBanner}
                onChange={(e) => setSettings({ ...settings, announcementBanner: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E6DF] text-xs text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83]"
                placeholder="e.g. Special Navratri Offer: 50% off on all annual plans..."
              />
            </div>

            {/* Submit Action */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-full bg-[#8B9D83] hover:bg-[#7A8C73] text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save All Content Settings</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: SUBSCRIBED MEMBERS */}
        {activeTab === "subscribers" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[#AFAFAF] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search phone, name, sign..."
                    value={subSearch}
                    onChange={(e) => setSubSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white border border-[#E8E6DF] focus:outline-none focus:border-[#8B9D83]"
                  />
                </div>

                <select
                  value={subFilter}
                  onChange={(e) => setSubFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-xl bg-white border border-[#E8E6DF] text-xs font-semibold focus:outline-none"
                >
                  <option value="all">All Plans</option>
                  <option value="active">Active Paid Only</option>
                  <option value="trial">3-Day Free Trials</option>
                </select>
              </div>

              <button
                onClick={() => setIsNewSubModal(true)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#8B9D83] hover:bg-[#7A8C73] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Member</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#E8E6DF]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F6] border-b border-[#E8E6DF] text-[#7A7A7A] uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Mobile &amp; Sign</th>
                    <th className="py-3 px-4">Plan &amp; Price</th>
                    <th className="py-3 px-4">Channel &amp; Time</th>
                    <th className="py-3 px-4">Valid Until</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6DF]">
                  {filteredSubscribers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[#7A7A7A]">
                        No members found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredSubscribers.map((sub) => (
                      <tr key={sub.id || sub.mobile} className="hover:bg-[#FAF9F6]/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#EAE8DE] text-[#5C6B5A] flex items-center justify-center font-bold text-xs shrink-0">
                              {(sub.name || "D").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-[#3D3D3D] block">{sub.name || "Devotee"}</span>
                              {sub.email ? (
                                <span className="text-[10px] text-[#7A7A7A] flex items-center gap-1">
                                  <Mail className="w-2.5 h-2.5 text-[#8B9D83]" />
                                  {sub.email}
                                </span>
                              ) : (
                                <span className="text-[10px] text-[#AFAFAF]">No email set</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[#3D3D3D]">+91 {sub.mobile}</span>
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
                              className="p-1 rounded-md text-[#7A7A7A] hover:text-[#25D366] hover:bg-[#E7F8EE] transition-colors cursor-pointer"
                              title="Edit Mobile Number (+91)"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            {sub.phoneVerified ? (
                              <span className="inline-flex items-center text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200" title="Phone OTP Verified">
                                <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                                Verified
                              </span>
                            ) : (
                              <span className="text-[9px] text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                                Pending
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#8B9D83] font-semibold block mt-0.5">{sub.zodiacSign}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F0EDDF] text-[#5C6B5A]">
                              {sub.planName || sub.planId}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                sub.status === "active"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : sub.status === "trial"
                                  ? "bg-amber-100 text-amber-800"
                                  : sub.status === "stopped"
                                  ? "bg-slate-100 text-slate-700"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {sub.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-[#7A7A7A]">
                              {sub.price > 0 ? `₹${sub.price}` : "Free Trial"}
                            </span>
                            <span className={`text-[9px] px-1 py-0.2 rounded ${sub.autoRenew !== false ? "text-emerald-700 bg-emerald-50" : "text-gray-500 bg-gray-100"}`}>
                              {sub.autoRenew !== false ? "Auto: ON" : "Auto: OFF"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize font-semibold text-[#3D3D3D] block">{sub.deliveryChannel}</span>
                          <span className="text-[10px] text-[#7A7A7A] block flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5 text-[#8B9D83]" />
                            {sub.deliveryTime || "07:00 AM"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] text-[#5C6B5A] font-semibold block">
                            {new Date(sub.validUntil).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-[9px] text-[#7A7A7A]">
                            {new Date(sub.validUntil).getTime() > Date.now() ? "Active" : "Expired"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
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
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#25D366]/40 bg-[#E7F8EE] hover:bg-[#25D366] text-[#1E7E34] hover:text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                            title="Edit Mobile Number (+91)"
                          >
                            <Smartphone className="w-3 h-3" />
                            <span>Edit Mobile</span>
                          </button>
                          <button
                            onClick={() => openEditModal(sub)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#8B9D83]/40 bg-[#FAF9F6] hover:bg-[#8B9D83] text-[#5C6B5A] hover:text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                            title="Edit Devotee Account (All Info)"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit All</span>
                          </button>
                          <button
                            onClick={() => handleDeleteSubscriber(sub.mobile)}
                            className="p-1.5 rounded-lg border border-[#E8E6DF] hover:bg-rose-50 text-rose-500 transition-colors cursor-pointer"
                            title="Delete Subscriber"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: UPI PAYMENTS */}
        {activeTab === "payments" && (() => {
          const filteredPayments = payments.filter((pay) => {
            const matchesFilter =
              paymentFilter === "all" ? true : pay.status === paymentFilter;
            const query = paymentSearch.trim().toLowerCase();
            const matchesSearch =
              !query ||
              (pay.userName && pay.userName.toLowerCase().includes(query)) ||
              (pay.mobile && pay.mobile.includes(query)) ||
              (pay.id && pay.id.toLowerCase().includes(query)) ||
              (pay.utrNumber && pay.utrNumber.toLowerCase().includes(query)) ||
              (pay.planName && pay.planName.toLowerCase().includes(query));
            return matchesFilter && matchesSearch;
          });

          const verifiedCount = payments.filter((p) => p.status === "verified").length;
          const pendingCount = payments.filter((p) => p.status === "pending").length;
          const rejectedCount = payments.filter((p) => p.status === "rejected").length;
          const failedCount = payments.filter((p) => p.status === "failed").length;
          const totalVerifiedAmount = payments
            .filter((p) => p.status === "verified")
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

          return (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-serif font-bold text-base text-[#3D3D3D]">
                    UPI Payment Ledger &amp; Status Management
                  </h4>
                  <p className="text-xs text-[#7A7A7A]">
                    Editable transaction records. Setting status to <strong>Verified</strong> activates devotee daily horoscopes in the database.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#5C6B5A] bg-[#EDF3EC] px-3 py-1.5 rounded-full border border-[#8B9D83]/30">
                    Collected: ₹{totalVerifiedAmount.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-bold text-[#CB997E] bg-[#FFF4E5] px-3 py-1.5 rounded-full border border-[#CB997E]/30">
                    VPA: {settings.upiId}
                  </span>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FAF9F6] p-3 rounded-2xl border border-[#E8E6DF]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#7A7A7A] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    placeholder="Search by devotee name, +91 mobile, txn ID, or UTR..."
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white border border-[#E8E6DF] focus:outline-none focus:border-[#8B9D83]"
                  />
                  {paymentSearch && (
                    <button
                      onClick={() => setPaymentSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#7A7A7A] hover:text-[#3D3D3D]"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
                  <button
                    onClick={() => setPaymentFilter("all")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      paymentFilter === "all"
                        ? "bg-[#5C6B5A] text-white shadow-xs"
                        : "bg-white text-[#7A7A7A] border border-[#E8E6DF] hover:bg-gray-50"
                    }`}
                  >
                    All ({payments.length})
                  </button>
                  <button
                    onClick={() => setPaymentFilter("verified")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      paymentFilter === "verified"
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    🟢 Verified ({verifiedCount})
                  </button>
                  <button
                    onClick={() => setPaymentFilter("pending")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      paymentFilter === "pending"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-white text-amber-800 border border-amber-200 hover:bg-amber-50"
                    }`}
                  >
                    🟡 Pending ({pendingCount})
                  </button>
                  <button
                    onClick={() => setPaymentFilter("rejected")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      paymentFilter === "rejected"
                        ? "bg-rose-700 text-white shadow-xs"
                        : "bg-white text-rose-800 border border-rose-200 hover:bg-rose-50"
                    }`}
                  >
                    🔴 Rejected ({rejectedCount})
                  </button>
                  <button
                    onClick={() => setPaymentFilter("failed")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      paymentFilter === "failed"
                        ? "bg-gray-700 text-white shadow-xs"
                        : "bg-white text-gray-700 border border-[#E8E6DF] hover:bg-gray-100"
                    }`}
                  >
                    ⚪ Failed ({failedCount})
                  </button>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto rounded-2xl border border-[#E8E6DF] bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9F6] border-b border-[#E8E6DF] text-[#7A7A7A] uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4">Transaction / UTR ID</th>
                      <th className="py-3 px-4">Devotee Member</th>
                      <th className="py-3 px-4">Plan &amp; Amount</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Status (Editable)</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E6DF]">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-xs text-[#7A7A7A]">
                          No UPI payment records match the current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((pay) => (
                        <tr key={pay.id} className="hover:bg-[#FAF9F6]/80 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-[#3D3D3D] block">
                              {pay.utrNumber || (pay as any).txnId || pay.id}
                            </span>
                            <span className="text-[10px] text-[#7A7A7A] block">
                              ID: {pay.id}
                            </span>
                            <span className="text-[10px] text-[#7A7A7A] block">
                              {new Date(pay.timestamp).toLocaleString("en-IN")}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-[#3D3D3D] block">{pay.userName}</span>
                            <span className="font-mono text-[#7A7A7A]">+91 {pay.mobile}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[#5C6B5A] font-bold block text-sm">₹{pay.amount}</span>
                            <span className="text-[#7A7A7A] text-[11px] block">{pay.planName}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F5F5F0] border border-[#E8E6DF] inline-block">
                              {pay.paymentMode === "upi_qr" ? "QR Code Scan" : "UPI App Intent"}
                            </span>
                            <span className="font-mono text-[10px] text-[#7A7A7A] block mt-0.5">
                              {pay.upiIdUsed}
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
                                className="text-[10px] text-[#7A7A7A] block mt-1 truncate max-w-[170px]"
                                title={pay.adminNotes}
                              >
                                💬 {pay.adminNotes}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {pay.status !== "verified" && (
                                <button
                                  onClick={() => handleUpdatePaymentStatus(pay.id, "verified")}
                                  disabled={updatingPaymentId === pay.id}
                                  className="px-2.5 py-1 rounded-xl bg-[#5C6B5A] text-white font-bold text-[11px] hover:bg-[#4E5B4C] cursor-pointer disabled:opacity-50"
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
          );
        })()}

        {/* TAB 5: HELPLINE 9560169988 LEADS */}
        {activeTab === "leads" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-base text-[#3D3D3D]">
                  Helpline 9560169988 Consultation Callback Leads
                </h4>
                <p className="text-xs text-[#7A7A7A]">
                  Devotees requesting astrologer callbacks or in-person Kendra appointments.
                </p>
              </div>
              <span className="text-xs font-bold text-[#8B9D83] bg-[#EDF3EC] px-3.5 py-1.5 rounded-full border border-[#8B9D83]/30">
                Helpline: {settings.helplineNumber}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {callbacks.map((cb) => (
                <div key={cb.id} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] space-y-2">
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
                      className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white border border-[#E8E6DF] focus:outline-none"
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
              ))}
            </div>
          </div>
        )}

        {/* Edit Subscriber Modal - Comprehensive Multi-Field Suite */}
        {editingSub && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl border border-[#E8E6DF] max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-scaleUp text-[#3D3D3D]">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-[#FAF9F6] border-b border-[#E8E6DF] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#8B9D83] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif font-bold text-base text-[#3D3D3D]">
                        Edit Devotee Account
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          editingSub.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : editingSub.status === "trial"
                            ? "bg-amber-100 text-amber-800"
                            : editingSub.status === "stopped"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {editingSub.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7A7A7A]">
                      Subscriber:{" "}
                      <span className="font-mono font-bold text-[#3D3D3D]">
                        +91 {editingSubOriginalMobile || editingSub.mobile}
                      </span>
                      {editingSub.name ? ` • ${editingSub.name}` : ""}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingSub(null);
                    setEditingSubOriginalMobile(null);
                  }}
                  className="p-2 rounded-xl text-[#7A7A7A] hover:text-[#3D3D3D] hover:bg-[#F0EDDF] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 px-4 py-2 bg-white border-b border-[#E8E6DF] overflow-x-auto text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setEditModalTab("profile")}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    editModalTab === "profile"
                      ? "bg-[#8B9D83] text-white shadow-xs"
                      : "text-[#7A7A7A] hover:text-[#3D3D3D] hover:bg-[#FAF9F6]"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Profile &amp; Contact</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditModalTab("kundali")}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    editModalTab === "kundali"
                      ? "bg-[#8B9D83] text-white shadow-xs"
                      : "text-[#7A7A7A] hover:text-[#3D3D3D] hover:bg-[#FAF9F6]"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Rashi &amp; Birth Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditModalTab("plan")}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    editModalTab === "plan"
                      ? "bg-[#8B9D83] text-white shadow-xs"
                      : "text-[#7A7A7A] hover:text-[#3D3D3D] hover:bg-[#FAF9F6]"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Plan &amp; Validity</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditModalTab("delivery")}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    editModalTab === "delivery"
                      ? "bg-[#8B9D83] text-white shadow-xs"
                      : "text-[#7A7A7A] hover:text-[#3D3D3D] hover:bg-[#FAF9F6]"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Delivery Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditModalTab("verification")}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    editModalTab === "verification"
                      ? "bg-[#8B9D83] text-white shadow-xs"
                      : "text-[#7A7A7A] hover:text-[#3D3D3D] hover:bg-[#FAF9F6]"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Trust &amp; Admin Notes</span>
                </button>
              </div>

              {/* Modal Body / Tab Content */}
              <form onSubmit={handleSaveSubscriber} className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* TAB 1: Profile & Contact */}
                {editModalTab === "profile" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#4A4A4A] mb-1.5">
                          Devotee Full Name
                        </label>
                        <div className="relative">
                          <User className="w-3.5 h-3.5 text-[#AFAFAF] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={editingSub.name || ""}
                            onChange={(e) => setEditingSub({ ...editingSub, name: e.target.value })}
                            placeholder="e.g. Ramesh Kumar Sharma"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83] font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-[#4A4A4A]">
                            Primary Mobile Number (+91)
                          </label>
                          <span className="text-[10px] text-[#5C6B5A] font-semibold flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            Devotee Contact Number
                          </span>
                        </div>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-[#AFAFAF] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            maxLength={10}
                            value={editingSub.mobile || ""}
                            onChange={(e) =>
                              setEditingSub({
                                ...editingSub,
                                mobile: e.target.value.replace(/\D/g, ""),
                              })
                            }
                            placeholder="10-digit mobile"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-mono font-bold text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83]"
                          />
                        </div>
                        {editingSubOriginalMobile && editingSub.mobile !== editingSubOriginalMobile && (
                          <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl mt-2 border border-amber-200 space-y-1">
                            <div className="font-bold flex items-center gap-1">
                              <span>⚠️ Migrating Devotee Mobile Number:</span>
                            </div>
                            <p className="text-[10px] leading-relaxed">
                              Old: <strong className="font-mono">+91 {editingSubOriginalMobile}</strong> ➔ New: <strong className="font-mono text-emerald-800">+91 {editingSub.mobile}</strong>
                            </p>
                            <p className="text-[10px] text-[#7A7A7A]">
                              All subscription logs, daily email deliveries, and astrologer consultations will be migrated to the new number upon saving.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#4A4A4A] mb-1.5">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 text-[#AFAFAF] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            value={editingSub.email || ""}
                            onChange={(e) => setEditingSub({ ...editingSub, email: e.target.value })}
                            placeholder="devotee@gmail.com"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83]"
                          />
                        </div>
                        <span className="text-[10px] text-[#7A7A7A] mt-1 block">
                          Receives automated morning email horoscopes &amp; OTP notifications.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#4A4A4A] mb-1.5">
                          City / Current Residence
                        </label>
                        <div className="relative">
                          <MapPin className="w-3.5 h-3.5 text-[#AFAFAF] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={editingSub.pob || editingSub.city || ""}
                            onChange={(e) =>
                              setEditingSub({ ...editingSub, pob: e.target.value, city: e.target.value })
                            }
                            placeholder="e.g. Varanasi, Uttar Pradesh"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Kundali & Rashi */}
                {editModalTab === "kundali" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#4A4A4A] mb-1.5">
                        Selected Zodiac Sign / Rashi
                      </label>
                      <input
                        type="text"
                        value={editingSub.zodiacSign || ""}
                        onChange={(e) => setEditingSub({ ...editingSub, zodiacSign: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold text-[#5C6B5A] mb-2 focus:outline-none focus:border-[#8B9D83]"
                      />
                      <span className="text-[10px] text-[#7A7A7A] block mb-2">
                        Quick select from all 12 Vedic Rashis:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-40 overflow-y-auto p-1 bg-[#FAF9F6] rounded-2xl border border-[#E8E6DF]">
                        {ZODIAC_OPTIONS.map((z) => {
                          const isSelected =
                            editingSub.zodiacSign?.toLowerCase().includes(z.en.toLowerCase()) ||
                            editingSub.zodiacSign?.toLowerCase().includes(z.sa.toLowerCase());
                          return (
                            <button
                              key={z.id}
                              type="button"
                              onClick={() =>
                                setEditingSub({
                                  ...editingSub,
                                  zodiacSign: `${z.en} (${z.sa})`,
                                })
                              }
                              className={`p-2 rounded-xl text-left border transition-all text-[11px] cursor-pointer ${
                                isSelected
                                  ? "bg-[#8B9D83] text-white border-[#8B9D83] shadow-xs"
                                  : "bg-white text-[#3D3D3D] border-[#E8E6DF] hover:bg-[#F0EDDF]"
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">{z.symbol}</span>
                                <span className="font-bold">{z.en}</span>
                              </div>
                              <span className={`text-[9px] block ${isSelected ? "text-white/80" : "text-[#7A7A7A]"}`}>
                                {z.sa}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                          Date of Birth (DOB)
                        </label>
                        <input
                          type="date"
                          value={editingSub.dob ? editingSub.dob.split("T")[0] : ""}
                          onChange={(e) => setEditingSub({ ...editingSub, dob: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-medium text-[#3D3D3D]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                          Time of Birth (TOB)
                        </label>
                        <input
                          type="time"
                          value={editingSub.tob || ""}
                          onChange={(e) => setEditingSub({ ...editingSub, tob: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-medium text-[#3D3D3D]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                          Vedic Gotra
                        </label>
                        <input
                          type="text"
                          value={editingSub.gotra || ""}
                          onChange={(e) => setEditingSub({ ...editingSub, gotra: e.target.value })}
                          placeholder="e.g. Kashyap, Bharadwaj"
                          className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-medium text-[#3D3D3D]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                        Birth Nakshatra &amp; Astrological Notes
                      </label>
                      <input
                        type="text"
                        value={editingSub.nakshatra || ""}
                        onChange={(e) => setEditingSub({ ...editingSub, nakshatra: e.target.value })}
                        placeholder="e.g. Pushya (Auspicious), Ashwini, Rohini"
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs text-[#3D3D3D]"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: Plan & Validity */}
                {editModalTab === "plan" && (
                  <div className="space-y-4">
                    {/* Status Selector */}
                    <div>
                      <label className="block text-xs font-bold text-[#4A4A4A] mb-1.5">
                        Subscription Status
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: "active", label: "Active (Paid)", color: "border-emerald-500 bg-emerald-50 text-emerald-800" },
                          { id: "trial", label: "3-Day Trial", color: "border-amber-500 bg-amber-50 text-amber-800" },
                          { id: "expired", label: "Expired", color: "border-rose-500 bg-rose-50 text-rose-800" },
                          { id: "stopped", label: "Stopped / Paused", color: "border-slate-500 bg-slate-50 text-slate-800" },
                        ].map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setEditingSub({ ...editingSub, status: st.id })}
                            className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                              editingSub.status === st.id
                                ? `${st.color} ring-2 ring-offset-1 ring-[#8B9D83]`
                                : "bg-white border-[#E8E6DF] text-[#7A7A7A] hover:bg-[#FAF9F6]"
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Plan Presets */}
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-[#7A7A7A] block mb-1.5">
                        Apply Plan Preset (Sets Tier, Label &amp; Price):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {PLAN_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => applyPlanPreset(preset)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              editingSub.planId === preset.id
                                ? "bg-[#8B9D83] text-white border-[#8B9D83] shadow-xs"
                                : "bg-white border-[#E8E6DF] hover:bg-[#F0EDDF] text-[#3D3D3D]"
                            }`}
                          >
                            <span className="font-bold text-xs block">{preset.name}</span>
                            <span className={`text-[10px] ${editingSub.planId === preset.id ? "text-white/80" : "text-[#7A7A7A]"}`}>
                              {preset.price === 0 ? "Free (3 Days)" : `₹${preset.price} / ${preset.days}d`}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                          Plan ID
                        </label>
                        <input
                          type="text"
                          value={editingSub.planId || ""}
                          onChange={(e) => setEditingSub({ ...editingSub, planId: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-mono font-bold text-[#3D3D3D]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                          Plan Display Name
                        </label>
                        <input
                          type="text"
                          value={editingSub.planName || ""}
                          onChange={(e) => setEditingSub({ ...editingSub, planName: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold text-[#3D3D3D]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                          Price Paid (₹ INR)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={editingSub.price !== undefined ? editingSub.price : ""}
                          onChange={(e) =>
                            setEditingSub({ ...editingSub, price: Number(e.target.value) || 0 })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold text-[#3D3D3D]"
                        />
                      </div>
                    </div>

                    {/* Auto-Renewal Toggle */}
                    <div className="p-3 bg-[#FAF9F6] rounded-2xl border border-[#E8E6DF] flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-[#3D3D3D] block">
                          Auto-Renewal Membership
                        </span>
                        <span className="text-[10px] text-[#7A7A7A]">
                          Automatically notify &amp; extend subscription via UPI link upon expiration
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingSub({ ...editingSub, autoRenew: !editingSub.autoRenew })}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                          editingSub.autoRenew !== false
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {editingSub.autoRenew !== false ? "Auto-Renew ON" : "Auto-Renew OFF"}
                      </button>
                    </div>

                    {/* Expiration Date & Quick Extenders */}
                    <div>
                      <label className="block text-xs font-bold text-[#4A4A4A] mb-1.5">
                        Subscription Validity Expiration (YYYY-MM-DD)
                      </label>
                      <div className="flex flex-col sm:flex-row items-center gap-2 mb-2">
                        <input
                          type="date"
                          value={editingSub.validUntil ? editingSub.validUntil.split("T")[0] : ""}
                          onChange={(e) =>
                            setEditingSub({
                              ...editingSub,
                              validUntil: new Date(e.target.value).toISOString(),
                            })
                          }
                          className="w-full sm:w-1/2 px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-mono font-bold text-[#3D3D3D]"
                        />
                        <span className="text-xs text-[#5C6B5A] font-semibold">
                          Expires:{" "}
                          {editingSub.validUntil
                            ? new Date(editingSub.validUntil).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "Not set"}
                        </span>
                      </div>

                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A7A7A] block mb-1">
                        Quick Add Validity:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: "+3 Days (Trial)", days: 3 },
                          { label: "+7 Days (Grace)", days: 7 },
                          { label: "+30 Days (1 Mo)", days: 30 },
                          { label: "+90 Days (3 Mo)", days: 90 },
                          { label: "+180 Days (6 Mo)", days: 180 },
                          { label: "+365 Days (1 Yr)", days: 365 },
                        ].map((ext) => (
                          <button
                            key={ext.days}
                            type="button"
                            onClick={() => extendValidity(ext.days)}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#F0EDDF] border border-[#E8E6DF] text-[10px] font-bold text-[#5C6B5A] cursor-pointer transition-colors shadow-2xs"
                          >
                            {ext.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: Delivery Settings */}
                {editModalTab === "delivery" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#4A4A4A] mb-1.5">
                        Daily Horoscope Delivery Channel
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: "email", label: "Email Dispatch (Active Daily)", icon: Mail, desc: "Full HTML formatted horoscope newsletter delivered directly to inbox at 07:00 AM" },
                        ].map((ch) => {
                          const IconComponent = ch.icon;
                          const isSelected = editingSub.deliveryChannel === ch.id || true;
                          return (
                            <button
                              key={ch.id}
                              type="button"
                              onClick={() => setEditingSub({ ...editingSub, deliveryChannel: "email" })}
                              className="p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 bg-[#8B9D83] text-white border-[#8B9D83] shadow-xs"
                            >
                              <IconComponent className="w-4 h-4 mt-0.5 text-white" />
                              <div>
                                <span className="font-bold text-xs block">{ch.label}</span>
                                <span className="text-[10px] text-white/80">
                                  {ch.desc}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#4A4A4A] mb-1.5">
                        Preferred Morning Delivery Time
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                        {DELIVERY_TIMES.map((timeStr) => (
                          <button
                            key={timeStr}
                            type="button"
                            onClick={() =>
                              setEditingSub({
                                ...editingSub,
                                deliveryTime: timeStr.split(" ")[0] + " " + timeStr.split(" ")[1],
                              })
                            }
                            className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              editingSub.deliveryTime?.startsWith(timeStr.split(" ")[0])
                                ? "bg-[#8B9D83] text-white border-[#8B9D83]"
                                : "bg-white border-[#E8E6DF] hover:bg-[#F0EDDF] text-[#3D3D3D]"
                            }`}
                          >
                            {timeStr}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#7A7A7A]" />
                        <input
                          type="text"
                          value={editingSub.deliveryTime || ""}
                          onChange={(e) => setEditingSub({ ...editingSub, deliveryTime: e.target.value })}
                          placeholder="e.g. 07:00 AM"
                          className="px-3 py-1.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold text-[#3D3D3D] w-36"
                        />
                        <span className="text-[10px] text-[#7A7A7A]">
                          Custom morning delivery slot
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: Verification & Notes */}
                {editModalTab === "verification" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Phone Verified */}
                      <div className="p-3 bg-[#FAF9F6] rounded-2xl border border-[#E8E6DF]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-[#3D3D3D]">
                            Phone Verification
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingSub({
                                ...editingSub,
                                phoneVerified: !editingSub.phoneVerified,
                                phoneVerifiedAt: !editingSub.phoneVerified ? new Date().toISOString() : "",
                              })
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                              editingSub.phoneVerified
                                ? "bg-emerald-600 text-white"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {editingSub.phoneVerified ? "Verified ✅" : "Unverified ⏳"}
                          </button>
                        </div>
                        <input
                          type="text"
                          value={editingSub.verificationProvider || ""}
                          onChange={(e) =>
                            setEditingSub({ ...editingSub, verificationProvider: e.target.value })
                          }
                          placeholder="Provider (e.g. Fast2SMS OTP, Admin Manual)"
                          className="w-full px-2.5 py-1 rounded-lg bg-white border border-[#E8E6DF] text-[11px] text-[#3D3D3D]"
                        />
                        {editingSub.phoneVerifiedAt && (
                          <span className="text-[9px] text-[#7A7A7A] block mt-1">
                            Verified at: {new Date(editingSub.phoneVerifiedAt).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>

                      {/* Email Verified */}
                      <div className="p-3 bg-[#FAF9F6] rounded-2xl border border-[#E8E6DF]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-[#3D3D3D]">
                            Email Verification
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingSub({
                                ...editingSub,
                                emailVerified: !editingSub.emailVerified,
                              })
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                              editingSub.emailVerified
                                ? "bg-emerald-600 text-white"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {editingSub.emailVerified ? "Verified ✅" : "Unverified ⏳"}
                          </button>
                        </div>
                        <span className="text-[10px] text-[#7A7A7A] block">
                          Controls whether email delivery skips spam filters and confirms inbox delivery.
                        </span>
                      </div>
                    </div>

                    {/* Admin CRM Remarks */}
                    <div>
                      <label className="block text-xs font-bold text-[#4A4A4A] mb-1.5">
                        Internal Staff &amp; Administrator Notes / Remarks
                      </label>
                      <textarea
                        rows={3}
                        value={editingSub.adminNotes || ""}
                        onChange={(e) => setEditingSub({ ...editingSub, adminNotes: e.target.value })}
                        placeholder="Internal notes: Special prayer requests, offline cash paid at Kashi Kendra, astrologer consultation notes, preferred call timings, VIP devotee flags..."
                        className="w-full p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs text-[#3D3D3D] focus:outline-none focus:border-[#8B9D83]"
                      />
                    </div>

                    {/* Audit Meta */}
                    <div className="p-3 bg-white rounded-xl border border-[#E8E6DF] flex flex-wrap items-center justify-between text-[10px] text-[#7A7A7A] gap-2">
                      <span>
                        Registered:{" "}
                        <strong>
                          {editingSub.registeredAt
                            ? new Date(editingSub.registeredAt).toLocaleString("en-IN")
                            : "Initial Seeder"}
                        </strong>
                      </span>
                      <span>
                        Last Update:{" "}
                        <strong>
                          {editingSub.updatedAt
                            ? new Date(editingSub.updatedAt).toLocaleString("en-IN")
                            : "Never"}
                        </strong>
                      </span>
                      <span>
                        ID: <strong className="font-mono">{editingSub.id || editingSub.mobile}</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Modal Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-[#E8E6DF]">
                  <div className="text-[11px] text-[#7A7A7A]">
                    {editingSubOriginalMobile && editingSub.mobile !== editingSubOriginalMobile ? (
                      <span className="text-amber-700 font-semibold">
                        Migrating +91 {editingSubOriginalMobile} ➔ +91 {editingSub.mobile}
                      </span>
                    ) : (
                      <span>Changes sync instantly with local DB &amp; Cloud Firestore</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSub(null);
                        setEditingSubOriginalMobile(null);
                      }}
                      className="px-4 py-2 rounded-xl border border-[#E8E6DF] text-xs font-bold text-[#7A7A7A] hover:text-[#3D3D3D] hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2 rounded-xl bg-[#8B9D83] hover:bg-[#7A8C73] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{loading ? "Saving Changes..." : "Save All Changes"}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Quick Edit Mobile Number Modal */}
        {quickEditMobileSub && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <form
              onSubmit={handleSaveQuickMobile}
              className="bg-white rounded-3xl border border-[#E8E6DF] p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp text-[#3D3D3D]"
            >
              <div className="flex items-center justify-between border-b border-[#E8E6DF] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#E7F8EE] text-[#1E7E34] flex items-center justify-center font-bold">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-base text-[#3D3D3D]">
                      Update Mobile Number
                    </h4>
                    <p className="text-[11px] text-[#7A7A7A]">
                      Devotee: <strong className="text-[#3D3D3D]">{quickEditMobileSub.name}</strong>
                      {quickEditMobileSub.zodiacSign ? ` • ${quickEditMobileSub.zodiacSign}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickEditMobileSub(null)}
                  className="p-1.5 rounded-xl text-[#7A7A7A] hover:text-[#3D3D3D] hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-[#E8E6DF] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[#7A7A7A] block font-semibold uppercase tracking-wider">
                    Current Registered Mobile
                  </span>
                  <span className="font-mono font-bold text-sm text-[#3D3D3D]">
                    +91 {quickEditMobileSub.originalMobile}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#1E7E34] bg-[#E7F8EE] px-2 py-0.5 rounded-full border border-[#C3E6CB]">
                  Active Devotee
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3D3D3D] uppercase tracking-wider mb-1.5">
                  New 10-Digit Mobile Number (+91)
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-bold font-mono text-[#7A7A7A]">
                    <Smartphone className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    required
                    autoFocus
                    maxLength={10}
                    placeholder="9876543210"
                    value={quickEditMobileSub.mobile}
                    onChange={(e) =>
                      setQuickEditMobileSub({
                        ...quickEditMobileSub,
                        mobile: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="w-full pl-16 pr-3 py-2.5 rounded-xl bg-white border border-[#E8E6DF] text-sm font-mono font-bold text-[#3D3D3D] focus:outline-none focus:border-[#25D366]"
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="text-[#7A7A7A]">
                    {quickEditMobileSub.mobile.length}/10 digits
                  </span>
                  {quickEditMobileSub.mobile.length === 10 ? (
                    quickEditMobileSub.mobile !== quickEditMobileSub.originalMobile ? (
                      <span className="text-[#1E7E34] font-semibold flex items-center gap-0.5">
                        <Check className="w-3 h-3" />
                        Migrating to +91 {quickEditMobileSub.mobile}
                      </span>
                    ) : (
                      <span className="text-[#7A7A7A]">Same as current number</span>
                    )
                  ) : (
                    <span className="text-[#9E2A2B]">Enter 10 digits</span>
                  )}
                </div>
              </div>

              {quickEditMobileSub.mobile !== quickEditMobileSub.originalMobile &&
                quickEditMobileSub.mobile.length === 10 && (
                  <div className="p-3 bg-[#E7F8EE] rounded-2xl border border-[#C3E6CB] text-[11px] text-[#155724] space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Seamless Data Migration:
                    </p>
                    <p className="text-[10px] leading-relaxed text-[#1E7E34]">
                      Subscription plan, daily email deliveries, consultation history, and Panchang alerts will automatically migrate from <strong>+91 {quickEditMobileSub.originalMobile}</strong> to <strong>+91 {quickEditMobileSub.mobile}</strong>.
                    </p>
                  </div>
                )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E6DF]">
                <button
                  type="button"
                  onClick={() => setQuickEditMobileSub(null)}
                  className="px-4 py-2 rounded-xl border border-[#E8E6DF] text-xs font-semibold text-[#7A7A7A] hover:text-[#3D3D3D] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuickMobile || quickEditMobileSub.mobile.length < 10}
                  className="px-5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{savingQuickMobile ? "Updating Number..." : "Save Mobile Number"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add New Member Modal */}
        {isNewSubModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
            <form
              onSubmit={handleAddSubscriber}
              className="bg-white rounded-3xl border border-[#E8E6DF] p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp"
            >
              <div className="flex items-center justify-between border-b border-[#E8E6DF] pb-3">
                <h4 className="font-serif font-bold text-base text-[#3D3D3D]">
                  Manually Add New Subscriber
                </h4>
                <button
                  type="button"
                  onClick={() => setIsNewSubModal(false)}
                  className="p-1 rounded-full text-[#7A7A7A] hover:text-[#3D3D3D]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={newSubForm.mobile}
                  onChange={(e) => setNewSubForm({ ...newSubForm, mobile: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F5F0] border border-[#E8E6DF] text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4A4A4A] mb-1">Name</label>
                  <input
                    type="text"
                    placeholder="Rahul Sharma"
                    value={newSubForm.name}
                    onChange={(e) => setNewSubForm({ ...newSubForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F5F0] border border-[#E8E6DF] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A4A4A] mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="rahul@gmail.com"
                    value={newSubForm.email}
                    onChange={(e) => setNewSubForm({ ...newSubForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F5F0] border border-[#E8E6DF] text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1">Zodiac Sign / Rashi</label>
                <select
                  value={newSubForm.zodiacSign}
                  onChange={(e) => setNewSubForm({ ...newSubForm, zodiacSign: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F5F0] border border-[#E8E6DF] text-xs font-bold"
                >
                  {ZODIAC_OPTIONS.map((z) => (
                    <option key={z.id} value={`${z.en} (${z.sa})`}>
                      {z.symbol} {z.en} ({z.sa})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4A4A4A] mb-1">Plan</label>
                  <select
                    value={newSubForm.planId}
                    onChange={(e) => {
                      const p = e.target.value;
                      const preset = PLAN_PRESETS.find((pr) => pr.id === p);
                      setNewSubForm({
                        ...newSubForm,
                        planId: p,
                        validityDays: preset?.days || 30,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F5F0] border border-[#E8E6DF] text-xs font-bold"
                  >
                    {PLAN_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.price === 0 ? "Free" : `₹${p.price}`})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A4A4A] mb-1">Channel</label>
                  <select
                    value={newSubForm.deliveryChannel}
                    onChange={(e) => setNewSubForm({ ...newSubForm, deliveryChannel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F5F0] border border-[#E8E6DF] text-xs font-bold"
                  >
                    <option value="email">Email Dispatch (Active)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                    Delivery Time
                  </label>
                  <select
                    value={newSubForm.deliveryTime}
                    onChange={(e) => setNewSubForm({ ...newSubForm, deliveryTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F5F0] border border-[#E8E6DF] text-xs font-bold"
                  >
                    {DELIVERY_TIMES.map((t) => (
                      <option key={t} value={t.split(" ")[0] + " " + t.split(" ")[1]}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                    Validity (Days)
                  </label>
                  <input
                    type="number"
                    value={newSubForm.validityDays}
                    onChange={(e) => setNewSubForm({ ...newSubForm, validityDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F5F0] border border-[#E8E6DF] text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewSubModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E6DF] text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#8B9D83] text-white text-xs font-bold"
                >
                  Register Member
                </button>
              </div>
            </form>
          </div>
        )}

        {/* QUICK EDIT MOBILE MODAL */}
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
                    ✓ Ready to migrate account from <strong>+91 {quickEditMobileSub.originalMobile}</strong> to <strong>+91 {quickEditMobileSub.mobile}</strong>. All daily horoscopes and records will continue seamlessly.
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

        {/* EDIT UPI PAYMENT MODAL */}
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
                  <option value="verified">🟢 Verified (Active - Activates Devotee Subscription)</option>
                  <option value="pending">🟡 Pending (Under Review)</option>
                  <option value="rejected">🔴 Rejected (Invalid / Unpaid)</option>
                  <option value="failed">⚪ Failed (Transaction Incomplete)</option>
                </select>
                <p className="text-[10px] text-[#7A7A7A] mt-1">
                  Setting status to <strong>Verified</strong> automatically activates devotee subscription in the database &amp; triggers daily horoscopes.
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

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FAF9F6] border-t border-[#E8E6DF] flex items-center justify-between text-xs text-[#7A7A7A]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8B9D83]" />
            <span>Changes persist immediately to `data/database.json` &amp; sync with live front-end</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#8B9D83] text-white font-bold text-xs hover:bg-[#7A8C73] transition-colors cursor-pointer"
          >
            Close Admin Portal
          </button>
        </div>
      </div>
    </div>
  );
};
