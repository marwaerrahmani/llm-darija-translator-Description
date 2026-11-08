<?php
/**
 * PHP Client for the LLM-Powered Darija Translator REST API.
 *
 * Usage (CLI):
 *   php translate.php "Hello, how are you?" [sourceLanguage] [username] [password]
 *
 * Usage (Web):
 *   Open in a browser. Submit the form to translate.
 *
 * Requirements: PHP with curl extension enabled.
 */

declare(strict_types=1);

// ── Configuration ─────────────────────────────────────────────────────────────

const API_URL       = 'http://localhost:8080/api/translate';
const API_USERNAME  = 'user';
const API_PASSWORD  = 'user123';

// ── CLI Mode ──────────────────────────────────────────────────────────────────

if (PHP_SAPI === 'cli') {
    if ($argc < 2) {
        fwrite(STDERR, "Usage: php translate.php \"<text>\" [lang] [username] [password]\n");
        fwrite(STDERR, "Example: php translate.php \"Good morning\" English user user123\n");
        exit(1);
    }

    $text           = $argv[1];
    $sourceLanguage = $argv[2] ?? 'English';
    $username       = $argv[3] ?? API_USERNAME;
    $password       = $argv[4] ?? API_PASSWORD;

    $result = translateText($text, $sourceLanguage, $username, $password);

    if ($result['success']) {
        echo "\n✅ Original    : {$result['originalText']}\n";
        echo "🇲🇦 Translation : {$result['translatedText']}\n";
        echo "🤖 Model       : {$result['model']}\n";
        echo "🌐 Source Lang  : {$result['sourceLanguage']}\n\n";
    } else {
        fwrite(STDERR, "❌ Error: {$result['error']}\n");
        exit(1);
    }
    exit(0);
}

// ── Web Form Handling ─────────────────────────────────────────────────────────

$result         = null;
$formText       = '';
$formLang       = 'English';
$formUsername   = API_USERNAME;
$formPassword   = API_PASSWORD;
$error          = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $formText     = trim($_POST['text'] ?? '');
    $formLang     = $_POST['lang'] ?? 'English';
    $formUsername = $_POST['username'] ?? API_USERNAME;
    $formPassword = $_POST['password'] ?? API_PASSWORD;

    if (empty($formText)) {
        $error = 'Please enter text to translate.';
    } else {
        $result = translateText($formText, $formLang, $formUsername, $formPassword);
        if (!$result['success']) {
            $error = $result['error'];
        }
    }
}

// ── API Call Function ─────────────────────────────────────────────────────────

/**
 * Calls the Darija Translator REST API.
 *
 * @param string $text           Text to translate
 * @param string $sourceLanguage Source language (default: English)
 * @param string $username       API username for Basic Auth
 * @param string $password       API password for Basic Auth
 *
 * @return array{success: bool, originalText?: string, translatedText?: string,
 *               model?: string, sourceLanguage?: string, error?: string}
 */
function translateText(
    string $text,
    string $sourceLanguage = 'English',
    string $username = API_USERNAME,
    string $password = API_PASSWORD
): array {
    if (!extension_loaded('curl')) {
        return ['success' => false, 'error' => 'PHP curl extension is required.'];
    }

    $payload = json_encode([
        'text'           => $text,
        'sourceLanguage' => $sourceLanguage,
        'context'        => null,
    ], JSON_THROW_ON_ERROR);

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => API_URL,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Accept: application/json',
        ],
        CURLOPT_USERPWD        => "{$username}:{$password}",
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_SSL_VERIFYPEER => false,  // Disable for self-signed certs in dev
    ]);

    $response   = curl_exec($ch);
    $httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError  = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        return ['success' => false, 'error' => "cURL error: {$curlError}"];
    }

    if ($httpCode === 401) {
        return ['success' => false, 'error' => 'Authentication failed. Check username and password.'];
    }

    if ($httpCode !== 200) {
        return ['success' => false, 'error' => "HTTP {$httpCode}: Server returned an error."];
    }

    $data = json_decode($response, true, 512, JSON_THROW_ON_ERROR);

    if (($data['status'] ?? '') === 'error') {
        return ['success' => false, 'error' => $data['errorMessage'] ?? 'Unknown error'];
    }

    return [
        'success'        => true,
        'originalText'   => $data['originalText']   ?? $text,
        'translatedText' => $data['translatedText']  ?? '',
        'model'          => $data['model']           ?? 'unknown',
        'sourceLanguage' => $data['sourceLanguage']  ?? $sourceLanguage,
    ];
}

// ── Supported Languages ───────────────────────────────────────────────────────

$supportedLanguages = [
    'English', 'French', 'Spanish', 'Arabic (Modern Standard)',
    'German', 'Italian', 'Portuguese', 'Dutch',
];

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Darija Translator — PHP Client</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f0f4f8; color: #1a1a2e; min-height: 100vh; }
    .container { max-width: 700px; margin: 40px auto; padding: 0 16px; }
    header { background: #1a7f4b; color: #fff; border-radius: 12px 12px 0 0; padding: 24px; }
    header h1 { font-size: 24px; }
    header p  { opacity: .8; margin-top: 4px; }
    .card { background: #fff; border-radius: 0 0 12px 12px; box-shadow: 0 4px 16px rgba(0,0,0,.1); padding: 28px; }
    .form-group { margin-bottom: 16px; }
    label { display: block; font-size: 13px; font-weight: 600; color: #555; margin-bottom: 6px; }
    input, select, textarea {
      width: 100%; padding: 10px 14px; border: 1px solid #dde;
      border-radius: 8px; font-size: 14px; font-family: inherit;
      outline: none; transition: border-color .15s;
    }
    input:focus, select:focus, textarea:focus { border-color: #1a7f4b; }
    textarea { resize: vertical; min-height: 110px; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    button[type=submit] {
      width: 100%; padding: 12px; background: #1a7f4b; color: #fff;
      border: none; border-radius: 8px; font-size: 16px; font-weight: 700;
      cursor: pointer; margin-top: 8px; transition: background .15s;
    }
    button[type=submit]:hover { background: #145e38; }
    .result-box {
      margin-top: 24px; padding: 20px; background: #f8fff8;
      border: 1px solid #c8e6c9; border-radius: 10px;
    }
    .result-label { font-size: 12px; font-weight: 700; color: #1a7f4b; text-transform: uppercase; letter-spacing: .4px; }
    .result-text { font-size: 20px; margin: 8px 0; direction: rtl; font-family: Arial, sans-serif; }
    .meta { font-size: 12px; color: #888; }
    .error-box {
      margin-top: 20px; padding: 14px; background: #fff0f0;
      border: 1px solid #f5c2c2; border-radius: 8px; color: #c0392b;
    }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-green { background: #e8f5e9; color: #1a7f4b; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🌍 Darija Translator</h1>
      <p>PHP Client — Translate to Moroccan Arabic Dialect (Darija)</p>
    </header>
    <div class="card">
      <form method="POST" action="">

        <div class="form-group">
          <label for="text">Text to Translate</label>
          <textarea name="text" id="text" placeholder="Enter your text here…" maxlength="5000"><?= htmlspecialchars($formText) ?></textarea>
        </div>

        <div class="row-2">
          <div class="form-group">
            <label for="lang">Source Language</label>
            <select name="lang" id="lang">
              <?php foreach ($supportedLanguages as $lang): ?>
              <option value="<?= htmlspecialchars($lang) ?>" <?= $formLang === $lang ? 'selected' : '' ?>>
                <?= htmlspecialchars($lang) ?>
              </option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label>Target Language</label>
            <input type="text" value="Moroccan Arabic (Darija)" readonly style="background:#f5f5f5;" />
          </div>
        </div>

        <div class="row-2">
          <div class="form-group">
            <label for="username">API Username</label>
            <input type="text" name="username" id="username" value="<?= htmlspecialchars($formUsername) ?>" autocomplete="username" />
          </div>
          <div class="form-group">
            <label for="password">API Password</label>
            <input type="password" name="password" id="password" value="<?= htmlspecialchars($formPassword) ?>" autocomplete="current-password" />
          </div>
        </div>

        <button type="submit">Translate →</button>
      </form>

      <?php if ($error): ?>
      <div class="error-box">❌ <?= htmlspecialchars($error) ?></div>
      <?php endif; ?>

      <?php if ($result && $result['success']): ?>
      <div class="result-box">
        <div style="margin-bottom:14px;">
          <span class="result-label">Original (<?= htmlspecialchars($result['sourceLanguage']) ?>)</span>
          <p style="margin-top:6px;"><?= htmlspecialchars($result['originalText']) ?></p>
        </div>
        <hr style="border:none;border-top:1px solid #c8e6c9;margin:12px 0;" />
        <div>
          <span class="result-label">Translation</span>
          <span class="badge badge-green" style="margin-left:8px;">Moroccan Darija 🇲🇦</span>
          <p class="result-text"><?= htmlspecialchars($result['translatedText']) ?></p>
        </div>
        <div class="meta">Model: <?= htmlspecialchars($result['model']) ?></div>
      </div>
      <?php endif; ?>

    </div><!-- /.card -->
  </div>
</body>
</html>
