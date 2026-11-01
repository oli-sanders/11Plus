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

## How questions are made

Each figure is a set of attributes (shape, shading, rotation, mirroring, number and type of small marks). Generators pick a rule, build the figures, then reject any question where a different rule could also justify another answer, or where two options look identical. Every question carries a plain-English explanation of its rule.

## Licence

See [LICENSE](LICENSE).
