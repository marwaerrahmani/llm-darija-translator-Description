package ma.nfaoui.translator.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * Data transfer objects for the Google Gemini API request/response.
 * NON_NULL ensures null fields are omitted — required by newer Gemini API versions.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GeminiRequest {

    @JsonProperty("contents")
    private List<Content> contents;

    @JsonProperty("generationConfig")
    private GenerationConfig generationConfig;

    @JsonProperty("safetySettings")
    private List<SafetySetting> safetySettings;

    public GeminiRequest(List<Content> contents, GenerationConfig generationConfig) {
        this.contents = contents;
        this.generationConfig = generationConfig;
    }

    public List<Content> getContents() { return contents; }
    public void setContents(List<Content> contents) { this.contents = contents; }

    public GenerationConfig getGenerationConfig() { return generationConfig; }
    public void setGenerationConfig(GenerationConfig generationConfig) {
        this.generationConfig = generationConfig;
    }

    public List<SafetySetting> getSafetySettings() { return safetySettings; }
    public void setSafetySettings(List<SafetySetting> safetySettings) {
        this.safetySettings = safetySettings;
    }

    // ── Nested DTOs ──────────────────────────────────────────────────────────

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Content {
        @JsonProperty("parts")
        private List<Part> parts;

        @JsonProperty("role")
        private String role;

        public Content(List<Part> parts) { this.parts = parts; }
        public Content(String role, List<Part> parts) { this.role = role; this.parts = parts; }

        public List<Part> getParts() { return parts; }
        public void setParts(List<Part> parts) { this.parts = parts; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }

    public static class Part {
        @JsonProperty("text")
        private String text;

        public Part(String text) { this.text = text; }

        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
    }

    public static class GenerationConfig {
        @JsonProperty("temperature")
        private double temperature;

        @JsonProperty("topP")
        private double topP;

        @JsonProperty("maxOutputTokens")
        private int maxOutputTokens;

        public GenerationConfig(double temperature, double topP, int maxOutputTokens) {
            this.temperature = temperature;
            this.topP = topP;
            this.maxOutputTokens = maxOutputTokens;
        }

        public double getTemperature() { return temperature; }
        public double getTopP() { return topP; }
        public int getMaxOutputTokens() { return maxOutputTokens; }
    }

    public static class SafetySetting {
        @JsonProperty("category")
        private String category;

        @JsonProperty("threshold")
        private String threshold;

        public SafetySetting(String category, String threshold) {
            this.category = category;
            this.threshold = threshold;
        }

        public String getCategory() { return category; }
        public String getThreshold() { return threshold; }
    }
}
