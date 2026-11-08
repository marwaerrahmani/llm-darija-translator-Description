#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# start-service.sh — Build and start the Darija Translator REST service
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")/translator-service"

# ── API Key Check ─────────────────────────────────────────────────────────────
if [[ -z "${GEMINI_API_KEY:-}" ]]; then
    echo "⚠️  Warning: GEMINI_API_KEY is not set."
    echo "   Get a free key at: https://ai.google.dev/pricing#1_5flash"
    echo "   Then: export GEMINI_API_KEY=your-key-here"
    echo ""
fi

# ── Dev Mode (hot-reload) or Production ───────────────────────────────────────
MODE="${1:-dev}"

if [[ "$MODE" == "dev" ]]; then
    echo "🚀 Starting in development mode (hot-reload)…"
    echo "   Swagger UI: http://localhost:8080/swagger-ui"
    echo "   Health:     http://localhost:8080/api/translate/health"
    echo ""
    mvn quarkus:dev -Dgemini.api.key="${GEMINI_API_KEY:-placeholder}"
elif [[ "$MODE" == "prod" ]]; then
    echo "📦 Building production JAR…"
    mvn package -DskipTests -q
    echo "🚀 Starting production server…"
    java -Dgemini.api.key="${GEMINI_API_KEY:-placeholder}" \
         -jar target/quarkus-app/quarkus-run.jar
else
    echo "Usage: $0 [dev|prod]"
    exit 1
fi
