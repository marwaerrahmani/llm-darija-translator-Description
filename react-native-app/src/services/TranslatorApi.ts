/**
 * API service layer for the Darija Translator REST endpoint.
 * Handles HTTP Basic Authentication, request construction, and error mapping.
 */

export interface TranslationRequest {
  text: string;
  sourceLanguage?: string;
  context?: string | null;
}

export interface TranslationResponse {
  status: 'success' | 'error';
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  model: string;
  timestamp: number;
  errorMessage?: string;
}

export interface ApiConfig {
  baseUrl: string;
  username: string;
  password: string;
}

const DEFAULT_CONFIG: ApiConfig = {
  baseUrl:  'http://localhost:8080/api/translate',
  username: 'user',
  password: 'user123',
};

class TranslatorApiService {
  private config: ApiConfig = DEFAULT_CONFIG;

  configure(config: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ApiConfig {
    return { ...this.config };
  }

  private buildAuthHeader(): string {
    const credentials = `${this.config.username}:${this.config.password}`;
    return `Basic ${btoa(credentials)}`;
  }

  /**
   * Translates text to Moroccan Arabic Dialect (Darija).
   */
  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const { text, sourceLanguage = 'English', context = null } = request;

    if (!text?.trim()) {
      throw new Error('Text to translate must not be empty.');
    }
    if (text.length > 5000) {
      throw new Error('Text exceeds the 5000 character limit.');
    }

    const response = await fetch(this.config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Accept':        'application/json',
        'Authorization': this.buildAuthHeader(),
      },
      body: JSON.stringify({ text: text.trim(), sourceLanguage, context }),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please check your credentials in Settings.');
    }

    let data: TranslationResponse;
    try {
      data = await response.json();
    } catch {
      throw new Error(`Invalid server response (HTTP ${response.status}).`);
    }

    if (!response.ok || data.status === 'error') {
      throw new Error(data.errorMessage || `Server error (HTTP ${response.status}).`);
    }

    return data;
  }

  /**
   * Health check — no authentication required.
   */
  async healthCheck(): Promise<{ status: string }> {
    const url = this.config.baseUrl.replace(/\/translate$/, '/translate/health');
    const response = await fetch(url, { method: 'GET' });
    return response.json();
  }

  /**
   * Returns the list of supported source languages.
   */
  async listLanguages(): Promise<{ targetLanguage: string; supportedSourceLanguages: string[] }> {
    const url = this.config.baseUrl.replace(/\/translate$/, '/translate/languages');
    const response = await fetch(url, {
      headers: { 'Authorization': this.buildAuthHeader() },
    });
    return response.json();
  }
}

export const translatorApi = new TranslatorApiService();
