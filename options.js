document.addEventListener("DOMContentLoaded", async () => {
  const apiKeyInput = document.getElementById("apiKey")
  const saveBtn = document.getElementById("saveBtn")
  const statusEl = document.getElementById("status")

  try {
    const { OPENAI_API_KEY } = await chrome.storage.sync.get(["OPENAI_API_KEY"])
    if (OPENAI_API_KEY) apiKeyInput.value = OPENAI_API_KEY
  } catch {}

  saveBtn.addEventListener("click", async () => {
    const key = apiKeyInput.value.trim()
    await chrome.storage.sync.set({ OPENAI_API_KEY: key })
    statusEl.classList.add("show")
    setTimeout(() => statusEl.classList.remove("show"), 1500)
  })
})


