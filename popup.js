function showStatus(msg, type) {
  const el = document.getElementById("status")
  el.textContent = msg
  el.className = "status " + type
}

async function scrapeTab(tabId) {
  try {
    const result = await chrome.tabs.sendMessage(tabId, { type: "SCRAPE" })
    if (result) return result
  } catch (_) {}

  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ["src/content/scraper.js"] })
    await new Promise((r) => setTimeout(r, 100))
    return await chrome.tabs.sendMessage(tabId, { type: "SCRAPE" })
  } catch (_) {}

  return null
}

async function init() {
  // Confirm Eagle is reachable; if not, point the user at settings / launching Eagle.
  const test = await chrome.runtime.sendMessage({ type: "TEST_EAGLE" })
  if (!test || test.error) {
    document.getElementById("not-configured").style.display = "flex"
    document.getElementById("main-body").style.display = "none"
    return
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const scraped = await scrapeTab(tab.id)

  if (scraped?.text)         document.getElementById("text").value = scraped.text
  if (scraped?.model)        document.getElementById("model").value = scraped.model
  if (scraped?.title)        document.getElementById("title").value = scraped.title
  if (scraped?.tags?.length) document.getElementById("tags").value = scraped.tags.join(", ")
  if (!scraped?.text)        document.getElementById("text").placeholder = "paste a prompt here..."

  document.getElementById("save-btn").addEventListener("click", async () => {
    const text = document.getElementById("text").value.trim()
    if (!text) { document.getElementById("text").focus(); return }

    const btn = document.getElementById("save-btn")
    btn.disabled = true
    btn.textContent = "saving..."
    showStatus("", "")

    const tags = document.getElementById("tags").value
      .split(",").map((t) => t.trim()).filter(Boolean)

    const payload = {
      text,
      title: document.getElementById("title").value.trim() || undefined,
      model: document.getElementById("model").value.trim() || undefined,
      sourceUrl: tab.url,
      imageUrl: scraped?.imageUrl ?? undefined,
      images: scraped?.images?.length ? scraped.images : undefined,
      hasVideo: scraped?.hasVideo ?? false,
      tags,
    }

    try {
      const response = await chrome.runtime.sendMessage({ type: "SAVE_PROMPT", payload })

      if (!response) {
        showStatus("no response — is Eagle running?", "error")
        btn.disabled = false
        btn.textContent = "save to Eagle"
      } else if (response.error) {
        showStatus(typeof response.error === "string" ? response.error : JSON.stringify(response.error), "error")
        btn.disabled = false
        btn.textContent = "save to Eagle"
      } else {
        const note = response.saved < response.total ? ` (${response.saved}/${response.total})` : ""
        showStatus("saved to Eagle" + note, "success")
        btn.textContent = "saved"
        setTimeout(() => window.close(), 1000)
      }
    } catch (err) {
      showStatus("error: " + err.message, "error")
      btn.disabled = false
      btn.textContent = "save to Eagle"
    }
  })
}

init()
