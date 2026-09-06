// Deprecated: Firebase Auth removed in favor of direct submission with 1-email/1-IP/1-device deduplication.
export function useEmailVerification() {
  return {
    status: "idle" as const,
    isSending: false,
    isSent: false,
    isVerifying: false,
    isVerified: false,
    email: null,
    error: null,
    user: null,
    sendVerificationEmail: async () => false,
    verifyCurrentUrl: async () => false,
    resendVerification: async () => false,
    checkStatus: async () => false,
    reset: () => {},
  };
}
