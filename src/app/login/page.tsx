import { LoginForm } from "@/components/LoginForm";
import { readOidcEnv } from "@/lib/oidc";

type LoginPageProps = {
  searchParams: Promise<{ oidc_error?: string }>;
};

const OIDC_ERROR_MESSAGES: Record<string, string> = {
  missing_state: "Your login session expired before we heard back. Please try again.",
  invalid_id_token: "The identity provider returned an invalid token.",
  not_authorized: "That account isn't allowed to sign in here.",
  callback_failed: "Single sign-on didn't complete. Please try again.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const oidcEnv = readOidcEnv();

  const oidcError = params.oidc_error
    ? OIDC_ERROR_MESSAGES[params.oidc_error] ?? "Single sign-on failed. Please try again."
    : null;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="glass w-full max-w-md rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-4xl">🔐</div>
          <h1 className="text-2xl font-bold">Hey stranger!</h1>
          <p className="text-sm text-text-muted">Log in to manage the pack.</p>
        </div>
        <LoginForm
          oidcEnabled={oidcEnv !== null}
          oidcProviderName={oidcEnv?.providerName ?? "SSO"}
          oidcError={oidcError}
        />
      </div>
    </div>
  );
}
