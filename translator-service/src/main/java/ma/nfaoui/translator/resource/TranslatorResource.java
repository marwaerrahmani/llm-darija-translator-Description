package ma.nfaoui.translator.resource;

import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import ma.nfaoui.translator.model.TranslationRequest;
import ma.nfaoui.translator.model.TranslationResponse;
import ma.nfaoui.translator.service.TranslationService;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.enums.ParameterIn;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.parameters.RequestBody;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;

import java.util.Map;

/**
 * JAX-RS RESTful resource for text translation to Moroccan Arabic Dialect (Darija).
 *
 * <p>Endpoints:
 * <ul>
 *   <li>POST /api/translate — translate using a JSON body</li>
 *   <li>GET  /api/translate?text=...&amp;lang=... — translate using query parameters</li>
 *   <li>GET  /api/translate/health — health check (no auth required)</li>
 *   <li>GET  /api/translate/languages — list supported source languages</li>
 * </ul>
 *
 * <p>All translation endpoints require HTTP Basic Authentication.
 */
@Path("/translate")
@RequestScoped
@Tag(name = "TranslatorResource", description = "Endpoints for LLM-powered text translation to Darija")
public class TranslatorResource {

    private static final Logger LOG = Logger.getLogger(TranslatorResource.class);

    @Inject
    TranslationService translationService;

    // ── POST /api/translate ───────────────────────────────────────────────────

    /**
     * Translates the submitted text to Moroccan Arabic Dialect (Darija).
     * Accepts a JSON request body. Requires the 'user' role (Basic Auth).
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed({"user", "admin"})
    @SecurityRequirement(name = "BasicAuth")
    @Operation(
        summary = "Translate text to Moroccan Darija",
        description = """
            Submits text for translation to Moroccan Arabic Dialect (Darija)
            using the Google Gemini LLM. Returns the translated text along
            with metadata such as the model used and the source language.
            """
    )
    @RequestBody(
        description = "The translation request",
        required = true,
        content = @Content(
            mediaType = MediaType.APPLICATION_JSON,
            schema = @Schema(implementation = TranslationRequest.class),
            example = """
                {
                  "text": "Hello, how are you?",
                  "sourceLanguage": "English",
                  "context": "casual greeting"
                }
                """
        )
    )
    @APIResponses({
        @APIResponse(responseCode = "200", description = "Translation successful",
            content = @Content(schema = @Schema(implementation = TranslationResponse.class))),
        @APIResponse(responseCode = "400", description = "Invalid request body"),
        @APIResponse(responseCode = "401", description = "Authentication required"),
        @APIResponse(responseCode = "500", description = "Internal server / LLM error")
    })
    public Response translate(@Valid TranslationRequest request, @Context SecurityContext sec) {
        LOG.infof("POST /translate — user: %s, text length: %d",
                  sec.getUserPrincipal().getName(), request.getText().length());

        TranslationResponse result = translationService.translate(request);

        if ("error".equals(result.getStatus())) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(result).build();
        }
        return Response.ok(result).build();
    }

    // ── GET /api/translate ────────────────────────────────────────────────────

    /**
     * Convenience endpoint that accepts translation parameters as query strings.
     * Useful for quick testing with cURL or a browser.
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed({"user", "admin"})
    @SecurityRequirement(name = "BasicAuth")
    @Operation(
        summary = "Translate text via query parameters",
        description = "Lightweight GET endpoint for quick translation without a JSON body."
    )
    @APIResponses({
        @APIResponse(responseCode = "200", description = "Translation successful",
            content = @Content(schema = @Schema(implementation = TranslationResponse.class))),
        @APIResponse(responseCode = "400", description = "Missing or invalid 'text' parameter"),
        @APIResponse(responseCode = "401", description = "Authentication required")
    })
    public Response translateGet(
        @Parameter(description = "Text to translate", required = true, in = ParameterIn.QUERY)
        @QueryParam("text") String text,
        @Parameter(description = "Source language (default: English)", in = ParameterIn.QUERY)
        @QueryParam("lang") @DefaultValue("English") String lang,
        @Context SecurityContext sec
    ) {
        if (text == null || text.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Query parameter 'text' is required and must not be blank"))
                .build();
        }

        LOG.infof("GET /translate — user: %s, lang: %s, text: %.50s",
                  sec.getUserPrincipal().getName(), lang, text);

        TranslationRequest request = new TranslationRequest(text, lang, null);
        TranslationResponse result = translationService.translate(request);

        if ("error".equals(result.getStatus())) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(result).build();
        }
        return Response.ok(result).build();
    }

    // ── GET /api/translate/health ─────────────────────────────────────────────

    /**
     * Health-check endpoint. No authentication required.
     */
    @GET
    @Path("/health")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Service health check", description = "Returns service status. No authentication required.")
    @APIResponse(responseCode = "200", description = "Service is healthy")
    public Response health() {
        return Response.ok(Map.of(
            "status", "UP",
            "service", "LLM Translator REST Service",
            "version", "1.0.0",
            "targetLanguage", "Moroccan Arabic Dialect (Darija)"
        )).build();
    }

    // ── GET /api/translate/languages ──────────────────────────────────────────

    /**
     * Returns the list of supported source languages.
     */
    @GET
    @Path("/languages")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed({"user", "admin"})
    @SecurityRequirement(name = "BasicAuth")
    @Operation(summary = "List supported source languages")
    @APIResponse(responseCode = "200", description = "List of supported languages")
    public Response supportedLanguages() {
        return Response.ok(Map.of(
            "targetLanguage", "Moroccan Arabic (Darija)",
            "supportedSourceLanguages", new String[]{
                "English", "French", "Spanish", "Arabic (Modern Standard)",
                "German", "Italian", "Portuguese", "Dutch", "Russian",
                "Chinese (Simplified)", "Japanese", "Korean", "Turkish"
            }
        )).build();
    }
}
