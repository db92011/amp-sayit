# SayIt Verification Snapshot

Date: 2026-03-24

## Current Baseline

- Real live app surface: `https://sayitapp.pages.dev`
- Marketing handoff: `https://circlethepeople.com/sayit`
- Old AMP-era URLs were removed from repo fallbacks and Circle handoff code.

## Verified Working

- Local `SayIt` app starts successfully with `npm run dev`
- App shell renders correctly on mobile preview
- Rewrite flow passes through the local UI
- Direct browser access to `/app.html` redirects back to the install surface as expected
- Live `sayitapp.pages.dev` responds successfully
- Live `circlethepeople.com/sayit` captures successfully in desktop and mobile views

## Visual Artifacts

- Live marketing captures:
  - `/Users/dannybrooking/Documents/GitHub = master copy/ScreenGenie/artifacts/visual/sayit-live-marketing-20260324-135737`
- Live app captures:
  - `/Users/dannybrooking/Documents/GitHub = master copy/ScreenGenie/artifacts/visual/sayit-live-app-20260324-135737`
- Local install flow:
  - `/Users/dannybrooking/Documents/GitHub = master copy/ScreenGenie/artifacts/visual/sayit/marketing-download/20260324-135738`
- Local app shell:
  - `/Users/dannybrooking/Documents/GitHub = master copy/ScreenGenie/artifacts/visual/sayit/app-iphone-view/20260324-135738`
- Local generate flow:
  - `/Users/dannybrooking/Documents/GitHub = master copy/ScreenGenie/artifacts/visual/sayit/generate/20260324-135926`
- Local guarded redirect flow:
  - `/Users/dannybrooking/Documents/GitHub = master copy/ScreenGenie/artifacts/visual/sayit/guarded-app-redirect/20260324-135926`

## Cloudflare / Deploy State

- Wrangler confirms the logged-in Cloudflare account is available locally.
- Non-interactive Pages project inspection is blocked without a `CLOUDFLARE_API_TOKEN`.
- GitHub Actions deploys are still failing at the `Deploy to Cloudflare Pages` step.
- Latest failing run after repo cleanup:
  - `Deploy SayIt #59`
  - `https://github.com/db92011/sayit/actions/runs/23510658860`

## Repo Alignment Completed

- `SayIt` repo commit:
  - `47c7f0c` `Align SayIt Pages target and app URL`
- `CircleThePeopleSite` repo commit:
  - `9aa8625` `Remove AMP SayIt handoff URLs`

## Outstanding Blocker

The remaining issue is Cloudflare-side deployment from GitHub, not the app shell itself. The next checks should be:

1. Confirm GitHub repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`
2. Confirm the Cloudflare Pages project exists under the expected account
3. Confirm whether `app.sayit.dev` should be mapped to the Pages app and remove any stale AMP-era domain mapping
