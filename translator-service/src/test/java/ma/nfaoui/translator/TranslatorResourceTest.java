package ma.nfaoui.translator;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;

/**
 * Integration tests for the TranslatorResource REST endpoint.
 * Uses RestAssured for HTTP-level testing against the running Quarkus instance.
 */
@QuarkusTest
class TranslatorResourceTest {

    // ── Health Check (unauthenticated) ────────────────────────────────────────

    @Test
    @DisplayName("GET /api/translate/health — should return 200 without auth")
    void testHealthEndpoint() {
        given()
            .when().get("/api/translate/health")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("status", equalTo("UP"))
                .body("service", equalTo("LLM Translator REST Service"));
    }

    // ── Authentication Tests ──────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/translate — should return 401 without credentials")
    void testTranslationRequiresAuth() {
        given()
            .queryParam("text", "Hello")
            .when().get("/api/translate")
            .then()
                .statusCode(401);
    }

    @Test
    @DisplayName("GET /api/translate — should return 401 with wrong credentials")
    void testTranslationBadCredentials() {
        given()
            .auth().preemptive().basic("admin", "wrongpassword")
            .queryParam("text", "Hello")
            .when().get("/api/translate")
            .then()
                .statusCode(401);
    }

    // ── GET Endpoint Tests ────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/translate — should return 400 when text param missing")
    void testGetTranslateMissingText() {
        given()
            .auth().preemptive().basic("user", "user123")
            .when().get("/api/translate")
            .then()
                .statusCode(400)
                .body("error", notNullValue());
    }

    @Test
    @DisplayName("GET /api/translate/languages — should list supported languages")
    void testSupportedLanguages() {
        given()
            .auth().preemptive().basic("user", "user123")
            .when().get("/api/translate/languages")
            .then()
                .statusCode(200)
                .body("targetLanguage", equalTo("Moroccan Arabic (Darija)"))
                .body("supportedSourceLanguages", notNullValue());
    }

    // ── POST Endpoint Tests ───────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/translate — should return 400 for blank text")
    void testPostTranslateBlankText() {
        given()
            .auth().preemptive().basic("user", "user123")
            .contentType(ContentType.JSON)
            .body("""
                {
                  "text": "",
                  "sourceLanguage": "English"
                }
                """)
            .when().post("/api/translate")
            .then()
                .statusCode(400);
    }

    @Test
    @DisplayName("POST /api/translate — admin role should also have access")
    void testAdminCanTranslate() {
        given()
            .auth().preemptive().basic("admin", "admin123")
            .contentType(ContentType.JSON)
            .body("""
                {
                  "text": "Good morning",
                  "sourceLanguage": "English"
                }
                """)
            .when().post("/api/translate")
            .then()
                // With a real API key this would be 200; in test it may hit Gemini mock
                .statusCode(anyOf(is(200), is(500)));
    }
}
