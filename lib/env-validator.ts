/**
 * Environment variable validation.
 * Ensures all required environment variables are set before the app starts.
 */

interface EnvConfig {
  name: string;
  required: boolean;
  sensitive: boolean;
  defaultValue?: string;
}

const REQUIRED_ENV_VARS: EnvConfig[] = [
  // Firebase (public, but required)
  { name: "NEXT_PUBLIC_FIREBASE_API_KEY", required: true, sensitive: false },
  { name: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", required: true, sensitive: false },
  { name: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", required: true, sensitive: false },

  // API keys (sensitive)
  { name: "ANTHROPIC_API_KEY", required: false, sensitive: true },
  { name: "NVIDIA_EXTRACTOR_API_KEY", required: false, sensitive: true },
  { name: "NVIDIA_STYLIST_API_KEY", required: false, sensitive: true },
  { name: "QWEN_API_KEY", required: false, sensitive: true },
  { name: "ILLUSTRATION_AI_KEY", required: false, sensitive: true },
  { name: "illustration_ai", required: false, sensitive: true },

  // Security
  { name: "WEBHOOK_SECRET", required: false, sensitive: true },
  { name: "CSRF_SECRET", required: false, sensitive: true },
];

/**
 * Validate that all required environment variables are set.
 * Returns a list of missing variables.
 */
export function validateEnv(): { valid: boolean; missing: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar.name];

    if (!value && envVar.required) {
      missing.push(envVar.name);
    } else if (!value && !envVar.required) {
      warnings.push(`${envVar.name} is not set (optional)`);
    }

    // Check for common mistakes
    if (value) {
      if (envVar.sensitive && value.length < 10) {
        warnings.push(`${envVar.name} looks too short - verify it's correct`);
      }
      if (value.startsWith(" ") || value.endsWith(" ")) {
        warnings.push(`${envVar.name} has leading/trailing whitespace`);
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Check if we're running in production.
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Get a safe (masked) version of a sensitive value for logging.
 */
export function maskSensitiveValue(value: string): string {
  if (!value) return "(not set)";
  if (value.length <= 8) return "****";
  return value.slice(0, 4) + "****" + value.slice(-4);
}
