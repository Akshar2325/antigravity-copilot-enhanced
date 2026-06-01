# 🚀 Antigravity Copilot

> **Use Google Gemini, Anthropic Claude, and other powerful AI models directly in GitHub Copilot Chat — for free, via the Antigravity service.**

A VS Code extension that bridges the [Antigravity](https://antigravity.dev) AI service with GitHub Copilot's **Bring Your Own Key (BYOK)** model system. It runs a local proxy, auto-configures Copilot, and gives you access to the latest frontier models without writing any API keys.

---

## ✨ Features

| Feature                      | Description                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| 🤖 **12+ AI Models**         | Gemini 3 (Flash/Pro/Agent), Gemini 3.1/3.5, Claude Sonnet/Opus, GPT-OSS                      |
| 🧠 **Thinking Models**       | Claude Opus 4.6 with extended reasoning / thinking blocks                                    |
| 👁️ **Vision Support**        | Attach images to your Copilot Chat messages                                                  |
| 🛡️ **Auto Schema Fix**       | Strips Gemini-incompatible JSON Schema fields (`$comment`, `enumDescriptions`) automatically |
| ⚡ **Rate Limit Protection** | Smart cooldown, retry with exponential backoff, per-model concurrency queues                 |
| 📊 **Live Dashboard**        | Sidebar shows server status, proxy status, rate limiter state, and model list                |
| 🔄 **Auto-Configure**        | Automatically registers all models in Copilot Chat on server start                           |

---

## 🏗️ Architecture

```
VS Code Copilot Chat
        │
        │  POST /v1/chat/completions
        │  (tools may contain $comment, enumDescriptions — Gemini-incompatible)
        ▼
┌─────────────────────────────────────────┐
│     Antigravity Proxy  (port 8420)      │
│                                         │
│  • sanitizeToolSchemas()                │  ← strips $comment etc.
│  • truncateToolOutput()                 │  ← reduces prompt size
│  • clamp max_tokens                     │  ← prevents quota blowout
│  • rate limiter + concurrency queue     │  ← 429 protection
│  • retry with exponential backoff       │
│  • ThinkingStreamTransformer            │  ← renders <thinking> blocks
└─────────────────────────────────────────┘
        │
        │  Clean request
        ▼
┌─────────────────────────────────────────┐
│     CLIProxyAPI  (port 8317)            │
│     (local binary managed by extension) │
│  • /v1/models  — dynamic model list     │
│  • /v1/chat/completions → routes to:    │
│       Google Gemini API                 │
│       Anthropic Claude API              │
│       OpenAI-compatible APIs            │
└─────────────────────────────────────────┘
```

---

## 📦 Source Files

| File                                                                   | Purpose                                                                                                                                          |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`src/extension.ts`](src/extension.ts)                                 | Entry point. Registers commands, status bar, sidebar. Manages server lifecycle and auto-configures Copilot models.                               |
| [`src/models.ts`](src/models.ts)                                       | Model definitions (`ANTIGRAVITY_MODELS`), dynamic model fetching from `/v1/models`, capability inference (`inferVision`, `inferThinking`, etc.). |
| [`src/ThrottlingProxyServer.ts`](src/ThrottlingProxyServer.ts)         | Core HTTP proxy. Rewrites payloads, strips Gemini-incompatible schema fields, enforces rate limits, streams responses.                           |
| [`src/ThinkingStreamTransformer.ts`](src/ThinkingStreamTransformer.ts) | SSE stream transformer that converts `reasoning_content` tokens into VS Code-renderable thinking blocks.                                         |
| [`src/AntigravityServer.ts`](src/AntigravityServer.ts)                 | Manages the CLIProxyAPI child process: start/stop/restart/login, config file management, port detection.                                         |
| [`src/CLIProxyAPIDownloader.ts`](src/CLIProxyAPIDownloader.ts)         | Downloads and extracts the CLIProxyAPI binary from GitHub Releases.                                                                              |
| [`src/RateLimiter.ts`](src/RateLimiter.ts)                             | Singleton rate limiter. Enforces per-request cooldowns, tracks 429 errors, exponential backoff.                                                  |
| [`src/ConcurrencyQueue.ts`](src/ConcurrencyQueue.ts)                   | Semaphore-based concurrency queue with retry. Thinking models get a separate low-concurrency queue (default: 1).                                 |
| [`src/QuotaManager.ts`](src/QuotaManager.ts)                           | Reads quota/credit info from the Antigravity process via its internal HTTPS API.                                                                 |
| [`src/SidebarProvider.ts`](src/SidebarProvider.ts)                     | Webview sidebar panel — server status, proxy status, rate limiter, model list.                                                                   |

---

## 🤖 Dynamic Model Auto-Discovery

There are **no hardcoded model configurations or static lists** in the extension. Instead, it is 100% future-proof:

1. **Auto-Discovery**: On start, the extension calls `GET /v1/models` on the running CLIProxyAPI to dynamically fetch all available models.
2. **Capability Inference**: It automatically determines model features and limits based on its ID:
   - **Tools**: Enabled (`true`) for all models automatically.
   - **Vision**: Enabled for Claude/Gemini/vision models; disabled (`false`) for GPT-OSS models.
   - **Thinking**: Enabled (`true`) for Claude 4.6 and reasoning models (IDs containing `thinking`, `sonnet-4-6`, `opus-4-6`).
   - **Context Window**: Standard models get **128K** inputs and **16K** outputs. Thinking models get a conservative **32K** inputs and **2K** outputs to prevent massive generations from instantly exhausting rate-limit quotas.

This means if Antigravity adds new models in the future, they will immediately show up and work in Copilot without needing an extension update!

---

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- VS Code 1.90+
- GitHub Copilot Chat extension installed

### Install & Build

```bash
git clone https://github.com/Akshar2325/antigravity-copilot-enhanced.git
cd antigravity-copilot
npm install
npm run compile
```

### Run in Development Mode

1. Open the project in VS Code
2. Press **F5** → opens a new **Extension Development Host** window
3. In the new window, the Antigravity status bar item appears bottom-left
4. Click it → **Start Server** (or set `antigravityCopilot.server.autoStart: true`)
5. Models auto-register in Copilot Chat

### Watch Mode (auto-rebuild on save)

```bash
npm run watch
```

### Package as VSIX

```bash
npm run package
# Output: antigravity-copilot-x.y.z.vsix
```

### Install VSIX

```bash
# Via CLI
code --install-extension antigravity-copilot-1.6.0.vsix

# Via UI
# Extensions panel → ··· → Install from VSIX...
```

---

## ⚙️ Configuration

Open VS Code Settings and search for `antigravityCopilot`:

| Setting                                        | Default | Description                               |
| ---------------------------------------------- | ------- | ----------------------------------------- |
| `antigravityCopilot.server.autoStart`          | `false` | Auto-start CLIProxyAPI on VS Code launch  |
| `antigravityCopilot.server.port`               | `8317`  | CLIProxyAPI port                          |
| `antigravityCopilot.server.executablePath`     | auto    | Path to `cli-proxy-api.exe`               |
| `antigravityCopilot.proxy.enabled`             | `true`  | Enable the throttling proxy               |
| `antigravityCopilot.proxy.port`                | `8420`  | Proxy port (Copilot sends requests here)  |
| `antigravityCopilot.proxy.thinkingConcurrency` | `1`     | Max parallel requests for thinking models |
| `antigravityCopilot.proxy.standardConcurrency` | `3`     | Max parallel requests for standard models |
| `antigravityCopilot.rateLimit.enabled`         | `true`  | Enable rate limiting                      |
| `antigravityCopilot.rateLimit.cooldownMs`      | `15000` | Cooldown between requests (ms)            |
| `antigravityCopilot.autoConfigureCopilot`      | `true`  | Auto-register models in Copilot on start  |

---

## 🔑 How Models Are Added to Copilot

The extension writes to VS Code's `chatLanguageModels.json` (BYOK config file):

- **Windows:** `%APPDATA%\Code\User\chatLanguageModels.json`
- **macOS:** `~/Library/Application Support/Code/User/chatLanguageModels.json`
- **Linux:** `~/.config/Code/User/chatLanguageModels.json`

Each model entry looks like:

```json
{
  "name": "Antigravity",
  "vendor": "customendpoint",
  "models": [
    {
      "id": "gemini-3-flash-agent",
      "name": "Antigravity: Gemini 3 Flash Agent",
      "url": "http://127.0.0.1:8420/v1",
      "toolCalling": true,
      "vision": true,
      "thinking": false,
      "maxInputTokens": 1048576,
      "maxOutputTokens": 8192
    }
  ]
}
```

The `url` always points to the **proxy** (port 8420), not CLIProxyAPI directly — this ensures schema sanitization and rate limiting are always applied.

---

## 🐛 Troubleshooting

### `$comment` / `enumDescriptions` 400 error from Gemini

**Root cause:** GitHub Copilot injects JSON Schema meta-keywords (`$comment`, `enumDescriptions`) into tool definitions. Gemini's API rejects these.

**Fix:** Already handled automatically by `sanitizeToolSchemas()` in the proxy. Make sure `antigravityCopilot.proxy.enabled` is `true`.

### Models not appearing in Copilot

1. Ensure the Antigravity server is running (status bar shows `$(broadcast) Antigravity: ON`)
2. Run command: **Antigravity: Configure Copilot Models**
3. Reload VS Code window (`Ctrl+Shift+P` → `Developer: Reload Window`)
4. Open Copilot Chat → model picker → **Manage Models** → search for "Antigravity"

### 429 / Rate limit errors

Thinking models (Claude Opus Thinking) have strict upstream rate limits. The proxy automatically:

- Queues concurrent requests (1 at a time for thinking models)
- Retries with exponential backoff (up to 5 retries)
- Shows a notification with the cooldown period

Reduce context sent by enabling tool output truncation (on by default).

---

## 📄 License

MIT — see [LICENSE](LICENSE)
