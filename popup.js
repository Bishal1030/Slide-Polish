// ============================================
// CONFIGURATION
// ============================================
// API key is loaded from chrome.storage.sync via getApiKey()

// ============================================
// STATE
// ============================================
let selectedTone = "precise"

// ============================================
// DOM ELEMENTS
// ============================================
const textInput = document.getElementById("textInput")
const generateBtn = document.getElementById("generateBtn")
const loadingDiv = document.getElementById("loading")
const resultsSection = document.getElementById("resultsSection")
const resultsList = document.getElementById("resultsList")
const errorMsg = document.getElementById("errorMsg")
const toneBtns = document.querySelectorAll(".tone-btn")

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  // Load pre-filled text from context menu
  window.chrome.storage.local.get(["selectedText"], (result) => {
    if (result.selectedText) {
      textInput.value = result.selectedText
      textInput.focus()
      window.chrome.storage.local.remove(["selectedText"])
    }
  })

  // Set up event listeners
  setupEventListeners()
})

function setupEventListeners() {
  // Tone selection
  toneBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      toneBtns.forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")
      selectedTone = btn.dataset.tone
    })
  })

  // Generate button
  generateBtn.addEventListener("click", handleGenerate)

  // Allow Enter key to generate (Ctrl+Enter or Cmd+Enter)
  textInput.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleGenerate()
    }
  })
}

// ============================================
// EVENT HANDLERS
// ============================================
async function handleGenerate() {
  const text = textInput.value.trim()

  // Validation
  if (!text) {
    showError("Please paste some text to rewrite.")
    return
  }

  const apiKey = await getApiKey()
  if (!apiKey) {
    showError("⚠️ OpenAI API key not set. Open extension Settings to add it.")
    return
  }

  // Show loading state
  showLoading(true)
  hideError()
  resultsSection.classList.add("hidden")

  try {
    const rewrites = await generateRewrites(text, selectedTone, apiKey)

    if (!rewrites || rewrites.length === 0) {
      showError("No rewrites generated. Please try again.")
      return
    }

    displayResults(rewrites)
  } catch (error) {
    showError(error.message || "Failed to generate rewrites. Please try again.")
  } finally {
    showLoading(false)
  }
}

// ============================================
// API CALL
// ============================================
async function generateRewrites(text, tone, apiKey) {
  const toneDescriptions = {
    precise: "concise and precise, removing any fluff or unnecessary words",
    professional: "professional and formal, suitable for business communication",
    executive: "executive-level summary with high-level insights only",
    friendly: "friendly and approachable, using a conversational tone",
  }

  const prompt = `You are a professional slide content editor. Your task is to rewrite the following text in a ${toneDescriptions[tone]} manner.

Original text: "${text}"

Generate exactly 3 different rewrite options. Each option should:
- Be distinct from the others
- Maintain the core message and meaning
- Be suitable for slide presentations
- Be concise (1-2 sentences max)

Return ONLY valid JSON with no markdown, no code blocks, and no extra text:
{
  "rewrites": [
    {"text": "rewrite option 1"},
    {"text": "rewrite option 2"},
    {"text": "rewrite option 3"}
  ]
}`

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 600,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = errorData.error?.message || "OpenAI API error"

      if (response.status === 401) {
        throw new Error("Invalid API key. Check your OpenAI credentials.")
      } else if (response.status === 429) {
        throw new Error("Rate limited. Please wait a moment and try again.")
      } else if (response.status === 500) {
        throw new Error("OpenAI service error. Please try again later.")
      }

      throw new Error(errorMessage)
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid response format from API")
    }

    const parsed = JSON.parse(jsonMatch[0])
    return parsed.rewrites || []
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse API response. Please try again.")
    }
    throw error
  }
}

// ============================================
// UI FUNCTIONS
// ============================================
function displayResults(rewrites) {
  resultsList.innerHTML = ""

  rewrites.forEach((rewrite, index) => {
    const item = document.createElement("div")
    item.className = "result-item"

    item.innerHTML = `
      <div class="result-text">${escapeHtml(rewrite.text)}</div>
      <div class="result-actions">
        <button class="copy-btn" data-index="${index}">Copy</button>
      </div>
    `

    const copyBtn = item.querySelector(".copy-btn")
    copyBtn.addEventListener("click", () => {
      copyToClipboard(rewrite.text, copyBtn)
    })

    resultsList.appendChild(item)
  })

  resultsSection.classList.remove("hidden")
}

function copyToClipboard(text, btn) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const originalText = btn.textContent
      btn.textContent = "✓ Copied!"
      btn.classList.add("copied")

      setTimeout(() => {
        btn.textContent = originalText
        btn.classList.remove("copied")
      }, 2000)
    })
    .catch(() => {
      showError("Failed to copy. Please try again.")
    })
}

function showLoading(show) {
  if (show) {
    loadingDiv.classList.remove("hidden")
    generateBtn.disabled = true
  } else {
    loadingDiv.classList.add("hidden")
    generateBtn.disabled = false
  }
}

function showError(message) {
  errorMsg.textContent = message
  errorMsg.classList.remove("hidden")
}

function hideError() {
  errorMsg.classList.add("hidden")
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

// ============================================
// SETTINGS
// ============================================
async function getApiKey() {
  try {
    const { OPENAI_API_KEY } = await chrome.storage.sync.get(["OPENAI_API_KEY"])
    return OPENAI_API_KEY || ""
  } catch (e) {
    return ""
  }
}
