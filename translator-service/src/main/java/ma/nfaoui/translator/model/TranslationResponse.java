package ma.nfaoui.translator.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

/**
 * Response payload returned by the translation endpoint.
 */
@Schema(description = "Translation response payload")
public class TranslationResponse {

    @Schema(description = "The original text submitted for translation")
    @JsonProperty("originalText")
    private String originalText;

    @Schema(description = "The translated text in Moroccan Arabic Dialect (Darija)")
    @JsonProperty("translatedText")
    private String translatedText;

    @Schema(description = "Source language detected or provided")
    @JsonProperty("sourceLanguage")
    private String sourceLanguage;

    @Schema(description = "Target language (always Moroccan Arabic / Darija)")
    @JsonProperty("targetLanguage")
    private String targetLanguage = "Moroccan Arabic (Darija)";

    @Schema(description = "LLM model used for the translation")
    @JsonProperty("model")
    private String model;

    @Schema(description = "Translation status: success or error")
    @JsonProperty("status")
    private String status;

    @Schema(description = "Error message if translation failed")
    @JsonProperty("errorMessage")
    private String errorMessage;

    @Schema(description = "Timestamp of the translation (epoch milliseconds)")
    @JsonProperty("timestamp")
    private long timestamp;

    public TranslationResponse() {
        this.timestamp = System.currentTimeMillis();
    }

    public static TranslationResponse success(String originalText, String translatedText,
                                               String sourceLanguage, String model) {
        TranslationResponse resp = new TranslationResponse();
        resp.originalText = originalText;
        resp.translatedText = translatedText;
        resp.sourceLanguage = sourceLanguage;
        resp.model = model;
        resp.status = "success";
        return resp;
    }

    public static TranslationResponse error(String originalText, String errorMessage) {
        TranslationResponse resp = new TranslationResponse();
        resp.originalText = originalText;
        resp.errorMessage = errorMessage;
        resp.status = "error";
        return resp;
    }

    public String getOriginalText() { return originalText; }
    public void setOriginalText(String originalText) { this.originalText = originalText; }

    public String getTranslatedText() { return translatedText; }
    public void setTranslatedText(String translatedText) { this.translatedText = translatedText; }

    public String getSourceLanguage() { return sourceLanguage; }
    public void setSourceLanguage(String sourceLanguage) { this.sourceLanguage = sourceLanguage; }

    public String getTargetLanguage() { return targetLanguage; }
    public void setTargetLanguage(String targetLanguage) { this.targetLanguage = targetLanguage; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}
