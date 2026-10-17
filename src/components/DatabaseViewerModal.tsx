import React, { useState, useEffect } from "react";
import {
  X,
  Database,
  Users,
  PhoneCall,
  Sparkles,
  RefreshCw,
  Search,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Layers,
  Quote,
  HelpCircle,
  Sun,
  Star,
  Zap,
  ExternalLink,
  Cloud,
  CloudUpload,
  Edit,
  Smartphone,
  Check,
} from "lucide-react";

interface DatabaseViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseViewerModal: React.FC<DatabaseViewerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    "subscribers" | "callbacks" | "consultations" | "panchang" | "horoscopes" | "plans" | "testimonials" | "faqs"
  >("subscribers");
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [callbacks, setCallbacks] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [panchang, setPanchang] = useState<any>(null);
  const [horoscopes, setHoroscopes] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [syncingFirestore, setSyncingFirestore] = useState(false);
  const [notification, setNotification] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [quickEditMobileSub, setQuickEditMobileSub] = useState<{
    originalMobile: string;
    mobile: string;
    name: string;
    zodiacSign?: string;
  } | null>(null);
  const [savingQuickMobile, setSavingQuickMobile] = useState(false);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: cleanNew,
          newMobile: cleanNew !== cleanOrig ? cleanNew : undefined,
          updatedAt: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification(
          cleanNew !== cleanOrig
            ? `✅ Mobile migrated from +91 ${cleanOrig} to +91 ${cleanNew} successfully!`
            : `✅ Mobile number verified & saved.`
        );
        setQuickEditMobileSub(null);
        await fetchData();
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

  const handleSyncFirestore = async () => {
    setSyncingFirestore(true);
    try {
      const res = await fetch("/api/db/sync-firestore", { method: "POST" });
      const data = await res.json();
      if (data?.success) {
        setNotification(`✅ ${data.message || "All devotees successfully synchronized to Firestore!"}`);
        await fetchData();
      } else {
        setNotification(`⚠️ ${data?.error || "Sync notification received."}`);
      }
    } catch (e) {
      setNotification("⚠️ Could not contact sync service.");
    } finally {
      setSyncingFirestore(false);
      setTimeout(() => setNotification(""), 5000);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subsRes, cbRes, consRes, statsRes, panchangRes, horoRes, plansRes, testRes, faqsRes] = await Promise.all([
        fetch("/api/db/subscribers").then((r) => r.json()).catch(() => ({ subscribers: [] })),
        fetch("/api/offline-callbacks").then((r) => r.json()).catch(() => ({ callbacks: [] })),
        fetch("/api/consultations").then((r) => r.json()).catch(() => ({ consultations: [] })),
        fetch("/api/db/stats").then((r) => r.json()).catch(() => ({ stats: null })),
        fetch("/api/panchang").then((r) => r.json()).catch(() => ({ panchang: null })),
        fetch("/api/horoscopes").then((r) => r.json()).catch(() => ({ horoscopes: [] })),
        fetch("/api/plans").then((r) => r.json()).catch(() => ({ plans: [] })),
        fetch("/api/testimonials").then((r) => r.json()).catch(() => ({ testimonials: [] })),
        fetch("/api/faqs").then((r) => r.json()).catch(() => ({ faqs: [] })),
      ]);

      if (subsRes?.subscribers) setSubscribers(subsRes.subscribers);
      if (cbRes?.callbacks) setCallbacks(cbRes.callbacks);
      if (consRes?.consultations) setConsultations(consRes.consultations);
      if (statsRes?.stats) setStats(statsRes.stats);
      if (panchangRes?.panchang) setPanchang(panchangRes.panchang);
      if (horoRes?.horoscopes) setHoroscopes(horoRes.horoscopes);
      if (plansRes?.plans) setPlans(plansRes.plans);
      if (testRes?.testimonials) setTestimonials(testRes.testimonials);
      if (faqsRes?.faqs) setFaqs(faqsRes.faqs);
    } catch (e) {
      console.error("Error fetching database records:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAiHoroscopes = async () => {
    setGeneratingAi(true);
    try {
      const res = await fetch("/api/horoscopes/generate-ai", { method: "POST" });
      const data = await res.json();
      if (data?.success && Array.isArray(data.horoscopes)) {
        setHoroscopes(data.horoscopes);
        setNotification("✨ AI Horoscopes generated and updated in DB!");
        setTimeout(() => setNotification(""), 4000);
      }
    } catch (e) {
      console.error("Error generating AI horoscopes:", e);
    } finally {
      setGeneratingAi(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredSubscribers = subscribers.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.mobile && s.mobile.includes(q)) ||
      (s.zodiacSign && s.zodiacSign.toLowerCase().includes(q)) ||
      (s.planName && s.planName.toLowerCase().includes(q))
    );
  });

  const filteredCallbacks = callbacks.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.callerName && c.callerName.toLowerCase().includes(q)) ||
      (c.callerPhone && c.callerPhone.includes(q)) ||
      (c.preferredTopic && c.preferredTopic.toLowerCase().includes(q))
    );
  });

  const filteredHoroscopes = horoscopes.filter((h) => {
    const q = searchQuery.toLowerCase();
    return (
      (h.name && h.name.toLowerCase().includes(q)) ||
      (h.vedicName && h.vedicName.toLowerCase().includes(q)) ||
      (h.element && h.element.toLowerCase().includes(q))
    );
  });

  const filteredTestimonials = testimonials.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.city && t.city.toLowerCase().includes(q)) ||
      (t.sign && t.sign.toLowerCase().includes(q)) ||
      (t.text && t.text.toLowerCase().includes(q))
    );
  });

  const filteredFaqs = faqs.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      (f.q && f.q.toLowerCase().includes(q)) ||
      (f.a && f.a.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-3xl border border-[#E8E6DF] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#FAF9F6] border-b border-[#E8E6DF] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F0EDDF] border border-[#E8E6DF] flex items-center justify-center text-[#8B9D83]">
              <Database className="w-5 h-5 text-[#8B9D83]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#3D3D3D]">
                  JyotishVani Central Database
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EDF3EC] text-[#5C6B5A] text-[10px] font-bold border border-[#8B9D83]/30">
                  Firestore-Ready
                </span>
              </div>
              <p className="text-xs text-[#7A7A7A]">
                All subscribed members, 9560169988 offline requests, consultations &amp; Panchang stored persistently.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncFirestore}
              disabled={syncingFirestore}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EDF3EC] hover:bg-[#DEE8DC] border border-[#8B9D83]/30 text-[#4A5D48] text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              title="Synchronize all devotees and records to Cloud Firestore"
            >
              <CloudUpload className={`w-3.5 h-3.5 text-[#5C6B5A] ${syncingFirestore ? "animate-bounce" : ""}`} />
              <span className="hidden md:inline">{syncingFirestore ? "Syncing..." : "Sync with Firestore"}</span>
            </button>
            <a
              href="https://console.firebase.google.com/project/evocative-hybrid-lvxch/firestore/databases/ai-studio-jyotishvanidaily-0bade786-5893-44d4-a990-587ce5f12462/data"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0EDDF] hover:bg-[#E4DFCE] border border-[#E8E6DF] text-[#3D3D3D] text-xs font-semibold transition-colors shadow-xs"
              title="Open direct Firestore Database in Firebase Console"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#CB997E]" />
              <span className="hidden sm:inline">Firebase Console</span>
            </a>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-xl border border-[#E8E6DF] hover:bg-[#F0EDDF] text-[#7A7A7A] hover:text-[#3D3D3D] transition-colors cursor-pointer"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#8B9D83]" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-[#E8E6DF] hover:bg-[#F0EDDF] text-[#7A7A7A] hover:text-[#3D3D3D] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white border-b border-[#E8E6DF]">
          <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF]">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#7A7A7A] block">
              Total Subscribers
            </span>
            <span className="text-xl font-serif font-bold text-[#3D3D3D]">
              {stats?.totalSubscribers ?? subscribers.length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#EDF3EC] border border-[#8B9D83]/30">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#5C6B5A] block">
              Active Trials (3-Day)
            </span>
            <span className="text-xl font-serif font-bold text-[#5C6B5A]">
              {stats?.activeTrials ?? subscribers.filter((s) => s.planId === "trial").length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF]">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#7A7A7A] block">
              Paid Members
            </span>
            <span className="text-xl font-serif font-bold text-[#CB997E]">
              {stats?.paidSubscribers ?? subscribers.filter((s) => s.planId !== "trial").length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF]">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#7A7A7A] block">
              Helpline 9560169988 Leads
            </span>
            <span className="text-xl font-serif font-bold text-[#3D3D3D]">
              {stats?.pendingCallbacks ?? callbacks.length}
            </span>
          </div>
        </div>

        {/* Success / Notification Banner */}
        {notification && (
          <div className="bg-[#EDF3EC] text-[#5C6B5A] px-6 py-2 text-xs font-semibold flex items-center justify-between border-b border-[#8B9D83]/30 animate-fadeIn">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#8B9D83]" />
              <span>{notification}</span>
            </span>
            <button onClick={() => setNotification("")} className="text-[#5C6B5A] hover:text-[#3D3D3D]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Selection & Search */}
        <div className="px-6 py-3 bg-[#FAF9F6] border-b border-[#E8E6DF] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#E8E6DF] overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab("subscribers")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "subscribers"
                  ? "bg-[#8B9D83] text-white shadow-xs"
                  : "text-[#7A7A7A] hover:text-[#3D3D3D]"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Subscribers ({subscribers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("horoscopes")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "horoscopes"
                  ? "bg-[#8B9D83] text-white shadow-xs"
                  : "text-[#7A7A7A] hover:text-[#3D3D3D]"
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Horoscopes ({horoscopes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("plans")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "plans"
                  ? "bg-[#8B9D83] text-white shadow-xs"
                  : "text-[#7A7A7A] hover:text-[#3D3D3D]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Plans ({plans.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("testimonials")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "testimonials"
                  ? "bg-[#8B9D83] text-white shadow-xs"
                  : "text-[#7A7A7A] hover:text-[#3D3D3D]"
              }`}
            >
              <Quote className="w-3.5 h-3.5" />
              <span>Testimonials ({testimonials.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("faqs")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "faqs"
                  ? "bg-[#8B9D83] text-white shadow-xs"
                  : "text-[#7A7A7A] hover:text-[#3D3D3D]"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>FAQs ({faqs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("callbacks")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "callbacks"
                  ? "bg-[#8B9D83] text-white shadow-xs"
                  : "text-[#7A7A7A] hover:text-[#3D3D3D]"
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Offline Leads ({callbacks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("consultations")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "consultations"
                  ? "bg-[#8B9D83] text-white shadow-xs"
                  : "text-[#7A7A7A] hover:text-[#3D3D3D]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Readings ({consultations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("panchang")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "panchang"
                  ? "bg-[#8B9D83] text-white shadow-xs"
                  : "text-[#7A7A7A] hover:text-[#3D3D3D]"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Panchang Data</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#AFAFAF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search database..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white border border-[#E8E6DF] focus:outline-none focus:border-[#8B9D83]"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* 1. SUBSCRIBERS TABLE */}
          {activeTab === "subscribers" && (
            <div className="space-y-3">
              {filteredSubscribers.length === 0 ? (
                <div className="py-12 text-center text-[#7A7A7A] text-xs">
                  No subscribers match your search filter.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-[#E8E6DF]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF9F6] border-b border-[#E8E6DF] text-[#7A7A7A] uppercase text-[10px] tracking-wider font-bold">
                      <tr>
                        <th className="py-3 px-4">Member</th>
                        <th className="py-3 px-4">Mobile &amp; Sign</th>
                        <th className="py-3 px-4">Plan &amp; Status</th>
                        <th className="py-3 px-4">Delivery</th>
                        <th className="py-3 px-4">Valid Until</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E6DF]">
                      {filteredSubscribers.map((sub, idx) => (
                        <tr key={sub.id || idx} className="hover:bg-[#FAF9F6]/80 transition-colors">
                          <td className="py-3 px-4 font-medium text-[#3D3D3D]">
                            <div>
                              <span className="font-bold text-[#3D3D3D]">{sub.name || "Seeker"}</span>
                              <span className="text-[10px] text-[#7A7A7A] block">{sub.id}</span>
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
                                  })
                                }
                                className="p-1 rounded text-[#5C6B5A] hover:text-[#25D366] hover:bg-[#E7F8EE] transition-colors cursor-pointer"
                                title="Edit Mobile Number (+91)"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-[10px] text-[#8B9D83] block font-semibold">{sub.zodiacSign}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F0EDDF] text-[#5C6B5A] border border-[#E8E6DF]">
                              {sub.planName || sub.planId}
                            </span>
                            <span className="text-[10px] text-[#7A7A7A] block mt-0.5">
                              {sub.price > 0 ? `₹${sub.price}` : "Free Trial"}
                            </span>
                            <span
                              className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold mt-1 ${
                                sub.autoRenew !== false
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : "bg-gray-100 text-gray-500 border border-gray-200"
                              }`}
                            >
                              Auto-Renew: {sub.autoRenew !== false ? "ON" : "OFF"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="capitalize font-semibold text-[#3D3D3D]">{sub.deliveryChannel}</span>
                            <span className="text-[10px] text-[#7A7A7A] block">{sub.deliveryTime || "07:00 AM"}</span>
                          </td>
                          <td className="py-3 px-4">
                            {(() => {
                              const isExp =
                                sub.status === "expired" ||
                                (Boolean(sub.validUntil) && new Date(sub.validUntil).getTime() < Date.now());
                              return (
                                <div>
                                  <span
                                    className={`text-[11px] font-semibold block ${
                                      isExp ? "text-rose-600 font-bold" : "text-[#5C6B5A]"
                                    }`}
                                  >
                                    {new Date(sub.validUntil).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>
                                  {isExp && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold uppercase inline-block mt-0.5">
                                      Expired
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setQuickEditMobileSub({
                                  originalMobile: sub.mobile,
                                  mobile: sub.mobile,
                                  name: sub.name || "Devotee",
                                  zodiacSign: sub.zodiacSign,
                                })
                              }
                              className="px-2.5 py-1 rounded-lg border border-[#25D366]/50 bg-[#E7F8EE] hover:bg-[#25D366] text-[#1E7E34] hover:text-white font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                              title="Edit Devotee Mobile Number (+91)"
                            >
                              <Smartphone className="w-3 h-3" />
                              <span>Edit Mo</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 2. OFFLINE LEADS (9560169988) */}
          {activeTab === "callbacks" && (
            <div className="space-y-3">
              {filteredCallbacks.length === 0 ? (
                <div className="py-12 text-center text-[#7A7A7A] text-xs">
                  No callback leads found.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredCallbacks.map((cb, idx) => (
                    <div key={cb.id || idx} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#3D3D3D]">{cb.callerName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          cb.status === "connected"
                            ? "bg-[#EDF3EC] text-[#5C6B5A] border border-[#8B9D83]/30"
                            : "bg-[#FFF4E5] text-[#B8856B] border border-[#CB997E]/30"
                        }`}>
                          {cb.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[#7A7A7A]">Caller Phone:</span>
                        <a href={`tel:${cb.callerPhone}`} className="font-mono font-bold text-[#3D3D3D] hover:text-[#CB997E]">
                          +91 {cb.callerPhone}
                        </a>
                      </div>

                      <div className="text-xs text-[#5C6B5A] font-medium bg-white p-2.5 rounded-xl border border-[#E8E6DF]">
                        <span className="text-[10px] text-[#7A7A7A] block font-bold uppercase">Topic:</span>
                        {cb.preferredTopic}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#7A7A7A] pt-1 border-t border-[#E8E6DF]">
                        <span>Target Helpline: <strong>9560169988</strong></span>
                        <span>{new Date(cb.requestedAt).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. AI CONSULTATIONS LOG */}
          {activeTab === "consultations" && (
            <div className="space-y-3">
              {consultations.length === 0 ? (
                <div className="py-12 text-center text-[#7A7A7A] text-xs">
                  No consultation logs recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {consultations.map((item, idx) => (
                    <div key={item.id || idx} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#3D3D3D]">Zodiac: {item.userSign}</span>
                        <span className="text-[10px] text-[#7A7A7A]">{new Date(item.timestamp).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="text-xs font-medium text-[#3D3D3D] bg-white p-2.5 rounded-xl border border-[#E8E6DF]">
                        <span className="text-[10px] text-[#CB997E] block font-bold uppercase">Question:</span>
                        "{item.question}"
                      </div>
                      <div className="text-xs text-[#7A7A7A] line-clamp-3 bg-white/70 p-2.5 rounded-xl border border-[#E8E6DF]">
                        <span className="text-[10px] text-[#8B9D83] block font-bold uppercase">Stored Astrological Answer:</span>
                        {item.answer.slice(0, 220)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. DYNAMIC PANCHANG DATA */}
          {activeTab === "panchang" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF]">
                <h4 className="font-serif font-bold text-sm text-[#3D3D3D] mb-3">
                  Current Panchang Record in Database
                </h4>
                {panchang ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 bg-white rounded-xl border border-[#E8E6DF]">
                      <span className="text-[10px] text-[#7A7A7A] block uppercase">Tithi</span>
                      <strong className="text-[#3D3D3D]">{panchang.tithi}</strong>
                      {panchang.tithiStartTime && (
                        <span className="block text-[10px] text-[#5C6B5A] font-semibold mt-0.5">
                          {panchang.tithiStartTime}
                        </span>
                      )}
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-[#E8E6DF]">
                      <span className="text-[10px] text-[#7A7A7A] block uppercase">Nakshatra</span>
                      <strong className="text-[#3D3D3D]">{panchang.nakshatra}</strong>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-[#E8E6DF]">
                      <span className="text-[10px] text-[#7A7A7A] block uppercase">Yoga</span>
                      <strong className="text-[#3D3D3D]">{panchang.yoga}</strong>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-[#E8E6DF]">
                      <span className="text-[10px] text-[#7A7A7A] block uppercase">Karana</span>
                      <strong className="text-[#3D3D3D]">{panchang.karana}</strong>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-[#E8E6DF]">
                      <span className="text-[10px] text-[#7A7A7A] block uppercase">Rahu Kaal</span>
                      <strong className="text-[#B8856B]">{panchang.rahuKaal}</strong>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-[#E8E6DF]">
                      <span className="text-[10px] text-[#7A7A7A] block uppercase">Abhijit Muhurat</span>
                      <strong className="text-[#5C6B5A]">{panchang.abhijitMuhurat}</strong>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-[#E8E6DF] col-span-2 sm:col-span-3">
                      <span className="text-[10px] text-[#8B9D83] block uppercase font-bold">Hindu Date &amp; Vikram Samvat</span>
                      <strong className="text-[#3D3D3D] text-sm">{panchang.hinduDate || `${panchang.tithi} (${panchang.tithiStartTime || "Starts at 10:55 PM"}), ${panchang.samvat}`}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#7A7A7A]">Loading Panchang records...</p>
                )}
              </div>
            </div>
          )}

          {/* 5. DYNAMIC HOROSCOPES DATA */}
          {activeTab === "horoscopes" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF]">
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#3D3D3D]">
                    12 Zodiac Signs &amp; Daily Predictions (Dynamic DB)
                  </h4>
                  <p className="text-xs text-[#7A7A7A]">
                    Stored in dynamic database. Synchronized with daily delivery engine, preview cards, and AI oracle.
                  </p>
                </div>
                <button
                  onClick={handleGenerateAiHoroscopes}
                  disabled={generatingAi}
                  className="px-4 py-2 rounded-xl bg-[#8B9D83] text-white text-xs font-bold hover:bg-[#7A8C73] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                  title="Generate AI-powered Vedic predictions using Gemini"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${generatingAi ? "animate-spin" : ""}`} />
                  <span>{generatingAi ? "Generating AI Predictions..." : "Generate AI Predictions (All 12)"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredHoroscopes.map((h) => (
                  <div key={h.id} className="p-4 rounded-2xl bg-white border border-[#E8E6DF] shadow-xs space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{h.symbol}</span>
                        <div>
                          <h5 className="font-serif font-bold text-sm text-[#3D3D3D]">
                            {h.name} <span className="text-xs text-[#8B9D83]">({h.vedicName})</span>
                          </h5>
                          <p className="text-[10px] text-[#7A7A7A]">{h.dates} • {h.element} Element</p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF9F6] border border-[#E8E6DF] text-[#7A7A7A] font-bold">
                        #{h.luckyNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 py-1.5 px-2 rounded-xl bg-[#FAF9F6] text-[10px] text-[#5C6B5A]">
                      <div>
                        <span className="text-[#7A7A7A] block text-[9px] uppercase">Lucky Color</span>
                        <span className="font-semibold">{h.luckyColor}</span>
                      </div>
                      <div>
                        <span className="text-[#7A7A7A] block text-[9px] uppercase">Lucky Num</span>
                        <span className="font-semibold">{h.luckyNumber}</span>
                      </div>
                      <div>
                        <span className="text-[#7A7A7A] block text-[9px] uppercase">Gemstone</span>
                        <span className="font-semibold truncate block">{h.gemstone}</span>
                      </div>
                    </div>

                    <div className="text-xs text-[#3D3D3D] line-clamp-3 bg-[#FAF9F6]/60 p-2.5 rounded-xl border border-[#E8E6DF]/60">
                      <span className="text-[10px] text-[#8B9D83] block font-bold uppercase tracking-wider">Prediction:</span>
                      {h.prediction}
                    </div>

                    <div className="text-xs text-[#5C6B5A] bg-[#EDF3EC]/60 p-2 rounded-xl border border-[#8B9D83]/20">
                      <span className="text-[10px] text-[#5C6B5A] font-bold uppercase tracking-wider block">Vedic Remedy:</span>
                      {h.remedy}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. DYNAMIC SUBSCRIPTION PLANS */}
          {activeTab === "plans" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF]">
                <h4 className="font-serif font-bold text-sm text-[#3D3D3D]">
                  Subscription Tiers &amp; Pricing Plans (Dynamic DB)
                </h4>
                <p className="text-xs text-[#7A7A7A]">
                  Configured pricing tiers, validity duration, billing frequency, and feature allowances.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border shadow-xs space-y-3 ${
                      p.popular
                        ? "bg-[#FAF9F6] border-[#8B9D83] ring-1 ring-[#8B9D83]/30"
                        : "bg-white border-[#E8E6DF]"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="font-serif font-bold text-base text-[#3D3D3D]">{p.name}</h5>
                          {p.popular && (
                            <span className="px-2 py-0.5 rounded-full bg-[#8B9D83] text-white text-[9px] font-bold">
                              Most Popular
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#7A7A7A] uppercase tracking-wider">
                          {p.validityDays} Days • {p.billingCycle}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-serif font-bold text-xl text-[#3D3D3D]">
                          {p.price === 0 ? "Free" : `₹${p.price}`}
                        </span>
                        {p.discount && (
                          <span className="block text-[10px] text-[#8B9D83] font-bold">{p.discount}</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-[#E8E6DF]">
                      {p.features?.map((feat: string, fIdx: number) => (
                        <div key={fIdx} className="flex items-center gap-2 text-xs text-[#5C6B5A]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#8B9D83] shrink-0" />
                          <span className="line-clamp-1">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. DYNAMIC TESTIMONIALS */}
          {activeTab === "testimonials" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF]">
                <h4 className="font-serif font-bold text-sm text-[#3D3D3D]">
                  Devotee Testimonials &amp; Reviews (Dynamic DB)
                </h4>
                <p className="text-xs text-[#7A7A7A]">
                  Real subscriber stories and feedback powering the home testimonials carousel.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTestimonials.map((t) => (
                  <div key={t.id} className="p-4 rounded-2xl bg-white border border-[#E8E6DF] shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-serif font-bold text-sm text-[#3D3D3D]">{t.name}</h5>
                        <p className="text-[10px] text-[#7A7A7A]">{t.city} • {t.sign}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF9F6] border border-[#E8E6DF] text-[#8B9D83] font-bold">
                        {t.plan}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[#CB997E]">
                      {Array.from({ length: t.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>

                    <p className="text-xs italic text-[#3D3D3D] bg-[#FAF9F6] p-2.5 rounded-xl border border-[#E8E6DF]">
                      "{t.text}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. DYNAMIC FAQS */}
          {activeTab === "faqs" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF]">
                <h4 className="font-serif font-bold text-sm text-[#3D3D3D]">
                  Frequently Asked Questions (Dynamic DB)
                </h4>
                <p className="text-xs text-[#7A7A7A]">
                  Dynamic Q&amp;A pairs displayed on the public landing page.
                </p>
              </div>

              <div className="space-y-2.5">
                {filteredFaqs.map((f, idx) => (
                  <div key={f.id || idx} className="p-4 rounded-2xl bg-white border border-[#E8E6DF] shadow-xs space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-[#8B9D83] shrink-0" />
                        <h5 className="font-semibold text-xs sm:text-sm text-[#3D3D3D]">{f.q}</h5>
                      </div>
                      {f.category && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF9F6] text-[#7A7A7A] border border-[#E8E6DF]">
                          {f.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#7A7A7A] pl-6 leading-relaxed">
                      {f.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FAF9F6] border-t border-[#E8E6DF] flex items-center justify-between text-xs text-[#7A7A7A]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8B9D83]" />
            <span>Database Storage: Persistent file store (`data/database.json`) &amp; ready for Firestore connection</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#8B9D83] text-white font-bold text-xs hover:bg-[#7A8C73] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

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
                    Update Devotee Mobile
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
                  ✓ Ready to migrate account from <strong>+91 {quickEditMobileSub.originalMobile}</strong> to <strong>+91 {quickEditMobileSub.mobile}</strong>. All records will transfer seamlessly.
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
    </div>
  );
};
