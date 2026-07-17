function msg(text, ok) {
  const el = document.getElementById("msg")
  el.textContent = text
  el.className = "msg " + (ok ? "ok" : "err")
}

async function init() {
  const c = await chrome.storage.sync.get(["eaglePort", "parentFolder", "eagleToken"])
  document.getElementById("eaglePort").value = c.eaglePort ?? 41595
  document.getElementById("parentFolder").value = c.parentFolder ?? "Prompts"
  if (c.eagleToken) document.getElementById("eagleToken").value = c.eagleToken

  document.getElementById("save").addEventListener("click", () => {
    const eaglePort = parseInt(document.getElementById("eaglePort").value.trim(), 10) || 41595
    const parentFolder = document.getElementById("parentFolder").value.trim() || "Prompts"
    const eagleToken = document.getElementById("eagleToken").value.trim()
    chrome.storage.sync.set({ eaglePort, parentFolder, eagleToken }, () => msg("settings saved", true))
  })

  document.getElementById("test").addEventListener("click", async () => {
    // Persist first so the background worker tests against the current values.
    const eaglePort = parseInt(document.getElementById("eaglePort").value.trim(), 10) || 41595
    const parentFolder = document.getElementById("parentFolder").value.trim() || "Prompts"
    const eagleToken = document.getElementById("eagleToken").value.trim()
    await chrome.storage.sync.set({ eaglePort, parentFolder, eagleToken })

    msg("testing…", true)
    const res = await chrome.runtime.sendMessage({ type: "TEST_EAGLE" })
    if (res?.ok) msg(`connected — Eagle ${res.version} on :${res.port}`, true)
    else msg(res?.error || "could not reach Eagle", false)
  })
}

init()
