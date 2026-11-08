package ma.nfaoui.translator;

import jakarta.ws.rs.ApplicationPath;
import jakarta.ws.rs.core.Application;
import org.eclipse.microprofile.openapi.annotations.OpenAPIDefinition;
import org.eclipse.microprofile.openapi.annotations.enums.SecuritySchemeType;
import org.eclipse.microprofile.openapi.annotations.info.Contact;
import org.eclipse.microprofile.openapi.annotations.info.Info;
import org.eclipse.microprofile.openapi.annotations.info.License;
import org.eclipse.microprofile.openapi.annotations.security.SecurityScheme;

/**
 * JAX-RS Application class — defines the base URI path for the REST service.
 * Annotated with OpenAPI metadata for auto-generated Swagger documentation.
 */
@ApplicationPath("/api")
@OpenAPIDefinition(
    info = @Info(
        title = "LLM-Powered Translator REST API",
        version = "1.0.0",
        description = """
            RESTful Web Service for translating text from any source language
            to Moroccan Arabic Dialect (Darija) using Google Gemini LLM.
            
            All endpoints require HTTP Basic Authentication.
            Default credentials: admin / admin123
            """,
        contact = @Contact(
            name = "Prof. El Habib Nfaoui",
            url = "https://github.com/your-username/llm-translator"
        ),
        license = @License(
            name = "MIT",
            url = "https://opensource.org/licenses/MIT"
        )
    )
)
@SecurityScheme(
    securitySchemeName = "BasicAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "basic",
    description = "HTTP Basic Authentication. Use admin/admin123 or user/user123."
)
public class TranslatorApplication extends Application {
}
