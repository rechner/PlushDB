import { NextRequest, NextResponse } from "next/server";
import * as client from "openid-client";
import { getSession } from "@/lib/auth";
import { getOidcConfig, isOidcEnabled, resolveRedirectUri } from "@/lib/oidc";

export async function POST(request: NextRequest) {
  const session = await getSession();
  const wasOidc = session.authMethod === "oidc";
  const idToken = session.oidc?.idToken;

  session.destroy();

  // For OIDC sessions, try to also end the session at the IdP so the user
  // isn't silently re-authenticated on the next login attempt. We surface the
  // end-session URL to the client which will follow it after the local logout.
  if (wasOidc && isOidcEnabled()) {
    try {
      const config = await getOidcConfig();
      const serverMetadata = config.serverMetadata();

      if (serverMetadata.end_session_endpoint) {
        const postLogoutRedirectUri = new URL("/", resolveRedirectUri(request)).toString();
        const endSessionUrl = client.buildEndSessionUrl(config, {
          post_logout_redirect_uri: postLogoutRedirectUri,
          ...(idToken ? { id_token_hint: idToken } : {}),
        });
        return NextResponse.json({ success: true, endSessionUrl: endSessionUrl.toString() });
      }
    } catch (err) {
      console.error("OIDC end-session URL build failed:", err);
    }
  }

  return NextResponse.json({ success: true });
}
