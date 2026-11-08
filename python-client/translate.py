#!/usr/bin/env python3
"""
Python client for the LLM-Powered Darija Translator REST API.

Usage:
    python translate.py                        # Interactive CLI mode
    python translate.py "Hello, how are you?"  # Direct translation
    python translate.py --gui                  # Launch Tkinter GUI

Requires: requests (pip install requests)
Optional: tkinter (usually bundled with Python)
"""

import sys
import json
import base64
import argparse
from typing import Optional

try:
    import requests
except ImportError:
    print("Error: 'requests' library not found. Install with: pip install requests", file=sys.stderr)
    sys.exit(1)


# ── Configuration ─────────────────────────────────────────────────────────────

DEFAULT_API_URL   = "http://localhost:8080/api/translate"
DEFAULT_USERNAME  = "user"
DEFAULT_PASSWORD  = "user123"
DEFAULT_LANG      = "English"


# ── API Client Class ──────────────────────────────────────────────────────────

class DarijaTranslatorClient:
    """
    HTTP client for the Darija Translator REST API.

    Uses HTTP Basic Authentication as required by the Jakarta Security
    configuration on the server.
    """

    def __init__(
        self,
        api_url: str = DEFAULT_API_URL,
        username: str = DEFAULT_USERNAME,
        password: str = DEFAULT_PASSWORD,
        timeout: int = 30,
    ):
        self.api_url  = api_url.rstrip("/")
        self.username = username
        self.password = password
        self.timeout  = timeout
        self.session  = requests.Session()
        self.session.auth = (username, password)
        self.session.headers.update({
            "Content-Type": "application/json",
            "Accept":       "application/json",
            "User-Agent":   "DarijaTranslator-PythonClient/1.0",
        })

    def translate(
        self,
        text: str,
        source_language: str = DEFAULT_LANG,
        context: Optional[str] = None,
    ) -> dict:
        """
        Translate text to Moroccan Arabic Dialect (Darija).

        Args:
            text:            The text to translate (max 5000 chars).
            source_language: Source language (default: English).
            context:         Optional translation context hint.

        Returns:
            dict with keys: status, originalText, translatedText, model,
                            sourceLanguage, targetLanguage, timestamp, errorMessage
        """
        if not text or not text.strip():
            raise ValueError("Text to translate must not be empty.")
        if len(text) > 5000:
            raise ValueError("Text exceeds the 5000 character limit.")

        payload = {
            "text":           text.strip(),
            "sourceLanguage": source_language,
            "context":        context,
        }

        try:
            response = self.session.post(
                self.api_url,
                json=payload,
                timeout=self.timeout,
            )
        except requests.exceptions.ConnectionError as e:
            raise ConnectionError(
                f"Could not connect to {self.api_url}. Is the server running?\n{e}"
            ) from e
        except requests.exceptions.Timeout:
            raise TimeoutError(f"Request timed out after {self.timeout}s.")

        if response.status_code == 401:
            raise PermissionError(
                "Authentication failed. Check your username and password."
            )

        try:
            data = response.json()
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON response: {e}") from e

        if not response.ok or data.get("status") == "error":
            raise RuntimeError(
                data.get("errorMessage", f"Server error (HTTP {response.status_code})")
            )

        return data

    def health_check(self) -> dict:
        """Check the service health (no auth required)."""
        resp = self.session.get(f"{self.api_url}/health", timeout=10)
        return resp.json()

    def list_languages(self) -> dict:
        """List supported source languages."""
        resp = self.session.get(f"{self.api_url}/languages", timeout=10)
        return resp.json()


# ── CLI Mode ──────────────────────────────────────────────────────────────────

def run_cli(args):
    """Interactive command-line interface."""
    client = DarijaTranslatorClient(
        api_url  = args.url,
        username = args.username,
        password = args.password,
    )

    # Quick health check
    try:
        health = client.health_check()
        print(f"✅ Service status: {health.get('status', 'unknown')}")
    except Exception as e:
        print(f"⚠️  Health check failed: {e}", file=sys.stderr)

    if args.text:
        # Single-shot translation from CLI argument
        _do_translation(client, args.text, args.lang)
        return

    # Interactive REPL
    print(f"\n{'─' * 50}")
    print("  Darija Translator — Python Client")
    print("  Target: Moroccan Arabic Dialect (Darija) 🇲🇦")
    print(f"{'─' * 50}")
    print(f"  API: {args.url}")
    print(f"  Language: {args.lang} → Darija")
    print("  Type 'quit' or Ctrl+C to exit, 'lang' to change language")
    print(f"{'─' * 50}\n")

    source_lang = args.lang
    while True:
        try:
            text = input(f"[{source_lang}] Enter text: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nGoodbye! / بسلامة")
            break

        if not text:
            continue
        if text.lower() in ("quit", "exit", "q"):
            print("Goodbye! / بسلامة")
            break
        if text.lower() == "lang":
            source_lang = input("Source language: ").strip() or source_lang
            continue

        _do_translation(client, text, source_lang)


def _do_translation(client: DarijaTranslatorClient, text: str, lang: str):
    """Perform and display a single translation."""
    print(f"\n⏳ Translating…", end="", flush=True)
    try:
        result = client.translate(text, source_language=lang)
        print(f"\r✅ Done!          ")
        print(f"\n  Original    [{lang}]: {result['originalText']}")
        print(f"  Translation [Darija]: {result['translatedText']}")
        print(f"  Model: {result.get('model', 'unknown')}\n")
    except Exception as e:
        print(f"\r❌ Error: {e}\n", file=sys.stderr)


# ── Tkinter GUI Mode ──────────────────────────────────────────────────────────

def run_gui(args):
    """Launch a Tkinter GUI for the translator."""
    try:
        import tkinter as tk
        from tkinter import ttk, messagebox
    except ImportError:
        print("Tkinter not available. Run without --gui for CLI mode.", file=sys.stderr)
        sys.exit(1)

    client = DarijaTranslatorClient(
        api_url  = args.url,
        username = args.username,
        password = args.password,
    )

    root = tk.Tk()
    root.title("Darija Translator")
    root.geometry("600x560")
    root.configure(bg="#f0f4f8")
    root.resizable(True, True)

    # ── Styles ─────────────────────────────────────────────────────────────────
    style = ttk.Style()
    style.theme_use("clam")
    style.configure("TButton",   font=("Segoe UI", 11, "bold"), padding=8)
    style.configure("TLabel",    font=("Segoe UI", 10), background="#f0f4f8")
    style.configure("TEntry",    font=("Segoe UI", 10))
    style.configure("TCombobox", font=("Segoe UI", 10))

    # ── Header ─────────────────────────────────────────────────────────────────
    hdr = tk.Frame(root, bg="#1a7f4b", padx=16, pady=12)
    hdr.pack(fill="x")
    tk.Label(hdr, text="🌍  Darija Translator", font=("Segoe UI", 16, "bold"),
             bg="#1a7f4b", fg="#fff").pack(anchor="w")
    tk.Label(hdr, text="Python Client — Powered by Google Gemini LLM",
             font=("Segoe UI", 10), bg="#1a7f4b", fg="#c8f5d8").pack(anchor="w")

    # ── Main Frame ─────────────────────────────────────────────────────────────
    frm = tk.Frame(root, bg="#f0f4f8", padx=20, pady=16)
    frm.pack(fill="both", expand=True)

    # Source language
    lang_frm = tk.Frame(frm, bg="#f0f4f8")
    lang_frm.pack(fill="x", pady=(0, 8))
    ttk.Label(lang_frm, text="Source Language:").pack(side="left")
    lang_var = tk.StringVar(value="English")
    lang_cb = ttk.Combobox(lang_frm, textvariable=lang_var, width=20, state="readonly",
                            values=["English", "French", "Spanish", "Arabic (Modern Standard)",
                                    "German", "Italian", "Portuguese"])
    lang_cb.pack(side="left", padx=(8, 0))

    # Source textarea
    ttk.Label(frm, text="Text to translate:").pack(anchor="w")
    src_text = tk.Text(frm, height=6, font=("Segoe UI", 11), wrap="word",
                       relief="solid", borderwidth=1)
    src_text.pack(fill="x", pady=(4, 10))

    # Translate button
    def on_translate():
        text = src_text.get("1.0", "end").strip()
        if not text:
            messagebox.showwarning("Input required", "Please enter text to translate.")
            return
        translate_btn.config(state="disabled", text="⏳ Translating…")
        result_text.config(state="normal")
        result_text.delete("1.0", "end")
        result_text.insert("end", "Translating…")
        result_text.config(state="disabled")
        root.update()

        def do_work():
            try:
                result = client.translate(text, source_language=lang_var.get())
                translated = result["translatedText"]
                model = result.get("model", "unknown")
                root.after(0, lambda: update_result(translated, model, None))
            except Exception as e:
                root.after(0, lambda: update_result(None, None, str(e)))

        def update_result(translated, model, error):
            result_text.config(state="normal")
            result_text.delete("1.0", "end")
            if error:
                result_text.insert("end", f"❌ {error}")
                result_text.tag_add("error", "1.0", "end")
                result_text.tag_config("error", foreground="#c0392b")
                status_var.set(f"Error: {error}")
            else:
                result_text.insert("end", translated)
                status_var.set(f"✅ Done  |  Model: {model}")
            result_text.config(state="disabled")
            translate_btn.config(state="normal", text="Translate →")

        import threading
        threading.Thread(target=do_work, daemon=True).start()

    translate_btn = ttk.Button(frm, text="Translate →", command=on_translate)
    translate_btn.pack(fill="x")

    # Result box
    ttk.Label(frm, text="Translation (Moroccan Arabic / Darija):").pack(anchor="w", pady=(12, 0))
    result_text = tk.Text(frm, height=6, font=("Arial", 14), wrap="word",
                          relief="solid", borderwidth=1, state="disabled")
    result_text.pack(fill="x", pady=(4, 8))
    # Arabic text is RTL — Tkinter doesn't natively support RTL, so we just display it LTR

    # Status bar
    status_var = tk.StringVar(value="Ready")
    status_lbl = tk.Label(frm, textvariable=status_var, font=("Segoe UI", 9),
                          fg="#555", bg="#f0f4f8", anchor="w")
    status_lbl.pack(fill="x")

    root.mainloop()


# ── Entry Point ───────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Python client for the Darija Translator REST API"
    )
    parser.add_argument("text",        nargs="?", help="Text to translate (omit for interactive mode)")
    parser.add_argument("--url",       default=DEFAULT_API_URL,  help="API URL")
    parser.add_argument("--username",  default=DEFAULT_USERNAME,  help="API username")
    parser.add_argument("--password",  default=DEFAULT_PASSWORD,  help="API password")
    parser.add_argument("--lang",      default=DEFAULT_LANG,      help="Source language")
    parser.add_argument("--gui",       action="store_true",        help="Launch GUI (requires tkinter)")
    args = parser.parse_args()

    if args.gui:
        run_gui(args)
    else:
        run_cli(args)


if __name__ == "__main__":
    main()
