import React, { useState, useEffect } from "react";
import {
  Clock,
  Mail,
  Send,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Calendar,
  UserCheck,
  UserX,
  FileText,
  Eye,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertTriangle,
  Zap,
  ExternalLink,
  Info,
} from "lucide-react";
import {
  EmailSchedulerConfig,
  EmailSchedulerLog,
  StoredSubscriber,
} from "../types";
import { ZODIAC_SIGNS, SUBSCRIPTION_PLANS } from "../data/astrologyData";

interface EmailSchedulerTabProps {
  subscribers: StoredSubscriber[];
  onSubscribersUpdated?: () => void;
}

export const EmailSchedulerTab: React.FC<EmailSchedulerTabProps> = ({
  subscribers,
  onSubscribersUpdated,
}) => {
  const [config, setConfig] = useState<EmailSchedulerConfig>({
    enabled: true,
    scheduleTime: "07:00 AM",
    frequency: "daily",
    senderName: "Acharya JyotishVani Kendra",
    senderEmail: "horoscope@jyotishvani.live",
    subjectTemplate: "🌟 Your Daily Vedic Horoscope & Shubh Muhurat - {{date}}",
    includePanchang: true,
    includeRemedies: true,
    targetSubscriptionTiers: ["trial", "monthly", "three_months", "six_months", "yearly"],
  });

  const [logs, setLogs] = useState<EmailSchedulerLog[]>([]);
  const [metrics, setMetrics] = useState<{
    totalSubscribers: number;
    activeSubscribers: number;
    activeWithEmail: number;
    activeWithoutEmail: number;
  }>({
    totalSubscribers: subscribers.length,
    activeSubscribers: subscribers.filter((s) => s.status === "active" || s.status === "trial").length,
    activeWithEmail: 0,
    activeWithoutEmail: 0,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [testing, setTesting] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [creatingTestSmtp, setCreatingTestSmtp] = useState(false);
  const [testEmail, setTestEmail] = useState("devotee@example.com");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
    previewUrl?: string;
  } | null>(null);

  // Email Preview State
  const [selectedPreviewSign, setSelectedPreviewSign] = useState<string>("scorpio");
  const [selectedPreviewSubMobile, setSelectedPreviewSubMobile] = useState<string>("");
  const [previewContent, setPreviewContent] = useState<{
    subject: string;
    html: string;
    text: string;
    summary: string;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState<"html" | "text">("html");
  const [copiedHtml, setCopiedHtml] = useState(false);

  // Log Inspection
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Devotee quick contact edit modal (Email & Name)
  const [editingSubContact, setEditingSubContact] = useState<{
    originalMobile: string;
    mobile: string;
    name: string;
    email: string;
  } | null>(null);
  const [savingSubContact, setSavingSubContact] = useState(false);

  // Modal to inspect full email dispatched
  const [selectedEmailModal, setSelectedEmailModal] = useState<{
    devoteeName: string;
    email: string;
    sign: string;
    subject: string;
    previewUrl?: string;
    summary?: string;
  } | null>(null);

  // Admin authorization headers helper
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

  // Fetch Scheduler Configuration & History
  const fetchSchedulerData = async () => {
    setLoading(true);
    try {
      const [cfgRes, logsRes] = await Promise.all([
        fetch("/api/admin/scheduler/config", { headers: getAdminHeaders() }),
        fetch("/api/admin/scheduler/logs", { headers: getAdminHeaders() }),
      ]);

      if (cfgRes.ok) {
        const cfgData = await cfgRes.json();
        if (cfgData.config) {
          setConfig(cfgData.config);
        }
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData.logs) {
          setLogs(logsData.logs);
        }
      }
    } catch (err) {
      console.error("Failed to load scheduler data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedulerData();
  }, []);

  // Update metrics when subscribers change
  useEffect(() => {
    const active = subscribers.filter((s) => s.status === "active" || s.status === "trial");
    const withEmail = active.filter((s) => s.email && s.email.trim().length > 0 && s.email.includes("@"));
    setMetrics({
      totalSubscribers: subscribers.length,
      activeSubscribers: active.length,
      activeWithEmail: withEmail.length,
      activeWithoutEmail: active.length - withEmail.length,
    });
  }, [subscribers]);

  // Fetch live email template preview
  useEffect(() => {
    let isMounted = true;
    const fetchPreview = async () => {
      setPreviewLoading(true);
      try {
        const res = await fetch("/api/admin/scheduler/preview", {
          method: "POST",
          headers: getAdminHeaders(),
          body: JSON.stringify({
            zodiacSign: selectedPreviewSign,
            subscriberMobile: selectedPreviewSubMobile || undefined,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const content = data.preview || data;
          if (isMounted) {
            setPreviewContent({
              subject: content.subject || data.subject || "🌟 Your Daily Vedic Horoscope",
              html: content.html || data.html || "",
              text: content.text || data.text || "",
              summary: content.summary || data.summary || "",
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch horoscope preview:", err);
      } finally {
        if (isMounted) {
          setPreviewLoading(false);
        }
      }
    };

    fetchPreview();
    return () => {
      isMounted = false;
    };
  }, [selectedPreviewSign, selectedPreviewSubMobile]);

  // Save Configuration
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/scheduler/config", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          type: "success",
          text: `Daily Email Scheduler updated! Delivery set for ${config.scheduleTime} every morning.`,
        });
        setConfig(data.config);
      } else {
        setStatusMessage({
          type: "error",
          text: data.error || "Failed to update scheduler configuration.",
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Network error occurred while saving configuration.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Run Manual Broadcast
  const handleTriggerBroadcast = async () => {
    if (
      !confirm(
        `Are you sure you want to trigger the daily morning email broadcast now to ${metrics.activeWithEmail} active devotees?`
      )
    ) {
      return;
    }

    setRunning(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/scheduler/trigger", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          source: "admin_manual_trigger",
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: `Server error (Status: ${res.status})` };
      }

      if (res.ok && data.success) {
        const sent = data.emailSentCount ?? data.sentCount ?? 0;
        const skipped = data.skippedCount ?? 0;

        setStatusMessage({
          type: "success",
          text: `Daily broadcast completed! Dispatched ${sent} personalized horoscope emails (${skipped} skipped due to missing email).`,
          previewUrl: data.previewUrl,
        });

        fetchSchedulerData();
      } else {
        setStatusMessage({
          type: "error",
          text: data.error || "Execution error during manual broadcast.",
        });
      }
    } catch (err: any) {
      console.error("Daily broadcast error:", err);
      setStatusMessage({
        type: "error",
        text: err?.message ? `Network/Server error: ${err.message}` : "Network error occurred while executing daily broadcast.",
      });
    } finally {
      setRunning(false);
    }
  };

  // Send Single Test Email
  const handleSendTestEmail = async () => {
    const cleanEmail = testEmail.trim();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setStatusMessage({
        type: "error",
        text: "Please enter a valid recipient email address for testing.",
      });
      return;
    }

    setTesting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/scheduler/test-send", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          targetEmail: cleanEmail,
          zodiacSign: selectedPreviewSign,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: `Server error (Status: ${res.status})` };
      }

      if (res.ok && data.success) {
        setStatusMessage({
          type: "success",
          text: `Vedic Horoscope sample email successfully dispatched to ${cleanEmail}!`,
          previewUrl: data.previewUrl,
        });
      } else {
        setStatusMessage({
          type: "error",
          text: data.error || "Failed to dispatch test email.",
        });
      }
    } catch (err: any) {
      console.error("Test email error:", err);
      setStatusMessage({
        type: "error",
        text: err?.message ? `Dispatch failed: ${err.message}` : "Network error occurred while dispatching test email.",
      });
    } finally {
      setTesting(false);
    }
  };

  // Test SMTP Connection
  const handleTestSmtpConnection = async () => {
    setSmtpTesting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/scheduler/test-smtp", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          smtpHost: config.smtpHost,
          smtpPort: config.smtpPort,
          smtpUser: config.smtpUser,
          smtpPass: config.smtpPass,
          smtpSecure: config.smtpSecure,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          type: "success",
          text: `SMTP Connection Verified! Successfully authenticated with mail server ${data.host || config.smtpHost || "Ethereal"}.`,
        });
      } else {
        setStatusMessage({
          type: "error",
          text: `SMTP Connection Failed: ${data.error || "Could not authenticate with mail server."}`,
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Network error occurred while testing SMTP connection.",
      });
    } finally {
      setSmtpTesting(false);
    }
  };

  // Generate Ethereal Sandbox Account
  const handleCreateEtherealAccount = async () => {
    setCreatingTestSmtp(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/scheduler/create-ethereal", {
        method: "POST",
        headers: getAdminHeaders(),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setConfig((prev) => ({
          ...prev,
          smtpHost: data.account.smtpHost,
          smtpPort: data.account.smtpPort,
          smtpUser: data.account.smtpUser,
          smtpPass: data.account.smtpPass,
          smtpSecure: false,
          senderEmail: data.account.senderEmail || "horoscope@ethereal.email",
        }));

        setStatusMessage({
          type: "success",
          text: `Free Ethereal Test Account generated! User: ${data.account.smtpUser}. Dispatches will generate live webmail preview links automatically.`,
        });
      } else {
        setStatusMessage({
          type: "error",
          text: data.error || "Could not generate Ethereal test credentials.",
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Network error creating Ethereal test credentials.",
      });
    } finally {
      setCreatingTestSmtp(false);
    }
  };

  // Quick edit devotee email
  const handleSaveSubContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubContact) return;

    setSavingSubContact(true);
    try {
      const res = await fetch(`/api/subscribers/${editingSubContact.originalMobile}`, {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          mobile: editingSubContact.mobile.trim(),
          name: editingSubContact.name.trim(),
          email: editingSubContact.email.trim(),
          deliveryChannel: "email",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          type: "success",
          text: `Devotee contact info updated for ${editingSubContact.name}! Daily emails will be delivered to ${editingSubContact.email}.`,
        });
        setEditingSubContact(null);
        if (onSubscribersUpdated) onSubscribersUpdated();
        fetchSchedulerData();
      } else {
        alert(data.error || "Failed to update subscriber contact.");
      }
    } catch {
      alert("Network error updating contact info.");
    } finally {
      setSavingSubContact(false);
    }
  };

  const activeMissingEmailList = subscribers.filter(
    (s) =>
      (s.status === "active" || s.status === "trial") &&
      (!s.email || s.email.trim().length === 0 || !s.email.includes("@"))
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8E6DF] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#F0EDDF] text-[#5C6B5A]">
              <Mail className="w-5 h-5" />
            </div>
            <h1 className="font-serif font-bold text-2xl text-[#3D3D3D]">
              Daily Horoscope Email Scheduler
            </h1>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                config.enabled
                  ? "bg-[#EDF3EC] text-[#5C6B5A] border border-[#8B9D83]/30"
                  : "bg-[#FFF2F0] text-[#9E2A2B] border border-[#F5C2B8]"
              }`}
            >
              {config.enabled ? "● Active Daily (07:00 AM)" : "○ Paused"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#7A7A7A] mt-1.5 leading-relaxed">
            Automates the daily delivery of personalized Vedic astrology forecasts directly to devotees' email inboxes every morning.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchSchedulerData}
            disabled={loading}
            className="px-3.5 py-2 rounded-2xl bg-white hover:bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold text-[#5C6B5A] flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerBroadcast}
            disabled={running || metrics.activeWithEmail === 0}
            className="px-4 py-2 rounded-2xl bg-[#5C6B5A] hover:bg-[#4E5B4C] text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 transition-all"
            title="Execute daily email broadcast immediately"
          >
            {running ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Broadcasting...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run Broadcast Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start justify-between gap-3 animate-slideDown ${
            statusMessage.type === "success"
              ? "bg-[#EDF3EC] border-[#8B9D83]/40 text-[#3D4A3E]"
              : statusMessage.type === "error"
              ? "bg-[#FFF2F0] border-[#F5C2B8] text-[#9E2A2B]"
              : "bg-[#F0EDDF] border-[#E8E6DF] text-[#5C6B5A]"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-[#5C6B5A] shrink-0 mt-0.5" />
            ) : statusMessage.type === "error" ? (
              <AlertCircle className="w-5 h-5 text-[#9E2A2B] shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-[#5C6B5A] shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{statusMessage.text}</p>
              {statusMessage.previewUrl && (
                <a
                  href={statusMessage.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-bold underline hover:opacity-80"
                >
                  <span>Open Dispatched Email Webmail Preview</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Four KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="p-5 rounded-3xl bg-white border border-[#E8E6DF] shadow-xs">
          <div className="flex items-center justify-between text-[#7A7A7A] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Scheduled Hour</span>
            <Clock className="w-4 h-4 text-[#5C6B5A]" />
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#3D3D3D]">
            {config.scheduleTime || "07:00 AM"}
          </div>
          <p className="text-[11px] text-[#7A7A7A] mt-1">Every morning at dawn</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E8E6DF] shadow-xs">
          <div className="flex items-center justify-between text-[#7A7A7A] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Devotees</span>
            <UserCheck className="w-4 h-4 text-[#5C6B5A]" />
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#3D3D3D]">
            {metrics.activeSubscribers}
          </div>
          <p className="text-[11px] text-[#7A7A7A] mt-1">Active &amp; Trial members</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E8E6DF] shadow-xs">
          <div className="flex items-center justify-between text-[#7A7A7A] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Email Recipients</span>
            <Mail className="w-4 h-4 text-[#5C6B5A]" />
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#5C6B5A]">
            {metrics.activeWithEmail}
          </div>
          <p className="text-[11px] text-[#7A7A7A] mt-1">Ready for morning dispatch</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E8E6DF] shadow-xs">
          <div className="flex items-center justify-between text-[#7A7A7A] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Missing Email</span>
            <UserX className="w-4 h-4 text-[#CB997E]" />
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#CB997E]">
            {metrics.activeWithoutEmail}
          </div>
          <p className="text-[11px] text-[#7A7A7A] mt-1">Skipped until email is saved</p>
        </div>
      </div>

      {/* Main Action & Sandbox Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box A: Manual Broadcast Trigger */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E8E6DF] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-xl bg-[#F0EDDF] text-[#5C6B5A] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#3D3D3D]">
                Manual Morning Broadcast
              </h3>
            </div>
            <p className="text-xs text-[#7A7A7A] leading-relaxed">
              Triggers today's planetary calculations, Rahu Kaal muhurat, and personalized horoscopes for all {metrics.activeWithEmail} active devotees immediately.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E8E6DF] flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-[#7A7A7A]">
              Recipients: <strong className="text-[#3D3D3D]">{metrics.activeWithEmail} devotees</strong>
            </div>
            <button
              type="button"
              onClick={handleTriggerBroadcast}
              disabled={running || metrics.activeWithEmail === 0}
              className="px-5 py-2.5 rounded-2xl bg-[#5C6B5A] hover:bg-[#4E5B4C] text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 transition-all"
            >
              {running ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Transmitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Broadcast to All</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Box B: Send Sample / Test Dispatch */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E8E6DF] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-xl bg-[#F0EDDF] text-[#5C6B5A] flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#3D3D3D]">
                Sample Email Dispatch Sandbox
              </h3>
            </div>
            <p className="text-xs text-[#7A7A7A] leading-relaxed">
              Dispatch a test email formatted with live Vedic Ephemeris, Rahu Kaal, lucky attributes &amp; custom horoscope to any target address.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E8E6DF] flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 px-3.5 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-semibold text-[#3D3D3D] focus:outline-none focus:border-[#5C6B5A]"
            />
            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={testing || !testEmail}
              className="px-4 py-2 rounded-xl bg-[#5C6B5A] hover:bg-[#4E5B4C] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 whitespace-nowrap transition-all"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Sample Email</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Scheduler Configuration Form */}
      <form onSubmit={handleSaveConfig} className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E8E6DF] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E6DF] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-lg text-[#3D3D3D]">
                Daily Horoscope Scheduler Settings (Email Delivery)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EDF3EC] text-[#5C6B5A] text-[10px] font-bold border border-[#8B9D83]/30">
                node-cron Background Service
              </span>
            </div>
            <p className="text-xs text-[#7A7A7A] mt-1">
              Automates the daily delivery of personalized Vedic astrology forecasts directly to active devotees via email.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Enable/Disable Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs font-bold text-[#3D3D3D]">
                {config.enabled ? "Scheduler Active" : "Scheduler Paused"}
              </span>
              <div
                onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  config.enabled ? "bg-[#5C6B5A]" : "bg-[#D9D9D9]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                    config.enabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl bg-[#5C6B5A] hover:bg-[#4E5B4C] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save Settings"}</span>
            </button>
          </div>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Schedule Time */}
          <div>
            <label className="block text-xs font-bold text-[#3D3D3D] uppercase tracking-wider mb-1.5">
              Scheduled Morning Time
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-[#7A7A7A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={config.scheduleTime}
                onChange={(e) => setConfig({ ...config, scheduleTime: e.target.value })}
                placeholder="07:00 AM"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold text-[#3D3D3D] focus:outline-none focus:border-[#5C6B5A]"
              />
            </div>
            <span className="text-[11px] text-[#7A7A7A] mt-1 block">Default: 07:00 AM Indian Standard Time</span>
          </div>

          {/* Sender Name */}
          <div>
            <label className="block text-xs font-bold text-[#3D3D3D] uppercase tracking-wider mb-1.5">
              Sender Name
            </label>
            <input
              type="text"
              value={config.senderName}
              onChange={(e) => setConfig({ ...config, senderName: e.target.value })}
              placeholder="Acharya JyotishVani Kendra"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold text-[#3D3D3D] focus:outline-none focus:border-[#5C6B5A]"
            />
            <span className="text-[11px] text-[#7A7A7A] mt-1 block">Appears in devotees' inboxes</span>
          </div>

          {/* Sender Email */}
          <div>
            <label className="block text-xs font-bold text-[#3D3D3D] uppercase tracking-wider mb-1.5">
              Sender Email Address
            </label>
            <input
              type="email"
              value={config.senderEmail}
              onChange={(e) => setConfig({ ...config, senderEmail: e.target.value })}
              placeholder="horoscope@jyotishvani.live"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold text-[#3D3D3D] focus:outline-none focus:border-[#5C6B5A]"
            />
            <span className="text-[11px] text-[#7A7A7A] mt-1 block">From header address</span>
          </div>
        </div>

        {/* Subject Template */}
        <div>
          <label className="block text-xs font-bold text-[#3D3D3D] uppercase tracking-wider mb-1.5">
            Email Subject Template
          </label>
          <input
            type="text"
            value={config.subjectTemplate}
            onChange={(e) => setConfig({ ...config, subjectTemplate: e.target.value })}
            placeholder="🌟 Your Daily Vedic Horoscope & Shubh Muhurat - {{date}}"
            className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold text-[#3D3D3D] focus:outline-none focus:border-[#5C6B5A]"
          />
          <span className="text-[11px] text-[#7A7A7A] mt-1 block">
            Supports variables: <code>{"{{date}}"}</code>, <code>{"{{name}}"}</code>, <code>{"{{sign}}"}</code>
          </span>
        </div>

        {/* Toggles: Panchang & Remedies */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E8E6DF]">
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] cursor-pointer hover:bg-[#F5F5F0] transition-colors">
            <input
              type="checkbox"
              checked={config.includePanchang}
              onChange={(e) => setConfig({ ...config, includePanchang: e.target.checked })}
              className="mt-0.5 rounded text-[#5C6B5A] focus:ring-[#8B9D83]"
            />
            <div>
              <span className="text-xs font-bold text-[#3D3D3D] block">Include Shubh Panchang &amp; Rahu Kaal</span>
              <span className="text-[11px] text-[#7A7A7A]">Calculates Tithi, Nakshatra, Yoga, and exact inauspicious hours for the day.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6DF] cursor-pointer hover:bg-[#F5F5F0] transition-colors">
            <input
              type="checkbox"
              checked={config.includeRemedies}
              onChange={(e) => setConfig({ ...config, includeRemedies: e.target.checked })}
              className="mt-0.5 rounded text-[#5C6B5A] focus:ring-[#8B9D83]"
            />
            <div>
              <span className="text-xs font-bold text-[#3D3D3D] block">Include Daily Sattvic Remedies (Upaya)</span>
              <span className="text-[11px] text-[#7A7A7A]">Appends sacred chants, lucky colors, auspicious numbers, and gemstone advice.</span>
            </div>
          </label>
        </div>

        {/* SMTP Configuration Accordion */}
        <div className="pt-4 border-t border-[#E8E6DF] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-[#3D3D3D] uppercase tracking-wider block">
                Custom SMTP Mail Server (Production / Live Dispatch)
              </span>
              <p className="text-[11px] text-[#7A7A7A]">
                Configure your outgoing mail host (e.g. Amazon SES, Gmail App Password, Brevo, SendGrid, or local postfix).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreateEtherealAccount}
                disabled={creatingTestSmtp}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF9F6] border border-[#E8E6DF] text-[11px] font-bold text-[#5C6B5A] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <Zap className="w-3 h-3 text-amber-500" />
                <span>{creatingTestSmtp ? "Generating..." : "Generate Test Mailbox"}</span>
              </button>

              <button
                type="button"
                onClick={handleTestSmtpConnection}
                disabled={smtpTesting}
                className="px-3 py-1.5 rounded-xl bg-[#FAF9F6] hover:bg-[#EDF3EC] border border-[#8B9D83]/30 text-[11px] font-bold text-[#5C6B5A] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <RefreshCw className={`w-3 h-3 ${smtpTesting ? "animate-spin" : ""}`} />
                <span>Test Connection</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#FAF9F6] p-4 rounded-2xl border border-[#E8E6DF]">
            <div>
              <label className="block text-[11px] font-bold text-[#4A4A4A] mb-1">SMTP Host</label>
              <input
                type="text"
                value={config.smtpHost || ""}
                onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
                className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#E8E6DF] text-xs font-semibold text-[#3D3D3D] focus:outline-none focus:border-[#5C6B5A]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#4A4A4A] mb-1">SMTP Port</label>
              <input
                type="number"
                value={config.smtpPort || 587}
                onChange={(e) => setConfig({ ...config, smtpPort: Number(e.target.value) })}
                placeholder="587"
                className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#E8E6DF] text-xs font-semibold text-[#3D3D3D] focus:outline-none focus:border-[#5C6B5A]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#4A4A4A] mb-1">Username / Account</label>
              <input
                type="text"
                value={config.smtpUser || ""}
                onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
                placeholder="horoscope@gmail.com"
                className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#E8E6DF] text-xs font-semibold text-[#3D3D3D] focus:outline-none focus:border-[#5C6B5A]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#4A4A4A] mb-1">Password / App Key</label>
              <input
                type="password"
                value={config.smtpPass || ""}
                onChange={(e) => setConfig({ ...config, smtpPass: e.target.value })}
                placeholder="App-specific password"
                className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#E8E6DF] text-xs font-semibold text-[#3D3D3D] focus:outline-none focus:border-[#5C6B5A]"
              />
            </div>
          </div>
        </div>
      </form>

      {/* Devotees Missing Email Alert */}
      {activeMissingEmailList.length > 0 && (
        <div className="p-5 rounded-3xl bg-[#FFF2F0] border border-[#F5C2B8] shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#9E2A2B] shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-serif font-bold text-sm text-[#9E2A2B]">
                {activeMissingEmailList.length} Active Devotee(s) Missing Registered Email
              </h3>
              <p className="text-xs text-[#7A7A7A] mt-0.5">
                These devotees have active or trial subscriptions but have not registered an email address. The scheduler will skip them during daily email runs until an email is attached.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {activeMissingEmailList.slice(0, 5).map((sub) => (
                  <button
                    key={sub.mobile}
                    type="button"
                    onClick={() =>
                      setEditingSubContact({
                        originalMobile: sub.mobile,
                        mobile: sub.mobile,
                        name: sub.name,
                        email: sub.email || "",
                      })
                    }
                    className="px-3 py-1 rounded-xl bg-white border border-[#F5C2B8] text-xs font-bold text-[#3D3D3D] hover:bg-[#FAF9F6] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>{sub.name}</span>
                    <span className="font-mono text-[#7A7A7A]">(+91 {sub.mobile.slice(-10)})</span>
                    <span className="text-[#9E2A2B] font-bold text-[10px]">+ Add Email</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Email Preview Box */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E8E6DF] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E6DF] pb-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#3D3D3D] flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#5C6B5A]" />
              <span>Live Email Horoscope Template Preview</span>
            </h3>
            <p className="text-xs text-[#7A7A7A] mt-0.5">
              Rendered dynamically with today's ephemeris transits, Nakshatra, and customized remedies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedPreviewSign}
              onChange={(e) => setSelectedPreviewSign(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold text-[#3D3D3D] focus:outline-none focus:border-[#5C6B5A]"
            >
              {ZODIAC_SIGNS.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.symbol} {z.name} ({z.vedicName})
                </option>
              ))}
            </select>

            <div className="flex items-center rounded-xl bg-[#FAF9F6] p-0.5 border border-[#E8E6DF]">
              <button
                type="button"
                onClick={() => setPreviewMode("html")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  previewMode === "html"
                    ? "bg-[#5C6B5A] text-white shadow-2xs"
                    : "text-[#7A7A7A] hover:text-[#3D3D3D]"
                }`}
              >
                Rich HTML
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("text")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  previewMode === "text"
                    ? "bg-[#5C6B5A] text-white shadow-2xs"
                    : "text-[#7A7A7A] hover:text-[#3D3D3D]"
                }`}
              >
                Plain Text
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (previewContent?.html) {
                  navigator.clipboard.writeText(previewContent.html);
                  setCopiedHtml(true);
                  setTimeout(() => setCopiedHtml(false), 2000);
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-[#FAF9F6] hover:bg-[#F0EDDF] border border-[#E8E6DF] text-xs font-bold text-[#5C6B5A] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              {copiedHtml ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedHtml ? "Copied!" : "Copy HTML"}</span>
            </button>
          </div>
        </div>

        {/* Email Header Preview Bar */}
        <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#E8E6DF] text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#7A7A7A] w-14">Subject:</span>
            <span className="font-serif font-bold text-[#3D3D3D]">
              {previewContent?.subject || "🕉️ Dainik Vedic Rashifal & Shubh Muhurat"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#7A7A7A] w-14">From:</span>
            <span className="text-[#4A4A4A]">
              {config.senderName} &lt;{config.senderEmail}&gt;
            </span>
          </div>
        </div>

        {/* Preview Frame */}
        <div className="rounded-2xl border border-[#E8E6DF] overflow-hidden bg-white shadow-inner relative">
          {previewMode === "html" ? (
            previewContent?.html ? (
              <iframe
                srcDoc={previewContent.html}
                title="Daily Horoscope Email Preview"
                className="w-full h-[540px] border-0"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-center p-8 bg-[#FAF9F6]">
                <RefreshCw className="w-7 h-7 text-[#8B9D83] animate-spin mb-3" />
                <p className="text-sm font-bold text-[#3D3D3D]">Generating Vedic Horoscope Email Preview...</p>
                <p className="text-xs text-[#7A7A7A] mt-1.5 max-w-md">
                  Formatting today's planetary transits, Panchang calculations, and astrological guidance for {selectedPreviewSign}.
                </p>
              </div>
            )
          ) : (
            <pre className="p-6 text-xs text-[#3D3D3D] font-mono whitespace-pre-wrap leading-relaxed max-h-[540px] overflow-y-auto">
              {previewContent?.text || (previewLoading ? "Generating plain-text version..." : "No preview text available.")}
            </pre>
          )}
        </div>
      </div>

      {/* Execution Logs & Historical Dispatches */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E8E6DF] shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#E8E6DF] pb-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#3D3D3D] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#5C6B5A]" />
              <span>Daily Broadcast Execution History &amp; Audit Logs</span>
            </h3>
            <p className="text-xs text-[#7A7A7A] mt-0.5">
              Detailed tracking of every automated 07:00 AM delivery and manual broadcast.
            </p>
          </div>

          <span className="text-xs text-[#7A7A7A] font-semibold">
            {logs.length} Total Runs Recorded
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center bg-[#FAF9F6] rounded-2xl border border-[#E8E6DF] text-xs text-[#7A7A7A]">
            No broadcast runs recorded yet. Click &quot;Run Broadcast Now&quot; above to execute the first run.
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div
                  key={log.id}
                  className="rounded-2xl border border-[#E8E6DF] overflow-hidden bg-white transition-all shadow-2xs"
                >
                  {/* Log summary row */}
                  <div
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="p-4 bg-[#FAF9F6] hover:bg-[#F5F5F0] flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          log.status === "success"
                            ? "bg-[#EDF3EC] text-[#5C6B5A]"
                            : log.status === "failed"
                            ? "bg-[#FFF2F0] text-[#9E2A2B]"
                            : "bg-[#F0EDDF] text-[#CB997E]"
                        }`}
                      >
                        {log.status === "success" ? "✓" : "!"}
                      </div>

                      <div>
                        <div className="font-serif font-bold text-sm text-[#3D3D3D]">
                          {new Date(log.runAt).toLocaleDateString("en-IN", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          at{" "}
                          {new Date(log.runAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <span className="text-[11px] text-[#7A7A7A]">
                          Trigger:{" "}
                          <strong className="text-[#3D3D3D]">
                            {log.trigger === "scheduled_daily"
                              ? "Automated Daily Cron"
                              : "Manual Admin Execution"}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-right flex flex-col items-end gap-0.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5C6B5A] bg-[#EDF3EC] px-2.5 py-0.5 rounded-md border border-[#8B9D83]/30">
                          <Mail className="w-3 h-3" />
                          {log.emailSentCount ?? log.sentCount} Emails Dispatched
                        </span>
                        {log.skippedCount > 0 && (
                          <span className="text-[#CB997E] text-[10px]">({log.skippedCount} skipped without email)</span>
                        )}
                        <span className="text-[#7A7A7A] block text-[10px]">
                          Targeted: {log.totalTargeted} Devotees
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#7A7A7A]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#7A7A7A]" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Recipient Dispatches Table */}
                  {isExpanded && (
                    <div className="p-4 border-t border-[#E8E6DF] overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#FAF9F6] text-[#7A7A7A] uppercase text-[10px] tracking-wider border-b border-[#E8E6DF]">
                          <tr>
                            <th className="py-2.5 px-3 font-bold">Devotee Contact</th>
                            <th className="py-2.5 px-3 font-bold">Rashi &amp; Plan</th>
                            <th className="py-2.5 px-3 font-bold">Delivery Channel</th>
                            <th className="py-2.5 px-3 font-bold">Status</th>
                            <th className="py-2.5 px-3 font-bold">Email Preview &amp; Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E6DF]">
                          {log.dispatches.map((disp, idx) => (
                            <tr key={idx} className="hover:bg-[#FAF9F6]">
                              <td className="py-2.5 px-3">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold text-[#3D3D3D] block">{disp.name}</span>
                                  {disp.mobile && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingSubContact({
                                          originalMobile: disp.mobile,
                                          mobile: disp.mobile,
                                          name: disp.name,
                                          email: disp.email || "",
                                        })
                                      }
                                      className="text-[10px] text-[#5C6B5A] hover:text-[#3D3D3D] bg-[#FAF9F6] hover:bg-[#F0EDDF] px-1.5 py-0.5 rounded border border-[#E8E6DF] font-semibold cursor-pointer transition-colors"
                                      title="Edit Devotee Email"
                                    >
                                      Edit Email
                                    </button>
                                  )}
                                </div>
                                <div className="flex flex-col gap-0.5 mt-0.5 text-[11px]">
                                  {disp.email ? (
                                    <span className="text-[#5C6B5A] font-mono text-[10px] flex items-center gap-1">
                                      <Mail className="w-3 h-3 shrink-0" />
                                      {disp.email}
                                    </span>
                                  ) : (
                                    <span className="text-[#CB997E] text-[10px] italic">No email saved</span>
                                  )}
                                </div>
                              </td>

                              <td className="py-2.5 px-3 text-[#7A7A7A]">
                                <span className="font-semibold text-[#3D3D3D] block capitalize">
                                  {disp.zodiacSign}
                                </span>
                                <span className="text-[10px]">{disp.planName}</span>
                              </td>

                              <td className="py-2.5 px-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EDF3EC] text-[#5C6B5A] border border-[#8B9D83]/30">
                                  <Mail className="w-2.5 h-2.5" />
                                  Email
                                </span>
                              </td>

                              <td className="py-2.5 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                                    disp.status === "delivered" || disp.emailStatus === "delivered"
                                      ? "bg-[#EDF3EC] text-[#5C6B5A]"
                                      : "bg-[#FFF2F0] text-[#9E2A2B]"
                                  }`}
                                >
                                  {disp.emailStatus || disp.status}
                                </span>
                              </td>

                              <td className="py-2.5 px-3 text-[11px] max-w-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-[#7A7A7A] truncate text-[11px] flex-1">
                                    {disp.previewSummary || "Daily Vedic Horoscope Dispatched"}
                                  </span>

                                  {disp.previewUrl && (
                                    <a
                                      href={disp.previewUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] text-[#5C6B5A] hover:text-[#3D3D3D] bg-white px-2 py-0.5 rounded-md font-bold border border-[#E8E6DF] transition-colors shadow-2xs whitespace-nowrap"
                                    >
                                      <ExternalLink className="w-2.5 h-2.5" />
                                      View Webmail
                                    </a>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedEmailModal({
                                        devoteeName: disp.name,
                                        email: disp.email || "",
                                        sign: disp.zodiacSign,
                                        subject: disp.subject || "🕉️ Dainik Vedic Rashifal",
                                        previewUrl: disp.previewUrl,
                                        summary: disp.previewSummary,
                                      })
                                    }
                                    className="inline-flex items-center gap-1 text-[10px] text-[#5C6B5A] hover:text-[#3D3D3D] bg-[#FAF9F6] hover:bg-[#F0EDDF] px-2 py-0.5 rounded-md font-bold border border-[#E8E6DF] transition-colors cursor-pointer whitespace-nowrap"
                                  >
                                    <Eye className="w-2.5 h-2.5" />
                                    Details
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Devotee Contact Modal */}
      {editingSubContact && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E8E6DF] shadow-2xl p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#E8E6DF] pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-[#3D3D3D]">
                  Edit Devotee Email &amp; Contact
                </h3>
                <p className="text-[11px] text-[#7A7A7A]">
                  For morning daily horoscope delivery
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSubContact(null)}
                className="text-[#7A7A7A] hover:text-[#3D3D3D] text-lg font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSubContact} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1">Devotee Name</label>
                <input
                  type="text"
                  required
                  value={editingSubContact.name}
                  onChange={(e) => setEditingSubContact({ ...editingSubContact, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-bold text-[#3D3D3D] focus:outline-none focus:border-[#5C6B5A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1">Email Address (Primary)</label>
                <input
                  type="email"
                  required
                  value={editingSubContact.email}
                  onChange={(e) => setEditingSubContact({ ...editingSubContact, email: e.target.value })}
                  placeholder="devotee@example.com"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-mono font-bold text-[#3D3D3D] focus:outline-none focus:border-[#5C6B5A]"
                />
                <span className="text-[10px] text-[#7A7A7A] mt-1 block">
                  Daily Vedic horoscope will be delivered here every morning at 07:00 AM.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1">Mobile Number (+91)</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={editingSubContact.mobile}
                  onChange={(e) =>
                    setEditingSubContact({
                      ...editingSubContact,
                      mobile: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] text-xs font-mono font-bold text-[#3D3D3D] focus:outline-none focus:border-[#5C6B5A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E6DF]">
                <button
                  type="button"
                  onClick={() => setEditingSubContact(null)}
                  className="px-4 py-2 rounded-xl border border-[#E8E6DF] text-xs font-semibold text-[#7A7A7A] hover:text-[#3D3D3D] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSubContact}
                  className="px-5 py-2 rounded-xl bg-[#5C6B5A] hover:bg-[#4E5B4C] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {savingSubContact ? "Saving..." : "Save Devotee Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatched Email Details Modal */}
      {selectedEmailModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#E8E6DF] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-[#5C6B5A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#8B9D83] flex items-center justify-center text-white">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-white">
                    Daily Horoscope Email Record
                  </h3>
                  <p className="text-[11px] text-[#F0EDDF]/80">
                    Recipient: {selectedEmailModal.devoteeName} ({selectedEmailModal.email})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEmailModal(null)}
                className="text-white/80 hover:text-white text-lg font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto">
              <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E8E6DF] text-xs space-y-1">
                <div><strong>Zodiac Sign:</strong> {selectedEmailModal.sign}</div>
                <div><strong>Subject:</strong> {selectedEmailModal.subject}</div>
                <div><strong>Recipient Email:</strong> {selectedEmailModal.email}</div>
                {selectedEmailModal.summary && (
                  <div><strong>Summary:</strong> {selectedEmailModal.summary}</div>
                )}
              </div>

              {selectedEmailModal.previewUrl && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
                  <span className="text-emerald-800 font-bold">Live Ethereal Webmail Preview Available</span>
                  <a
                    href={selectedEmailModal.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] inline-flex items-center gap-1 shadow-xs"
                  >
                    <span>Open Webmail</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-[#E8E6DF] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEmailModal(null)}
                className="px-4 py-2 rounded-xl border border-[#E8E6DF] text-xs font-semibold text-[#7A7A7A] hover:text-[#3D3D3D] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
