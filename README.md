<p align="center">
  <img src="images/doors-of-durin.png" alt="Mellon — Doors of Durin" width="420">
</p>

# Mellon 🚪

A mobile-first mini app for opening a gate via a **webhook**. It works with
**any gate, controller or automation that exposes an HTTP webhook** — Home
Assistant is used throughout this README as the reference example, but anything
you can trigger with an HTTP request (another automation hub, a custom endpoint,
an IoT relay, etc.) works just as well. An
admin generates a unique link and sets how many times the gate may be opened.
Once the limit is reached the button disappears. After a press, a 20-second
visual "the gate is opening" countdown runs. Several visuals are available:
**Basic**, **Lord of the Rings** (the Doors of Durin, "Mellon"),
**Harry Potter — Fireplace** (Floo powder), **Harry Potter — Door** (Alohomora)
and **Stargate** (dial the gate). Each opened link also lets the viewer switch
visual and language.

The usage counter and the webhook URL live **strictly on the server** — the
limit cannot be bypassed from the browser and the webhook never leaks to the
client.

> **Self-hosted.** Mellon is a self-hosted app: you run it yourself (Docker,
> CapRover, bare Node, …) and you expose it so the share links reach visitors'
> phones. There is no hosted/cloud version — the server, the database and the
> webhook secret all stay on infrastructure you control.

## How it works

- **Admin** (`/admin`, password-protected) generates links, sets the number of
  openings and the visual, and can disable/delete them.
- A **visitor** receives a `/g/<token>` link showing the button. A click →
  the server atomically reserves one opening and calls the HA webhook →
  20s countdown → done.
- State is kept in a local **SQLite** database (`data/mellon.db`).

## Localization

The UI defaults to **English** and supports: English, Español, Deutsch,
Slovenčina, Čeština, Polski, 中文, 日本語, Magyar. Users can switch language with
the selector in the top-right corner. The default language is set via the
`DEFAULT_LOCALE` env variable.

## Configuration (env variables)

Copy `.env.example` to `.env` and fill it in. **No secret lives in the code.**

| Variable | Description |
|---|---|
| `ADMIN_PASSWORD` | Password for the admin UI |
| `SESSION_SECRET` | Key used to sign the login cookie (long random string) |
| `HA_WEBHOOK_URL` | Home Assistant webhook that opens the gate |
| `HA_WEBHOOK_METHOD` | Webhook HTTP method (default `POST`) |
| `HA_WEBHOOK_QUERY` | Optional query string appended to the webhook URL (e.g. `dev123`) — a shared secret verified by the HA automation. Leave empty if HA verifies none. |
| `DEFAULT_LOCALE` | Default UI language: `en`, `es`, `de`, `sk`, `cs`, `pl`, `zh`, `ja`, `hu` |
| `PREVIEW_MODE` | If `true`, real links work but **never open the gate** (webhook is not called), and `/preview` is exposed. Off by default. See below. |
| `DB_PATH` | Path to the SQLite file (default `./data/mellon.db`) |
| `PORT` | Server port (default `3000`) |

> If `HA_WEBHOOK_URL` is not set, the server runs in **simulation mode** — a
> button press won't actually open the gate, it just simulates success (handy
> for previewing).

Generate a strong `SESSION_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Preview / dry-run mode

Set `PREVIEW_MODE=true` to turn the whole app into a **dry-run** — ideal for
testing or demoing on a live deployment without actually opening the gate. It
does two things:

1. **Real links never open the gate.** A normal `/g/<token>` link still shows
   the button, plays the full animation and counts the opening — but the server
   **does not call the webhook**, so the physical gate stays shut. (The usage
   counter still decrements, so bump a link's openings afterwards if you burned
   some while testing.)
2. **Exposes `/preview`.** A page that simulates the open flow **entirely in the
   browser** (no link needed, nothing counted, no webhook) and lets you switch
   between all visuals and replay the animation.

When `PREVIEW_MODE` is off (the default), the webhook fires normally and
`/preview` redirects to `/admin`.

> Remember to turn `PREVIEW_MODE` off once you're done — while it's on, **no
> link will actually open the gate.**

---

## Deployment

### A) Docker Compose (most portable)

```bash
cp .env.example .env      # and fill in the values
docker compose up -d --build
```
The app runs at `http://localhost:3000`. The database lives in the named volume
`mellon-data` (survives redeploys).

### B) Plain Docker

```bash
docker build -t mellon .
docker run -d --name mellon -p 3000:3000 \
  --env-file .env \
  -v mellon-data:/app/data \
  mellon
```

### C) CapRover

The repo includes `captain-definition` (which points to `Dockerfile`).
1. `caprover deploy`, or connect the app to your Git repo.
2. In **App Configs → Environment Variables** set the variables from the table above.
3. In **App Configs → Persistent Directories** map `/app/data` (so the database
   survives redeploys).

### D) Without Docker (bare Node)

Requires **Node 20+** (and a build toolchain for `better-sqlite3`).
```bash
npm install
npm run build          # builds the React client
node --env-file=.env server/index.js
```

---

## Local development

```bash
cp .env.example .env
npm install && npm --prefix client install

# terminal 1 — backend (auto-reload, loads .env)
npm run dev:server

# terminal 2 — frontend with hot reload (proxies /api to the backend)
npm run dev:client
```

---

## Home Assistant: create a webhook automation (POST)

Mellon sends an HTTP **POST** to your webhook with a JSON body
`{"source":"mellon"}`. Set up an automation triggered by that webhook:

### Via the UI

1. **Settings → Automations & scenes → Create automation → Start with an empty automation**.
2. **Add trigger → Webhook**.
3. Enter a **Webhook ID**, e.g. `mellon-gate-opener` (keep it secret — anyone
   who knows it can trigger the automation).
4. Under the webhook's options, make sure **POST** is an allowed method
   (in recent HA versions you can restrict allowed methods; enable POST).
5. **Add action → Device / Call service** and pick whatever opens your gate,
   e.g. `cover.open_cover`, `switch.turn_on`, or a button/script entity.
6. Save.

Your webhook URL is then:
```
https://<your-home-assistant>/api/webhook/mellon-gate-opener
```
Put that into `HA_WEBHOOK_URL` and keep `HA_WEBHOOK_METHOD=POST`.

### Equivalent YAML

```yaml
alias: Mellon — open the gate
trigger:
  - platform: webhook
    webhook_id: mellon-gate-opener
    allowed_methods:
      - POST
    local_only: false   # set true if HA and Mellon are on the same LAN
action:
  - service: cover.open_cover        # replace with your gate entity/service
    target:
      entity_id: cover.driveway_gate
mode: single
```

> **Security tips:** treat the webhook ID like a password (it's the only thing
> guarding the automation). If Mellon and Home Assistant are not on the same
> network, keep `local_only: false` and expose HA over HTTPS. You can also add a
> condition in the automation (e.g. time of day) for extra safety.

### Optional: require a secret query parameter

For an extra layer beyond the webhook ID, you can require a secret **query
parameter**. In the automation add an **"and if" condition → Template** that
only continues when the parameter is present:

```
{{ 'dev123' in trigger.query }}
```

`trigger.query` is the dict of URL query parameters, so this passes only when the
request URL contains `?dev123`. In YAML the automation looks like:

```yaml
alias: Mellon — open the gate
trigger:
  - platform: webhook
    webhook_id: mellon-gate-opener
    allowed_methods:
      - POST
    local_only: false
condition:
  - condition: template
    value_template: "{{ 'dev123' in trigger.query }}"
action:
  - service: cover.open_cover
    target:
      entity_id: cover.driveway_gate
mode: single
```

Then set the matching secret in Mellon:

```
HA_WEBHOOK_QUERY=dev123
```

Mellon appends it to the webhook URL (`…/api/webhook/mellon-gate-opener?dev123`)
on every call. If `HA_WEBHOOK_QUERY` is left empty, the webhook is called without
any query — use that when the automation verifies no query parameter.

### Test the webhook

```bash
# without query verification
curl -X POST https://<your-home-assistant>/api/webhook/mellon-gate-opener \
  -H "Content-Type: application/json" -d '{"source":"mellon"}'

# with a secret query parameter (HA_WEBHOOK_QUERY=dev123)
curl -X POST "https://<your-home-assistant>/api/webhook/mellon-gate-opener?dev123" \
  -H "Content-Type: application/json" -d '{"source":"mellon"}'
```
If the gate reacts, Mellon will work too.
