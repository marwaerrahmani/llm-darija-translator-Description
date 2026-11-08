package ma.nfaoui.translator.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

/**
 * Request payload for the translation endpoint.
 */
@Schema(description = "Translation request payload")
public class TranslationRequest {

    @NotBlank(message = "Text to translate must not be blank")
    @Size(min = 1, max = 5000, message = "Text must be between 1 and 5000 characters")
    @Schema(
        description = "The text to be translated to Moroccan Arabic Dialect (Darija)",
        example = "Hello, how are you?",
        required = true,
        minLength = 1,
        maxLength = 5000
    )
    @JsonProperty("text")
    private String text;

    @Schema(
        description = "Source language of the text (default: English)",
        example = "English",
        defaultValue = "English"
    )
    @JsonProperty("sourceLanguage")
    private String sourceLanguage = "English";

    @Schema(
        description = "Additional translation context or instructions",
        example = "casual conversation"
    )
    @JsonProperty("context")
    private String context;

    public TranslationRequest() {}

    public TranslationRequest(String text, String sourceLanguage, String context) {
        this.text = text;
        this.sourceLanguage = sourceLanguage;
        this.context = context;
    }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getSourceLanguage() { return sourceLanguage; }
    public void setSourceLanguage(String sourceLanguage) {
        this.sourceLanguage = sourceLanguage != null ? sourceLanguage : "English";
    }

    public String getContext() { return context; }
    public void setContext(String context) { this.context = context; }
}
