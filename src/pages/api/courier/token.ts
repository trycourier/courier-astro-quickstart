import type { APIRoute } from "astro";
import { COURIER_API_KEY } from "astro:env/server";
import Courier from "@trycourier/courier";
import { DEMO_USER_ID } from "../../../lib/demo-user";

/** This route is per-request, so it must not be prerendered at build time. */
export const prerender = false;

/**
 * Mints a short-lived Courier JWT for the signed-in user.
 *
 * This endpoint is the whole reason the sample has a server: your Courier API
 * key signs the token, and it must never reach the browser. The island calls
 * this route, gets a scoped token, and hands that to the SDK.
 */
export const GET: APIRoute = async () => {
  // Declared in astro.config.mjs as a server secret, so this reads the live
  // environment on every request. Reading import.meta.env here instead would
  // compile to the key's build-time value as a string literal.
  const apiKey = COURIER_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "COURIER_API_KEY is not set. Copy .env.example to .env, add your key, and restart the dev server." },
      { status: 500 },
    );
  }

  // ── Replace this with your own session lookup ────────────────────────────
  // Whatever your app uses — Auth.js, Clerk, a cookie on Astro.locals — read
  // the user id from it here. Never take the user id from the request: a
  // caller who can name any user can read that user's inbox.
  const userId = DEMO_USER_ID;
  // ─────────────────────────────────────────────────────────────────────────

  const client = new Courier({ apiKey });

  try {
    const { token } = await client.auth.issueToken({
      scope: `user_id:${userId} inbox:read:messages inbox:write:events`,
      // Always set this. Omitting it mints a token that never expires.
      expires_in: "1 day",
    });

    return Response.json({ userId, token });
  } catch (cause) {
    // Without this, a mistyped key surfaces as a blank 500 and the inbox just
    // sits empty. Say what went wrong instead.
    const status =
      typeof cause === "object" && cause !== null && "status" in cause ? Number(cause.status) : undefined;

    const message =
      status === 401 || status === 403
        ? "Courier rejected the API key. Check COURIER_API_KEY in .env."
        : `Could not issue a Courier token${status ? ` (HTTP ${status})` : ""}.`;

    console.error("[courier] issueToken failed:", cause);
    return Response.json({ error: message }, { status: 500 });
  }
};
