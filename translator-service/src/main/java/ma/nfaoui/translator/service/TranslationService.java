package ma.nfaoui.translator.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import ma.nfaoui.translator.model.TranslationRequest;
import ma.nfaoui.translator.model.TranslationResponse;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Core business service that orchestrates translation using the Gemini LLM.
 *
 * <p>Uses Java's built-in {@link HttpClient} for the Gemini REST call so we
 * have full, predictable control over the serialized JSON body — avoiding any
 * null-field issues that MicroProfile REST Client serialization can introduce
 * with newer Gemini API versions.
 */
@ApplicationScoped
public class TranslationService {

    private static final Logger LOG = Logger.getLogger(TranslationService.class);

    private static final String GEMINI_BASE_URL =
        "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build();

    @ConfigProperty(name = "gemini.api.key")
    String apiKey;

    @ConfigProperty(name = "gemini.model", defaultValue = "gemini-3.1-flash-lite")
    String model;

    /**
     * Translates the given text to Moroccan Arabic Dialect (Darija).
     */
    public TranslationResponse translate(TranslationRequest request) {
        LOG.infof("Translating %d chars from %s → Darija using %s",
                  request.getText().length(), request.getSourceLanguage(), model);

        String prompt = buildPrompt(request);
        String requestBody = buildJsonBody(prompt);

        try {
            String url = String.format(GEMINI_BASE_URL, model, apiKey);

            HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .timeout(Duration.ofSeconds(30))
                .build();

            HttpResponse<String> response = httpClient.send(
                httpRequest, HttpResponse.BodyHandlers.ofString()
            );

            LOG.debugf("Gemini HTTP %d, body: %.200s", response.statusCode(), response.body());

            if (response.statusCode() != 200) {
                LOG.errorf("Gemini error %d: %s", response.statusCode(), response.body());
                return TranslationResponse.error(request.getText(),
                    "LLM API error (HTTP " + response.statusCode() + "): " + response.body());
            }

            String translatedText = extractText(response.body());
            if (translatedText == null || translatedText.isBlank()) {
                return TranslationResponse.error(request.getText(), "LLM returned an empty response.");
            }

            LOG.infof("Translation successful: %.80s", translatedText);
            return TranslationResponse.success(
                request.getText(),
                translatedText.trim(),
                request.getSourceLanguage(),
                model
            );

        } catch (Exception e) {
            LOG.errorf(e, "Translation failed");
            return TranslationResponse.error(request.getText(), "Translation failed: " + e.getMessage());
        }
    }

    // ── Prompt Engineering ────────────────────────────────────────────────────

    private String buildPrompt(TranslationRequest request) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an expert translator specializing in Moroccan Arabic Dialect (Darija).\n");
        sb.append("Translate the following text from ").append(request.getSourceLanguage())
          .append(" to Moroccan Arabic Dialect (Darija).\n\n");
        sb.append("RULES:\n");
        sb.append("- Translate naturally as a native Darija speaker would say it.\n");
        sb.append("- Use Arabic script (العربية المغربية) as the primary script.\n");
        sb.append("- Preserve the original tone (formal/informal).\n");
        sb.append("- Output ONLY the translated text. No explanations, no prefixes.\n\n");

        if (request.getContext() != null && !request.getContext().isBlank()) {
            sb.append("Context: ").append(request.getContext()).append("\n\n");
        }

        sb.append("Examples:\n");
        sb.append("English: 'Hello' → Darija: 'سلام'\n");
        sb.append("English: 'How are you?' → Darija: 'كيداير؟'\n");
        sb.append("English: 'Good morning' → Darija: 'صباح الخير'\n\n");

        sb.append("TEXT:\n").append(request.getText());
        return sb.toString();
    }

    // ── JSON Construction (manual — avoids null-field serialization issues) ───

    private String buildJsonBody(String prompt) {
        // Manually build the JSON to guarantee no null fields are included
        String escapedPrompt = escapeJson(prompt);
        return String.format("""
            {
              "contents": [
                {
                  "parts": [
                    { "text": "%s" }
                  ]
                }
              ],
              "generationConfig": {
                "temperature": 0.3,
                "topP": 0.9,
                "maxOutputTokens": 2048
              }
            }
            """, escapedPrompt);
    }

    private String escapeJson(String text) {
        return text
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t");
    }

    // ── Response Parsing ──────────────────────────────────────────────────────

    private String extractText(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            return root
                .path("candidates").get(0)
                .path("content")
                .path("parts").get(0)
                .path("text")
                .asText(null);
        } catch (Exception e) {
            LOG.errorf(e, "Failed to parse Gemini response: %.200s", responseBody);
            return null;
        }
    }
}
