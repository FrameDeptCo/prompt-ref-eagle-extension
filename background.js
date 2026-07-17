// Routes scraped prompts into Eagle via its local API (default http://localhost:41595).
// Images are fetched in this privileged context (carries the page's CDN session, so
// Instagram/Threads signed URLs don't 403), converted to a base64 data URI, and handed to
// Eagle's addFromURL — Eagle stores the bytes permanently. Prompt text -> annotation,
// model -> "model:<name>" tag, styles -> bare tags, source post -> website. Each image in a
// carousel becomes its own item sharing the same annotation/tags/folder. Items land in
// <parentFolder>/<model> (auto-created), e.g. "Prompts / GPT Image 2".

const DEFAULTS = { eaglePort: 41595, parentFolder: "Prompts", eagleToken: "" }

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "SAVE_PROMPT") {
    savePrompt(msg.payload).then(sendResponse).catch((err) => sendResponse({ error: err.message }))
    return true // async
  }
  if (msg.type === "TEST_EAGLE") {
    testEagle().then(sendResponse).catch((err) => sendResponse({ error: err.message }))
    return true
  }
})

async function getConfig() {
  const c = await chrome.storage.sync.get(["eaglePort", "parentFolder", "eagleToken"])
  return {
    eaglePort: c.eaglePort || DEFAULTS.eaglePort,
    parentFolder: (c.parentFolder || DEFAULTS.parentFolder).trim(),
    eagleToken: c.eagleToken || DEFAULTS.eagleToken,
  }
}

function base(cfg) {
  return `http://localhost:${cfg.eaglePort}`
}

async function eagleGet(cfg, path) {
  const q = cfg.eagleToken ? `?token=${encodeURIComponent(cfg.eagleToken)}` : ""
  const res = await fetch(`${base(cfg)}${path}${q}`)
  if (!res.ok) throw new Error(`Eagle ${path} HTTP ${res.status}`)
  const json = await res.json()
  if (json.status !== "success") throw new Error(`Eagle ${path}: ${json.status}`)
  return json.data
}

async function eaglePost(cfg, path, body) {
  const q = cfg.eagleToken ? `?token=${encodeURIComponent(cfg.eagleToken)}` : ""
  const res = await fetch(`${base(cfg)}${path}${q}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Eagle ${path} HTTP ${res.status}`)
  const json = await res.json()
  if (json.status !== "success") throw new Error(`Eagle ${path}: ${json.status}`)
  return json.data
}

// Collapse cosmetic naming variants ("GPT Image 2" vs "GPT Image 2.0" vs casing/whitespace)
// so folder lookups treat them as the same folder instead of creating a duplicate.
function normFolderName(s) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(\d)\.0\b/g, "$1")
}

// Find a top-level folder by name, creating it if missing.
async function ensureTopFolder(cfg, name) {
  const tree = await eagleGet(cfg, "/api/folder/list")
  const found = tree.find((f) => normFolderName(f.name) === normFolderName(name))
  if (found) return found
  return await eaglePost(cfg, "/api/folder/create", { folderName: name })
}

// Find a child folder by name under parentId, creating it if missing. Matches on a normalized
// name so pre-existing variant folders (e.g. a stray "GPT Image 2.0") get reused instead of
// spawning a new duplicate. Re-reads the tree so children created earlier this session are seen.
async function ensureChildFolder(cfg, parentId, name) {
  const tree = await eagleGet(cfg, "/api/folder/list")
  const parent = findById(tree, parentId)
  const target = normFolderName(name)
  const child = parent?.children?.find((c) => normFolderName(c.name) === target)
  if (child) return child.id
  const created = await eaglePost(cfg, "/api/folder/create", { folderName: name, parent: parentId })
  return created.id
}

function findById(tree, id) {
  for (const f of tree) {
    if (f.id === id) return f
    const hit = findById(f.children || [], id)
    if (hit) return hit
  }
  return null
}

// Resolve the target folderId for a capture: <parentFolder>/<model>, or <parentFolder> root if
// no model was detected.
async function resolveFolder(cfg, model) {
  const top = await ensureTopFolder(cfg, cfg.parentFolder)
  if (!model) return top.id
  return await ensureChildFolder(cfg, top.id, model)
}

async function toDataUri(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`image HTTP ${res.status}`)
  const blob = await res.blob()
  return await new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result)
    fr.onerror = () => reject(new Error("read failed"))
    fr.readAsDataURL(blob)
  })
}

function deriveName(payload) {
  if (payload.title) return payload.title
  const firstLine = (payload.text || "").split("\n")[0].trim()
  return firstLine.slice(0, 80) || "prompt"
}

function buildTags(payload) {
  const tags = []
  if (payload.model) tags.push(`model:${payload.model}`)
  if (payload.hasVideo) tags.push("type:video")
  for (const t of payload.tags || []) {
    const name = typeof t === "string" ? t : t.name
    if (name) tags.push(name)
  }
  return tags
}

async function savePrompt(payload) {
  const cfg = await getConfig()

  const images = Array.isArray(payload.images) && payload.images.length
    ? payload.images
    : payload.imageUrl
    ? [payload.imageUrl]
    : []

  if (!images.length) {
    return { error: "No image found — Eagle needs a file. Text-only prompts can't be saved." }
  }

  const folderId = await resolveFolder(cfg, payload.model)
  const tags = buildTags(payload)
  const name = deriveName(payload)

  let saved = 0
  const failures = []
  for (const imgUrl of images) {
    try {
      // Prefer fetching bytes here (session-authed, beats 403); fall back to letting Eagle
      // download the remote URL directly if the in-extension fetch fails.
      let url
      try {
        url = await toDataUri(imgUrl)
      } catch {
        url = imgUrl
      }
      await eaglePost(cfg, "/api/item/addFromURL", {
        url,
        name,
        website: payload.sourceUrl || undefined,
        annotation: payload.text || "",
        tags,
        folderId,
      })
      saved++
    } catch (e) {
      failures.push(e.message)
    }
  }

  if (saved === 0) return { error: `Eagle save failed: ${failures[0] || "unknown"}` }
  return { ok: true, saved, total: images.length, failures }
}

async function testEagle() {
  const cfg = await getConfig()
  const info = await eagleGet(cfg, "/api/application/info")
  return { ok: true, version: info.version, port: cfg.eaglePort }
}
