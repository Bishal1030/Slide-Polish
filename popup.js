

let selectedTone = "executive"


const textInput = document.getElementById("textInput")
const polishBtn = document.getElementById("polishBtn")
const loadingDiv = document.getElementById("loading")
const closeBtn = document.getElementById("closeBtn") // Updated to match the HTML id
const resultsSection = document.getElementById("resultsSection")
const resultsList = document.getElementById("resultsList")
const errorMsg = document.getElementById("errorMsg")
const toneSection = document.getElementById("toneSection")
const tabs = document.querySelectorAll(".tab")
const toneBtns = document.querySelectorAll(".tone-btn")

// Close button handler
closeBtn?.addEventListener("click", () => {
    window.close()
})


document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const rephraseAction = document.getElementById("rephraseAction")
  const adjustToneAction = document.getElementById("adjustToneAction")
  const toneSection = document.getElementById("toneSection")

  // Initialize state - hide all sections
  toneSection.classList.add("hidden")
  resultsSection.classList.add("hidden")
  loadingDiv.classList.add("hidden")
  errorMsg.classList.add("hidden")

  window.chrome.storage.local.get(["selectedText"], (result) => {
    if (result.selectedText) {
      textInput.value = result.selectedText
      textInput.focus()
      window.chrome.storage.local.remove(["selectedText"])
    }
  })

  // Setup action text listeners
  adjustToneAction.addEventListener("click", () => {
    rephraseAction.classList.remove("active")
    adjustToneAction.classList.add("active")
    toneSection.classList.remove("hidden")
    toneSection.style.display = "block"
    resultsSection.classList.add("hidden")
  })

  rephraseAction.addEventListener("click", async () => {
    // Always allow tab switching
    adjustToneAction.classList.remove("active")
    rephraseAction.classList.add("active")
    toneSection.classList.add("hidden")
    toneSection.style.display = "none"

    // Clear previous results first
    resultsList.innerHTML = ""
    resultsSection.classList.add("hidden")
    
    // Only generate new content if there's text
    if (!textInput.value.trim()) return;
    
    try {
      showLoading(true)
      hideError()
      polishBtn.disabled = true

      // Generate fresh rewrites using the rephrase function
      const rewrites = await generateRephrases(textInput.value.trim(), selectedTone);

      if (!rewrites || rewrites.length === 0) {
        throw new Error("No results generated. Please try again.");
      }

      displayResults(rewrites);
    } catch (error) {
      showError(error.message || "Failed to generate rewrites. Please try again.");
    } finally {
      showLoading(false)
      polishBtn.disabled = false
    }
  })

  setupEventListeners()
})

function setupEventListeners() {

  // Tone buttons
  toneBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      toneBtns.forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")
      selectedTone = btn.dataset.tone
    })
  })

  // Polish button
  polishBtn.addEventListener("click", handleGenerate)

  textInput.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleGenerate()
    }
  })
}


async function handleGenerate(forceNew = false) {
  const text = textInput.value.trim()

  if (!text) {
    showError("Please paste some text to rewrite.")
    return
  }

  showLoading(true)
  hideError()
  resultsSection.classList.add("hidden")
  document.querySelector(".content").classList.remove("has-results")
  polishBtn.disabled = true

  try {
    // Try backend first, fall back to direct API
    let rewrites;
    try {
      rewrites = await generateViaBackend(text, selectedTone, forceNew)
    } catch (backendError) {
      console.log("Backend failed, using direct API:", backendError)
      rewrites = await generateRewrites(text, selectedTone)
    }

    if (!rewrites || rewrites.length === 0) {
      throw new Error("No rewrites generated. Please try again.")
    }

    displayResults(rewrites)
  } catch (error) {
    showError(error.message || "Failed to generate rewrites. Please try again.")
  } finally {
    showLoading(false)
    polishBtn.disabled = false
  }
}


// ============================================
// API CALL
// ============================================
async function generateRewrites(text, tone) {
  const toneDescriptions = {
    executive: `OUTPUT FORMAT (DO NOT DEVIATE):
Headline: "..."
• ...
• ...
• ...

EXAMPLE:
Headline: "Onboarding automation cut signup friction by 35%."
• Signup flow now fully automated; reduced manual steps from 8 → 3.
• Activation rate improved from 62% → 84% post-release.
• Dashboards now track conversion trends across all user cohorts.`,

    investor: `OUTPUT FORMAT (DO NOT DEVIATE):
• ...
• ... → ...
• Next: ... → ...

EXAMPLE:
• Activation rate +22% MoM after onboarding automation.
• Dashboard analytics surfaced key drop-off points → guiding Q4 UX priorities.
• Next: expand automation to enterprise tier; expected +15% ARR uplift.`,

    product: `OUTPUT FORMAT (DO NOT DEVIATE):
• ... (Now).
• ... (Next).
• ... (Later).

EXAMPLE:
• Reduce onboarding time from 7 → 2 minutes to boost activation (Now).
• Enable real-time conversion tracking for better user insight (Next).
• Expand analytics dashboard for A/B testing and product decisions (Later).`,

    sales: `OUTPUT FORMAT (DO NOT DEVIATE):
• Pain: "..."
• Value: "..."
• Proof: "..."

EXAMPLE:
• Pain: "Manual onboarding slows your growth."
• Value: "Automation lets users get started in 2 minutes — no setup needed."
• Proof: "Teams using this flow saw a 35% increase in activations."`,

    technical: `OUTPUT FORMAT (DO NOT DEVIATE):
• What it is: ...
• Why it matters: ...
• Business impact: ...

EXAMPLE:
• What it is: Automated signup and conversion tracking system.
• Why it matters: Removes manual verification and tracks real-time drop-offs.
• Business impact: Faster activations, +22% new user conversions, reduced support overhead.`,

    clarity: `OUTPUT FORMAT (DO NOT DEVIATE):
• ...
• ...
• ...

EXAMPLE:
• Signup flow automated — 8 steps → 3.
• Activation up 22%.
• Dashboard tracks user conversion in real time.`
  }

  const prompt = `${toneDescriptions[tone]}

TEXT: "${text}"

RULES:
1. Output ONLY bullets (use • character)
2. NO paragraphs, NO prose
3. Use \\n between lines
4. Use → for transitions
5. Include required labels shown in format

Generate 3 DIFFERENT rewrites in the SAME bullet structure.

JSON OUTPUT:
{
  "rewrites": [
    {"text": "bullets here"},
    {"text": "bullets here"},
    {"text": "bullets here"}
  ]
}`

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a slide formatter. You output ONLY bullet-point structured text. You NEVER output paragraphs or prose. You MUST use • for bullets, → for transitions, and include required prefixes."
          },
          {
            role: "user",
            content: `Format in ${tone} tone: We improved onboarding and conversion went up.`
          },
          {
            role: "assistant",
            content: tone === 'executive' 
              ? `{"rewrites":[{"text":"Headline: \\"Onboarding optimization drove 40% conversion lift.\\"\\n• Signup friction reduced via UI simplification.\\n• Conversion rate increased from 45% → 62%.\\n• User satisfaction scores up 23 points."}]}`
              : tone === 'investor'
              ? `{"rewrites":[{"text":"• Conversion rate +38% after onboarding improvements.\\n• User feedback scores improved → informing Q4 product roadmap.\\n• Next: scale to enterprise segment; projected +20% ARR."}]}`
              : tone === 'product'
              ? `{"rewrites":[{"text":"• Streamline onboarding from 5 → 2 steps to boost activation (Now).\\n• Add conversion tracking dashboard for insight (Next).\\n• Expand A/B testing framework for optimization (Later)."}]}`
              : tone === 'sales'
              ? `{"rewrites":[{"text":"• Pain: \\"Complex onboarding kills conversions.\\"\\n• Value: \\"Simplified flow gets users started in under 2 minutes.\\"\\n• Proof: \\"Early adopters saw 38% higher activation rates.\\""}]}`
              : tone === 'technical'
              ? `{"rewrites":[{"text":"• What it is: Automated onboarding and conversion tracking system.\\n• Why it matters: Eliminates manual steps and provides real-time analytics.\\n• Business impact: +38% conversions, reduced support costs, faster time-to-value."}]}`
              : `{"rewrites":[{"text":"• Onboarding simplified — 5 steps → 2.\\n• Conversions up 38%.\\n• Users report smoother experience."}]}`
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 1.0,
        max_tokens: 1200,
        response_format: { type: "json_object" }
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


function displayResults(rewrites) {
  resultsList.innerHTML = ""

  // Hide tone section when showing results
  toneSection.classList.add("hidden")
  toneSection.style.display = "none"
  
  rewrites.forEach((rewrite, index) => {
    const item = document.createElement("div")
    item.className = "result-item"

    // Convert \n to <br> for proper line breaks
    const formattedText = escapeHtml(rewrite.text).replace(/\n/g, '<br>')

    item.innerHTML = `
      <div class="result-text">${formattedText}</div>
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

  // Show results section and enable scrolling
  resultsSection.classList.remove("hidden")
  resultsSection.style.display = "block"
  document.querySelector(".content").classList.add("has-results")

  // Reset tab states
  const rephraseAction = document.getElementById("rephraseAction")
  const adjustToneAction = document.getElementById("adjustToneAction")
  rephraseAction.classList.add("active")
  adjustToneAction.classList.remove("active")
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
    polishBtn.disabled = true
  } else {
    loadingDiv.classList.add("hidden")
    polishBtn.disabled = false
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


async function getApiKey() {
  try {
    const { OPENAI_API_KEY } = await chrome.storage.sync.get(["OPENAI_API_KEY"])
    return OPENAI_API_KEY || ""
  } catch (e) {
    return ""
  }
}


async function generateViaBackend(text, tone, forceNew = false, timestamp = null) {
  if (!CONFIG || !CONFIG.BACKEND_URL) {
    throw new Error("Backend URL not configured")
  }

  const url = CONFIG.BACKEND_URL
  try {
    const uniqueId = Math.random().toString(36).substring(7) + Date.now().toString(36);
    
    // Create a unique cache-busting URL for each request
    const params = new URLSearchParams({
      _: uniqueId,
      t: timestamp || Date.now(),
      r: Math.random()
    });

    const res = await fetch(`${url}?${params}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      },
      body: JSON.stringify({ 
        text,
        tone,
        uniqueId,
        timestamp: Date.now(),
        temperature: 0.9,
        forceNew: true
      })
    });

    if (!res.ok) {
      throw new Error(`Backend error: ${res.status}`)
    }

    const data = await res.json()
    console.log("Backend returned data:", data)
    
    if (!Array.isArray(data.rewrites)) {
      throw new Error("Invalid response format from backend")
    }

    return data.rewrites
  } catch (err) {
    console.error("Backend fetch error:", err)
    throw new Error("Failed to connect to the backend. Please try again.")
  }
}

async function generateRephrases(text, tone) {
  if (!CONFIG || !CONFIG.BACKEND_URL) {
    throw new Error("Backend URL not configured")
  }

  const url = CONFIG.BACKEND_URL
  try {
    // Make 3 separate requests with different seeds for truly unique results
    const promises = Array.from({ length: 3 }, (_, i) => {
      const uniqueId = Math.random().toString(36).substring(7) + Date.now().toString(36) + i;
      const params = new URLSearchParams({
        _: uniqueId,
        t: Date.now() + i * 100,
        r: Math.random()
      });

      return fetch(`${url}?${params}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        },
        body: JSON.stringify({ 
          text,
          tone,
          uniqueId,
          timestamp: Date.now() + i,
          temperature: 0.9,
          seed: Math.random() * 1000000,
          forceNew: true
        })
      });
    });

    const responses = await Promise.all(promises);
    const results = [];

    for (const res of responses) {
      if (res.ok) {
        const data = await res.json();
        if (data.rewrites && data.rewrites.length > 0) {
          // Take first rewrite from each response
          results.push(data.rewrites[0]);
        }
      }
    }

    if (results.length === 0) {
      throw new Error("No results generated");
    }

    return results;
  } catch (err) {
    console.error("Backend fetch error:", err);
    throw new Error("Failed to connect to the backend. Please try again.");
  }
}

