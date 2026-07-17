# Prompt-Ref → Eagle

A free browser extension that scrapes AI-generated prompts (and their images) from X/Twitter, Threads, Midjourney, Civitai, Reddit, and PromptHero, and saves them straight into your [Eagle](https://eagle.cool) library — auto-detecting the model used and filing it into a matching folder.

No account, no server, no tracking. It talks directly to Eagle's local API on your machine.

## What it does

- Detects the AI model mentioned in a post (GPT Image, Midjourney, Flux, Kling, Seedance, Veo, NanoBanana, and 20+ others) and files the save into `Prompts/<Model>` in Eagle, auto-creating folders as needed.
- Pulls the prompt text into the item's annotation.
- Grabs all images in a post (carousels included) as separate Eagle items sharing the same tags/annotation.
- Tags the source (`website`), flags video posts (`type:video`), and pulls in any style/technique keywords it recognizes (cinematic, portrait, cyberpunk, etc).
- Lets you review/edit everything (text, model, title, tags) before saving, or fill it in by hand on sites it doesn't know.

## Requirements

- [Eagle](https://eagle.cool) app installed and running, with its local API enabled: **Eagle → Preferences → Developer → Enable Local API**.
- A Chromium-based browser (Chrome, Brave, Edge, etc).

## Install

1. Download this repo (Code → Download ZIP, or `git clone`) and unzip it somewhere permanent — don't delete the folder after installing, the browser loads the extension from it.
2. Go to `chrome://extensions` (or `brave://extensions`).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select this folder.
5. Pin the extension for easy access.

## Use

1. Open a post with an AI prompt (X, Threads, Midjourney, Civitai, Reddit, PromptHero — or select text on any other page).
2. Click the extension icon. It auto-fills the prompt text, detected model, title, and tags.
3. Edit anything that's wrong, then hit **Save to Eagle**.

If it says it can't reach Eagle, make sure the Eagle app is open and the local API is enabled (see Requirements above).

## Settings

Click **settings** in the popup to change:
- **Eagle API port** — default `41595`, matches Eagle's default.
- **Parent folder** — default `Prompts`, the top-level Eagle folder that model subfolders get created under.
- **API token** — only needed if you've set one in Eagle; leave blank otherwise.

## Notes

- Eagle is file-first, so text-only prompts with no image attached can't be saved.
- Model detection is pattern-based and won't catch everything — you can always type/fix the model manually before saving.
