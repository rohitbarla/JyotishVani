import { auth } from "../firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";

let activeConfirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

export function getRecaptchaVerifier(containerId = "recaptcha-container"): RecaptchaVerifier | null {
  if (typeof window === "undefined") return null;

  try {
    if (!recaptchaVerifier) {
      const container = document.getElementById(containerId);
      if (!container) return null;

      recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: "invisible",
        callback: () => {
          console.log("[Firebase Auth] reCAPTCHA verified.");
        },
        "expired-callback": () => {
          console.warn("[Firebase Auth] reCAPTCHA expired, resetting.");
          if (recaptchaVerifier) {
            recaptchaVerifier.clear();
            recaptchaVerifier = null;
          }
        },
      });
    }
    return recaptchaVerifier;
  } catch (err) {
    console.warn("[Firebase Auth] RecaptchaVerifier setup notice:", err);
    return null;
  }
}

export async function sendFirebasePhoneOtp(
  rawPhone: string,
  containerId = "recaptcha-container"
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const digits = rawPhone.replace(/\D/g, "");
    const clean10 = digits.slice(-10);
    const formattedPhone = `+91${clean10}`;

    const appVerifier = getRecaptchaVerifier(containerId);
    if (!appVerifier) {
      return { success: false, error: "reCAPTCHA container not ready." };
    }

    const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
    activeConfirmationResult = confirmation;

    return {
      success: true,
      message: `Verification code dispatched to ${formattedPhone}`,
    };
  } catch (err: any) {
    console.warn("[Firebase Auth] Phone dispatch notice:", err?.code || err?.message);
    // Reset recaptcha on error so next attempt works cleanly
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
      } catch (_) {}
      recaptchaVerifier = null;
    }
    return {
      success: false,
      error: err?.message || "Verification code dispatch not completed.",
    };
  }
}

export async function confirmFirebasePhoneOtp(
  code: string
): Promise<{ success: boolean; uid?: string; error?: string }> {
  if (!activeConfirmationResult) {
    return { success: false, error: "No active Firebase verification in progress." };
  }

  try {
    const userCredential = await activeConfirmationResult.confirm(code);
    return {
      success: true,
      uid: userCredential.user.uid,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Invalid or expired Firebase code.",
    };
  }
}
