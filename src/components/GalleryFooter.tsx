"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightToBracket, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { MatureSlider } from "@/components/MatureSlider";
import { useAuthSession } from "@/lib/use-auth-session";
import "@/lib/fontawesome";

export function GalleryFooter() {
  const router = useRouter();
  const session = useAuthSession();

  async function handleLogout() {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    const data = (await res.json().catch(() => null)) as { endSessionUrl?: string } | null;

    if (data?.endSessionUrl) {
      // Follow the OIDC end-session redirect so the IdP also clears its cookie.
      window.location.href = data.endSessionUrl;
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <footer className="border-t border-border-subtle pt-8 pb-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {session === null ? (
            <span className="inline-flex size-8" aria-hidden />
          ) : session.isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className="inline-flex items-center rounded-md p-1.5 text-accent/80 transition-colors hover:bg-surface-overlay hover:text-accent"
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href="/login"
              aria-label="Log in"
              title="Log in"
              className="inline-flex items-center rounded-md p-1.5 text-text-muted/60 transition-colors hover:bg-surface-overlay hover:text-text-muted"
            >
              <FontAwesomeIcon icon={faArrowRightToBracket} className="h-4 w-4" />
            </Link>
          )}
          <MatureSlider />
        </div>

        <div className="flex items-center gap-2 text-sm text-text-muted">
          <p>
            A{" "}
            <a
              href="https://phoenixnet-labs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent transition-colors hover:text-accent-hover hover:underline"
            >
              PhoenixNet-Labs
            </a>{" "}
            Project
          </p>
          <a
            href="https://phoenixnet-labs.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="PhoenixNet Labs"
            className="size-5 shrink-0 overflow-hidden rounded-sm ring-1 ring-border-subtle transition-opacity hover:opacity-80"
          >
            <img
              src="https://phoenixnet-labs.com/images/pnet-logo.png"
              alt=""
              className="size-full object-cover"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
