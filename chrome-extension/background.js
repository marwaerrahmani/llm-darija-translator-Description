/**
 * Service Worker — Darija Translator Chrome Extension
 * Manifest V3 background script.
 *
 * Responsibilities:
 * - Register context (right-click) menu entries
 * - Open the Side Panel when the extension icon or context menu is clicked
 * - Relay selected text to the side panel via chrome.runtime messaging
 */

// ── Context Menu Registration ─────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  // Main context menu entry for selected text
  chrome.contextMenus.create({
    id: "translate-selection",
    title: "🌍 Translate to Darija",
    contexts: ["selection"]
  });

  // Context menu entry on the extension action button
  chrome.contextMenus.create({
    id: "open-translator",
    title: "Open Darija Translator",
    contexts: ["action"]
  });

  console.log("[Darija Translator] Extension installed. Context menus registered.");
});

// ── Side Panel Configuration ──────────────────────────────────────────────────

// Allow any tab to open the side panel
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.error("[Darija Translator] setPanelBehavior error:", err));

// ── Context Menu Click Handler ────────────────────────────────────────────────

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "translate-selection" && info.selectionText) {
    // 1. Open the side panel for the current tab
    await chrome.sidePanel.open({ tabId: tab.id });

    // 2. Store the selected text so the side panel can read it on load
    await chrome.storage.session.set({
      pendingTranslation: {
        text: info.selectionText,
        source: tab.url,
        timestamp: Date.now()
      }
    });

    // 3. Notify the side panel if it is already open and listening
    chrome.runtime.sendMessage({
      type: "TRANSLATE_SELECTION",
      text: info.selectionText
    }).catch(() => {
      // Side panel not yet mounted; it will read from session storage on load
    });
  }

  if (info.menuItemId === "open-translator") {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

// ── Extension Action (toolbar icon) click ────────────────────────────────────

chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ tabId: tab.id });
});
