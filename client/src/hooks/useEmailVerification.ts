import { useEffect, useState, useCallback } from "react";
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  applyActionCode,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth, initAnalytics } from "@/lib/firebase";

export type VerificationStatus =
  | "idle"
  | "sending"
  | "sent"
  | "verifying"
  | "verified"
  | "error";

export interface EmailVerificationState {
  status: VerificationStatus;
  isSending: boolean;
  isSent: boolean;
  isVerifying: boolean;
  isVerified: boolean;
  email: string | null;
  error: string | null;
  user: User | null;
  sendVerificationEmail: (email: string) => Promise<boolean>;
  verifyCurrentUrl: () => Promise<boolean>;
  resendVerification: () => Promise<boolean>;
  checkStatus: () => Promise<boolean>;
  reset: () => void;
}

const STORAGE_KEY_EMAIL = "emailForSignIn";
const STORAGE_KEY_PENDING = "pending_verification_email";
const STORAGE_KEY_VERIFIED = "verified_email";

export function useEmailVerification(): EmailVerificationState {
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [email, setEmail] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return (
        window.localStorage.getItem(STORAGE_KEY_VERIFIED) ||
        window.localStorage.getItem(STORAGE_KEY_PENDING) ||
        null
      );
    }
    return null;
  });
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Send verification link to user's email
  const sendVerificationEmail = useCallback(
    async (targetEmail: string): Promise<boolean> => {
      const trimmed = targetEmail.trim();
      if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setError("Vui lòng nhập địa chỉ email hợp lệ.");
        setStatus("error");
        return false;
      }

      setStatus("sending");
      setError(null);

      try {
        const redirectUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}${window.location.pathname}?verified=true`
            : "";

        const actionCodeSettings = {
          url: redirectUrl || window.location.origin,
          handleCodeInApp: true,
        };

        await sendSignInLinkToEmail(auth, trimmed, actionCodeSettings);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY_EMAIL, trimmed);
          window.localStorage.setItem(STORAGE_KEY_PENDING, trimmed);
        }

        setEmail(trimmed);
        setStatus("sent");
        return true;
      } catch (err: any) {
        console.error("Firebase sendSignInLinkToEmail error:", err);
        let msg = "Không thể gửi email xác thực. Vui lòng thử lại.";
        if (err?.code === "auth/invalid-email") {
          msg = "Địa chỉ email không đúng định dạng.";
        } else if (err?.code === "auth/too-many-requests") {
          msg = "Quá nhiều yêu cầu trong thời gian ngắn. Vui lòng đợi vài phút rồi thử lại.";
        } else if (err?.code === "auth/unauthorized-continue-uri") {
          msg = "Tên miền chuyển hướng chưa được cho phép trong Firebase Auth.";
        } else if (err?.code === "auth/operation-not-allowed") {
          msg = "Phương thức đăng nhập qua Email Link chưa được bật trong Firebase Console (Authentication > Sign-in method > Email/Password > Email link).";
        } else if (err?.message) {
          msg = err.message;
        }
        setError(msg);
        setStatus("error");
        return false;
      }
    },
    []
  );

  // Verify code from URL when redirected back from email link
  const verifyCurrentUrl = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;

    const href = window.location.href;
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");

    // Case 1: Sign in with Email Link
    if (isSignInWithEmailLink(auth, href)) {
      setStatus("verifying");
      setError(null);
      try {
        let savedEmail =
          window.localStorage.getItem(STORAGE_KEY_EMAIL) ||
          window.localStorage.getItem(STORAGE_KEY_PENDING);

        if (!savedEmail) {
          savedEmail = window.prompt(
            "Vui lòng nhập lại email của bạn để hoàn tất xác minh:"
          );
        }

        if (savedEmail) {
          const result = await signInWithEmailLink(auth, savedEmail, href);
          window.localStorage.removeItem(STORAGE_KEY_EMAIL);
          window.localStorage.setItem(STORAGE_KEY_VERIFIED, savedEmail);
          setEmail(savedEmail);
          setUser(result.user);
          setStatus("verified");

          // Clean URL parameters
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          return true;
        }
      } catch (err: any) {
        console.error("signInWithEmailLink error:", err);
        setError(err?.message || "Liên kết xác thực không hợp lệ hoặc đã hết hạn.");
        setStatus("error");
        return false;
      }
    }

    // Case 2: Direct action code (mode=verifyEmail)
    if (mode === "verifyEmail" && oobCode) {
      setStatus("verifying");
      setError(null);
      try {
        await applyActionCode(auth, oobCode);
        setStatus("verified");
        if (email) {
          window.localStorage.setItem(STORAGE_KEY_VERIFIED, email);
        }
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        return true;
      } catch (err: any) {
        console.error("applyActionCode error:", err);
        setError(err?.message || "Mã xác thực không hợp lệ hoặc đã hết hạn.");
        setStatus("error");
        return false;
      }
    }

    // Case 3: Already verified in local session
    const previouslyVerified = window.localStorage.getItem(STORAGE_KEY_VERIFIED);
    if (previouslyVerified) {
      setEmail(previouslyVerified);
      setStatus("verified");
      return true;
    }

    return false;
  }, [email]);

  // Resend verification
  const resendVerification = useCallback(async (): Promise<boolean> => {
    const target =
      email ||
      (typeof window !== "undefined"
        ? window.localStorage.getItem(STORAGE_KEY_PENDING)
        : null);

    if (target) {
      return sendVerificationEmail(target);
    }
    setError("Không tìm thấy địa chỉ email để gửi lại.");
    return false;
  }, [email, sendVerificationEmail]);

  // Check reload status
  const checkStatus = useCallback(async (): Promise<boolean> => {
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          setStatus("verified");
          if (auth.currentUser.email) {
            setEmail(auth.currentUser.email);
            window.localStorage.setItem(
              STORAGE_KEY_VERIFIED,
              auth.currentUser.email
            );
          }
          return true;
        }
      } catch (err) {
        console.error("User reload error:", err);
      }
    }
    return status === "verified";
  }, [status]);

  // Reset state
  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  // Initialization & URL checking
  useEffect(() => {
    initAnalytics().catch(() => {});
    verifyCurrentUrl();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.emailVerified) {
        setStatus("verified");
        if (currentUser.email) {
          setEmail(currentUser.email);
          window.localStorage.setItem(STORAGE_KEY_VERIFIED, currentUser.email);
        }
      }
    });

    return () => unsubscribe();
  }, [verifyCurrentUrl]);

  return {
    status,
    isSending: status === "sending",
    isSent: status === "sent",
    isVerifying: status === "verifying",
    isVerified: status === "verified",
    email,
    error,
    user,
    sendVerificationEmail,
    verifyCurrentUrl,
    resendVerification,
    checkStatus,
    reset,
  };
}
