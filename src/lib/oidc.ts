import * as client from "openid-client";

/**
 * OIDC integration.
 *
 * Configuration lives in environment variables:
 *
 *   OIDC_ISSUER_URL          Issuer URL (discovery is performed against `/.well-known/openid-configuration`).
 *   OIDC_CLIENT_ID           Client ID registered with the identity provider.
 *   OIDC_CLIENT_SECRET       Client secret (leave empty for public clients using PKCE only).
 *   OIDC_REDIRECT_URI        Full callback URL, e.g. https://plushdb.example.com/api/auth/oidc/callback.
 *                            If unset, the callback URL is derived from the incoming request.
 *   OIDC_SCOPES              Optional space-separated scopes (default: "openid profile email").
 *   OIDC_ALLOWED_EMAILS      Optional comma-separated allowlist of emails permitted to sign in.
 *                            If unset, any successfully authenticated user is allowed.
 *   OIDC_PROVIDER_NAME       Optional display name for the SSO button (default: "SSO").
 *   OIDC_ALLOW_INSECURE      Set to "true" to allow non-HTTPS issuers (dev only).
 */

export type OidcConfig = {
  issuer: string;
  clientId: string;
  clientSecret?: string;
  redirectUri?: string;
  scopes: string;
  allowedEmails: string[] | null;
  providerName: string;
  allowInsecure: boolean;
};

export function readOidcEnv(): OidcConfig | null {
  const issuer = process.env.OIDC_ISSUER_URL?.trim();
  const clientId = process.env.OIDC_CLIENT_ID?.trim();

  if (!issuer || !clientId) {
    return null;
  }

  const allowedEmailsRaw = process.env.OIDC_ALLOWED_EMAILS?.trim();
  const allowedEmails = allowedEmailsRaw
    ? allowedEmailsRaw
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean)
    : null;

  return {
    issuer,
    clientId,
    clientSecret: process.env.OIDC_CLIENT_SECRET?.trim() || undefined,
    redirectUri: process.env.OIDC_REDIRECT_URI?.trim() || undefined,
    scopes: process.env.OIDC_SCOPES?.trim() || "openid profile email",
    allowedEmails,
    providerName: process.env.OIDC_PROVIDER_NAME?.trim() || "SSO",
    allowInsecure: process.env.OIDC_ALLOW_INSECURE === "true",
  };
}

export function isOidcEnabled(): boolean {
  return readOidcEnv() !== null;
}

let cachedConfig: Promise<client.Configuration> | null = null;
let cachedFor: string | null = null;

/**
 * Discovers and caches the OIDC provider configuration. The cache is keyed on
 * issuer + client id, so config changes at runtime are picked up automatically.
 */
export async function getOidcConfig(): Promise<client.Configuration> {
  const env = readOidcEnv();
  if (!env) {
    throw new Error("OIDC is not configured");
  }

  const cacheKey = `${env.issuer}::${env.clientId}`;
  if (cachedConfig && cachedFor === cacheKey) {
    return cachedConfig;
  }

  cachedFor = cacheKey;
  cachedConfig = (async () => {
    const config = await client.discovery(
      new URL(env.issuer),
      env.clientId,
      env.clientSecret ? { client_secret: env.clientSecret } : undefined,
    );

    if (env.allowInsecure) {
      client.allowInsecureRequests(config);
    }

    return config;
  })().catch((err) => {
    // Reset on failure so the next attempt can retry discovery.
    cachedConfig = null;
    cachedFor = null;
    throw err;
  });

  return cachedConfig;
}

/**
 * Derives the callback URL for the current request when OIDC_REDIRECT_URI is
 * not explicitly configured. Honors the X-Forwarded-* headers when present so
 * this works behind reverse proxies (Coolify, nginx, etc.).
 */
export function resolveRedirectUri(request: Request): string {
  const env = readOidcEnv();
  if (env?.redirectUri) {
    return env.redirectUri;
  }

  const url = new URL(request.url);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");

  const protocol = forwardedProto?.split(",")[0].trim() || url.protocol.replace(":", "");
  const host = forwardedHost?.split(",")[0].trim() || url.host;

  return `${protocol}://${host}/api/auth/oidc/callback`;
}

/**
 * Checks whether the given email is permitted by the configured allowlist.
 * Returns true when no allowlist is set.
 */
export function isEmailAllowed(email: string | undefined): boolean {
  const env = readOidcEnv();
  if (!env || !env.allowedEmails) {
    return true;
  }
  if (!email) {
    return false;
  }
  return env.allowedEmails.includes(email.toLowerCase());
}
