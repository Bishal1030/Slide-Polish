(function injectSlidePolishButton() {
  const BUTTON_ID = "slide-polish-fab";
  const STYLE_ID = "slide-polish-fab-style";

  function createStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${BUTTON_ID} {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 2147483647;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        border: none;
        border-radius: 999px;
        padding: 10px 14px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.4px;
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.35);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      #${BUTTON_ID}:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(102,126,234,0.45); }
      #${BUTTON_ID}:active { transform: translateY(0); }
      #${BUTTON_ID} .sp-dot {
        width: 8px; height: 8px; border-radius: 50%; background: #fff; opacity: 0.9;
      }
      @media (max-width: 900px) {
        #${BUTTON_ID} { right: 12px; bottom: 12px; padding: 9px 12px; font-size: 11px; }
      }
    `;
    document.documentElement.appendChild(style);
  }

  function ensureButton() {
    if (document.getElementById(BUTTON_ID)) return;
    const btn = document.createElement("button");
    btn.id = BUTTON_ID;
    btn.type = "button";
    btn.title = "Rewrite with Slide Polish";
    btn.innerHTML = `<span class="sp-dot"></span> Rewrite with Slide Polish`;
    btn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "openPopup" });
    }, { once: false });

    document.documentElement.appendChild(btn);
  }

  function init() {
    createStyle();
    ensureButton();
  }

  // Slides is a SPA; observe DOM changes and re-ensure button
  const observer = new MutationObserver(() => {
    init();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Initial run
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();


