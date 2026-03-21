# Next.js on Netlify Platform Starter

[Live Demo](https://nextjs-platform-starter.netlify.app/)

A modern starter based on Next.js 16 (App Router), Tailwind, and [Netlify Core Primitives](https://docs.netlify.com/core/overview/#develop) (Edge Functions, Image CDN, Blob Store).

In this site, Netlify Core Primitives are used both implictly for running Next.js features (e.g. Route Handlers, image optimization via `next/image`, and more) and also explicitly by the user code.

Implicit usage means you're using any Next.js functionality and everything "just works" when deployed - all the plumbing is done for you. Explicit usage is framework-agnostic and typically provides more features than what Next.js exposes.

## Deploying to Netlify

Click the button below to deploy this template to your Netlify account.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/netlify-templates/next-platform-starter)

## Developing Locally

1. Clone this repository, then run `npm install` in its root directory.

2. For the starter to have full functionality locally (e.g. edge functions, blob store), please ensure you have an up-to-date version of Netlify CLI. Run:

```
npm install netlify-cli@latest -g
```

3. Link your local repository to the deployed Netlify site. This will ensure you're using the same runtime version for both local development and your deployed site.

```
netlify link
```

4. Then, run the Next.js development server via Netlify CLI:

```
netlify dev
```

If your browser doesn't navigate to the site automatically, visit [localhost:8888](http://localhost:8888).

## Google Analytics 4 (GA4)

This site sends GA4 page view events using the GA4 `gtag.js` snippet.

Set the measurement id via:

```bash
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Passwordless auth

This app now uses first-party passwordless magic links backed by the app database.

Required auth-related env vars:

- `APP_BASE_URL`
- `OCI_EMAIL_DELIVERY_ENDPOINT`
- `OCI_EMAIL_DELIVERY_COMPARTMENT_OCID`
- `OCI_EMAIL_SENDER`
- `OCI_TENANCY_OCID`
- `OCI_USER_OCID`
- `OCI_FINGERPRINT`
- `OCI_PRIVATE_KEY_B64`
- `OCI_REGION`

Magic links are one-time use and expire after 20 minutes. Sessions are stored server-side and use a 14 day rolling cookie.

Set `APP_BASE_URL` to the canonical public origin for the deployed site, for example `https://www.omrecipes.dev`. This prevents magic links from being generated against preview or secondary hostnames.

If production serves more than one hostname that should share auth, set `AUTH_COOKIE_DOMAIN` to the shared parent domain, for example `omrecipes.dev`. If you only want one canonical hostname, it is usually better to configure Netlify to redirect all other domains to that primary host.

`OCI_EMAIL_DELIVERY_ENDPOINT` must be a full HTTPS endpoint. If you paste only the host, the app now normalizes it to `https://...`, but the safest value is the exact HTTPS endpoint from OCI Email Delivery configuration.

## Uploaded image + OES asset URLs

Uploaded assets are stored in Netlify Blob Store and served via a Netlify **Edge Function**.

- OES files: `GET /oes/${slug}.oes`
- Original images: `GET /images/${authorId}/${slug}.${ext}`

Notes:

- `authorId` is currently part of the public URL for organization, but the underlying blob key is `${slug}.${ext}`.
- These URLs are written to the DB by `app/upload/actions.js` during upload.

## Resources

- Check out the [Next.js on Netlify docs](https://docs.netlify.com/frameworks/next-js/overview/)
