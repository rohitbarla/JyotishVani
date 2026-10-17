import fs from "fs";
import path from "path";
import {
  StoredHoroscope,
  StoredPlan,
  StoredTestimonial,
  StoredFaq,
  DEFAULT_HOROSCOPES,
  DEFAULT_PLANS,
  DEFAULT_TESTIMONIALS,
  DEFAULT_FAQS,
} from "./defaultData";
import {
  syncSubscriberToFirestore,
  removeSubscriberFromFirestore,
  syncCallbackToFirestore,
  syncConsultationToFirestore,
  syncAllToFirestore,
} from "./firestoreService";

export type { StoredHoroscope, StoredPlan, StoredTestimonial, StoredFaq };

export interface StoredSubscriber {
  id: string;
  mobile: string;
  name: string;
  email?: string;
  zodiacSign: string;
  birthDate?: string;
  birthTime?: string;
  birthCity?: string;
  dob?: string;
  tob?: string;
  pob?: string;
  city?: string;
  gotra?: string;
  nakshatra?: string;
  adminNotes?: string;
  emailVerified?: boolean;
  deliveryChannel: "whatsapp" | "sms" | "email" | "both" | "all" | string;
  deliveryTime: string;
  planId: "trial" | "monthly" | "three_months" | "six_months" | "yearly" | string;
  planName: string;
  price: number;
  status: "active" | "trial" | "expired" | "pending_otp" | "stopped" | "pending_verification";
  registeredAt: string;
  updatedAt?: string;
  validUntil: string;
  autoRenew?: boolean;
  otp?: string;
  phoneVerified?: boolean;
  phoneVerifiedAt?: string;
  verificationProvider?: string;
  lastHoroscopeSentAt?: string;
  lastDispatched?: string;
  createdAt?: string;
}

export interface EmailSchedulerConfig {
  enabled: boolean;
  scheduleTime: string; // e.g. "07:00 AM"
  frequency: "daily";
  senderName: string;
  senderEmail: string;
  subjectTemplate: string;
  includePanchang: boolean;
  includeRemedies: boolean;
  enableEmailDelivery?: boolean;
  enableWhatsAppDelivery?: boolean;
  enableSmsDelivery?: boolean;
  primaryMobileChannel?: "sms" | "whatsapp" | "both";
  smsGatewayProvider?: "device_sms" | "fast2sms" | "twilio_sms" | "custom_webhook" | "simulated_sms";
  fast2smsApiKey?: string;
  twilioSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  twilioSmsNumber?: string;
  customSmsUrl?: string;
  customSmsToken?: string;
  targetSubscriptionTiers: string[];
  lastRunAt?: string;
  nextRunAt?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
}

export interface EmailDispatchRecord {
  subscriberId: string;
  name: string;
  email: string;
  mobile?: string;
  zodiacSign: string;
  planName: string;
  status: "delivered" | "skipped" | "failed" | "queued";
  emailStatus?: "delivered" | "skipped" | "failed" | "queued";
  whatsappStatus?: "delivered" | "skipped" | "failed" | "queued";
  smsStatus?: "delivered" | "skipped" | "failed" | "queued";
  whatsappMessage?: string;
  whatsappUrl?: string;
  smsMessage?: string;
  smsUrl?: string;
  reason?: string;
  subject: string;
  sentAt: string;
  previewSummary?: string;
  deliveryMode?:
    | "smtp"
    | "simulated"
    | "simulated_sms"
    | "audit_log"
    | "simulation"
    | "twilio"
    | "twilio_sms"
    | "fast2sms"
    | "meta_cloud"
    | "custom_webhook"
    | "direct_gateway"
    | "device_sms";
  messageId?: string;
  previewUrl?: string;
}

export interface EmailSchedulerLog {
  id: string;
  runAt: string;
  trigger: "manual" | "scheduled_daily" | "test";
  totalTargeted: number;
  sentCount: number;
  emailSentCount?: number;
  whatsappSentCount?: number;
  smsSentCount?: number;
  skippedCount: number;
  status: "success" | "partial" | "failed";
  dispatches: EmailDispatchRecord[];
}

export interface StoredCallback {
  id: string;
  callerName: string;
  callerPhone: string;
  preferredTopic: string;
  helplineCalled: string; // "9560169988"
  requestedAt: string;
  status: "pending" | "connected" | "scheduled";
  notes?: string;
}

export interface StoredConsultation {
  id: string;
  userSign: string;
  birthDate?: string;
  question: string;
  answer: string;
  source: string;
  timestamp: string;
}

export interface StoredPanchang {
  date: string;
  hinduDate?: string;
  tithi: string;
  tithiStartTime?: string;
  tithiEndsAt?: string;
  tithiTiming?: string;
  paksha: string;
  nakshatra: string;
  yoga: string;
  karana: string;
  samvat: string;
  vikramSamvat?: string;
  shakaSamvat?: string;
  monthPurnimanta?: string;
  monthAmanta?: string;
  sunrise: string;
  sunset: string;
  rahuKaal: string;
  abhijitMuhurat: string;
  shubhMuhurat: string;
  moonSign: string;
  festivalNote?: string;
  isCustomized?: boolean;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
}

export interface DynamicSettings {
  helplineNumber: string; // "9560169988"
  helplineWhatsApp: string; // "9560169988"
  kendraTimings: string; // "10:00 AM – 7:30 PM (All 7 Days)"
  kendraLocation: string; // "Kashi Vishwanath Corridor, Varanasi & Delhi NCR Kendra"
  kendraStatus: "open" | "closed";
  upiId: string; // "9560169988@pthdfc"
  upiPayeeName: string; // "JyotishVani Kendra"
  trialDays: number; // 3
  planPrices: {
    trial: number; // 0
    monthly: number; // 150
    three_months: number; // 400
    six_months: number; // 500
    yearly: number; // 1000
  };
  announcementBanner: string;
}

export interface StoredPayment {
  id: string;
  mobile: string;
  userName: string;
  planId: string;
  planName: string;
  amount: number;
  upiIdUsed: string;
  utrNumber?: string;
  paymentMode: "upi_app" | "upi_qr" | "upi_manual";
  status: "verified" | "pending" | "rejected" | "failed";
  timestamp: string;
  adminNotes?: string;
  updatedAt?: string;
}

export interface DatabaseSchema {
  subscribers: Record<string, StoredSubscriber>; // keyed by cleanMobile
  callbacks: StoredCallback[];
  consultations: StoredConsultation[];
  panchang: Record<string, StoredPanchang>; // keyed by YYYY-MM-DD
  payments: StoredPayment[];
  settings: DynamicSettings;
  schedulerConfig: EmailSchedulerConfig;
  schedulerLogs: EmailSchedulerLog[];
  horoscopes: StoredHoroscope[];
  plans: StoredPlan[];
  testimonials: StoredTestimonial[];
  faqs: StoredFaq[];
  version: string;
  lastUpdated: string;
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "database.json");

// Ensure data folder exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initial Seed Data
const initialSeedData: DatabaseSchema = {
  version: "1.0.0",
  lastUpdated: new Date().toISOString(),
  subscribers: {
    "9811234567": {
      id: "SUB-1001",
      mobile: "9811234567",
      name: "Aarav Sharma",
      email: "aarav.sharma@vedicmail.in",
      zodiacSign: "Leo (Simha)",
      birthDate: "1988-08-14",
      birthTime: "06:45 AM",
      birthCity: "Varanasi",
      deliveryChannel: "email",
      deliveryTime: "07:00 AM",
      planId: "yearly",
      planName: "1 Year Cosmic Shield",
      price: 1000,
      status: "active",
      registeredAt: "2026-08-01T06:30:00.000Z",
      validUntil: "2027-08-01T06:30:00.000Z",
      lastHoroscopeSentAt: "Today, 07:00 AM",
    },
    "9922334455": {
      id: "SUB-1002",
      mobile: "9922334455",
      name: "Priyanka Joshi",
      email: "priyanka.j@shridivya.org",
      zodiacSign: "Taurus (Vrishabha)",
      birthDate: "1994-05-08",
      birthTime: "11:20 AM",
      birthCity: "Jaipur",
      deliveryChannel: "email",
      deliveryTime: "07:00 AM",
      planId: "three_months",
      planName: "3 Months Auspicious",
      price: 400,
      status: "active",
      registeredAt: "2026-08-15T09:12:00.000Z",
      validUntil: "2026-11-15T09:12:00.000Z",
      lastHoroscopeSentAt: "Today, 07:00 AM",
    },
    "9712348899": {
      id: "SUB-1003",
      mobile: "9712348899",
      name: "Vikramaditya Rao",
      email: "rohit.barla.ai.india@gmail.com",
      zodiacSign: "Scorpio (Vrishchika)",
      birthDate: "1982-11-20",
      birthTime: "04:15 PM",
      birthCity: "Bengaluru",
      deliveryChannel: "email",
      deliveryTime: "06:30 AM",
      planId: "trial",
      planName: "3-Day Free Trial",
      price: 0,
      status: "trial",
      registeredAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 3 * 86400000).toISOString(),
      autoRenew: true,
      lastHoroscopeSentAt: "Today, 07:00 AM",
    },
    "9876543210": {
      id: "SUB-1004",
      mobile: "9876543210",
      name: "Ananya Deshmukh",
      email: "ananya.d@example.com",
      zodiacSign: "Leo (Simha)",
      birthDate: "1996-08-14",
      birthTime: "08:30 AM",
      birthCity: "Pune",
      deliveryChannel: "email",
      deliveryTime: "07:00 AM",
      planId: "monthly",
      planName: "1 Month Pure Vedic",
      price: 150,
      status: "expired",
      registeredAt: "2026-07-01T06:00:00.000Z",
      validUntil: "2026-08-01T06:00:00.000Z",
      autoRenew: true,
      lastHoroscopeSentAt: "Subscription expired on 01 Aug 2026",
    },
  },
  callbacks: [
    {
      id: "CB-7001",
      callerName: "Rajeshwar Mittal",
      callerPhone: "9876501234",
      preferredTopic: "Kundali Milan & Matchmaking",
      helplineCalled: "9560169988",
      requestedAt: "2026-09-06T09:15:00.000Z",
      status: "connected",
      notes: "Called regarding child's Kundali matching; Kendra visit fixed for Thursday.",
    },
    {
      id: "CB-7002",
      callerName: "Sunita Verma",
      callerPhone: "9818812345",
      preferredTopic: "Health, Graha Dosha & Shanti Pooja",
      helplineCalled: "9560169988",
      requestedAt: "2026-09-06T10:30:00.000Z",
      status: "pending",
      notes: "Requested callback regarding Rahu Mahadasha remedies.",
    },
  ],
  consultations: [
    {
      id: "CON-501",
      userSign: "Aries",
      question: "Will I get a promotion in my software job in the next 3 months?",
      answer: "The transit of Jupiter through your 10th house is favorably aspecting Mercury, creating strong karma-siddhi yoga. Between October and November, high chances of appraisal or job shift emerge. Wear copper and chant Surya Gayatri.",
      source: "gemini-api",
      timestamp: "2026-09-06T08:20:00.000Z",
    },
  ],
  panchang: {
    "today": {
      date: new Date().toISOString().split("T")[0],
      hinduDate: "Krishna Paksha Chaturdashi (until 09:36 PM, followed by Amavasya), Vikram Samvat 2083 (Siddharthi)",
      tithi: "Krishna Paksha Chaturdashi (until 09:36 PM, followed by Amavasya)",
      tithiStartTime: "Starts yesterday at 10:38 PM",
      tithiEndsAt: "Ends today at 09:36 PM",
      tithiTiming: "until 09:36 PM, followed by Amavasya",
      paksha: "Krishna Paksha",
      nakshatra: "Uttara Phalguni (until 09:19 PM, followed by Hasta)",
      yoga: "Brahma (until 11:21 PM)",
      karana: "Vishti (until 09:52 AM), Shakuni (until 09:35 PM)",
      samvat: "Vikram Samvat 2083 (Siddharthi)",
      vikramSamvat: "2083 (Siddharthi)",
      shakaSamvat: "1948 (Parabhava)",
      monthPurnimanta: "Ashwin",
      monthAmanta: "Bhadrapada",
      sunrise: "06:05 AM",
      sunset: "06:29 PM",
      rahuKaal: "10:30 AM - 12:00 PM (Inauspicious - Shukravara)",
      abhijitMuhurat: "11:53 AM - 12:43 PM (Most Auspicious)",
      shubhMuhurat: "08:15 AM - 09:45 AM (Amrit Vela)",
      moonSign: "Kanya (Virgo)",
      festivalNote: "आश्विन कृष्ण चतुर्दशी • मासिक शिवरात्रि (Ashwin Krishna Chaturdashi)",
      isCustomized: false,
    },
  },
  settings: {
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
  },
  payments: [
    {
      id: "PAY-8801",
      mobile: "9811234567",
      userName: "Aarav Sharma",
      planId: "yearly",
      planName: "1 Year Cosmic Shield",
      amount: 1000,
      upiIdUsed: "9560169988@upi",
      utrNumber: "424598129034",
      paymentMode: "upi_qr",
      status: "verified",
      timestamp: "2026-08-01T06:35:00.000Z",
    },
    {
      id: "PAY-8802",
      mobile: "9922334455",
      userName: "Priyanka Joshi",
      planId: "three_months",
      planName: "3 Months Auspicious",
      amount: 400,
      upiIdUsed: "9560169988@upi",
      utrNumber: "424610482910",
      paymentMode: "upi_app",
      status: "verified",
      timestamp: "2026-08-15T09:15:00.000Z",
    },
  ],
  schedulerConfig: {
    enabled: true,
    scheduleTime: "07:00 AM",
    frequency: "daily",
    senderName: "Acharya JyotishVani Kendra",
    senderEmail: "horoscope@jyotishvani.live",
    subjectTemplate: "🌟 Your Daily Vedic Horoscope & Shubh Muhurat - {{date}}",
    includePanchang: true,
    includeRemedies: true,
    enableEmailDelivery: true,
    enableWhatsAppDelivery: true,
    enableSmsDelivery: true,
    primaryMobileChannel: "sms",
    smsGatewayProvider: "device_sms",
    targetSubscriptionTiers: ["trial", "monthly", "three_months", "six_months", "yearly"],
    lastRunAt: "2026-09-08T07:00:00.000Z",
    nextRunAt: "Tomorrow at 07:00 AM IST",
  },
  schedulerLogs: [
    {
      id: "SCHED-LOG-101",
      runAt: "2026-09-08T07:00:00.000Z",
      trigger: "scheduled_daily",
      totalTargeted: 3,
      sentCount: 3,
      skippedCount: 0,
      status: "success",
      dispatches: [
        {
          subscriberId: "SUB-1001",
          name: "Aarav Sharma",
          email: "aarav.sharma@vedicmail.in",
          zodiacSign: "Leo (Simha)",
          planName: "1 Year Cosmic Shield",
          status: "delivered",
          subject: "🌟 Your Daily Vedic Horoscope & Shubh Muhurat - 08 Sep 2026",
          sentAt: "2026-09-08T07:00:02.000Z",
          previewSummary: "Surya transit in Leo illuminates Karma house. Favorable day for leadership and strategic initiatives.",
        },
        {
          subscriberId: "SUB-1002",
          name: "Priyanka Joshi",
          email: "priyanka.j@shridivya.org",
          zodiacSign: "Taurus (Vrishabha)",
          planName: "3 Months Auspicious",
          status: "delivered",
          subject: "🌟 Your Daily Vedic Horoscope & Shubh Muhurat - 08 Sep 2026",
          sentAt: "2026-09-08T07:00:03.000Z",
          previewSummary: "Venus transit strengthens family harmony and financial prudence.",
        },
        {
          subscriberId: "SUB-1003",
          name: "Vikramaditya Rao",
          email: "rohit.barla.ai.india@gmail.com",
          zodiacSign: "Scorpio (Vrishchika)",
          planName: "3-Day Free Trial",
          status: "delivered",
          subject: "🌟 Your Daily Vedic Horoscope & Shubh Muhurat - 08 Sep 2026",
          sentAt: "2026-09-08T07:00:04.000Z",
          previewSummary: "Mars energizes vitality; chant Hanuman Chalisa for courage and mental serenity.",
        },
      ],
    },
  ],
  horoscopes: DEFAULT_HOROSCOPES,
  plans: DEFAULT_PLANS,
  testimonials: DEFAULT_TESTIMONIALS,
  faqs: DEFAULT_FAQS,
};

class DocumentDatabase {
  private db: DatabaseSchema;

  constructor() {
    this.db = this.loadDatabase();
    // Synchronize all existing devotees and records with Firestore in background
    setTimeout(() => {
      syncAllToFirestore(this.db).catch((err) =>
        console.warn("[Firestore] Boot sync notice:", err)
      );
    }, 1500);
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(content);
        const loaded: DatabaseSchema = {
          ...initialSeedData,
          ...parsed,
          settings: {
            ...initialSeedData.settings,
            ...(parsed.settings || {}),
            planPrices: {
              ...initialSeedData.settings.planPrices,
              ...(parsed.settings?.planPrices || {}),
            },
          },
          payments: Array.isArray(parsed.payments) ? parsed.payments : initialSeedData.payments,
          subscribers: (() => {
            const rawSubs = parsed.subscribers || initialSeedData.subscribers;
            for (const [k, v] of Object.entries(initialSeedData.subscribers)) {
              if (rawSubs[k] && !rawSubs[k].email && v.email) {
                rawSubs[k].email = v.email;
              }
            }
            return rawSubs;
          })(),
          callbacks: Array.isArray(parsed.callbacks) ? parsed.callbacks : initialSeedData.callbacks,
          consultations: Array.isArray(parsed.consultations) ? parsed.consultations : initialSeedData.consultations,
          panchang: parsed.panchang || initialSeedData.panchang,
          schedulerConfig: { ...initialSeedData.schedulerConfig, ...(parsed.schedulerConfig || {}) },
          schedulerLogs: Array.isArray(parsed.schedulerLogs) ? parsed.schedulerLogs : initialSeedData.schedulerLogs,
          horoscopes: Array.isArray(parsed.horoscopes) && parsed.horoscopes.length > 0 ? parsed.horoscopes : initialSeedData.horoscopes,
          plans: Array.isArray(parsed.plans) && parsed.plans.length > 0 ? parsed.plans : initialSeedData.plans,
          testimonials: Array.isArray(parsed.testimonials) && parsed.testimonials.length > 0 ? parsed.testimonials : initialSeedData.testimonials,
          faqs: Array.isArray(parsed.faqs) && parsed.faqs.length > 0 ? parsed.faqs : initialSeedData.faqs,
        };
        if (!parsed.horoscopes || !parsed.plans || !parsed.testimonials || !parsed.faqs) {
          this.persist(loaded);
        }
        return loaded;
      }
    } catch (err) {
      console.error("Error reading database file, using seeds:", err);
    }
    this.persist(initialSeedData);
    return initialSeedData;
  }

  private persist(data: DatabaseSchema) {
    try {
      data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("Error persisting database to file:", err);
    }
  }

  // --- SUBSCRIBERS ---
  public getSubscribers(): StoredSubscriber[] {
    return Object.values(this.db.subscribers).sort(
      (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
    );
  }

  public getSubscriber(mobile: string): StoredSubscriber | null {
    const clean = mobile.replace(/\D/g, "");
    return this.db.subscribers[clean] || null;
  }

  public upsertSubscriber(sub: Partial<StoredSubscriber> & { mobile: string }): StoredSubscriber {
    const clean = sub.mobile.replace(/\D/g, "");
    const existing = this.db.subscribers[clean];

    const planNames: Record<string, { name: string; price: number }> = {
      trial: { name: "3-Day Free Trial", price: 0 },
      monthly: { name: "1 Month Pure Vedic", price: 150 },
      three_months: { name: "3 Months Auspicious", price: 400 },
      six_months: { name: "6 Months Divya Shakti", price: 500 },
      yearly: { name: "1 Year Cosmic Shield", price: 1000 },
    };

    const planInfo = planNames[sub.planId || "trial"] || planNames.trial;

    const updated: StoredSubscriber = {
      id: existing?.id || `SUB-${Math.floor(1000 + Math.random() * 9000)}`,
      mobile: clean,
      name: sub.name || existing?.name || "Cosmic Seeker",
      email: sub.email !== undefined ? sub.email : (existing?.email || ""),
      zodiacSign: sub.zodiacSign || existing?.zodiacSign || "Aries",
      birthDate: sub.birthDate || existing?.birthDate || "",
      birthTime: sub.birthTime || existing?.birthTime || "",
      birthCity: sub.birthCity || existing?.birthCity || "",
      deliveryChannel: sub.deliveryChannel || existing?.deliveryChannel || "email",
      deliveryTime: sub.deliveryTime || existing?.deliveryTime || "07:00 AM",
      planId: sub.planId || existing?.planId || "trial",
      planName: planInfo.name,
      price: planInfo.price,
      status: (existing && (existing.status === "active" || existing.status === "trial" || existing.status === "pending_verification") && sub.status === "pending_otp")
        ? existing.status
        : (sub.status || existing?.status || "pending_otp"),
      registeredAt: existing?.registeredAt || new Date().toISOString(),
      validUntil: sub.validUntil || existing?.validUntil || new Date(Date.now() + 3 * 86400000).toISOString(),
      autoRenew: sub.autoRenew !== undefined ? sub.autoRenew : (existing?.autoRenew !== undefined ? existing.autoRenew : true),
      otp: sub.otp || existing?.otp || undefined,
      lastHoroscopeSentAt: existing?.lastHoroscopeSentAt || "Scheduled tomorrow 07:00 AM",
    };

    this.db.subscribers[clean] = updated;
    this.persist(this.db);
    syncSubscriberToFirestore(updated).catch((err) =>
      console.warn(`[Firestore] Sync failed for ${clean}:`, err)
    );
    return updated;
  }

  public activateSubscription(
    mobile: string,
    planId: string,
    autoRenew?: boolean,
    verificationDetails?: { provider?: string; verifiedAt?: string }
  ): StoredSubscriber {
    const clean = mobile.replace(/\D/g, "");
    let sub = this.db.subscribers[clean];

    const durationDays: Record<string, number> = {
      trial: 3,
      monthly: 30,
      three_months: 90,
      six_months: 180,
      yearly: 365,
    };

    const days = durationDays[planId] || 3;
    const validUntil = new Date(Date.now() + days * 86400000).toISOString();

    const planNames: Record<string, { name: string; price: number }> = {
      trial: { name: "3-Day Free Trial", price: 0 },
      monthly: { name: "1 Month Pure Vedic", price: 150 },
      three_months: { name: "3 Months Auspicious", price: 400 },
      six_months: { name: "6 Months Divya Shakti", price: 500 },
      yearly: { name: "1 Year Cosmic Shield", price: 1000 },
    };
    const planInfo = planNames[planId] || planNames.trial;

    if (!sub) {
      sub = {
        id: `SUB-${Math.floor(1000 + Math.random() * 9000)}`,
        mobile: clean,
        name: "Cosmic Seeker",
        zodiacSign: "Aries",
        deliveryChannel: "email",
        deliveryTime: "07:00 AM",
        planId: planId as any,
        planName: planInfo.name,
        price: planInfo.price,
        status: planId === "trial" ? "trial" : "active",
        registeredAt: new Date().toISOString(),
        validUntil,
        autoRenew: autoRenew !== undefined ? autoRenew : true,
        phoneVerified: true,
        phoneVerifiedAt: verificationDetails?.verifiedAt || new Date().toISOString(),
        verificationProvider: verificationDetails?.provider || "live_otp",
        lastHoroscopeSentAt: "Delivery queued for 07:00 AM",
      };
    } else {
      sub.planId = planId as any;
      sub.planName = planInfo.name;
      sub.price = planInfo.price;
      sub.status = planId === "trial" ? "trial" : "active";
      sub.validUntil = validUntil;
      sub.phoneVerified = true;
      sub.phoneVerifiedAt = verificationDetails?.verifiedAt || new Date().toISOString();
      if (verificationDetails?.provider) {
        sub.verificationProvider = verificationDetails.provider;
      }
      if (autoRenew !== undefined) {
        sub.autoRenew = autoRenew;
      } else if (sub.autoRenew === undefined) {
        sub.autoRenew = true;
      }
    }

    this.db.subscribers[clean] = sub;
    this.persist(this.db);
    syncSubscriberToFirestore(sub).catch((err) =>
      console.warn(`[Firestore] Sync failed for ${clean}:`, err)
    );
    return sub;
  }

  public renewSubscription(mobile: string, planId?: string, autoRenew?: boolean): StoredSubscriber {
    const clean = mobile.replace(/\D/g, "");
    let sub = this.db.subscribers[clean];

    const planToUse = planId || (sub && sub.planId !== "trial" ? sub.planId : "monthly");
    const durationDays: Record<string, number> = {
      trial: 3,
      monthly: 30,
      three_months: 90,
      six_months: 180,
      yearly: 365,
    };

    const days = durationDays[planToUse] || 30;
    const now = Date.now();
    // If current validUntil is still valid in the future, extend from validUntil; otherwise from now
    let baseTime = now;
    if (sub && sub.validUntil) {
      const currentExpiry = new Date(sub.validUntil).getTime();
      if (!isNaN(currentExpiry) && currentExpiry > now) {
        baseTime = currentExpiry;
      }
    }
    const newValidUntil = new Date(baseTime + days * 86400000).toISOString();

    const planNames: Record<string, { name: string; price: number }> = {
      trial: { name: "3-Day Free Trial", price: 0 },
      monthly: { name: "1 Month Pure Vedic", price: 150 },
      three_months: { name: "3 Months Auspicious", price: 400 },
      six_months: { name: "6 Months Divya Shakti", price: 500 },
      yearly: { name: "1 Year Cosmic Shield", price: 1000 },
    };
    const planInfo = planNames[planToUse] || planNames.monthly;

    if (!sub) {
      sub = {
        id: `SUB-${Math.floor(1000 + Math.random() * 9000)}`,
        mobile: clean,
        name: "Cosmic Seeker",
        zodiacSign: "Aries",
        deliveryChannel: "email",
        deliveryTime: "07:00 AM",
        planId: planToUse as any,
        planName: planInfo.name,
        price: planInfo.price,
        status: "active",
        registeredAt: new Date().toISOString(),
        validUntil: newValidUntil,
        autoRenew: autoRenew !== undefined ? autoRenew : true,
        lastHoroscopeSentAt: "Renewed! Next dispatch at 07:00 AM",
      };
    } else {
      sub.planId = planToUse as any;
      sub.planName = planInfo.name;
      sub.price = planInfo.price;
      sub.status = "active";
      sub.validUntil = newValidUntil;
      sub.autoRenew = autoRenew !== undefined ? autoRenew : (sub.autoRenew !== undefined ? sub.autoRenew : true);
      sub.lastHoroscopeSentAt = "Renewed! Next dispatch at 07:00 AM";
    }

    this.db.subscribers[clean] = sub;

    // Record renewal in payments ledger
    if (planInfo.price > 0) {
      this.recordPayment({
        mobile: clean,
        userName: sub.name || "Devotee",
        planId: planToUse,
        planName: `${planInfo.name} (Auto-Renew)`,
        amount: planInfo.price,
        upiIdUsed: this.db.settings?.upiId || "9560169988@pthdfc",
        utrNumber: `RENEW${Date.now().toString().slice(-8)}`,
        paymentMode: "upi_app",
      });
    }

    this.persist(this.db);
    syncSubscriberToFirestore(sub).catch((err) =>
      console.warn(`[Firestore] Sync failed for ${clean}:`, err)
    );
    return sub;
  }

  public toggleAutoRenew(mobile: string, autoRenew: boolean): StoredSubscriber | null {
    const clean = mobile.replace(/\D/g, "");
    const sub = this.db.subscribers[clean];
    if (!sub) return null;
    sub.autoRenew = autoRenew;
    this.persist(this.db);
    return sub;
  }

  public stopSubscription(mobile: string, reason?: string): StoredSubscriber | null {
    const clean = mobile.replace(/\D/g, "");
    const sub = this.db.subscribers[clean];
    if (!sub) return null;
    sub.status = "stopped";
    sub.autoRenew = false;
    sub.lastHoroscopeSentAt = `Subscription stopped by Admin (${new Date().toLocaleDateString("en-IN")})${reason ? `: ${reason}` : ""}`;
    this.persist(this.db);
    return sub;
  }

  public resumeSubscription(mobile: string): StoredSubscriber | null {
    const clean = mobile.replace(/\D/g, "");
    const sub = this.db.subscribers[clean];
    if (!sub) return null;
    const isExpired = sub.validUntil && new Date(sub.validUntil).getTime() < Date.now();
    if (isExpired) {
      // If was expired before stopping, renew it for a fresh period
      return this.renewSubscription(clean, sub.planId, true);
    }
    sub.status = sub.planId === "trial" ? "trial" : "active";
    sub.autoRenew = true;
    sub.lastHoroscopeSentAt = "Resumed by Admin! Scheduled for 07:00 AM";
    this.persist(this.db);
    return sub;
  }

  // --- CALLBACKS (Offline Helpline 9560169988) ---
  public getCallbacks(): StoredCallback[] {
    return [...this.db.callbacks].sort(
      (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
  }

  public addCallback(entry: Omit<StoredCallback, "id" | "requestedAt" | "helplineCalled" | "status">): StoredCallback {
    const newCallback: StoredCallback = {
      id: `CB-${Math.floor(1000 + Math.random() * 9000)}`,
      callerName: entry.callerName || "Anonymous Devotee",
      callerPhone: entry.callerPhone.replace(/\D/g, ""),
      preferredTopic: entry.preferredTopic || "General Guidance",
      helplineCalled: "9560169988",
      requestedAt: new Date().toISOString(),
      status: "pending",
      notes: "Requested direct offline Kendra callback via portal.",
    };

    this.db.callbacks.unshift(newCallback);
    this.persist(this.db);
    return newCallback;
  }

  public updateCallbackStatus(id: string, status: "pending" | "connected" | "scheduled", notes?: string): boolean {
    const item = this.db.callbacks.find((c) => c.id === id);
    if (item) {
      item.status = status;
      if (notes) item.notes = notes;
      this.persist(this.db);
      return true;
    }
    return false;
  }

  // --- CONSULTATIONS ---
  public getConsultations(): StoredConsultation[] {
    return [...this.db.consultations].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public saveConsultation(entry: Omit<StoredConsultation, "id" | "timestamp">): StoredConsultation {
    const item: StoredConsultation = {
      id: `CON-${Math.floor(1000 + Math.random() * 9000)}`,
      userSign: entry.userSign,
      birthDate: entry.birthDate,
      question: entry.question,
      answer: entry.answer,
      source: entry.source,
      timestamp: new Date().toISOString(),
    };
    this.db.consultations.unshift(item);
    // Keep max 50 recent
    if (this.db.consultations.length > 50) {
      this.db.consultations = this.db.consultations.slice(0, 50);
    }
    this.persist(this.db);
    return item;
  }

  // --- PANCHANG ---
  public getPanchang(dateKey: string = "today", clientTimezone?: string): StoredPanchang {
    const raw = this.db.panchang[dateKey] || this.db.panchang["today"];
    // Dynamically compute accurate Vikram Samvat year: Gregorian Year + 57
    const now = new Date();
    const gregorianYear = now.getFullYear();
    const samvatYear = gregorianYear + 57; // e.g. 2026 + 57 = 2083
    const accurateSamvat = (raw.samvat || `Vikram Samvat ${samvatYear}`).replace("2081", String(samvatYear));
    const todayIso = now.toISOString().split("T")[0];

    const formatRelativeDay = (str: string): string => {
      if (!str) return str;
      if (/starts\s+(today|yesterday|tomorrow)\s+at/i.test(str)) return str;
      return str.replace(/starts\s+at/i, "Starts today at");
    };

    const tithiStartTime = formatRelativeDay(raw.tithiStartTime || "Starts today at 10:55 PM");
    const tithiEndsAt = raw.tithiEndsAt || "Ends at 11:07 PM";
    const tithiTiming = raw.tithiTiming ? formatRelativeDay(raw.tithiTiming) : `${tithiStartTime} • ${tithiEndsAt}`;

    let accurateHinduDate = raw.hinduDate
      ? raw.hinduDate.replace("2081", String(samvatYear))
      : `${raw.tithi || "Dwitiya (Krishna Paksha)"}, ${accurateSamvat}`;

    if (/starts\s+at/i.test(accurateHinduDate) && !/starts\s+(today|yesterday|tomorrow)\s+at/i.test(accurateHinduDate)) {
      accurateHinduDate = accurateHinduDate.replace(/starts\s+at/i, "Starts today at");
    }

    // If tithi start time is not yet incorporated into hinduDate string, add it cleanly
    if (tithiStartTime && !accurateHinduDate.toLowerCase().includes("start")) {
      if (accurateHinduDate.includes(",")) {
        const parts = accurateHinduDate.split(",");
        const tithiPart = parts[0].trim();
        const samvatPart = parts.slice(1).join(",").trim();
        accurateHinduDate = `${tithiPart} (${tithiStartTime}), ${samvatPart}`;
      } else {
        accurateHinduDate = `${accurateHinduDate} (${tithiStartTime})`;
      }
    }

    const updatedPanchang: StoredPanchang = {
      ...raw,
      date: dateKey === "today" ? todayIso : (raw.date || todayIso),
      samvat: accurateSamvat,
      hinduDate: accurateHinduDate,
      tithiStartTime,
      tithiEndsAt,
      tithiTiming,
      lastUpdatedAt: raw.lastUpdatedAt || new Date().toISOString(),
    };

    return updatedPanchang;
  }

  public updatePanchang(data: Partial<StoredPanchang>, dateKey: string = "today"): StoredPanchang {
    const current = this.getPanchang(dateKey);
    const updated: StoredPanchang = {
      ...current,
      ...data,
      date: data.date || current.date,
      lastUpdatedAt: data.lastUpdatedAt || new Date().toISOString(),
    };
    this.db.panchang[dateKey] = updated;
    this.persist(this.db);
    return updated;
  }

  // --- DYNAMIC SETTINGS ---
  public getSettings(): DynamicSettings {
    return { ...this.db.settings };
  }

  public updateSettings(updates: Partial<DynamicSettings>): DynamicSettings {
    const newPrices: DynamicSettings["planPrices"] = {
      trial: 0,
      monthly: Number(updates.planPrices?.monthly ?? this.db.settings?.planPrices?.monthly ?? 150),
      three_months: Number(updates.planPrices?.three_months ?? this.db.settings?.planPrices?.three_months ?? 400),
      six_months: Number(updates.planPrices?.six_months ?? this.db.settings?.planPrices?.six_months ?? 500),
      yearly: Number(updates.planPrices?.yearly ?? this.db.settings?.planPrices?.yearly ?? 1000),
    };

    this.db.settings = {
      ...this.db.settings,
      ...updates,
      planPrices: newPrices,
    };

    // Synchronize this.db.plans prices with updated planPrices
    const basePlans = this.db.plans && this.db.plans.length > 0 ? this.db.plans : DEFAULT_PLANS;
    this.db.plans = basePlans.map((p) => {
      const idKey = p.id as keyof typeof newPrices;
      if (newPrices[idKey] !== undefined && !isNaN(newPrices[idKey])) {
        const newPrice = newPrices[idKey];
        return {
          ...p,
          price: newPrice,
          billingText:
            p.id === "trial"
              ? "100% Free • No Payment Upfront"
              : p.id === "monthly"
              ? `Billed at ₹${newPrice} every month`
              : p.id === "three_months"
              ? `Billed at ₹${newPrice} for 3 months (~₹${Math.round(newPrice / 3)}/mo)`
              : p.id === "six_months"
              ? `Billed at ₹${newPrice} for 6 months (~₹${Math.round(newPrice / 6)}/mo)`
              : `Billed at ₹${newPrice.toLocaleString("en-IN")} for 12 months (~₹${Math.round(newPrice / 12)}/mo)`,
          ctaText:
            p.id === "trial"
              ? "Start 3-Day Free Trial"
              : p.id === "monthly"
              ? `Choose Monthly (₹${newPrice})`
              : p.id === "three_months"
              ? `Choose 3 Months (₹${newPrice})`
              : p.id === "six_months"
              ? `Get 6 Months (₹${newPrice})`
              : `Get Yearly Pass (₹${newPrice.toLocaleString("en-IN")})`,
        };
      }
      return p;
    });

    this.persist(this.db);
    return this.db.settings;
  }

  // --- PAYMENTS (UPI) ---
  public getPayments(): StoredPayment[] {
    return [...(this.db.payments || [])].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public recordPayment(entry: Omit<StoredPayment, "id" | "timestamp" | "status"> & { status?: "verified" | "pending" }): StoredPayment {
    const newPayment: StoredPayment = {
      id: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
      mobile: entry.mobile.replace(/\D/g, ""),
      userName: entry.userName || "Valued Devotee",
      planId: entry.planId,
      planName: entry.planName,
      amount: entry.amount,
      upiIdUsed: entry.upiIdUsed || this.db.settings.upiId,
      utrNumber: entry.utrNumber || `UTR${Date.now().toString().slice(-10)}`,
      paymentMode: entry.paymentMode || "upi_app",
      status: entry.status || "verified",
      timestamp: new Date().toISOString(),
    };

    if (!this.db.payments) {
      this.db.payments = [];
    }
    this.db.payments.unshift(newPayment);

    // If payment is verified, automatically activate or extend subscriber
    if (newPayment.status === "verified") {
      this.activateSubscription(newPayment.mobile, newPayment.planId);
    }

    this.persist(this.db);
    return newPayment;
  }

  public updatePaymentStatus(
    id: string,
    status: "verified" | "pending" | "rejected" | "failed",
    adminNotes?: string
  ): StoredPayment | null {
    const payment = this.db.payments?.find((p) => p.id === id);
    if (payment) {
      payment.status = status;
      if (adminNotes !== undefined) {
        payment.adminNotes = adminNotes;
      }
      payment.updatedAt = new Date().toISOString();
      if (status === "verified") {
        this.activateSubscription(payment.mobile, payment.planId);
      }
      this.persist(this.db);
      return payment;
    }
    return null;
  }

  public updatePayment(id: string, updates: Partial<StoredPayment>): StoredPayment | null {
    const payment = this.db.payments?.find((p) => p.id === id);
    if (payment) {
      Object.assign(payment, updates, { updatedAt: new Date().toISOString() });
      if (updates.status === "verified") {
        this.activateSubscription(payment.mobile, payment.planId);
      }
      this.persist(this.db);
      return payment;
    }
    return null;
  }

  // --- SUBSCRIBER MANAGEMENT (ADMIN) ---
  public updateSubscriber(mobile: string, updates: Partial<StoredSubscriber> & { newMobile?: string }): StoredSubscriber | null {
    const clean = mobile.replace(/\D/g, "");
    const sub = this.db.subscribers[clean];
    if (!sub) return null;

    const targetMobile = (updates.newMobile || (updates.mobile && updates.mobile !== clean))
      ? String(updates.newMobile || updates.mobile).replace(/\D/g, "")
      : clean;

    const updatedSub: StoredSubscriber = {
      ...sub,
      ...updates,
      mobile: targetMobile,
      updatedAt: new Date().toISOString(),
    };

    if (targetMobile !== clean) {
      delete this.db.subscribers[clean];
      removeSubscriberFromFirestore(clean).catch((err) =>
        console.warn(`[Firestore] Remove old mobile failed for ${clean}:`, err)
      );
    }

    this.db.subscribers[targetMobile] = updatedSub;
    this.persist(this.db);
    syncSubscriberToFirestore(updatedSub).catch((err) =>
      console.warn(`[Firestore] Sync failed for ${targetMobile}:`, err)
    );
    return updatedSub;
  }

  public deleteSubscriber(mobile: string): boolean {
    const clean = mobile.replace(/\D/g, "");
    if (this.db.subscribers[clean]) {
      delete this.db.subscribers[clean];
      this.persist(this.db);
      removeSubscriberFromFirestore(clean).catch((err) =>
        console.warn(`[Firestore] Remove failed for ${clean}:`, err)
      );
      return true;
    }
    return false;
  }

  // --- SCHEDULER JOB (DAILY HOROSCOPE: EMAIL + WHATSAPP) ---
  public getSchedulerConfig(): EmailSchedulerConfig {
    return {
      enableEmailDelivery: true,
      enableWhatsAppDelivery: true,
      ...this.db.schedulerConfig,
    };
  }

  public updateSchedulerConfig(updates: Partial<EmailSchedulerConfig>): EmailSchedulerConfig {
    this.db.schedulerConfig = {
      ...this.db.schedulerConfig,
      ...updates,
    };
    this.persist(this.db);
    return this.db.schedulerConfig;
  }

  public getSchedulerLogs(): EmailSchedulerLog[] {
    return [...(this.db.schedulerLogs || [])].sort(
      (a, b) => new Date(b.runAt).getTime() - new Date(a.runAt).getTime()
    );
  }

  public addSchedulerLog(log: EmailSchedulerLog): void {
    if (!this.db.schedulerLogs) {
      this.db.schedulerLogs = [];
    }
    this.db.schedulerLogs.unshift(log);
    // Keep max 50 recent scheduler logs
    if (this.db.schedulerLogs.length > 50) {
      this.db.schedulerLogs = this.db.schedulerLogs.slice(0, 50);
    }
    this.db.schedulerConfig.lastRunAt = log.runAt;
    this.persist(this.db);
  }

  public generateHoroscopeEmail(
    sub: StoredSubscriber,
    panchang?: StoredPanchang,
    aiGeneratedPrediction?: string,
    webBaseUrl?: string
  ): { subject: string; html: string; text: string; summary: string } {
    const todayPanchang = panchang || this.getPanchang("today");
    const dateStr = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const subject = this.db.schedulerConfig.subjectTemplate
      ? this.db.schedulerConfig.subjectTemplate.replace("{{date}}", dateStr)
      : `🌟 Your Daily Vedic Horoscope & Shubh Muhurat - ${dateStr}`;

    const hostUrl = (webBaseUrl || "https://ais-dev-qy2e5uwllij24bppgp6ci6-72004684266.asia-east1.run.app").replace(/\/+$/, "");
    const bookAstrologerUrl = `${hostUrl}/#offline-connect`;

    // Personalized planetary analysis for the subscriber's sign
    const sign = sub.zodiacSign || "Aries";
    const birthInfo = sub.birthDate
      ? `DOB: ${sub.birthDate}${sub.birthTime ? ` at ${sub.birthTime}` : ""}${sub.birthCity ? `, ${sub.birthCity}` : ""}`
      : "Vedic Birth Profile Synced";

    const defaultPredictions: Record<string, { forecast: string; remedy: string; lucky: string }> = {
      aries: {
        forecast: "Mars energizes your house of Karma. Clear opportunities emerge in career negotiations and long-pending initiatives. Trust your focused intuition over impulsive reactions.",
        remedy: "Chant 'Om Angarakaya Namaha' 11 times and offer water to Surya Dev in a copper vessel.",
        lucky: "Lucky Color: Crimson Red | Auspicious Number: 9 | Favorable Time: 09:30 AM - 11:00 AM",
      },
      taurus: {
        forecast: "Venus alignment showers harmonious blessings on personal relationships and artistic ventures. Financial stability strengthens through prudent planning rather than speculation.",
        remedy: "Feed cows green grass or donate white sweets to the needy on Friday.",
        lucky: "Lucky Color: Off-White & Lotus Pink | Auspicious Number: 6 | Favorable Time: 10:00 AM - 11:30 AM",
      },
      gemini: {
        forecast: "Mercury encourages intellectual breakthrough and commercial contracts. Communication skills are at their peak; express your proposals with confidence.",
        remedy: "Chant the Vishnu Sahasranama or recite the Budh Beej Mantra.",
        lucky: "Lucky Color: Emerald Green | Auspicious Number: 5 | Favorable Time: 02:00 PM - 03:30 PM",
      },
      cancer: {
        forecast: "The Moon transit through intuitive quadrants enhances emotional clarity and spiritual wisdom. Deep conversations with family will bring profound peace of mind.",
        remedy: "Drink water in a silver cup and practice 10 minutes of serene meditation during twilight.",
        lucky: "Lucky Color: Pearl White & Silver | Auspicious Number: 2 | Favorable Time: 07:00 AM - 08:30 AM",
      },
      leo: {
        forecast: "Surya's radiant energy ignites leadership potential and social respect. Your dedication is recognized by mentors and superiors; remain humble yet resolute.",
        remedy: "Perform Surya Namaskar at sunrise and chant the Aditya Hridaya Stotram.",
        lucky: "Lucky Color: Deep Gold & Saffron | Auspicious Number: 1 | Favorable Time: 08:00 AM - 09:30 AM",
      },
      virgo: {
        forecast: "Planetary aspects promote methodical precision and health rejuvenation. Ideal day for balancing accounts, health routines, and organized project workflows.",
        remedy: "Keep green plants in the North-East direction and chant 'Om Gam Ganapataye Namaha'.",
        lucky: "Lucky Color: Mint Green & Beige | Auspicious Number: 5 | Favorable Time: 11:00 AM - 12:30 PM",
      },
      libra: {
        forecast: "Shukra promotes partnership harmony and aesthetic elegance. A favorable juncture for entering collaborative agreements and resolving emotional discords.",
        remedy: "Wear clean pastel garments and offer white flowers at an altar or temple.",
        lucky: "Lucky Color: Royal Blue & Pastel Lilac | Auspicious Number: 7 | Favorable Time: 03:30 PM - 05:00 PM",
      },
      scorpio: {
        forecast: "Mars and Ketu stimulate transformative determination and inner courage. Hidden obstacles dissolve as you confront pending challenges with moral fortitude.",
        remedy: "Recite Hanuman Chalisa and donate jaggery or red lentils to the underprivileged.",
        lucky: "Lucky Color: Maroon & Deep Amber | Auspicious Number: 9 | Favorable Time: 06:30 AM - 08:00 AM",
      },
      sagittarius: {
        forecast: "Jupiter's benevolence illuminates the 9th house of higher wisdom and Dharma. Ideal for spiritual learning, pilgrimages, and ethical financial commitments.",
        remedy: "Apply a small sandalwood/turmeric tilak on forehead and respect spiritual teachers.",
        lucky: "Lucky Color: Canary Yellow & Ochre | Auspicious Number: 3 | Favorable Time: 09:00 AM - 10:30 AM",
      },
      capricorn: {
        forecast: "Saturn fosters steadfast perseverance and foundational success. Your hard work over the past cycle begins consolidating into tangible, long-term respect.",
        remedy: "Light a mustard oil lamp under a Peepal tree on Saturdays and help senior citizens.",
        lucky: "Lucky Color: Charcoal & Indigo | Auspicious Number: 8 | Favorable Time: 04:00 PM - 05:30 PM",
      },
      aquarius: {
        forecast: "Saturn encourages visionary philanthropy and progressive community ideas. Team efforts achieve auspicious breakthroughs; embrace collaborative harmony.",
        remedy: "Feed birds in the morning and avoid unnecessary arguments during Rahu Kaal.",
        lucky: "Lucky Color: Electric Blue & Violet | Auspicious Number: 4 | Favorable Time: 01:30 PM - 03:00 PM",
      },
      pisces: {
        forecast: "Jupiter and Neptune align to bless compassionate endeavors, artistic devotion, and serene dreams. Trust the spiritual current guiding your path today.",
        remedy: "Feed aquatic life or birds, and chant 'Om Gurave Namaha' with a peaceful heart.",
        lucky: "Lucky Color: Sea Green & Golden Yellow | Auspicious Number: 3 | Favorable Time: 07:30 AM - 09:00 AM",
      },
    };

    const cleanSignKey = sign.toLowerCase().split(" ")[0].replace(/[^a-z]/g, "");
    const info = defaultPredictions[cleanSignKey] || defaultPredictions.aries;
    const finalPrediction = aiGeneratedPrediction || info.forecast;
    const summary = `${sign}: ${finalPrediction.slice(0, 110)}...`;

    // Tier specific badge & blessings
    const tierName = sub.planName || "Vedic Member";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #FAF9F6; margin: 0; padding: 20px; color: #3D3D3D; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E8E6DF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #5C6B5A; color: #FFFFFF; padding: 24px; text-align: center; }
    .header h1 { margin: 0 0 4px 0; font-size: 22px; font-weight: bold; letter-spacing: 0.5px; }
    .header p { margin: 0; font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 24px; }
    .badge { display: inline-block; background: #F0EDDF; color: #8B9D83; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; }
    .user-card { background: #FAF9F6; border: 1px solid #E8E6DF; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; }
    .user-card h3 { margin: 0 0 6px 0; font-size: 16px; color: #3D3D3D; }
    .user-card p { margin: 2px 0; font-size: 12px; color: #7A7A7A; }
    .panchang-box { background: #FFF9F2; border-left: 4px solid #CB997E; border-radius: 4px; padding: 14px 16px; margin-bottom: 20px; }
    .panchang-box h4 { margin: 0 0 8px 0; font-size: 13px; color: #B8856B; text-transform: uppercase; letter-spacing: 0.5px; }
    .panchang-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; }
    .prediction { margin-bottom: 20px; line-height: 1.6; font-size: 14px; color: #4A4A4A; }
    .remedy-box { background: #EDF3EC; border: 1px solid #8B9D83; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; font-size: 13px; }
    .remedy-box strong { color: #5C6B5A; display: block; margin-bottom: 4px; }
    .consult-box { background: linear-gradient(135deg, #FAF8F5 0%, #F5EFEB 100%); border: 1px solid #CB997E; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center; }
    .consult-box h3 { margin: 0 0 6px 0; font-size: 16px; color: #3D3D3D; font-family: 'Georgia', serif; }
    .consult-box p { margin: 0 0 16px 0; font-size: 12px; color: #666666; line-height: 1.5; }
    .book-btn { display: inline-block; background-color: #CB997E; color: #FFFFFF !important; font-size: 13px; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 24px; letter-spacing: 0.5px; box-shadow: 0 3px 10px rgba(203,153,126,0.35); }
    .footer { background: #F0EDDF; padding: 18px; text-align: center; font-size: 11px; color: #7A7A7A; border-top: 1px solid #E8E6DF; }
    .footer a { color: #5C6B5A; font-weight: bold; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>JyotishVani Kendra</h1>
      <p>Daily Personalized Vedic Horoscope • ${dateStr}</p>
    </div>
    <div class="content">
      <span class="badge">Active Subscription: ${tierName}</span>
      <div class="user-card">
        <h3>Namaste ${sub.name} Ji 🙏</h3>
        <p><strong>Zodiac & Rashi:</strong> ${sub.zodiacSign}</p>
        <p><strong>Birth Chart Profile:</strong> ${birthInfo}</p>
        <p><strong>Delivery Scheduled Time:</strong> ${sub.deliveryTime} (Daily Delivery)</p>
      </div>

      <div class="panchang-box">
        <h4>Today's Shubh Panchang & Ephemeris</h4>
        <div class="panchang-grid">
          <div><strong>Tithi:</strong> ${todayPanchang.tithi}</div>
          <div><strong>Nakshatra:</strong> ${todayPanchang.nakshatra}</div>
          <div><strong>Abhijit Muhurat:</strong> ${todayPanchang.abhijitMuhurat}</div>
          <div><strong>Rahu Kaal:</strong> ${todayPanchang.rahuKaal}</div>
        </div>
      </div>

      <div class="prediction">
        <h3 style="color: #3D3D3D; margin-top: 0;">Planetary Forecast for ${sub.zodiacSign}</h3>
        <p>${finalPrediction}</p>
      </div>

      <div class="remedy-box">
        <strong>Vedic Upaya (Remedy of the Day):</strong>
        <p style="margin: 0 0 8px 0;">${info.remedy}</p>
        <div style="font-size: 11px; color: #5C6B5A; font-weight: 600;">${info.lucky}</div>
      </div>

      <!-- 1-on-1 Astrologer Consultation CTA Box with Booking Link -->
      <div class="consult-box">
        <div style="font-size: 24px; margin-bottom: 4px;">🪐 🕉️ 🪔</div>
        <h3>Need Deep Birth Chart (Kundali) Guidance?</h3>
        <p>Speak 1-on-1 with senior Vedic Acharyas for personalized Kundali Milan, Career & Marriage Forecasts, or Graha Dosha remedies.</p>
        <div style="margin-bottom: 10px;">
          <a href="${bookAstrologerUrl}" class="book-btn" target="_blank">
            📅 Book Appointment with Astrologer &rarr;
          </a>
        </div>
        <div style="font-size: 11px; color: #7A7A7A; margin-top: 8px;">
          Direct Booking Link: <a href="${bookAstrologerUrl}" style="color: #CB997E; text-decoration: underline;">${bookAstrologerUrl}</a>
          <br>Or dial Kendra Central Helpline: <a href="tel:${this.db.settings.helplineNumber}" style="color: #5C6B5A; font-weight: bold;">+91 ${this.db.settings.helplineNumber}</a>
        </div>
      </div>

      <p style="font-size: 12px; color: #7A7A7A; font-style: italic;">
        "May the supreme light of Surya and cosmic planets bestow peace, health, and prosperity upon your journey today."
      </p>
    </div>
    <div class="footer">
      <p>JyotishVani Kendra • Vedic Astrology Consultation Centre</p>
      <p>Helpline & Support: <a href="tel:${this.db.settings.helplineNumber}">+91 ${this.db.settings.helplineNumber}</a> • Email: support@jyotishvani.live</p>
      <p style="margin-top: 8px; font-size: 10px; color: #A0A0A0;">Sent via JyotishVani Automated Daily Email Scheduler to ${sub.email || "devotee email"}.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const text = `
JYOTISHVANI KENDRA - DAILY PERSONALIZED VEDIC HOROSCOPE
Date: ${dateStr}
Recipient: ${sub.name} (${sub.zodiacSign})
Subscription: ${tierName}
Email: ${sub.email || "N/A"}

--- TODAY'S PANCHANG ---
Tithi: ${todayPanchang.tithi}
Nakshatra: ${todayPanchang.nakshatra}
Abhijit Muhurat: ${todayPanchang.abhijitMuhurat}
Rahu Kaal: ${todayPanchang.rahuKaal}

--- COSMIC FORECAST FOR ${sub.zodiacSign.toUpperCase()} ---
${finalPrediction}

--- VEDIC REMEDY (UPAYA) ---
${info.remedy}
${info.lucky}

--- BOOK APPOINTMENT WITH SENIOR ASTROLOGER ---
Need deep birth chart (Kundli) analysis, career/marriage forecast, or Graha Dosha remedies?
👉 Book Appointment with Astrologer: ${bookAstrologerUrl}
Direct Kendra Helpline: +91 ${this.db.settings.helplineNumber}

--- KENDRA HELPLINE ---
Phone: +91 ${this.db.settings.helplineNumber}
Sent via JyotishVani Daily Scheduler.
    `.trim();

    return {
      subject,
      html,
      text,
      summary,
    };
  }

  /**
   * Generate highly personalized daily horoscope WhatsApp message for devotee
   */
  public generateHoroscopeWhatsApp(
    sub: StoredSubscriber,
    todayPanchang: any,
    devoteeWebsiteUrl?: string
  ): { text: string; summary: string; cleanMobile: string } {
    const devoteeName = sub.name || "Devotee";
    const sign = sub.zodiacSign || "Aries (Mesha)";
    const cleanMobile = (sub.mobile || "").replace(/\D/g, "");
    const tierName = sub.planName || (sub.planId === "trial" ? "3-Day Free Trial" : "Vedic Member");
    const dateStr = new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const defaultPredictions: Record<string, { forecast: string; remedy: string; lucky: string }> = {
      aries: {
        forecast: "Dynamic Mangal energy boosts your confidence and decision-making today. Favorable alignments for career progression and courageous investments.",
        remedy: "Offer Arghya (water) to Lord Surya at sunrise and chant 'Om Kram Kreem Kroum Sah Bhaumaya Namaha'.",
        lucky: "Lucky Color: Crimson Red | Lucky No: 9 | Auspicious Time: 09:15 AM - 10:45 AM",
      },
      taurus: {
        forecast: "Venus infuses grace and stability into financial matters. Collaborative pursuits with partners flourish; focus on prudent wealth accumulation.",
        remedy: "Offer white sweets or rice to the needy and chant 'Om Shum Shukraya Namaha'.",
        lucky: "Lucky Color: Opalescent White & Cream | Lucky No: 6 | Auspicious Time: 10:30 AM - 12:00 PM",
      },
      gemini: {
        forecast: "Mercury encourages intellectual breakthroughs and clear contracts. Communication skills are at their peak; express your ideas with clarity.",
        remedy: "Chant the Vishnu Sahasranama or recite the Budh Beej Mantra.",
        lucky: "Lucky Color: Emerald Green | Lucky No: 5 | Auspicious Time: 02:00 PM - 03:30 PM",
      },
      cancer: {
        forecast: "The Moon transit through intuitive quadrants enhances emotional clarity and spiritual wisdom. Deep family conversations bring peace of mind.",
        remedy: "Drink water in a silver cup and practice 10 minutes of serene meditation during twilight.",
        lucky: "Lucky Color: Pearl White & Silver | Lucky No: 2 | Auspicious Time: 07:00 AM - 08:30 AM",
      },
      leo: {
        forecast: "Surya's radiant energy ignites leadership potential and social respect. Your dedication is recognized by superiors; remain humble yet resolute.",
        remedy: "Perform Surya Namaskar at sunrise and chant the Aditya Hridaya Stotram.",
        lucky: "Lucky Color: Deep Gold & Saffron | Lucky No: 1 | Auspicious Time: 08:00 AM - 09:30 AM",
      },
      virgo: {
        forecast: "Planetary aspects promote methodical precision and health rejuvenation. Ideal day for balancing accounts and organized project workflows.",
        remedy: "Keep green plants in the North-East direction and chant 'Om Gam Ganapataye Namaha'.",
        lucky: "Lucky Color: Mint Green & Beige | Lucky No: 5 | Auspicious Time: 11:00 AM - 12:30 PM",
      },
      libra: {
        forecast: "Shukra promotes partnership harmony and aesthetic elegance. A favorable juncture for collaborative agreements and resolving emotional discords.",
        remedy: "Wear clean pastel garments and offer white flowers at an altar or temple.",
        lucky: "Lucky Color: Royal Blue & Pastel Lilac | Lucky No: 7 | Auspicious Time: 03:30 PM - 05:00 PM",
      },
      scorpio: {
        forecast: "Mars and Ketu stimulate transformative determination and inner courage. Hidden obstacles dissolve as you confront pending challenges.",
        remedy: "Recite Hanuman Chalisa and donate jaggery or red lentils to the underprivileged.",
        lucky: "Lucky Color: Maroon & Deep Amber | Lucky No: 9 | Auspicious Time: 06:30 AM - 08:00 AM",
      },
      sagittarius: {
        forecast: "Jupiter's benevolence illuminates higher wisdom and Dharma. Ideal for spiritual learning, ethical financial commitments, and auspicious starts.",
        remedy: "Apply a small sandalwood/turmeric tilak on forehead and respect spiritual elders.",
        lucky: "Lucky Color: Canary Yellow & Ochre | Lucky No: 3 | Auspicious Time: 09:00 AM - 10:30 AM",
      },
      capricorn: {
        forecast: "Saturn fosters steadfast perseverance and foundational success. Your hard work over the past cycle begins consolidating into tangible respect.",
        remedy: "Light a mustard oil lamp under a Peepal tree on Saturdays and help senior citizens.",
        lucky: "Lucky Color: Charcoal & Indigo | Lucky No: 8 | Auspicious Time: 04:00 PM - 05:30 PM",
      },
      aquarius: {
        forecast: "Saturn encourages visionary thinking and community harmony. Team efforts achieve auspicious breakthroughs; embrace progressive solutions.",
        remedy: "Feed birds in the morning and avoid arguments during Rahu Kaal.",
        lucky: "Lucky Color: Electric Blue & Violet | Lucky No: 4 | Auspicious Time: 01:30 PM - 03:00 PM",
      },
      pisces: {
        forecast: "Jupiter and Neptune align to bless compassionate endeavors, artistic devotion, and serene dreams. Trust the spiritual guidance on your path today.",
        remedy: "Feed aquatic life or birds, and chant 'Om Gurave Namaha' with a peaceful heart.",
        lucky: "Lucky Color: Sea Green & Golden Yellow | Lucky No: 3 | Auspicious Time: 07:30 AM - 09:00 AM",
      },
    };

    const cleanSignKey = sign.toLowerCase().split(" ")[0].replace(/[^a-z]/g, "");
    const info = defaultPredictions[cleanSignKey] || defaultPredictions.aries;
    const summary = `${sign}: ${info.forecast.slice(0, 110)}...`;
    const websiteUrl = devoteeWebsiteUrl || "https://ais-dev-qy2e5uwllij24bppgp6ci6-72004684266.asia-east1.run.app";

    const text = `🕉️ *JYOTISHVANI KENDRA - DAINIK VEDIC RASHIFAL* 🕉️
📅 *${dateStr}*
Pranam *${devoteeName} Ji* 🙏

🌟 *Vedic Rashi:* ${sign.toUpperCase()}
📦 *Subscription Plan:* ${tierName}
⏰ *Scheduled Delivery:* ${sub.deliveryTime || "07:00 AM"}

━━━━━━━━━━━━━━━━━━━━
🔱 *TODAY'S SHUBH PANCHANG*
• *Tithi:* ${todayPanchang?.tithi || "Shukla Paksha"}
• *Nakshatra:* ${todayPanchang?.nakshatra || "Auspicious"}
• *Abhijit Muhurat:* ${todayPanchang?.abhijitMuhurat || "11:53 AM - 12:43 PM"}
• *Rahu Kaal (Avoid):* ${todayPanchang?.rahuKaal || "10:30 AM - 12:00 PM"}

━━━━━━━━━━━━━━━━━━━━
🪐 *COSMIC FORECAST FOR ${sign.toUpperCase()}*
${info.forecast}

━━━━━━━━━━━━━━━━━━━━
🪔 *VEDIC REMEDY OF THE DAY (UPAYA)*
${info.remedy}

✨ *Auspicious Attributes:*
${info.lucky}

━━━━━━━━━━━━━━━━━━━━
🌐 *Devotee Web Portal:* ${websiteUrl}
📞 *Kendra Central Helpline:* +91 ${this.db.settings.helplineNumber}
💬 *WhatsApp Kendra Support:* +91 ${this.db.settings.helplineWhatsApp}

_May the cosmic grace of Surya and Navagrahas bring peace, health & prosperity to your home today!_ 🌺`;

    return {
      text,
      summary,
      cleanMobile,
    };
  }

  public generateHoroscopeSMS(
    sub: StoredSubscriber,
    todayPanchang: any,
    devoteeWebsiteUrl?: string
  ): { text: string; compactText: string; summary: string; cleanMobile: string } {
    const devoteeName = sub.name || "Devotee";
    const sign = sub.zodiacSign || "Aries (Mesha)";
    const cleanMobile = (sub.mobile || "").replace(/\D/g, "");
    const dateStr = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });

    const defaultPredictions: Record<string, { forecast: string; remedy: string; lucky: string }> = {
      aries: {
        forecast: "Mangal energy boosts confidence and positive decision-making. Favorable for career progression.",
        remedy: "Offer water to Lord Surya at sunrise and chant Gayatri Mantra.",
        lucky: "Lucky Color: Crimson Red | Lucky No: 9",
      },
      taurus: {
        forecast: "Venus infuses grace into financial matters. Collaborative pursuits and wealth accumulation flourish.",
        remedy: "Offer white sweets or rice to the needy.",
        lucky: "Lucky Color: Opalescent White | Lucky No: 6",
      },
      gemini: {
        forecast: "Mercury encourages intellectual breakthroughs. Communication skills are at peak.",
        remedy: "Chant the Budh Beej Mantra or feed green fodder to cows.",
        lucky: "Lucky Color: Emerald Green | Lucky No: 5",
      },
      cancer: {
        forecast: "Moon transit enhances emotional clarity and spiritual wisdom. Family brings peace.",
        remedy: "Drink water in a silver vessel and meditate at twilight.",
        lucky: "Lucky Color: Pearl White | Lucky No: 2",
      },
      leo: {
        forecast: "Surya's radiant energy ignites leadership and respect. Work hard with humility.",
        remedy: "Perform Surya Namaskar and recite Aditya Hridaya Stotram.",
        lucky: "Lucky Color: Deep Gold | Lucky No: 1",
      },
      virgo: {
        forecast: "Analytical focus ensures victory in complex tasks. Health and finances look stable.",
        remedy: "Water Tulsi plant and chant 'Om Namo Bhagavate Vasudevaya'.",
        lucky: "Lucky Color: Forest Green | Lucky No: 5",
      },
      libra: {
        forecast: "Auspicious harmony in business and relationships. Financial clarity brings comfort.",
        remedy: "Light ghee lamp for Goddess Lakshmi in the evening.",
        lucky: "Lucky Color: Royal Blue | Lucky No: 6",
      },
      scorpio: {
        forecast: "Transformative vitality and spiritual strength. Intuition will guide major decisions.",
        remedy: "Recite Hanuman Chalisa and donate red lentils on Tuesday.",
        lucky: "Lucky Color: Vermilion | Lucky No: 9",
      },
      sagittarius: {
        forecast: "Jupiter expands wisdom and optimism. Mentors provide blessings and guidance.",
        remedy: "Apply saffron/turmeric tilak and chant 'Om Brihaspataye Namaha'.",
        lucky: "Lucky Color: Sunshine Yellow | Lucky No: 3",
      },
      capricorn: {
        forecast: "Saturn fosters steadfast perseverance. Past efforts yield tangible respect.",
        remedy: "Light sesame oil lamp under Peepal tree and assist seniors.",
        lucky: "Lucky Color: Charcoal & Indigo | Lucky No: 8",
      },
      aquarius: {
        forecast: "Visionary insights bring community breakthroughs. Team efforts succeed.",
        remedy: "Feed birds in the morning and avoid disputes during Rahu Kaal.",
        lucky: "Lucky Color: Electric Blue | Lucky No: 4",
      },
      pisces: {
        forecast: "Jupiter blesses compassionate endeavors and artistic devotion. Trust spiritual signs.",
        remedy: "Feed fish or birds and chant 'Om Gurave Namaha'.",
        lucky: "Lucky Color: Sea Green & Yellow | Lucky No: 3",
      },
    };

    const cleanSignKey = sign.toLowerCase().split(" ")[0].replace(/[^a-z]/g, "");
    const info = defaultPredictions[cleanSignKey] || defaultPredictions.aries;
    const summary = `${sign}: ${info.forecast.slice(0, 90)}...`;
    const websiteUrl = devoteeWebsiteUrl || "https://ais-dev-qy2e5uwllij24bppgp6ci6-72004684266.asia-east1.run.app";
    const muhurat = todayPanchang?.abhijitMuhurat || "11:53 AM - 12:43 PM";
    const tithi = todayPanchang?.tithi || "Shukla Paksha";

    // Compact single/double segment SMS text
    const compactText = `🕉️ JYOTISHVANI DAINIK RASHIFAL (${dateStr})
Pranam ${devoteeName} Ji.
Rashi: ${sign.toUpperCase()}
Forecast: ${info.forecast}
Upaya: ${info.remedy}
Shubh Muhurat: ${muhurat}
Full Kundali & Panchang: ${websiteUrl}
Helpline: +91 ${this.db.settings.helplineNumber}`;

    // Standard complete SMS text
    const text = `🕉️ JYOTISHVANI KENDRA - DAINIK VEDIC RASHIFAL
Date: ${dateStr}
Pranam ${devoteeName} Ji 🙏

Rashi: ${sign.toUpperCase()}
Tithi: ${tithi}
Shubh Muhurat: ${muhurat}
Rahu Kaal: ${todayPanchang?.rahuKaal || "10:30 AM - 12:00 PM"}

Planetary Guidance:
${info.forecast}

Vedic Upaya (Remedy):
${info.remedy}

${info.lucky}

View Full Daily Panchang & Kundali:
${websiteUrl}

Kendra Helpline: +91 ${this.db.settings.helplineNumber}`;

    return {
      text,
      compactText,
      summary,
      cleanMobile,
    };
  }

  // --- DYNAMIC HOROSCOPES ---
  public getHoroscopes(): StoredHoroscope[] {
    return this.db.horoscopes || DEFAULT_HOROSCOPES;
  }

  public getHoroscope(id: string): StoredHoroscope | undefined {
    const list = this.getHoroscopes();
    return list.find((h) => h.id.toLowerCase() === id.toLowerCase());
  }

  public updateHoroscope(id: string, updates: Partial<StoredHoroscope>): StoredHoroscope | undefined {
    const list = this.getHoroscopes();
    const index = list.findIndex((h) => h.id.toLowerCase() === id.toLowerCase());
    if (index === -1) return undefined;
    list[index] = {
      ...list[index],
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
    this.db.horoscopes = list;
    this.persist(this.db);
    return list[index];
  }

  public updateAllHoroscopes(updatedList: StoredHoroscope[]): StoredHoroscope[] {
    this.db.horoscopes = updatedList;
    this.persist(this.db);
    return this.db.horoscopes;
  }

  // --- DYNAMIC SUBSCRIPTION PLANS ---
  public getPlans(): StoredPlan[] {
    const plans = this.db.plans && this.db.plans.length > 0 ? this.db.plans : DEFAULT_PLANS;
    const prices = this.db.settings?.planPrices;
    if (prices) {
      return plans.map((p) => {
        const idKey = p.id as keyof typeof prices;
        if (prices[idKey] !== undefined && typeof prices[idKey] === "number") {
          const newPrice = prices[idKey];
          return {
            ...p,
            price: newPrice,
            billingText:
              p.id === "trial"
                ? "100% Free • No Payment Upfront"
                : p.id === "monthly"
                ? `Billed at ₹${newPrice} every month`
                : p.id === "three_months"
                ? `Billed at ₹${newPrice} for 3 months (~₹${Math.round(newPrice / 3)}/mo)`
                : p.id === "six_months"
                ? `Billed at ₹${newPrice} for 6 months (~₹${Math.round(newPrice / 6)}/mo)`
                : `Billed at ₹${newPrice.toLocaleString("en-IN")} for 12 months (~₹${Math.round(newPrice / 12)}/mo)`,
            ctaText:
              p.id === "trial"
                ? "Start 3-Day Free Trial"
                : p.id === "monthly"
                ? `Choose Monthly (₹${newPrice})`
                : p.id === "three_months"
                ? `Choose 3 Months (₹${newPrice})`
                : p.id === "six_months"
                ? `Get 6 Months (₹${newPrice})`
                : `Get Yearly Pass (₹${newPrice.toLocaleString("en-IN")})`,
          };
        }
        return p;
      });
    }
    return plans;
  }

  public getPlan(id: string): StoredPlan | undefined {
    const list = this.getPlans();
    return list.find((p) => p.id === id);
  }

  public updatePlan(id: string, updates: Partial<StoredPlan>): StoredPlan | undefined {
    const list = this.getPlans();
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) return undefined;
    list[index] = {
      ...list[index],
      ...updates,
    };
    this.db.plans = list;
    // Also sync price with settings if price changed
    if (typeof updates.price === "number" && this.db.settings?.planPrices) {
      if (id in this.db.settings.planPrices) {
        (this.db.settings.planPrices as any)[id] = updates.price;
      }
    }
    this.persist(this.db);
    return list[index];
  }

  // --- DYNAMIC TESTIMONIALS ---
  public getTestimonials(): StoredTestimonial[] {
    return this.db.testimonials || DEFAULT_TESTIMONIALS;
  }

  public addTestimonial(data: Omit<StoredTestimonial, "id">): StoredTestimonial {
    const id = `test-${Date.now()}`;
    const newTestimonial: StoredTestimonial = {
      id,
      ...data,
      verified: data.verified ?? true,
    };
    if (!this.db.testimonials) {
      this.db.testimonials = [...DEFAULT_TESTIMONIALS];
    }
    this.db.testimonials.unshift(newTestimonial);
    this.persist(this.db);
    return newTestimonial;
  }

  public updateTestimonial(id: string, updates: Partial<StoredTestimonial>): StoredTestimonial | undefined {
    const list = this.getTestimonials();
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) return undefined;
    list[index] = { ...list[index], ...updates };
    this.db.testimonials = list;
    this.persist(this.db);
    return list[index];
  }

  public deleteTestimonial(id: string): boolean {
    const list = this.getTestimonials();
    const filtered = list.filter((t) => t.id !== id);
    if (filtered.length === list.length) return false;
    this.db.testimonials = filtered;
    this.persist(this.db);
    return true;
  }

  // --- DYNAMIC FAQS ---
  public getFaqs(): StoredFaq[] {
    return this.db.faqs || DEFAULT_FAQS;
  }

  public addFaq(data: Omit<StoredFaq, "id">): StoredFaq {
    const id = `faq-${Date.now()}`;
    const newFaq: StoredFaq = {
      id,
      ...data,
    };
    if (!this.db.faqs) {
      this.db.faqs = [...DEFAULT_FAQS];
    }
    this.db.faqs.push(newFaq);
    this.persist(this.db);
    return newFaq;
  }

  public updateFaq(id: string, updates: Partial<StoredFaq>): StoredFaq | undefined {
    const list = this.getFaqs();
    const index = list.findIndex((f) => f.id === id);
    if (index === -1) return undefined;
    list[index] = { ...list[index], ...updates };
    this.db.faqs = list;
    this.persist(this.db);
    return list[index];
  }

  public deleteFaq(id: string): boolean {
    const list = this.getFaqs();
    const filtered = list.filter((f) => f.id !== id);
    if (filtered.length === list.length) return false;
    this.db.faqs = filtered;
    this.persist(this.db);
    return true;
  }

  // --- OVERALL STATS ---
  public getStats() {
    const subscribers = Object.values(this.db.subscribers);
    const totalSubscribers = subscribers.length;
    const activeTrials = subscribers.filter((s) => s.status === "trial" || s.planId === "trial").length;
    const paidSubscribers = subscribers.filter((s) => s.status === "active" && s.planId !== "trial").length;
    const pendingCallbacks = this.db.callbacks.filter((c) => c.status === "pending").length;
    const totalConsultations = this.db.consultations.length;
    const totalPayments = (this.db.payments || []).length;
    const totalRevenue = (this.db.payments || [])
      .filter((p) => p.status === "verified")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      totalSubscribers,
      activeTrials,
      paidSubscribers,
      pendingCallbacks,
      totalConsultations,
      totalPayments,
      totalRevenue,
      horoscopesCount: (this.db.horoscopes || []).length,
      plansCount: (this.db.plans || []).length,
      testimonialsCount: (this.db.testimonials || []).length,
      faqsCount: (this.db.faqs || []).length,
      databaseType: "Document Database (Persistent Storage with Firebase Firestore sync capability)",
      lastUpdated: this.db.lastUpdated,
      storageFile: "data/database.json",
    };
  }
}

export const db = new DocumentDatabase();
