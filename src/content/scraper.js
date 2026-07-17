// Flexible "version" fragment — matches "2", "v2", "ver 2", "version 2", "2.0", with any/no separator
const VER = "[\\s-]?(?:v(?:er(?:sion)?)?\\.?[\\s-]?)?(\\d+(?:\\.\\d+)?)?"

// Normalize a captured version number so "2", "v2", and "2.0" all collapse to the same folder name
function normVer(v) {
  if (!v) return null
  const n = parseFloat(v)
  return Number.isInteger(n) ? String(n) : String(n)
}

// Model name patterns — order matters (more specific first)
const MODEL_PATTERNS = [
  { re: new RegExp(`gpt[\\s-]?image${VER}`, "i"), name: (m) => { const v = normVer(m[1]); return v ? `GPT Image ${v}` : "GPT Image" } },
  { re: /gpt[\s-]?4o/i, name: () => "GPT-4o" },
  { re: new RegExp(`dall[\\s-]?e${VER}`, "i"), name: (m) => { const v = normVer(m[1]); return v ? `DALL-E ${v}` : "DALL-E" } },
  { re: /midjourney|mid[\s-]?journey|\bmj\b/i, name: () => "Midjourney" },
  { re: new RegExp(`flux${VER}|flux[\\s-]?(pro|dev|schnell|kontext|ultra)`, "i"), name: (m) => { const v = normVer(m[1]) || m[2]; return v ? `Flux ${v[0].toUpperCase()}${v.slice(1)}` : "Flux" } },
  { re: new RegExp(`stable[\\s-]?diffusion${VER}`, "i"), name: () => "Stable Diffusion" },
  { re: /sdxl/i, name: () => "Stable Diffusion XL" },
  { re: new RegExp(`sora${VER}`, "i"), name: () => "Sora" },
  { re: new RegExp(`runway|gen[\\s-]?(\\d)(?:[\\s-]?alpha|[\\s-]?turbo)?`, "i"), name: (m) => m[1] ? `Runway Gen-${m[1]}` : "Runway" },
  { re: new RegExp(`kling${VER}`, "i"), name: (m) => { const v = normVer(m[1]); return v ? `Kling ${v}` : "Kling" } },
  { re: new RegExp(`seedance${VER}`, "i"), name: (m) => { const v = normVer(m[1]); return v ? `Seedance ${v}` : "Seedance 2" } },
  { re: new RegExp(`hailuo${VER}`, "i"), name: () => "Hailuo" },
  { re: /\bwan[\s-]?x?\b/i, name: () => "Wan" },
  { re: /haiper/i, name: () => "Haiper" },
  { re: /hunyuan[\s-]?(?:video)?/i, name: () => "HunyuanVideo" },
  { re: new RegExp(`pika${VER}`, "i"), name: () => "Pika" },
  { re: /happy[\s-]?horse/i, name: () => "Happy Horse" },
  { re: new RegExp(`veo${VER}`, "i"), name: (m) => { const v = normVer(m[1]); return v ? `Veo ${v}` : "Veo" } },
  { re: new RegExp(`imagen${VER}`, "i"), name: (m) => { const v = normVer(m[1]); return v ? `Imagen ${v}` : "Imagen" } },
  { re: /firefly/i, name: () => "Firefly" },
  { re: /ideogram/i, name: () => "Ideogram" },
  { re: /recraft/i, name: () => "Recraft" },
  { re: /leonardo/i, name: () => "Leonardo" },
  { re: /nano[\s-]?banana[\s-]?pro/i, name: () => "NanoBanana Pro" },
  { re: /nano[\s-]?banana/i, name: () => "NanoBanana" },
  { re: /luma[\s-]?(?:labs|dream[\s-]?machine)?/i, name: () => "Luma" },
  { re: /higgsfield/i, name: () => "Higgsfield" },
  { re: /magnific/i, name: () => "Magnific" },
  { re: /topaz/i, name: () => "Topaz" },
  { re: /grok[\s-]?imagine/i, name: () => "Grok Imagine" },
  { re: /qwen[\s-]?image/i, name: () => "Qwen Image" },
]

// Detect prompt-style params even without model name
const PROMPT_PARAMS = /--ar |--v |--style |--sref |cfg_scale|sampler_name|steps:/i

function detectModel(text) {
  if (!text) return null
  for (const { re, name } of MODEL_PATTERNS) {
    const m = text.match(re)
    if (m) return name(m)
  }
  if (PROMPT_PARAMS.test(text)) return "Midjourney"
  return null
}

// Curated vocabulary of known creative/style tags — multi-word phrases checked first
const TAG_PHRASES = [
  // Techniques
  'stop motion', 'motion capture', 'slow motion', 'time lapse', 'double exposure',
  'long exposure', 'tilt shift', 'depth of field', 'bokeh', 'lens flare',
  // Styles
  'black and white', 'monochrome', 'noir', 'cinematic', 'photorealistic', 'hyperrealistic',
  'stylized', 'cartoon', 'anime', 'manga', 'comic', 'illustration', 'concept art',
  'digital art', 'oil painting', 'watercolor', 'sketch', 'line art', 'flat design',
  'isometric', 'pixel art', 'low poly', 'voxel', '3d render', 'cgi',
  // Aesthetics
  'cyberpunk', 'steampunk', 'retrowave', 'synthwave', 'vaporwave', 'lo-fi', 'neon',
  'minimal', 'minimalist', 'maximalist', 'surreal', 'abstract', 'geometric',
  'gothic', 'dark fantasy', 'fantasy', 'sci-fi', 'futuristic', 'retro', 'vintage',
  'film noir', 'horror', 'ethereal', 'dreamy', 'dystopian', 'utopian',
  // Lighting
  'golden hour', 'blue hour', 'backlit', 'rim light', 'studio lighting',
  'natural light', 'dramatic lighting', 'moody lighting', 'bioluminescent',
  // Subjects
  'portrait', 'landscape', 'street photography', 'architecture', 'nature',
  'wildlife', 'aerial', 'underwater', 'macro', 'fashion', 'editorial',
  // Format / medium
  'poster', 'cover art', 'album art', 'book cover', 'logo', 'typography',
  'infographic', 'storyboard', 'moodboard', 'collage', 'pattern',
  // Motion specific
  'animation', 'looping', 'particle', 'fluid simulation', 'vfx', 'visual effects',
  'kinetic', 'generative', 'procedural',
]

// Extract tags by matching against known vocabulary
function extractTagsFromTitle(titleLine, model) {
  if (!titleLine) return []

  // Remove model name from the line before matching
  let text = titleLine.toLowerCase()
  if (model) {
    text = text.replace(model.toLowerCase(), '')
  }
  // Also strip version numbers and common filler
  text = text.replace(/\d+(\.\d+)?/g, ' ').replace(/\b(is|for|with|using|by|the|a|an|and|or|of|in|on|at|to)\b/g, ' ')

  const found = []
  // Check multi-word phrases first (order matters — longer matches win)
  for (const phrase of TAG_PHRASES) {
    if (text.includes(phrase)) {
      found.push(phrase)
      text = text.replace(phrase, '') // consume it so we don't double-match subwords
    }
  }

  return found.slice(0, 6)
}

// Parse X/Twitter tweet text
// Pattern: first line = title (may contain model), then "Prompt\n..." or just body text
function parseTweetText(raw) {
  if (!raw) return null
  const lines = raw.split('\n').filter(l => l.trim())
  const firstLine = lines[0]?.trim() ?? ''

  // Find where the actual prompt starts
  const promptIdx = lines.findIndex(l => /^prompt[:\s]*/i.test(l.trim()))
  let promptText = ''
  if (promptIdx !== -1) {
    // Everything after the "Prompt" label line
    promptText = lines.slice(promptIdx + 1).join('\n').trim()
    // If the prompt label itself has content after the colon, include it
    const labelLine = lines[promptIdx].replace(/^prompt[:\s]*/i, '').trim()
    if (labelLine) promptText = labelLine + '\n' + promptText
  } else {
    // No explicit "Prompt" section — use full text
    promptText = raw.trim()
  }

  const model = detectModel(firstLine) ?? detectModel(raw)
  const tags = extractTagsFromTitle(firstLine, model)

  return {
    title: firstLine || null,
    text: promptText || raw,
    model,
    tags,
  }
}

// Site-specific scrapers
const scrapers = {
  "x.com": scrapeX,
  "twitter.com": scrapeX,
  "threads.com": scrapeThreads,
  "www.threads.com": scrapeThreads,
  "midjourney.com": scrapeMidjourney,
  "civitai.com": scrapeCivitai,
  "reddit.com": scrapeReddit,
  "prompthero.com": scrapePromptHero,
}

function scrapeThreads() {
  const authorMatch = window.location.pathname.match(/\/@([^/]+)/)
  const author = authorMatch?.[1] ?? null

  const container = Array.from(document.querySelectorAll('div.x1n2onr6'))
    .map(el => el.innerText?.trim())
    .filter(t => t?.length > 100)
    .reduce((a, b) => a.length > b.length ? a : b, '')

  if (!container) return null

  // Parse posts by detecting username\ndate boundaries
  const dateRe = /^\d{2}\/\d{2}\/\d{2}$/
  const engagementRe = /^[\d/]+$/
  const lines = container.split('\n').map(l => l.trim()).filter(l => l)

  const allPosts = []
  let i = 0
  while (i < lines.length) {
    if (i + 1 < lines.length && dateRe.test(lines[i + 1]) && lines[i].length < 40) {
      const username = lines[i]
      i += 2
      const content = []
      while (i < lines.length) {
        if (i + 1 < lines.length && dateRe.test(lines[i + 1]) && lines[i].length < 40) break
        if (!engagementRe.test(lines[i])) content.push(lines[i])
        i++
      }
      allPosts.push({ username, content: content.join('\n').trim() })
    } else {
      i++
    }
  }

  // Only keep posts from the thread author
  const authorPosts = allPosts
    .filter(p => !author || p.username === author)
    .map(p => p.content)
    .filter(c => c.length > 10)

  if (!authorPosts.length) return null

  const fullText = authorPosts.join('\n')
  const titlePost = authorPosts[0]
  const title = titlePost.split('\n')[0]?.trim() ?? null

  // Find prompt — post with explicit "Prompt" label, or longest post
  let promptText = ''
  const promptPost = authorPosts.find(p => /^prompt\b/i.test(p))
  if (promptPost) {
    const plines = promptPost.split('\n').filter(l => l.trim())
    const labelIdx = plines.findIndex(l => /^prompt\b/i.test(l))
    promptText = plines.slice(labelIdx + 1).join('\n').trim()
  } else {
    promptText = authorPosts.reduce((a, b) => a.length > b.length ? a : b, '')
  }

  if (!promptText) return null

  const imgs = Array.from(document.querySelectorAll('img'))
    .filter(i => !i.alt?.toLowerCase().includes('profile'))
    .map(i => i.src || i.getAttribute('data-src') || '')
    // t51.82787-15 = post media, t51.82787-19 = profile pictures
    .filter(s => s.includes('cdninstagram') && s.includes('t51.82787-15'))
    .filter((s, i, arr) => arr.indexOf(s) === i)

  const videoPosters = Array.from(document.querySelectorAll('video')).map(v => v.poster).filter(Boolean)
  const hasVideo = videoPosters.length > 0
  const allImages = [...imgs, ...videoPosters]

  const model = detectModel(fullText) ?? detectModel(document.title)
  // Try title first, fall back to scanning the prompt body for tags
  let tags = extractTagsFromTitle(titlePost, model)
  if (!tags.length) tags = extractTagsFromTitle(promptText.slice(0, 200), model)

  return {
    text: promptText,
    title,
    imageUrl: allImages[0] ?? null,
    images: allImages,
    hasVideo,
    model,
    tags,
  }
}

function scrapeX() {
  const article = document.querySelector('article[data-testid="tweet"]')
  if (!article) return null
  const raw = article.querySelector('[data-testid="tweetText"]')?.innerText?.trim()
  if (!raw) return null

  const parsed = parseTweetText(raw)

  // Grab all media images
  const imgs = Array.from(article.querySelectorAll('img[src*="pbs.twimg.com/media"]'))
    .map((img) => img.src.split('?')[0] + '?format=jpg&name=large')
    .filter((src, i, arr) => arr.indexOf(src) === i)

  // Grab video posters (Twitter HLS — actual video src is empty, poster is accessible)
  const videoPosters = Array.from(article.querySelectorAll('video[poster]'))
    .map((v) => v.poster)
    .filter(Boolean)

  const hasVideo = videoPosters.length > 0
  const allImages = [...imgs, ...videoPosters]

  return {
    ...parsed,
    imageUrl: allImages[0] ?? null,
    images: allImages,
    hasVideo,
  }
}

function scrapeMidjourney() {
  const promptEl = document.querySelector('[class*="prompt"], [data-prompt]')
  const raw = promptEl?.innerText?.trim() ?? promptEl?.dataset?.prompt?.trim()
  const imgEl = document.querySelector('img[src*="cdn.midjourney.com"]')
  if (!raw) return null
  return {
    text: raw,
    title: null,
    imageUrl: imgEl?.src ?? null,
    model: "Midjourney",
    tags: [],
  }
}

function scrapeCivitai() {
  const promptEl = document.querySelector('[class*="prompt"], pre, [data-key="prompt"]')
  const raw = promptEl?.innerText?.trim()
  const imgEl = document.querySelector('img[src*="image.civitai.com"]')
  const modelEl = document.querySelector('[class*="model-name"], [class*="modelName"]')
  if (!raw) return null
  const modelName = modelEl?.innerText?.trim() ?? detectModel(raw) ?? detectModel(document.title)
  return {
    text: raw,
    title: document.title ?? null,
    imageUrl: imgEl?.src ?? null,
    model: modelName,
    tags: extractTagsFromTitle(document.title, modelName),
  }
}

function scrapeReddit() {
  const postEl = document.querySelector('[data-test-id="post-content"], [slot="text-body"]')
  const raw = postEl?.innerText?.trim()
  const imgEl = document.querySelector('img[src*="preview.redd.it"], img[src*="i.redd.it"]')
  if (!raw) return null
  const title = document.querySelector('h1')?.innerText?.trim() ?? null
  const model = detectModel(title) ?? detectModel(raw)
  return {
    text: raw,
    title,
    imageUrl: imgEl?.src ?? null,
    model,
    tags: extractTagsFromTitle(title, model),
  }
}

function scrapePromptHero() {
  const promptEl = document.querySelector('[class*="prompt"]')
  const raw = promptEl?.innerText?.trim()
  const imgEl = document.querySelector('img.prompt-image, [class*="hero"] img')
  if (!raw) return null
  const model = detectModel(document.title) ?? detectModel(raw)
  return {
    text: raw,
    title: null,
    imageUrl: imgEl?.src ?? null,
    model,
    tags: [],
  }
}

function genericScrape() {
  const selected = window.getSelection()?.toString()?.trim()
  if (selected && selected.length > 20) {
    const model = detectModel(document.title) ?? detectModel(selected)
    const parsed = parseTweetText(selected)
    return {
      ...parsed,
      model: model ?? parsed.model,
      imageUrl: null,
    }
  }
  // Last resort: try to find any large text block
  const model = detectModel(document.title)
  return {
    text: '',
    title: document.title ?? null,
    imageUrl: null,
    model,
    tags: extractTagsFromTitle(document.title, model),
  }
}

function getScrapedData() {
  const hostname = window.location.hostname.replace('www.', '')
  const scraper = scrapers[hostname]
  const result = scraper ? scraper() : null
  return result ?? genericScrape()
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'SCRAPE') {
    sendResponse(getScrapedData())
  }
})
