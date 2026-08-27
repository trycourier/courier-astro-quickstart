import { config } from "dotenv";
import Courier from "@trycourier/courier";
import { DEMO_USER_ID, DEMO_USER_NAME } from "../src/lib/demo-user";

// Astro reads .env automatically; a standalone script does not.
config({ path: ".env" });

/**
 * Sends one message to the demo user's inbox.
 *
 * The content is inline, so this runs against a fresh workspace with no
 * template to create first. In your own app you would reference a published
 * template by id instead, and keep the copy out of your code.
 */
async function main() {
  const apiKey = process.env.COURIER_API_KEY;

  if (!apiKey || apiKey === "YOUR_COURIER_API_KEY") {
    console.error("COURIER_API_KEY is not set. Copy .env.example to .env and add your key.");
    process.exit(1);
  }

  const client = new Courier({ apiKey });

  const response = await client.send.message({
    message: {
      to: { user_id: DEMO_USER_ID },
      // `inbox` is a channel like `email` or `sms`. This is the only line that
      // decides the message lands in the inbox.
      routing: { method: "single", channels: ["inbox"] },
      content: {
        title: "Your report is ready",
        body: `Hi ${DEMO_USER_NAME}, the export you asked for has finished processing.`,
      },
    },
  });

  console.log(`Sent to ${DEMO_USER_ID}. Request id: ${response.requestId}`);
  console.log("It should already be in the inbox at http://localhost:4321");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
