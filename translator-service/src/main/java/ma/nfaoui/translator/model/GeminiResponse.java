package ma.nfaoui.translator.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * Data transfer object for the Google Gemini API response.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class GeminiResponse {

    @JsonProperty("candidates")
    private List<Candidate> candidates;

    @JsonProperty("usageMetadata")
    private UsageMetadata usageMetadata;

    @JsonProperty("modelVersion")
    private String modelVersion;

    public List<Candidate> getCandidates() { return candidates; }
    public void setCandidates(List<Candidate> candidates) { this.candidates = candidates; }

    public UsageMetadata getUsageMetadata() { return usageMetadata; }
    public void setUsageMetadata(UsageMetadata usageMetadata) { this.usageMetadata = usageMetadata; }

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

    /**
     * Extracts the generated text from the first candidate's first part.
     */
    public String extractText() {
        if (candidates == null || candidates.isEmpty()) return null;
        Candidate first = candidates.get(0);
        if (first.getContent() == null) return null;
        List<GeminiRequest.Part> parts = first.getContent().getParts();
        if (parts == null || parts.isEmpty()) return null;
        return parts.get(0).getText();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Candidate {
        @JsonProperty("content")
        private GeminiRequest.Content content;

        @JsonProperty("finishReason")
        private String finishReason;

        @JsonProperty("index")
        private int index;

        public GeminiRequest.Content getContent() { return content; }
        public void setContent(GeminiRequest.Content content) { this.content = content; }

        public String getFinishReason() { return finishReason; }
        public void setFinishReason(String finishReason) { this.finishReason = finishReason; }

        public int getIndex() { return index; }
        public void setIndex(int index) { this.index = index; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class UsageMetadata {
        @JsonProperty("promptTokenCount")
        private int promptTokenCount;

        @JsonProperty("candidatesTokenCount")
        private int candidatesTokenCount;

        @JsonProperty("totalTokenCount")
        private int totalTokenCount;

        public int getPromptTokenCount() { return promptTokenCount; }
        public int getCandidatesTokenCount() { return candidatesTokenCount; }
        public int getTotalTokenCount() { return totalTokenCount; }
    }
}
