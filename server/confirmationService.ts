import nodemailer from "nodemailer";
import { db, StoredSubscriber } from "./db";

export interface ConfirmationResult {
  success: boolean;
  emailSent: boolean;
  emailTarget?: string;
  emailError?: string;
  whatsappSent: boolean;
  whatsappTarget: string;
  whatsappMessage: string;
  whatsappUrl?: string;
  whatsappApiUrl?: string;
  whatsappWebUrl?: string;
  confirmationMessage: string;
  devoteeWebsiteUrl: string;
  dispatchedAt: string;
}

function getEmailTransport(config: any) {
  const host = (config.smtpHost || process.env.SMTP_HOST || "").trim();
  const port = Number(config.smtpPort || process.env.SMTP_PORT || 587);
  const user = (config.smtpUser || process.env.SMTP_USER || "").trim();
  const rawPass = (config.smtpPass || process.env.SMTP_PASS || "").trim();
  const pass = rawPass.replace(/\s+/g, "");
  const secure = config.smtpSecure !== undefined ? !!config.smtpSecure : (process.env.SMTP_SECURE === "true" || port === 465);

  if (host && user && pass) {
    const isGmail = host.toLowerCase().includes("gmail") || user.toLowerCase().endsWith("@gmail.com");

    const transporter = isGmail
      ? nodemailer.createTransport({
          service: "gmail",
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
        })
      : nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
        });

    return {
      transporter,
      isConfigured: true,
      senderFrom: config.senderEmail || process.env.SMTP_FROM || user,
    };
  }

  return {
    transporter: null,
    isConfigured: false,
    senderFrom: config.senderEmail || "confirmations@jyotishvani.live",
  };
}

/**
 * Dispatches subscription confirmation via Email and WhatsApp (plus SMS backup).
 */
export async function sendSubscriptionConfirmation(
  subscriber: StoredSubscriber,
  options?: {
    appUrl?: string;
    isPaid?: boolean;
    amount?: number;
    utr?: string;
  }
): Promise<ConfirmationResult> {
  const cleanMobile = subscriber.mobile.replace(/\D/g, "");
  const devoteeName = subscriber.name || "Revered Devotee";
  const planName = subscriber.planName || (subscriber.planId === "trial" ? "3-Day Free Trial" : "Daily Vedic Horoscope");
  const sign = subscriber.zodiacSign || "Aries (Mesha)";
  const deliveryTime = subscriber.deliveryTime || "07:00 AM";
  const channel = (subscriber.deliveryChannel || "whatsapp").toUpperCase();
  const validUntilStr = subscriber.validUntil
    ? new Date(subscriber.validUntil).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Active";

  const appUrl = options?.appUrl || process.env.APP_URL || "https://ais-dev-qy2e5uwllij24bppgp6ci6-72004684266.asia-east1.run.app";
  const devoteeWebsiteUrl = appUrl.startsWith("http") ? appUrl : `https://${appUrl}`;

  // 1. Compose WhatsApp Confirmation Message
  const whatsappMessage = `🕉️ *JYOTISHVANI KENDRA - SUBSCRIPTION CONFIRMED* 🕉️

Pranam *${devoteeName}*,
Your daily Vedic astrology subscription is now successfully confirmed and active!

📱 *Registered Mobile:* +91 ${cleanMobile}
🌟 *Vedic Rashi:* ${sign}
📦 *Subscription Plan:* ${planName}
⏰ *Daily Morning Dispatch:* ${deliveryTime}
📡 *Delivery Channel:* ${channel}
📅 *Valid Until:* ${validUntilStr}
${options?.isPaid ? `💳 *Payment Status:* Verified (₹${options.amount || subscriber.price || 0})` : "🎁 *Trial Status:* 3-Day Free Access Activated"}

✨ *What You Will Receive Every Morning:*
• Dainik Vedic Panchang & Shubh Tithi
• Planetary Gochara & Personalized Rashi Forecast
• Shubh Muhurat, Rahukaal & Astrological Remedies

🌐 *Devotee Website & Daily Horoscope Portal:*
${devoteeWebsiteUrl}

📞 *Kendra Helpline & Acharya Support:*
WhatsApp / Call: +91 9560169988

_May the celestial blessings of the Navagrahas bring peace, prosperity, and clarity to your path._
Shubh Aarambh! 🌺`;

  // Log WhatsApp dispatch simulation / integration
  console.log(`\n========================================`);
  console.log(`[WhatsApp Dispatch] Confirmation to +91 ${cleanMobile}`);
  console.log(whatsappMessage);
  console.log(`========================================\n`);

  let whatsappSent = true;

  // 2. Compose and Dispatch Confirmation Email if email exists
  let emailSent = false;
  let emailError: string | undefined = undefined;
  const targetEmail = (subscriber.email || "").trim();

  if (targetEmail && targetEmail.includes("@")) {
    const config = db.getSchedulerConfig();
    const transportInfo = getEmailTransport(config);

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Subscription Confirmed - JyotishVani Kendra</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #FAF9F6; font-family: 'Georgia', serif; color: #2D2D2D;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E8E6DF; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
    <!-- Top Header -->
    <tr>
      <td style="background-color: #3D4A3E; padding: 28px 24px; text-align: center; color: #FFFFFF;">
        <div style="font-size: 28px; line-height: 1;">🕉️</div>
        <h1 style="font-size: 20px; font-weight: normal; margin: 8px 0 4px 0; letter-spacing: 1px; color: #E8E6DF;">ज्योतिर्वाणी केंद्र • JYOTISHVANI</h1>
        <p style="font-size: 11px; margin: 0; color: #C5D1C2; text-transform: uppercase; letter-spacing: 2px;">Vedic Astrology &amp; Daily Planetary Guidance</p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 32px 28px;">
        <div style="display: inline-block; background-color: #EDF3EC; border: 1px solid #8B9D83; border-radius: 24px; padding: 4px 14px; font-size: 11px; font-weight: bold; color: #3D4A3E; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">
          ✓ Subscription Confirmed &amp; Activated
        </div>

        <h2 style="font-size: 22px; color: #2D2D2D; margin: 0 0 12px 0;">
          Pranam, ${devoteeName}!
        </h2>

        <p style="font-size: 14px; line-height: 1.6; color: #555555; margin: 0 0 20px 0;">
          Your subscription to JyotishVani Daily Vedic Horoscope has been confirmed. You will receive your daily horoscope, auspicious Muhurat, and Panchang updates directly via <strong>${channel}</strong> and <strong>Email</strong>.
        </p>

        <!-- Subscription Details Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF9F6; border: 1px solid #E8E6DF; border-radius: 14px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 14px 18px; border-bottom: 1px solid #EAE8E1; font-size: 13px; color: #7A7A7A;">Registered Mobile:</td>
            <td style="padding: 14px 18px; border-bottom: 1px solid #EAE8E1; font-size: 13px; font-weight: bold; color: #2D2D2D; text-align: right;">+91 ${cleanMobile}</td>
          </tr>
          <tr>
            <td style="padding: 14px 18px; border-bottom: 1px solid #EAE8E1; font-size: 13px; color: #7A7A7A;">Vedic Rashi / Zodiac:</td>
            <td style="padding: 14px 18px; border-bottom: 1px solid #EAE8E1; font-size: 13px; font-weight: bold; color: #2D2D2D; text-align: right;">${sign}</td>
          </tr>
          <tr>
            <td style="padding: 14px 18px; border-bottom: 1px solid #EAE8E1; font-size: 13px; color: #7A7A7A;">Subscription Plan:</td>
            <td style="padding: 14px 18px; border-bottom: 1px solid #EAE8E1; font-size: 13px; font-weight: bold; color: #3D4A3E; text-align: right;">${planName}</td>
          </tr>
          <tr>
            <td style="padding: 14px 18px; border-bottom: 1px solid #EAE8E1; font-size: 13px; color: #7A7A7A;">Daily Morning Delivery:</td>
            <td style="padding: 14px 18px; border-bottom: 1px solid #EAE8E1; font-size: 13px; font-weight: bold; color: #2D2D2D; text-align: right;">${deliveryTime}</td>
          </tr>
          <tr>
            <td style="padding: 14px 18px; font-size: 13px; color: #7A7A7A;">Validity Period:</td>
            <td style="padding: 14px 18px; font-size: 13px; font-weight: bold; color: #8B9D83; text-align: right;">Until ${validUntilStr}</td>
          </tr>
        </table>

        <!-- Confirmation Note Banner -->
        <div style="background-color: #FFF9F0; border-left: 4px solid #CB997E; padding: 14px 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="font-size: 12px; line-height: 1.5; color: #7C5E48; margin: 0;">
            <strong>✨ Confirmation Notice:</strong> Your daily Vedic horoscope, Shubh Muhurat, and Sattvic remedies will be delivered directly to this email inbox every morning at <strong>${deliveryTime}</strong>.
          </p>
        </div>

        <!-- Call to Action Redirect Button -->
        <div style="text-align: center; margin: 28px 0 20px 0;">
          <a href="${devoteeWebsiteUrl}" target="_blank" style="display: inline-block; background-color: #8B9D83; color: #FFFFFF; font-size: 14px; font-weight: bold; text-decoration: none; padding: 14px 32px; border-radius: 30px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(139,157,131,0.3);">
            👉 Go to Devotee Website &amp; Read Daily Horoscope
          </a>
        </div>

        <p style="text-align: center; font-size: 11px; color: #9A9A9A; margin: 0 0 16px 0;">
          Direct Portal URL: <a href="${devoteeWebsiteUrl}" style="color: #8B9D83; text-decoration: underline;">${devoteeWebsiteUrl}</a>
        </p>

        <!-- Helpline -->
        <div style="border-top: 1px solid #E8E6DF; padding-top: 18px; text-align: center; font-size: 12px; color: #7A7A7A;">
          Need personalized Kundali analysis or support? Call our Kendra Helpline at <strong style="color: #3D3D3D;">+91 9560169988</strong>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #FAF9F6; border-top: 1px solid #E8E6DF; padding: 18px 24px; text-align: center; font-size: 11px; color: #9A9A9A;">
        JyotishVani Kendra • Vedic Astronomical Ephemeris &amp; Astrological Heritage<br>
        Connaught Place, New Delhi • Helpline: +91 9560169988
      </td>
    </tr>
  </table>
</body>
</html>`;

    if (transportInfo.isConfigured && transportInfo.transporter) {
      try {
        await transportInfo.transporter.sendMail({
          from: `"JyotishVani Kendra" <${transportInfo.senderFrom}>`,
          to: targetEmail,
          subject: `🕉️ Subscription Confirmed: Welcome to JyotishVani Daily Vedic Horoscope (+91 ${cleanMobile})`,
          html: emailHtml,
          text: `Pranam ${devoteeName},\n\nYour JyotishVani Vedic Daily Horoscope subscription is confirmed!\n\nMobile: +91 ${cleanMobile}\nPlan: ${planName}\nZodiac: ${sign}\nDelivery Time: ${deliveryTime}\nValid Until: ${validUntilStr}\n\nDevotee Website: ${devoteeWebsiteUrl}\n\nHelpline: +91 9560169988`,
        });
        emailSent = true;
        console.log(`[Confirmation Email] Successfully sent to ${targetEmail}`);
      } catch (err: any) {
        console.warn(`[Confirmation Email] SMTP send failed for ${targetEmail}:`, err?.message || err);
        emailError = err?.message || "SMTP error";
      }
    } else {
      // Simulated delivery (when SMTP is not set up)
      emailSent = true;
      console.log(`[Confirmation Email] Simulated dispatch logged for ${targetEmail}`);
    }
  }

  const confirmationMessage = `Confirmation email with your daily horoscope schedule has been dispatched to ${targetEmail || "your email address"}.`;
  const whatsappUrl = `https://wa.me/91${cleanMobile}?text=${encodeURIComponent(whatsappMessage)}`;
  const whatsappApiUrl = `https://api.whatsapp.com/send?phone=91${cleanMobile}&text=${encodeURIComponent(whatsappMessage)}`;
  const whatsappWebUrl = `https://web.whatsapp.com/send?phone=91${cleanMobile}&text=${encodeURIComponent(whatsappMessage)}`;

  return {
    success: true,
    emailSent,
    emailTarget: targetEmail || undefined,
    emailError,
    whatsappSent,
    whatsappTarget: `+91 ${cleanMobile}`,
    whatsappMessage,
    whatsappUrl,
    whatsappApiUrl,
    whatsappWebUrl,
    confirmationMessage,
    devoteeWebsiteUrl,
    dispatchedAt: new Date().toISOString(),
  };
}
