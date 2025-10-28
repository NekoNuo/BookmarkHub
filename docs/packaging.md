# BookmarkHub Packaging Guide

This document explains how to build and package the BookmarkHub browser extension for the major browser stores. The project is powered by [WXT](https://wxt.dev), so most workflows map directly to the provided npm scripts.

## 1. Prerequisites

- Node.js ≥ 18 (LTS recommended)  
- npm ≥ 9 (or pnpm/yarn if you prefer, update scripts accordingly)  
- A clean working tree – commit or stash local changes before packaging to avoid shipping experimental code.

## 2. Install dependencies

```bash
npm install
```

> This runs the `postinstall` hook (`wxt prepare`) which generates the extension manifest icons and other assets required for build.

## 3. Build production bundles

### Chromium-based browsers (Chrome / Edge / Brave)

```bash
npm run build
```

- Output folder: `dist/chrome-mv3/`  
- Contains the manifest, compiled background script, popup/options entries, and assets ready for submission to the Chrome Web Store or Edge Add-ons.

### Firefox

```bash
npm run build:firefox
```

- Output folder: `dist/firefox/`  
- Uses the Gecko-compatible manifest and polyfills provided by WXT.

## 4. Create ZIP archives for store upload

WXT can bundle the build artifacts into store-ready archives:

```bash
npm run zip        # Creates Chromium archive
npm run zip:firefox
```

- Archives are saved under `.output/` with timestamped filenames, e.g. `.output/bookmarkhub-chrome-2024-01-01.zip`.  
- Upload these ZIP files directly to the Chrome Web Store or Firefox Add-ons dashboard.

### Custom naming or repeated builds

If you need to override names or rebuild quickly without reinstalling dependencies:

```bash
npx wxt zip --name bookmarkhub-chrome --browser chromium
npx wxt zip --name bookmarkhub-firefox --browser firefox
```

## 5. Local smoke testing before submission

| Browser | Steps |
|---------|-------|
| Chrome / Edge | 1. Visit `chrome://extensions` (or `edge://extensions`)<br>2. Enable “Developer mode”<br>3. Click “Load unpacked” and select `dist/chrome-mv3` |
| Firefox | 1. Visit `about:debugging#/runtime/this-firefox`<br>2. Click “Load Temporary Add-on…”<br>3. Select `dist/firefox/manifest.json` |

- Verify popup actions, options page, and background syncing with a test GitHub token before publishing.  
- For Firefox, temporary add-ons disappear after restart; repeat the steps if you need to retest.

## 6. Submitting to stores

1. **Chrome Web Store / Edge Add-ons**  
   - Upload the Chromium ZIP archive.  
   - Fill in release notes, screenshots, and ensure permissions match the manifest (`storage`, `bookmarks`, `notifications`, `alarms`).

2. **Firefox Add-ons (AMO)**  
   - Upload the Firefox ZIP archive.  
   - Mozilla’s reviewer may request additional information if the extension interacts with bookmarks – keep a test token handy for review notes.

## 7. Versioning and changelog

- Update `package.json` and the `manifest` version (managed by WXT; ensure the number is bumped before building).  
- Maintain changelog entries in `CHANGELOG.md` or release notes so reviewers can see what changed.  
- Tag the release in Git once the build is published.

## 8. Common build issues

| Symptom | Fix |
|---------|-----|
| `npm run build` fails with missing dependencies | Ensure `npm install` finished successfully; delete `node_modules` and reinstall if needed. |
| GitHub API calls fail in production | Confirm you set the `GitHub Token` and `Gist ID` in the options page before testing. |
| Icons missing in the popup after build | Rerun `npm install` or `npx wxt prepare` to regenerate icon assets. |
| Firefox rejects the submission for manifest issues | Make sure you built with `npm run build:firefox`; Chromium bundles are not compatible with AMO. |

---

After each packaging run, remember to test on both Chromium and Firefox at least once. This ensures UI changes, like the redesigned popup and options pages, render correctly across browsers before you roll out a store update. Happy shipping!
