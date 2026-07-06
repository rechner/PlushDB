import { NextRequest, NextResponse } from "next/server";
import * as client from "openid-client";
import { getSession } from "@/lib/auth";
import { getOidcConfig, readOidcEnv, resolveRedirectUri } from "@/lib/oidc";

function isSafeRedirect(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

/**
 * Initiates the OIDC Authorization Code flow with PKCE.
 *
 * We stash `state`, `nonce`, and the PKCE `code_verifier` in the iron-session
 * cookie under `oidcFlow` and then 302 the browser to the provider's authorize
 * endpoint. The `/callback` route consumes those values.
 */
export async function GET(request: NextRequest) {
  const env = readOidcEnv();
  if (!env) {
    return NextResponse.json({ error: "OIDC is not configured" }, { status: 404 });
  }

  try {
    const config = await getOidcConfig();

    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
    const state = client.randomState();
    const nonce = client.randomNonce();

    const redirectUri = resolveRedirectUri(request);
    const rawRedirectTo = request.nextUrl.searchParams.get("redirect_to") || "/manage";
    const redirectTo = isSafeRedirect(rawRedirectTo) ? rawRedirectTo : "/manage";

    const session = await getSession();
    session.oidcFlow = {
      state,
      nonce,
      codeVerifier,
      redirectTo,
    };
    await session.save();

    const authorizationUrl = client.buildAuthorizationUrl(config, {
      redirect_uri: redirectUri,
      scope: env.scopes,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
      nonce,
    });

    return NextResponse.redirect(authorizationUrl);
  } catch (err) {
    console.error("OIDC login initiation failed:", err);
    return NextResponse.json({ error: "Failed to start OIDC login" }, { status: 500 });
  }
}
