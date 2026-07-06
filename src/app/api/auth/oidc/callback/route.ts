import { NextRequest, NextResponse } from "next/server";
import * as client from "openid-client";
import { getSession } from "@/lib/auth";
import { getOidcConfig, isEmailAllowed, readOidcEnv } from "@/lib/oidc";

/**
 * Handles the OIDC redirect from the identity provider.
 *
 * Verifies state, nonce, and PKCE against the values previously stashed in the
 * session by /api/auth/oidc/login, exchanges the code for tokens, then marks
 * the session as logged in.
 */
export async function GET(request: NextRequest) {
  const env = readOidcEnv();
  if (!env) {
    return NextResponse.json({ error: "OIDC is not configured" }, { status: 404 });
  }

  const session = await getSession();
  const flow = session.oidcFlow;

  if (!flow) {
    return redirectToLoginWithError(request, "missing_state");
  }

  // Clear the transient flow state regardless of outcome to avoid replay.
  const redirectTo = flow.redirectTo || "/manage";
  session.oidcFlow = undefined;
  await session.save();

  try {
    const config = await getOidcConfig();

    const tokens = await client.authorizationCodeGrant(config, new URL(request.url), {
      pkceCodeVerifier: flow.codeVerifier,
      expectedState: flow.state,
      expectedNonce: flow.nonce,
    });

    const claims = tokens.claims();
    if (!claims?.sub) {
      return redirectToLoginWithError(request, "invalid_id_token");
    }

    const email = typeof claims.email === "string" ? claims.email : undefined;
    const name =
      typeof claims.name === "string"
        ? claims.name
        : typeof claims.preferred_username === "string"
          ? claims.preferred_username
          : undefined;

    if (!isEmailAllowed(email)) {
      return redirectToLoginWithError(request, "not_authorized");
    }

    session.isLoggedIn = true;
    session.authMethod = "oidc";
    session.username = name || email || claims.sub;
    session.oidc = {
      sub: claims.sub,
      email,
      name,
      idToken: tokens.id_token,
    };
    await session.save();

    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch (err) {
    console.error("OIDC callback failed:", err);
    return redirectToLoginWithError(request, "callback_failed");
  }
}

function redirectToLoginWithError(request: NextRequest, reason: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("oidc_error", reason);
  return NextResponse.redirect(url);
}
