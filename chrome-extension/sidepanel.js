/**
 * Side Panel Script — Darija Translator Chrome Extension
 *
 * Features:
 *  - Translate text via the Jakarta REST API (Basic Auth)
 *  - Auto-detect selected text injected by the background service worker
 *  - Voice input (Web Speech API — SpeechRecognition)
 *  - Text-to-Speech read-aloud (Web Speech API — SpeechSynthesis)
 *  - Translation history (chrome.storage.local)
 *  - Persistent settings (API URL, credentials, source language)
 */

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_API_URL = "http://localhost:8080/api/translate";
const MAX_HISTORY = 20;

// ── DOM Refs ──────────────────────────────────────────────────────────────────

const sourceTextEl    = document.getElementById("sourceText");
const outputEl        = document.getElementById("translationOutput");
const translateBtn    = document.getElementById("translateBtn");
const voiceInputBtn   = document.getElementById("voiceInputBtn");
const clearBtn        = document.getElementById("clearBtn");
const copyBtn         = document.getElementById("copyBtn");
const speakBtn        = document.getElementById("speakBtn");
const statusBar       = document.getElementById("statusBar");
const statusIcon      = document.getElementById("statusIcon");
const statusMessage   = document.getElementById("statusMessage");
const voiceStatus     = document.getElementById("voiceStatus");
const metaBar         = document.getElementById("metaBar");
const metaModel       = document.getElementById("metaModel");
const metaTime        = document.getElementById("metaTime");
const charCount       = document.getElementById("charCount");
const historyList     = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const settingsBtn     = document.getElementById("settingsBtn");
const settingsPanel   = document.getElementById("settingsPanel");
const saveSettings    = document.getElementById("saveSettings");
const settingsSaved   = document.getElementById("settingsSaved");
const sourceLangBadge = document.getElementById("sourceLangBadge");

const apiUrlInput     = document.getElementById("apiUrl");
const usernameInput   = document.getElementById("username");
const passwordInput   = document.getElementById("password");
const sourceLangSel   = document.getElementById("sourceLanguage");

// ── State ─────────────────────────────────────────────────────────────────────

let currentTranslation = "";
let isListening = false;
let recognition = null;

// ── Initialise ────────────────────────────────────────────────────────────────

async function init() {
  await loadSettings();
  await renderHistory();
  await checkPendingTranslation();
  setupEventListeners();
}

// ── Settings ──────────────────────────────────────────────────────────────────

async function loadSettings() {
  const data = await chrome.storage.sync.get({
    apiUrl: DEFAULT_API_URL,
    username: "user",
    password: "user123",
    sourceLanguage: "English"
  });
  apiUrlInput.value      = data.apiUrl;
  usernameInput.value    = data.username;
  passwordInput.value    = data.password;
  sourceLangSel.value    = data.sourceLanguage;
  sourceLangBadge.textContent = data.sourceLanguage;
}

async function persistSettings() {
  await chrome.storage.sync.set({
    apiUrl:         apiUrlInput.value.trim() || DEFAULT_API_URL,
    username:       usernameInput.value.trim(),
    password:       passwordInput.value,
    sourceLanguage: sourceLangSel.value
  });
  sourceLangBadge.textContent = sourceLangSel.value;
  settingsSaved.classList.remove("hidden");
  setTimeout(() => settingsSaved.classList.add("hidden"), 2000);
}

function getSettings() {
  return {
    apiUrl:         apiUrlInput.value.trim() || DEFAULT_API_URL,
    username:       usernameInput.value.trim() || "user",
    password:       passwordInput.value || "user123",
    sourceLanguage: sourceLangSel.value || "English"
  };
}

// ── Pending Translation (from context menu) ───────────────────────────────────

async function checkPendingTranslation() {
  const data = await chrome.storage.session.get("pendingTranslation");
  if (data.pendingTranslation) {
    sourceTextEl.value = data.pendingTranslation.text;
    updateCharCount();
    await chrome.storage.session.remove("pendingTranslation");
    await performTranslation();
  }
}

// ── Translation ───────────────────────────────────────────────────────────────

async function performTranslation() {
  const text = sourceTextEl.value.trim();
  if (!text) {
    showStatus("error", "⚠️", "Please enter text to translate.");
    return;
  }
  if (text.length > 5000) {
    showStatus("error", "⚠️", "Text exceeds the 5000 character limit.");
    return;
  }

  const { apiUrl, username, password, sourceLanguage } = getSettings();
  const credentials = btoa(`${username}:${password}`);

  translateBtn.disabled = true;
  showStatus("loading", "⏳", "Translating with Gemini LLM…");
  outputEl.innerHTML = '<span class="placeholder">Translating…</span>';
  metaBar.classList.add("hidden");

  try {
    const startTime = Date.now();

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${credentials}`
      },
      body: JSON.stringify({
        text,
        sourceLanguage,
        context: null
      })
    });

    if (response.status === 401) {
      showStatus("error", "🔐", "Authentication failed. Check credentials in Settings.");
      outputEl.innerHTML = '<span class="placeholder">Translation failed.</span>';
      return;
    }

    const data = await response.json();
    const elapsed = Date.now() - startTime;

    if (!response.ok || data.status === "error") {
      showStatus("error", "❌", `Error: ${data.errorMessage || "Unknown error"}`);
      outputEl.innerHTML = '<span class="placeholder">Translation failed.</span>';
      return;
    }

    currentTranslation = data.translatedText;
    outputEl.textContent = data.translatedText;
    showStatus("success", "✅", "Translation complete!");
    setTimeout(() => statusBar.classList.add("hidden"), 2000);

    metaModel.textContent = `Model: ${data.model || "gemini"}`;
    metaTime.textContent = `${elapsed}ms`;
    metaBar.classList.remove("hidden");

    await saveToHistory({
      original:    text,
      translated:  data.translatedText,
      sourceLanguage,
      model:       data.model,
      timestamp:   data.timestamp
    });
    await renderHistory();

  } catch (err) {
    console.error("[Darija Translator] fetch error:", err);
    showStatus("error", "🔌", `Connection error: ${err.message}. Is the server running?`);
    outputEl.innerHTML = '<span class="placeholder">Could not reach the translation server.</span>';
  } finally {
    translateBtn.disabled = false;
  }
}

// ── History ───────────────────────────────────────────────────────────────────

async function saveToHistory(entry) {
  const { history = [] } = await chrome.storage.local.get("history");
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  await chrome.storage.local.set({ history });
}

async function renderHistory() {
  const { history = [] } = await chrome.storage.local.get("history");
  if (!history.length) {
    historyList.innerHTML = '<p class="empty-state">No translations yet.</p>';
    return;
  }
  historyList.innerHTML = history.map((entry, i) => `
    <div class="history-item" data-index="${i}" title="Click to restore">
      <div class="history-original">${escapeHtml(entry.original)}</div>
      <div class="history-translated">${escapeHtml(entry.translated)}</div>
    </div>
  `).join("");

  historyList.querySelectorAll(".history-item").forEach(item => {
    item.addEventListener("click", async () => {
      const idx = parseInt(item.dataset.index, 10);
      const { history: h = [] } = await chrome.storage.local.get("history");
      if (h[idx]) {
        sourceTextEl.value = h[idx].original;
        outputEl.textContent = h[idx].translated;
        currentTranslation = h[idx].translated;
        updateCharCount();
      }
    });
  });
}

// ── Voice Input (SpeechRecognition) ──────────────────────────────────────────

function startVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showStatus("error", "🎤", "Speech recognition not supported in this browser.");
    return;
  }

  if (isListening) {
    recognition?.stop();
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = getRecognitionLang(sourceLangSel.value);

  isListening = true;
  voiceInputBtn.textContent = "⏹️";
  voiceStatus.classList.remove("hidden");

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(r => r[0].transcript)
      .join("");
    sourceTextEl.value = transcript;
    updateCharCount();
  };

  recognition.onend = () => {
    isListening = false;
    voiceInputBtn.textContent = "🎤";
    voiceStatus.classList.add("hidden");
    if (sourceTextEl.value.trim()) {
      performTranslation();
    }
  };

  recognition.onerror = (e) => {
    console.error("[Darija Translator] SpeechRecognition error:", e.error);
    showStatus("error", "🎤", `Voice error: ${e.error}`);
    isListening = false;
    voiceInputBtn.textContent = "🎤";
    voiceStatus.classList.add("hidden");
  };

  recognition.start();
}

function getRecognitionLang(language) {
  const map = {
    "English": "en-US", "French": "fr-FR", "Spanish": "es-ES",
    "German": "de-DE", "Italian": "it-IT", "Arabic (Modern Standard)": "ar-SA"
  };
  return map[language] || "en-US";
}

// ── Text-to-Speech (Read Aloud) ───────────────────────────────────────────────

function readAloud() {
  if (!currentTranslation) {
    showStatus("error", "🔊", "No translation to read.");
    return;
  }
  if (!window.speechSynthesis) {
    showStatus("error", "🔊", "Text-to-speech not supported.");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(currentTranslation);
  utterance.lang = "ar-MA";
  utterance.rate = 0.9;
  utterance.pitch = 1;

  // Try to find an Arabic voice
  const voices = window.speechSynthesis.getVoices();
  const arabicVoice = voices.find(v => v.lang.startsWith("ar"));
  if (arabicVoice) utterance.voice = arabicVoice;

  speakBtn.textContent = "⏹️";
  utterance.onend = () => { speakBtn.textContent = "🔊"; };
  utterance.onerror = () => { speakBtn.textContent = "🔊"; };

  window.speechSynthesis.speak(utterance);
}

// ── UI Helpers ────────────────────────────────────────────────────────────────

function showStatus(type, icon, message) {
  statusBar.className = `status-bar ${type}`;
  statusIcon.textContent = icon;
  statusMessage.textContent = message;
  statusBar.classList.remove("hidden");
}

function updateCharCount() {
  charCount.textContent = sourceTextEl.value.length;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ── Event Listeners ───────────────────────────────────────────────────────────

function setupEventListeners() {
  translateBtn.addEventListener("click", performTranslation);

  sourceTextEl.addEventListener("input", updateCharCount);
  sourceTextEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) performTranslation();
  });

  clearBtn.addEventListener("click", () => {
    sourceTextEl.value = "";
    outputEl.innerHTML = '<span class="placeholder">Translation will appear here…</span>';
    currentTranslation = "";
    statusBar.classList.add("hidden");
    metaBar.classList.add("hidden");
    updateCharCount();
  });

  copyBtn.addEventListener("click", async () => {
    if (!currentTranslation) return;
    await navigator.clipboard.writeText(currentTranslation);
    copyBtn.textContent = "✅";
    setTimeout(() => { copyBtn.textContent = "📋"; }, 1500);
  });

  speakBtn.addEventListener("click", readAloud);
  voiceInputBtn.addEventListener("click", startVoiceInput);

  settingsBtn.addEventListener("click", () => {
    settingsPanel.classList.toggle("hidden");
  });
  saveSettings.addEventListener("click", persistSettings);

  sourceLangSel.addEventListener("change", () => {
    sourceLangBadge.textContent = sourceLangSel.value;
  });

  clearHistoryBtn.addEventListener("click", async () => {
    await chrome.storage.local.set({ history: [] });
    await renderHistory();
  });

  // Listen for messages from the background service worker
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "TRANSLATE_SELECTION" && message.text) {
      sourceTextEl.value = message.text;
      updateCharCount();
      performTranslation();
    }
  });
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

init().catch(console.error);
