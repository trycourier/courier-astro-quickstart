# Courier Inbox — Astro quickstart

A working [Courier Inbox](https://www.courier.com/docs/in-app/add-an-inbox) in an Astro
app. Two files do the work: an endpoint that mints a scoped token, and a React island
that renders the feed.

```
src/pages/api/courier/token.ts   mints a short-lived JWT (server only)
src/components/CourierInbox.tsx  signs in and renders the inbox (browser only)
```

## Run it

```bash
npm install
cp .env.example .env   # paste your API key
npm run dev
```

Open `localhost:4321`, then run `npm run send` in a second terminal. The message arrives
in the open page without a refresh.

A [Test API key](https://app.courier.com/settings/api-keys) is fine — the inbox channel
delivers in Test.

## How it fits together

The endpoint exists because your API key signs the token and must never reach the
browser. The browser gets a JWT instead: scoped to one user, and expiring.

```
browser                    your server                courier
   │                            │                        │
   │  GET /api/courier/token    │                        │
   ├───────────────────────────►│  POST /auth/issue-token│
   │                            ├───────────────────────►│
   │   { userId, token }        │◄───────────────────────┤
   │◄───────────────────────────┤                        │
   │                                                     │
   │  signIn({ userId, jwt }) ─── websocket ────────────►│
   │◄──────────────── new messages, in real time ────────┤
```

`src/lib/demo-user.ts` pins the user id to a constant so the endpoint and the send script
agree without you wiring up auth first. In your own app, read it from your session — and
read it there, never from the request. A caller who can name any user can read that user's
inbox.

## Three things that are specific to Astro

### `client:only`, not `client:load`

```astro
<Inbox client:only="react" />
```

The inbox renders as a custom element, so a server pass would render nothing and then
throw it away. `client:load` works too and costs you that wasted pass.

### Named imports need `@trycourier/courier-react` 9.3.0 or newer

On 9.2.12 and earlier, importing the SDK from server code failed:

```
[vite] Named export 'useCourier' not found. The requested module
'@trycourier/courier-react' is a CommonJS module, which may not support all
module.exports as named exports.
```

The packages shipped both a CommonJS and an ESM bundle but declared no `exports` map.
Node only reads `main` and never `module`, so it landed on the CommonJS bundle and could
not read the names out of it. Fixed in
[courier-web#248](https://github.com/trycourier/courier-web/pull/248), which is why this
sample requires 9.3.0.

If you are pinned to an older version, `client:only` sidesteps it by keeping the module
out of the server graph. `vite.ssr.noExternal` is the other fix commonly suggested, and
it is a trap: it works in `astro dev` and then **fails in `astro build`**, where the
prerender pass loads the server bundle through Node's own resolver and externalizes the
package again.

### The API key is a runtime secret, not a build-time one

```js
// astro.config.mjs
COURIER_API_KEY: envField.string({ context: "server", access: "secret", optional: true })
```

```ts
import { COURIER_API_KEY } from "astro:env/server";
```

`access: "secret"` is the load-bearing part: the value is read from the environment on
each request. Reading `import.meta.env.COURIER_API_KEY` instead compiles to the key's
build-time value as a string literal, baking it into the bundle you deploy.

`npm run dev` and `npm run build` read `.env`. The built server does not — it reads the
real environment, so set `COURIER_API_KEY` wherever you host it:

```bash
COURIER_API_KEY=... node ./dist/server/entry.mjs
```

## Keep the session alive

The SDKs do not refresh tokens. Before the current one expires, mint a new JWT and call
`signIn` again with it. Match `expires_in` to your own session length — a short-lived
token can expire while a tab stays open, which quietly empties the inbox.

`expires_in` is optional, and omitting it mints a token that **never expires**. Always
set it. Rotating the API key that signed it is the only way to revoke one.

## Empty inbox?

Suspect the token before anything else. An expired or mis-scoped JWT signs in silently
and returns no messages.

- The two `inbox:` scopes are the minimum for a working feed.
- Signing in with a `tenantId` hides messages sent without one.
- Send to the same `user_id` the token was scoped to.

[Troubleshooting](https://www.courier.com/docs/in-app/authenticate-users#troubleshooting)
walks the causes in order.

## Scripts

| | |
|---|---|
| `npm run dev` | Dev server on `localhost:4321` |
| `npm run build` | Production build |
| `npm start` | Serve the build |
| `npm run send` | Send one message to the demo user's inbox |
| `npm run typecheck` | `astro check` |

## Docs

- [Add an inbox to Astro](https://www.courier.com/docs/guides/add-an-inbox-to-astro)
- [Add an inbox](https://www.courier.com/docs/in-app/add-an-inbox) — every framework
- [Authenticate users](https://www.courier.com/docs/in-app/authenticate-users) — scopes, refresh, EU
- [Customize the inbox](https://www.courier.com/docs/in-app/customize-the-inbox) — theming
