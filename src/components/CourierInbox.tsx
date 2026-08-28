import { useEffect, useRef, useState } from "react";
import { CourierInbox, useCourier } from "@trycourier/courier-react";

/**
 * The Courier Inbox, signed in with a token from /api/courier/token.
 *
 * This is an Astro island: the page renders it with client:only, so Astro
 * ships it to the browser and mounts it there without a server pass. The inbox
 * renders as a custom element, which only exists in the browser, so signing in
 * belongs in an effect rather than at module scope.
 */
export default function Inbox() {
  const courier = useCourier();
  const [error, setError] = useState<string | null>(null);

  // React runs effects twice in development. Signing in twice would make the
  // SDK sign the first user out again, so do it once.
  const signedIn = useRef(false);

  useEffect(() => {
    if (signedIn.current) return;
    signedIn.current = true;

    async function signIn() {
      try {
        const response = await fetch("/api/courier/token");
        const body = await response.json();

        if (!response.ok) throw new Error(body.error ?? "Could not issue a token.");

        courier.shared.signIn({ userId: body.userId, jwt: body.token });
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Sign-in failed.");
      }
    }

    void signIn();
  }, [courier]);

  if (error) {
    return <p className="error">{error}</p>;
  }

  // CourierInbox fills its container's width and takes its height from the
  // parent, so the parent sets a height.
  return (
    <div className="inbox">
      <CourierInbox />
    </div>
  );
}
