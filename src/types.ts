export type ZodiacId =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

export interface ZodiacSign {
  id: ZodiacId;
  name: string;
  vedicName: string;
  symbol: string;
  element: "Fire" | "Earth" | "Air" | "Water";
  dates: string;
  rulingPlanet: string;
  gemstone: string;
  luckyColor: string;
  luckyNumber: number;
  favorableTime: string;
  overallRating: number; // 1 to 5
  prediction: {
    summary: string;
    love: string;
    career: string;
    finance: string;
    health: string;
    remedy: string;
  };
}

export type SubscriptionPlanId = "trial" | "monthly" | "three_months" | "six_months" | "yearly";

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  price: number;
  originalPrice?: number;
  durationLabel: string;
  billingText: string;
  badge?: string;
  popular?: boolean;
  isFree?: boolean;
  savings?: string;
  features: string[];
  ctaText: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  source?: string;
}

export interface Astrologer {
  id: string;
  name: string;
  vedicTitle: string;
  experience: number; // years
  languages: string[];
  specializations: string[];
  rating: number;
  reviewsCount: number;
  videoFee: number; // in INR
  offlineFee: number; // in INR
  avatar: string;
  education: string;
  cities: string[]; // For offline visit
  clinicAddress: string;
  bio: string;
  availableNext: string;
}

export interface UserSubscription {
  mobile: string;
  name: string;
  email?: string;
  zodiacSign: string;
  deliveryChannel: "email";
  deliveryTime: string;
  planId: SubscriptionPlanId;
  planName?: string;
  price?: number;
  status: "active" | "trial" | "expired" | "stopped" | "pending_verification";
  validUntil: string;
  autoRenew?: boolean;
  phoneVerified?: boolean;
  phoneVerifiedAt?: string;
  verificationProvider?: string;
  emailVerified?: boolean;
  dob?: string;
  tob?: string;
  pob?: string;
  gotra?: string;
  adminNotes?: string;
  registeredAt?: string;
  createdAt?: string;
  updatedAt?: string;
  lastDispatched?: string;
}

export interface AstrologerBooking {
  bookingId: string;
  astrologerId: string;
  astrologerName: string;
  mode: "video" | "offline";
  date: string;
  timeSlot: string;
  userMobile: string;
  userName: string;
  city?: string;
  clinicAddress?: string;
  meetingLink?: string;
  status: string;
}

export interface DynamicSettings {
  helplineNumber: string;
  helplineWhatsApp: string;
  kendraTimings: string;
  kendraLocation: string;
  kendraStatus: "open" | "closed";
  upiId: string;
  upiPayeeName: string;
  trialDays: number;
  planPrices: {
    trial: number;
    monthly: number;
    three_months: number;
    six_months: number;
    yearly: number;
  };
  announcementBanner: string;
}

export interface UpiPaymentRecord {
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

export interface StoredPanchangData {
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
  targetSubscriptionTiers: string[];
  lastRunAt?: string;
  nextRunAt?: string;
  // Live SMTP Configuration
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
  reason?: string;
  subject: string;
  sentAt: string;
  previewSummary?: string;
  deliveryMode?:
    | "smtp"
    | "simulated"
    | "audit_log"
    | "simulation";
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
  skippedCount: number;
  status: "success" | "partial" | "failed";
  dispatches: EmailDispatchRecord[];
}

export type StoredSubscriber = UserSubscription;

export interface StoredTestimonial {
  id: string;
  name: string;
  city: string;
  text: string;
  sign: string;
  plan: string;
  rating: number;
  verified?: boolean;
}

export interface StoredFaq {
  id: string;
  q: string;
  a: string;
  category?: "trial" | "pricing" | "delivery" | "consultation" | "general";
}
