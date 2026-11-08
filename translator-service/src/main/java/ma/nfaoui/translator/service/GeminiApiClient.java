package ma.nfaoui.translator.service;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import ma.nfaoui.translator.model.GeminiRequest;
import ma.nfaoui.translator.model.GeminiResponse;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

/**
 * MicroProfile REST Client interface for the Google Gemini API.
 * Configured via application.properties: quarkus.rest-client.gemini-api.url
 */
@RegisterRestClient(configKey = "gemini-api")
@Path("/v1beta/models")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public interface GeminiApiClient {

    /**
     * Calls the Gemini generateContent endpoint.
     *
     * @param model  the model identifier (e.g., "gemini-1.5-flash")
     * @param apiKey your Gemini API key (passed as a query parameter)
     * @param body   the generation request body
     * @return the Gemini API response
     */
    @POST
    @Path("/{model}:generateContent")
    GeminiResponse generateContent(
        @PathParam("model") String model,
        @QueryParam("key") String apiKey,
        GeminiRequest body
    );
}
