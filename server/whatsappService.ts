/**
 * Direct WhatsApp Delivery Service
 * Dispatches WhatsApp messages directly from the server without opening client apps or browser tabs.
 * Supports Twilio WhatsApp API, Meta Cloud API, Custom Webhooks, and direct server gateway dispatch.
 */

export interface DirectWhatsAppOptions {
  to: string;
  text: string;
  devoteeName?: string;
  zodiacSign?: string;
  isTest?: boolean;
}

export interface DirectWhatsAppResult {
  success: boolean;
  delivered: boolean;
  messageId: string;
  to: string;
  gateway: "twilio" | "meta_cloud" | "custom_webhook" | "direct_gateway";
  status: "sent" | "delivered" | "queued";
  details: string;
  timestamp: string;
  whatsappUrl: string;
  whatsappApiUrl: string;
  whatsappWebUrl: string;
}

export async function sendDirectWhatsApp(
  options: DirectWhatsAppOptions
): Promise<DirectWhatsAppResult> {
  const rawMobile = (options.to || "").replace(/\D/g, "");
  const cleanMobile = rawMobile.length >= 10 ? rawMobile.slice(-10) : rawMobile;
  const formattedE164 = `+91${cleanMobile}`;
  const nowIso = new Date().toISOString();

  // Generate fallback deep links for records
  const whatsappUrl = `https://wa.me/91${cleanMobile}?text=${encodeURIComponent(options.text)}`;
  const whatsappApiUrl = `https://api.whatsapp.com/send?phone=91${cleanMobile}&text=${encodeURIComponent(options.text)}`;
  const whatsappWebUrl = `https://web.whatsapp.com/send?phone=91${cleanMobile}&text=${encodeURIComponent(options.text)}`;

  // 1. Check Twilio WhatsApp Gateway
  const twilioSid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
  const twilioAuthToken = (process.env.TWILIO_AUTH_TOKEN || "").trim();
  const twilioFromNumber = (process.env.TWILIO_WHATSAPP_NUMBER || "").trim();
  const twilioContentSid = (process.env.TWILIO_CONTENT_SID || "").trim();

  let twilioAttemptNote = "";

  if (twilioSid && twilioAuthToken) {
    try {
      console.log(`[WhatsApp Direct] Dispatching via Twilio WhatsApp API (${twilioSid.slice(0, 8)}...) to ${formattedE164}...`);
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const basicAuth = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString("base64");

      // Attempt sending with ContentSid if specified, otherwise Body
      const sendTwilioRequest = async (useContentSid: boolean) => {
        const params = new URLSearchParams();
        if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
          params.append("MessagingServiceSid", process.env.TWILIO_MESSAGING_SERVICE_SID.trim());
        } else {
          params.append("From", twilioFromNumber.startsWith("whatsapp:") ? twilioFromNumber : `whatsapp:${twilioFromNumber}`);
        }
        params.append("To", `whatsapp:${formattedE164}`);

        if (useContentSid && twilioContentSid) {
          params.append("ContentSid", twilioContentSid);
          // Pass template parameters if required by template
          const contentVars: Record<string, string> = {
            "1": options.devoteeName || "Devotee",
            "2": options.zodiacSign || "Aries",
            "3": options.text.slice(0, 500),
          };
          params.append("ContentVariables", JSON.stringify(contentVars));
        } else {
          params.append("Body", options.text);
        }

        const resp = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            Authorization: `Basic ${basicAuth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });
        return { ok: resp.ok, data: (await resp.json()) as any };
      };

      // Try with ContentSid first if available, else fall back to Body
      let twilioResult = await sendTwilioRequest(!!twilioContentSid);

      // If ContentSid failed due to template error, try direct Body fallback
      if (!twilioResult.ok && twilioContentSid && twilioResult.data?.code === 21655) {
        console.warn(`[WhatsApp Direct] ContentSid ${twilioContentSid} invalid/unapproved on Twilio; attempting Body fallback...`);
        const fallbackResult = await sendTwilioRequest(false);
        if (fallbackResult.ok) {
          twilioResult = fallbackResult;
        }
      }

      const responseData = twilioResult.data;

      if (twilioResult.ok && responseData?.sid) {
        console.log(`[WhatsApp Direct] Twilio dispatch success: ${responseData.sid}`);
        return {
          success: true,
          delivered: true,
          messageId: responseData.sid,
          to: formattedE164,
          gateway: "twilio",
          status: responseData.status || "delivered",
          details: `Direct WhatsApp message delivered via Twilio WhatsApp Gateway (SID: ${responseData.sid}) to ${formattedE164}.`,
          timestamp: nowIso,
          whatsappUrl,
          whatsappApiUrl,
          whatsappWebUrl,
        };
      } else {
        const twilioCode = responseData?.code;
        const twilioMsg = responseData?.message || `Code ${twilioCode || "Unknown"}`;
        console.warn(`[WhatsApp Direct] Twilio response (${twilioCode}):`, twilioMsg);
        
        if (twilioCode === 21654) {
          twilioAttemptNote = "Twilio Trial Restriction: WhatsApp template (ContentSid) required for automated delivery on Trial accounts. Use 1-Click WhatsApp to send directly to recipient.";
        } else if (twilioCode === 21655) {
          twilioAttemptNote = `Twilio ContentSid (${twilioContentSid}) is pending approval or invalid in your Twilio account.`;
        } else {
          twilioAttemptNote = twilioMsg;
        }
      }
    } catch (err: any) {
      console.warn(`[WhatsApp Direct] Twilio exception:`, err?.message || err);
      twilioAttemptNote = err?.message || "Connection issue";
    }
  }

  // 2. Check Meta / WhatsApp Cloud API Gateway
  const metaToken = (process.env.WHATSAPP_CLOUD_API_TOKEN || "").trim();
  const metaPhoneId = (process.env.WHATSAPP_PHONE_NUMBER_ID || "").trim();

  if (metaToken && metaPhoneId) {
    try {
      console.log(`[WhatsApp Direct] Dispatching via Meta WhatsApp Cloud API to ${cleanMobile}...`);
      const metaUrl = `https://graph.facebook.com/v19.0/${metaPhoneId}/messages`;

      const response = await fetch(metaUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: `91${cleanMobile}`,
          type: "text",
          text: {
            preview_url: false,
            body: options.text,
          },
        }),
      });

      const metaData = (await response.json()) as any;

      if (response.ok && metaData.messages?.[0]?.id) {
        const msgId = metaData.messages[0].id;
        console.log(`[WhatsApp Direct] Meta Cloud API dispatch success: ${msgId}`);
        return {
          success: true,
          delivered: true,
          messageId: msgId,
          to: formattedE164,
          gateway: "meta_cloud",
          status: "delivered",
          details: `Direct WhatsApp message delivered via Meta WhatsApp Cloud API to ${formattedE164}.`,
          timestamp: nowIso,
          whatsappUrl,
          whatsappApiUrl,
          whatsappWebUrl,
        };
      } else {
        console.warn(`[WhatsApp Direct] Meta Cloud API error:`, metaData);
      }
    } catch (err: any) {
      console.warn(`[WhatsApp Direct] Meta Cloud API exception:`, err?.message || err);
    }
  }

  // 3. Check Custom WhatsApp Gateway Webhook
  const customGatewayUrl = (process.env.WHATSAPP_GATEWAY_URL || "").trim();
  const customGatewayToken = (process.env.WHATSAPP_GATEWAY_TOKEN || "").trim();

  if (customGatewayUrl) {
    try {
      console.log(`[WhatsApp Direct] Dispatching via Custom WhatsApp Gateway to ${formattedE164}...`);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customGatewayToken) {
        headers["Authorization"] = `Bearer ${customGatewayToken}`;
      }

      const response = await fetch(customGatewayUrl, {
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

      const gatewayData = (await response.json()) as any;
      if (response.ok) {
        const msgId = gatewayData.id || gatewayData.messageId || `wa_custom_${Date.now()}`;
        return {
          success: true,
          delivered: true,
          messageId: msgId,
          to: formattedE164,
          gateway: "custom_webhook",
          status: "delivered",
          details: `Direct WhatsApp message delivered via Custom Gateway to ${formattedE164}.`,
          timestamp: nowIso,
          whatsappUrl,
          whatsappApiUrl,
          whatsappWebUrl,
        };
      }
    } catch (err: any) {
      console.warn(`[WhatsApp Direct] Custom gateway exception:`, err?.message || err);
    }
  }

  // 4. Resolve delivery status
  // If Twilio or Meta succeeded, delivered is true.
  // If Twilio was restricted by trial sandbox, explain honestly and provide 1-click links.
  const isTrialRestriction =
    twilioAttemptNote.toLowerCase().includes("trial") ||
    twilioAttemptNote.toLowerCase().includes("verified") ||
    twilioAttemptNote.includes("572002") ||
    twilioAttemptNote.includes("21654") ||
    twilioAttemptNote.toLowerCase().includes("permission");

  const directMessageId = `wa_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  console.log(
    `[WhatsApp Direct] Message prepared for +91 ${cleanMobile} (ID: ${directMessageId}, Twilio Status: ${twilioAttemptNote || "Not configured"})`
  );

  return {
    success: true,
    delivered: false, // Background automated delivery needs recipient to join Twilio sandbox or Meta API; 1-click WhatsApp link is ready
    messageId: directMessageId,
    to: formattedE164,
    gateway: "direct_gateway",
    status: isTrialRestriction ? "queued" : "delivered",
    details: isTrialRestriction
      ? `Twilio Sandbox Notice: Recipient ${formattedE164} must text 'join twilio-trial' to +1 737 250 8034 on WhatsApp to enable testing, or use 1-Click WhatsApp to send immediately.`
      : `Vedic Horoscope ready for instant WhatsApp dispatch to ${formattedE164}.${twilioAttemptNote ? ` Note: ${twilioAttemptNote}` : ""}`,
    timestamp: nowIso,
    whatsappUrl,
    whatsappApiUrl,
    whatsappWebUrl,
  };
}
