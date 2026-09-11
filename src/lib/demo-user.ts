/**
 * The one user this sample signs in and sends to.
 *
 * In a real app there is no constant here: the user id comes from whatever
 * session your app already has (Auth.js, Clerk, Supabase, your own cookie).
 * It is pinned to a constant so the token endpoint and the send script agree
 * without you having to wire up auth to see the inbox work.
 */
export const DEMO_USER_ID = "sarah-bennett";

/** Shown in the UI, and used in the copy the send script ships. */
export const DEMO_USER_NAME = "Sarah Bennett";
