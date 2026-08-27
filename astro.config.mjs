// @ts-check
import { defineConfig, envField } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";

export default defineConfig({
  integrations: [react()],

  // The token endpoint runs per request, so the site needs a server.
  adapter: node({ mode: "standalone" }),

  env: {
    schema: {
      // `access: "secret"` is the load-bearing part. A secret is read from the
      // environment at runtime; `import.meta.env.COURIER_API_KEY` would instead
      // be replaced with its build-time value, baking the key into the bundle
      // that ships. `context: "server"` keeps it out of the client build.
      //
      // Optional so a missing key surfaces as the message in token.ts rather
      // than as a schema error before the server starts.
      COURIER_API_KEY: envField.string({ context: "server", access: "secret", optional: true }),
    },
  },
});
