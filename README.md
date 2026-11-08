# 🌍 LLM-Powered Darija Translator — RESTful Web Service

> **Mini Project 2 — LLM-powered RESTful Web Service**  
> Pr. El Habib Nfaoui

[![Java](https://img.shields.io/badge/Java-21-orange)](https://www.oracle.com/java/)
[![Quarkus](https://img.shields.io/badge/Quarkus-3.8.3-blue)](https://quarkus.io/)
[![Jakarta EE](https://img.shields.io/badge/Jakarta_EE-10-green)](https://jakarta.ee/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-LLM-purple)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A complete **LLM-powered RESTful Web Service** that translates text from any language into **Moroccan Arabic Dialect (Darija)** using **Google Gemini**. Built with **Jakarta RESTful Web Services (JAX-RS)**, secured with **Jakarta Authentication (Basic Auth)**, and packaged as a **Quarkus embedded container**.

---

## 📋 Table of Contents

- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [REST Service](#-rest-service)
- [Security](#-security--jakarta-authentication)
- [API Reference](#-api-reference)
- [Chrome Extension](#-chrome-extension)
- [PHP Client](#-php-client)
- [Python Client](#-python-client)
- [React Native App](#-react-native-mobile-app)
- [UML Diagrams](#-uml-diagrams)
- [Testing](#-testing)

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│   Chrome Extension │ PHP Client │ Python Client │ React Native  │
└──────────┬─────────┴──────┬─────┴───────┬───────┴──────┬────────┘
           │                │             │              │
           └───────── HTTP Basic Auth (Jakarta Security) ┘
                                   │
                                   ▼
              ┌────────────────────────────────────────┐
              │   Quarkus Embedded Container :8080     │
              │                                        │
              │  TranslatorApplication  (@ApplicationPath=/api)  │
              │  TranslatorResource     (@Path=/translate)       │
              │  TranslationService     (@ApplicationScoped)     │
              │                                        │
              └───────────────────┬────────────────────┘
                                  │ HTTPS
                                  ▼
                    ┌──────────────────────────┐
                    │  Google Gemini LLM API   │
                    │  (gemini-3.1-flash-lite) │
                    └──────────────────────────┘
```

---

## 📁 Project Structure

```
llm-darija-translator/
├── 📂 translator-service/          Java REST Service (Maven/Quarkus)
│   ├── pom.xml
│   └── src/main/java/ma/nfaoui/translator/
│       ├── TranslatorApplication.java      ← @ApplicationPath("/api")
│       ├── resource/
│       │   └── TranslatorResource.java     ← @Path("/translate") + translate()
│       ├── service/
│       │   ├── TranslationService.java     ← Gemini LLM business logic
│       │   └── GeminiApiClient.java        ← MicroProfile REST Client
│       ├── model/
│       │   ├── TranslationRequest.java
│       │   ├── TranslationResponse.java
│       │   ├── GeminiRequest.java
│       │   └── GeminiResponse.java
│       └── filter/
│           ├── CorsFilter.java             ← CORS for browser clients
│           └── RequestLoggingFilter.java   ← Audit logging
├── 📂 chrome-extension/            Chrome Extension (Manifest V3)
│   ├── manifest.json               ← sidePanel + contextMenus permissions
│   ├── background.js               ← Service Worker
│   ├── sidepanel.html/css/js       ← UI with TTS + Voice Input
│   └── icons/
├── 📂 php-client/                  PHP Client (Web + CLI)
│   └── translate.php
├── 📂 python-client/               Python Client (CLI + Tkinter GUI)
│   ├── translate.py
│   └── requirements.txt
├── 📂 react-native-app/            React Native Mobile App (Expo)
│   ├── App.tsx
│   └── src/screens/
│       ├── TranslateScreen.tsx
│       ├── HistoryScreen.tsx
│       └── SettingsScreen.tsx
└── 📂 docs/
    ├── diagrams/
    │   ├── class-diagram.puml      ← Class Diagram (required)
    │   ├── deployment-diagram.puml ← Deployment Diagram (required)
    │   └── sequence-diagram.puml  ← Sequence Diagram (bonus)
    └── postman/
        └── DarijaTranslator.postman_collection.json
```

---

## ⚡ Quick Start

### Prerequisites
- Java 21+
- Maven 3.9+

### Run the REST Service

```bash
cd translator-service
mvn quarkus:dev
```

The service starts immediately on **http://localhost:8080**.

| URL | Description |
|-----|-------------|
| http://localhost:8080/swagger-ui | Interactive API docs (Swagger UI) |
| http://localhost:8080/api/translate/health | Health check (no auth) |
| http://localhost:8080/api/translate | Translation endpoint |

### Quick Test

```bash
# Health check (no auth required)
curl http://localhost:8080/api/translate/health

# Translate English → Darija
curl -u user:user123 \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello, how are you?","sourceLanguage":"English"}' \
  http://localhost:8080/api/translate
```

**Response:**
```json
{
  "status": "success",
  "originalText": "Hello, how are you?",
  "translatedText": "سلام، كيداير؟",
  "sourceLanguage": "English",
  "targetLanguage": "Moroccan Arabic (Darija)",
  "model": "gemini-3.1-flash-lite"
}
```

---

## ☕ REST Service

### Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | **Quarkus 3.8.3** (embedded container) |
| REST API | **Jakarta RESTful Web Services** (JAX-RS / RESTEasy) |
| Security | **Jakarta Authentication** — HTTP Basic Auth |
| LLM | **Google Gemini 3.1 Flash Lite** |
| JSON | Jackson (via RESTEasy Reactive) |
| Validation | Jakarta Bean Validation (Hibernate Validator) |
| API Docs | SmallRye OpenAPI + Swagger UI |
| Build | Maven 3.9 |
| Java | Java 21 |

### `TranslatorResource` — The Main Endpoint

```java
@Path("/translate")
@RequestScoped
public class TranslatorResource {

    @POST
    @RolesAllowed({"user", "admin"})
    public Response translate(@Valid TranslationRequest request, @Context SecurityContext sec) {
        TranslationResponse result = translationService.translate(request);
        return Response.ok(result).build();
    }
}
```

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/translate` | ✅ Required | Translate JSON body |
| `GET` | `/api/translate?text=...&lang=...` | ✅ Required | Translate query params |
| `GET` | `/api/translate/health` | ❌ Public | Health check |
| `GET` | `/api/translate/languages` | ✅ Required | Supported languages |

---

## 🔐 Security — Jakarta Authentication

The service uses **HTTP Basic Authentication** via the Jakarta Authentication Specification (`quarkus-elytron-security-properties-file`).

**Configuration (`application.properties`):**
```properties
quarkus.http.auth.basic=true
quarkus.security.users.file.enabled=true
quarkus.security.users.file.users=users.properties
quarkus.security.users.file.roles=roles.properties
```

**Default Credentials:**

| Username | Password | Role |
|----------|----------|------|
| `user` | `user123` | user |
| `admin` | `admin123` | admin, user |

**All translation endpoints require `@RolesAllowed({"user", "admin"})`.**

---

## 📡 API Reference

### POST `/api/translate`

**Request:**
```json
{
  "text": "Good morning, have a nice day!",
  "sourceLanguage": "English",
  "context": "casual greeting"
}
```

**Response `200 OK`:**
```json
{
  "status": "success",
  "originalText": "Good morning, have a nice day!",
  "translatedText": "صباح الخير، نهارك مبروك!",
  "sourceLanguage": "English",
  "targetLanguage": "Moroccan Arabic (Darija)",
  "model": "gemini-3.1-flash-lite",
  "timestamp": 1731021600000
}
```

**Response `401 Unauthorized`:** No or wrong credentials  
**Response `400 Bad Request`:** Empty or too-long text

### Supported Source Languages
English, French, Spanish, Arabic (MSA), German, Italian, Portuguese, Dutch, Russian, Chinese, Japanese, Korean, Turkish

---

## 🔌 Chrome Extension

**Manifest V3** extension using `chrome.sidePanel` API.

### Features
- **Right-click context menu** → "Translate to Darija" on any selected text
- **Auto-paste** selected text into the side panel
- **Voice Input** — Web Speech API (`SpeechRecognition`)
- **Read Aloud** — `SpeechSynthesis` reads Arabic translation aloud (`lang: ar-MA`)
- **Copy to clipboard** — one-click copy
- **Translation history** — stored in `chrome.storage.local`
- **Persistent settings** — API URL and credentials in `chrome.storage.sync`

### Installation
1. Open Chrome → `chrome://extensions`
2. Enable **Developer Mode** (top right toggle)
3. Click **Load Unpacked** → select the `chrome-extension/` folder
4. Right-click any text on any webpage → "Translate to Darija"

---

## 🐘 PHP Client

**Web form + CLI mode** using cURL for Basic Auth.

### Web Mode
```bash
cd php-client
php -S localhost:8000
# Open http://localhost:8000/translate.php in your browser
```

### CLI Mode
```bash
php translate.php "Hello, how are you?" English user user123
```

---

## 🐍 Python Client

**Interactive CLI + Tkinter GUI** using the `requests` library.

```bash
cd python-client
pip install -r requirements.txt

# Interactive REPL
python3 translate.py

# Single translation
python3 translate.py "Good morning"

# GUI mode
python3 translate.py --gui

# Custom server
python3 translate.py "Hello" --url http://your-server:8080/api/translate
```

---

## 📱 React Native Mobile App

**Expo** app with **React Navigation** (bottom tabs).

| Screen | Description |
|--------|-------------|
| **Translate** | Input text, select language, view Arabic RTL output, TTS |
| **History** | Past translations stored in AsyncStorage |
| **Settings** | Configure API URL, credentials, test connection |

### Run
```bash
cd react-native-app
npm install
npx expo start
```
Scan the QR code with the **Expo Go** app on your phone.

---

## 📐 UML Diagrams

Located in `docs/diagrams/`. Open with [PlantUML Online](https://www.plantuml.com/plantuml/uml) or the VS Code PlantUML extension.

| File | Type | Description |
|------|------|-------------|
| `class-diagram.puml` | Class Diagram | All packages, classes, relationships |
| `deployment-diagram.puml` | Deployment Diagram | Server, Cloud LLM, all client nodes |
| `sequence-diagram.puml` | Sequence Diagram | Full request flow: Chrome → REST → Gemini |

---

## 🧪 Testing

### Run All Tests
```bash
cd translator-service
mvn test
```

**Result: 7 tests, 0 failures ✅**

Tests cover:
- Health check (unauthenticated)
- 401 without credentials
- 401 with wrong credentials
- 400 for missing text parameter
- 200 for valid authenticated requests
- Role-based access (user + admin roles)

### Test with Postman
Import `docs/postman/DarijaTranslator.postman_collection.json` — includes 8 pre-configured requests.

---

## 📦 Build for Production

```bash
cd translator-service
mvn package -DskipTests
java -jar target/quarkus-app/quarkus-run.jar
```

---

*Mini Project 2 — LLM-powered RESTful Web Service — Pr. El Habib Nfaoui*
