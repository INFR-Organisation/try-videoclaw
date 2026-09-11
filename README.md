# try-videoclaw

Sandbox for videoclaw experiments — live at **https://try.videoclaw.com**

> [!WARNING]
> **This is a scratch space, not production.** Things here break, get overwritten, and
> disappear without notice. Nothing should ever depend on a `try.videoclaw.com` URL.
> Production demos live in [`videoclaw-lander`](https://github.com/INFR-Organisation/videoclaw-lander)
> on `demo.videoclaw.com`.

## Adding an experiment

One folder under `public/` = one experiment, served at that path.

```bash
cp -R public/hello public/my-idea
# edit public/my-idea/index.html
git add -A && git commit -m "add my-idea" && git push
```

Pushing to `main` deploys automatically. `public/my-idea/index.html` → `try.videoclaw.com/my-idea`.

There is no framework. Plain HTML/CSS/JS, plus any assets you put next to it (reference them
relatively). If it opens correctly as a local file, it will work here.

## The homepage

`public/index.html` is **generated** — don't edit it by hand, your changes get overwritten.
`scripts/build.js` scans `public/*/index.html` and reads each page's `<title>` and
`<meta name="description">` to build the listing, newest-first by last commit date.

So give every experiment a real title and description:

```html
<title>Caption timing test</title>
<meta name="description" content="Comparing three caption reveal curves.">
```

## Local preview

```bash
npm run dev      # regenerates the index, serves public/ on localhost
npm run build    # regenerates the index only
```

## Deploy

Vercel project `try-videoclaw` under the **Humeo** team, connected to this repo — push to `main`
and it ships. Build command `node scripts/build.js`, output directory `public`.

## Housekeeping

Large media bloats the repo permanently and slows every clone. For anything more than a few MB,
host the file elsewhere and point at it, or accept that it's there forever. Don't commit secrets —
this repo is public.
