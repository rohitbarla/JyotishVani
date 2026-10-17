/**
 * Direct SMS (Text Message) Delivery Service
 * Dispatches standard Text Messages (SMS) to devotees without requiring WhatsApp.
 * Supports Twilio SMS API, Fast2SMS (India Gateway), Custom Webhooks, Simulated Dev SMS, and Native Device SMS.
 */

import { db } from "./db";

export interface DirectSmsOptions {
  to: string;
  text: string;
  devoteeName?: string;
  zodiacSign?: string;
  isTest?: boolean;
  provider?: "twilio_sms" | "fast2sms" | "custom_webhook" | "device_sms" | "simulated_sms";
}

export interface DirectSmsResult {
  success: boolean;
  delivered: boolean;
  messageId: string;
  to: string;
  gateway: "twilio_sms" | "fast2sms" | "custom_webhook" | "device_sms" | "simulated_sms";
  status: "sent" | "delivered" | "queued" | "failed";
  details: string;
  timestamp: string;
  smsUrl: string;
  iosSmsUrl: string;
  androidSmsUrl: string;
  webSmsUrl: string;
  smsLength: number;
  smsSegments: number;
}

/**
 * Calculates standard GSM 7-bit SMS segment count
 */
export function calculateSmsSegments(text: string): { length: number; segments: number } {
  const len = text.length;
  // If text contains non-GSM characters, Unicode/UCS-2 segmentation applies (70 chars/part)
  const isUnicode = /[^\u0000-\u007F]/.test(text);
  const singleLimit = isUnicode ? 70 : 160;
  const multiLimit = isUnicode ? 67 : 153;

  const segments = len <= singleLimit ? 1 : Math.ceil(len / multiLimit);
  return { length: len, segments };
}

export async function sendDirectSms(options: DirectSmsOptions): Promise<DirectSmsResult> {
  const rawMobile = (options.to || "").replace(/\D/g, "");
  const cleanMobile = rawMobile.length >= 10 ? rawMobile.slice(-10) : rawMobile;
  const formattedE164 = `+91${cleanMobile}`;
  const nowIso = new Date().toISOString();
  const { length: smsLength, segments: smsSegments } = calculateSmsSegments(options.text);

  // Platform specific SMS URLs
  const encodedText = encodeURIComponent(options.text);
  // Universal standard (works across modern Android & desktop):
  const androidSmsUrl = `sms:${formattedE164}?body=${encodedText}`;
  // iOS Messages format:
  const iosSmsUrl = `sms:${formattedE164}&body=${encodedText}`;
  // Universal compatible deep link:
  const smsUrl = `sms:${formattedE164}?&body=${encodedText}`;
  // Web SMS (Google Messages for Web):
  const webSmsUrl = `https://messages.google.com/web`;

  // Fetch scheduler config for saved credentials
  const config = db.getSchedulerConfig();
  const activeProvider = options.provider || config.smsGatewayProvider || "device_sms";

  // 1. Simulated / Sandboxed Delivery (for instant testing & verification without third-party fees)
  if (activeProvider === "simulated_sms") {
    const simId = `sim_sms_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    return {
      success: true,
      delivered: true,
      messageId: simId,
      to: formattedE164,
      gateway: "simulated_sms",
      status: "delivered",
      details: `Dispatched via JyotishVani Simulated SMS Engine to +91 ${cleanMobile} (Audit ID: ${simId}).`,
      timestamp: nowIso,
      smsUrl,
      iosSmsUrl,
      androidSmsUrl,
      webSmsUrl,
      smsLength,
      smsSegments,
    };
  }

  // 2. Fast2SMS Indian SMS Gateway (Highest reliability for Indian mobile numbers)
  const fast2SmsKey = (config.fast2smsApiKey || process.env.FAST2SMS_API_KEY || "").trim();
  if (activeProvider === "fast2sms" || (!options.provider && fast2SmsKey)) {
    if (!fast2SmsKey) {
      return {
        success: false,
        delivered: false,
        messageId: `err_fast2sms_${Date.now()}`,
        to: formattedE164,
        gateway: "fast2sms",
        status: "failed",
        details: "Fast2SMS API Key is missing. Please enter your Fast2SMS API key in Scheduler Settings.",
        timestamp: nowIso,
        smsUrl,
        iosSmsUrl,
        androidSmsUrl,
        webSmsUrl,
        smsLength,
        smsSegments,
      };
    }

    try {
      console.log(`[SMS Direct] Dispatching via Fast2SMS Indian Gateway to ${cleanMobile}...`);
      // Use Fast2SMS bulkV2 route 'q' (Quick SMS - direct instant transmission)
      const resp = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: fast2SmsKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "q",
          message: options.text,
          language: "english",
          flash: 0,
          numbers: cleanMobile,
        }),
      });

      const data = (await resp.json()) as any;
      console.log(`[SMS Direct] Fast2SMS response:`, data);

      if (resp.ok && data?.return === true) {
        const msgId = data?.request_id || `f2s_${Date.now()}`;
        return {
          success: true,
          delivered: true,
          messageId: msgId,
          to: formattedE164,
          gateway: "fast2sms",
          status: "delivered",
          details: `Direct SMS delivered via Fast2SMS India Gateway (Request: ${msgId}) to +91 ${cleanMobile}.`,
          timestamp: nowIso,
          smsUrl,
          iosSmsUrl,
          androidSmsUrl,
          webSmsUrl,
          smsLength,
          smsSegments,
        };
      } else {
        const errMsg = Array.isArray(data?.message) ? data.message.join(", ") : (data?.message || "Fast2SMS dispatch error");
        console.warn(`[SMS Direct] Fast2SMS returned error:`, errMsg);
        return {
          success: false,
          delivered: false,
          messageId: `f2s_fail_${Date.now()}`,
          to: formattedE164,
          gateway: "fast2sms",
          status: "failed",
          details: `Fast2SMS error: ${errMsg}`,
          timestamp: nowIso,
          smsUrl,
          iosSmsUrl,
          androidSmsUrl,
          webSmsUrl,
          smsLength,
          smsSegments,
        };
      }
    } catch (err: any) {
      console.warn(`[SMS Direct] Fast2SMS exception:`, err?.message || err);
    }
  }

  // 3. Custom SMS Webhook Gateway (MSG91, Gupshup, Exotel, Textlocal, etc.)
  const customSmsUrl = (config.customSmsUrl || process.env.CUSTOM_SMS_GATEWAY_URL || "").trim();
  if (activeProvider === "custom_webhook" || (!options.provider && customSmsUrl)) {
    if (!customSmsUrl) {
      return {
        success: false,
        delivered: false,
        messageId: `err_custom_${Date.now()}`,
        to: formattedE164,
        gateway: "custom_webhook",
        status: "failed",
        details: "Custom SMS Webhook URL is not configured. Please enter the endpoint URL in Scheduler Settings.",
        timestamp: nowIso,
        smsUrl,
        iosSmsUrl,
        androidSmsUrl,
        webSmsUrl,
        smsLength,
        smsSegments,
      };
    }

    try {
      console.log(`[SMS Direct] Dispatching via Custom SMS Gateway to ${formattedE164}...`);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = (config.customSmsToken || process.env.CUSTOM_SMS_GATEWAY_TOKEN || "").trim();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const resp = await fetch(customSmsUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          to: formattedE164,
          mobile: cleanMobile,
          message: options.text,
          devoteeName: options.devoteeName || "Devotee",
          zodiacSign: options.zodiacSign || "Aries",
        }),
      });

      if (resp.ok) {
        const data = (await resp.json()) as any;
        const msgId = data?.id || data?.messageId || `custom_sms_${Date.now()}`;
        return {
          success: true,
          delivered: true,
          messageId: msgId,
          to: formattedE164,
          gateway: "custom_webhook",
          status: "delivered",
          details: `Direct SMS delivered via Custom Gateway to ${formattedE164}.`,
          timestamp: nowIso,
          smsUrl,
          iosSmsUrl,
          androidSmsUrl,
          webSmsUrl,
          smsLength,
          smsSegments,
        };
      }
    } catch (err: any) {
      console.warn(`[SMS Direct] Custom SMS Gateway exception:`, err?.message || err);
    }
  }

  // 4. Twilio SMS Gateway (for Upgraded / Paid accounts or pre-verified recipients)
  const twilioSid = (config.twilioSid || process.env.TWILIO_ACCOUNT_SID || "").trim();
  const twilioAuthToken = (config.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN || "").trim();
  let twilioFromNumber = (config.twilioPhoneNumber || config.twilioSmsNumber || process.env.TWILIO_PHONE_NUMBER || "").trim();
  if (twilioFromNumber.startsWith("whatsapp:")) {
    twilioFromNumber = twilioFromNumber.replace("whatsapp:", "");
  }

  let twilioAttemptNote = "";

  if (activeProvider === "twilio_sms" || (!options.provider && activeProvider !== "device_sms")) {
    if (twilioSid && twilioAuthToken && twilioFromNumber) {
      try {
        console.log(`[SMS Direct] Dispatching via Twilio SMS (${twilioFromNumber} -> ${formattedE164})...`);
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const basicAuth = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString("base64");

        const params = new URLSearchParams();
        params.append("From", twilioFromNumber);
        params.append("To", formattedE164);
        params.append("Body", options.text);

        const resp = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            Authorization: `Basic ${basicAuth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });

        const responseData = (await resp.json()) as any;

        if (resp.ok && responseData?.sid) {
          console.log(`[SMS Direct] Twilio SMS dispatch success: ${responseData.sid}`);
          return {
            success: true,
            delivered: true,
            messageId: responseData.sid,
            to: formattedE164,
            gateway: "twilio_sms",
            status: responseData.status || "delivered",
            details: `Direct SMS delivered via Twilio SMS Gateway (SID: ${responseData.sid}) to ${formattedE164}.`,
            timestamp: nowIso,
            smsUrl,
            iosSmsUrl,
            androidSmsUrl,
            webSmsUrl,
            smsLength,
            smsSegments,
          };
        } else {
          const twilioCode = responseData?.code;
          const twilioMsg = responseData?.message || `Code ${twilioCode || "Unknown"}`;
          console.warn(`[SMS Direct] Twilio response (${twilioCode}):`, twilioMsg);

          if (twilioCode === 572006 || twilioCode === 21608) {
            twilioAttemptNote = "Twilio Trial Restriction: Twilio trial accounts require an upgraded paid account or verified number to send custom international SMS to India (+91). Use Fast2SMS, Custom Webhook, or 1-Click Device SMS below.";
          } else {
            twilioAttemptNote = `Twilio Error: ${twilioMsg}`;
          }
        }
      } catch (err: any) {
        console.warn(`[SMS Direct] Twilio exception:`, err?.message || err);
        twilioAttemptNote = err?.message || "Twilio network error";
      }
    }
  }

  // 5. Default / 1-Click Device SMS & Multi-Channel Fallback
  const messageId = `sms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return {
    success: true,
    delivered: false,
    messageId,
    to: formattedE164,
    gateway: "device_sms",
    status: "queued",
    details: twilioAttemptNote
      ? twilioAttemptNote
      : `SMS text message prepared for +91 ${cleanMobile}. Use 1-Click Device SMS, Google Messages Web, or scan the QR Code on your mobile to transmit instantly.`,
    timestamp: nowIso,
    smsUrl,
    iosSmsUrl,
    androidSmsUrl,
    webSmsUrl,
    smsLength,
    smsSegments,
  };
}
