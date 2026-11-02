# Shape Logic 11+

Unlimited 11+ non-verbal reasoning practice in the browser. Every question is generated on the spot, so the same paper never comes up twice.

## Question types

- Odd one out
- Find the similar
- Series
- Analogies
- Codes
- Grids (3×3 matrices)

Each has a **Standard** and a **Challenging** level. Papers are 10, 20 or 30 questions, in **Practice** mode (answer and reasoning after each question) or **Test** mode (timed, marked at the end with a breakdown by type).

## Running it

It's a single static page with no build step and no dependencies. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Hosting

**GitHub Pages:** push to `main`, then in the repo go to *Settings → Pages* and set *Source* to **GitHub Actions**. The included workflow deploys on every push.

**Netlify / Cloudflare Pages / Vercel:** point them at the repo with no build command and the publish directory set to `/`.

## Progress tracking

Each person gets a progress link, `…/11plus/?id=<guid>`. The id is created on first visit and added to the address bar, so bookmarking the page keeps it. Opening the same link on another device brings back the same history.

When a paper is marked, the app records each question's type, whether it was right, whether the **first** choice was right, and the seconds spent on it. The **Progress** tab shows right-first-time and seconds-per-question charts, a breakdown by question type, and the weakest type.

Results are always kept in the browser. If a progress server is configured they are also saved there, and anything recorded while offline is uploaded on the next visit.

### Progress server (Cloudflare Worker + KV)

The Worker lives in `worker/`. It stores one KV record per progress link and only accepts requests from the origins listed in `worker/wrangler.toml`.

One-time setup:

```sh
cd worker
npx wrangler login
npx wrangler kv namespace create PROGRESS   # note the printed id
npx wrangler deploy                         # prints https://nvr-progress.<you>.workers.dev
```

Then put that URL in `index.html`:

```html
<meta name="progress-api" content="https://nvr-progress.<you>.workers.dev">
```

To deploy from GitHub Actions (automatically when `worker/` changes, or via *Run workflow*), add `CLOUDFLARE_API_TOKEN` (with the *Edit Cloudflare Workers* template) and `CLOUDFLARE_ACCOUNT_ID` as repository secrets, and `KV_NAMESPACE_ID` as a repository variable. For a manual deploy, put the id in place of the placeholder in `wrangler.toml` without committing it.

Anyone holding a progress link can read and add to that history, so treat the link like an unlisted bookmark rather than an account.

## How questions are made

Each figure is a set of attributes (shape, shading, rotation, mirroring, number and type of small marks). Generators pick a rule, build the figures, then reject any question where a different rule could also justify another answer, or where two options look identical. Every question carries a plain-English explanation of its rule.

## Licence

See [LICENSE](LICENSE).
