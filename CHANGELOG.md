# Change Log

## [2.0.0] - 2026-06-24

### Cross-Platform Support (Linux & macOS)
- CLIProxyAPI now auto-downloads and installs silently on all platforms (Linux, macOS, Windows) — no manual setup or path configuration required
- Binary is downloaded automatically in the background with a progress notification; server starts immediately after
- Default executable path resolves to `~/CLIProxyAPI/cli-proxy-api` on Linux/macOS and `%USERPROFILE%\CLIProxyAPI\cli-proxy-api.exe` on Windows
- If a synced path from another OS is detected (e.g. a Windows `.exe` path on Linux), it is automatically ignored and the platform default is used instead
- Downloads platform-appropriate release asset: `.tar.gz` for Linux/macOS, `.zip` for Windows; excludes `no-plugin` variants
- Automatically sets executable permission (`chmod 755`) on the binary after extraction on Linux/macOS
- `Executable Path` setting is now **machine-local** (`"scope": "machine"`) — it is no longer synced across devices via Settings Sync, so each machine manages its own path independently

### Model Changes
- Removed `Antigravity: Gemini 3 Flash`, `Antigravity: Gemini 3.1 Flash Lite`, and `Antigravity: Gemini 3 Flash Agent` from the Copilot model picker — these are now officially provided by Antigravity directly

## [1.1.0] - 2026-06-23

- Fixed Gemini API 400 error caused by unsupported `propertyNames` JSON Schema keyword in tool/function parameter schemas
- Added additional unsupported JSON Schema keywords to sanitizer: `allOf`, `not`, `const`, `uniqueItems`, `multipleOf`, `exclusiveMinimum`, `exclusiveMaximum`
- Added GitHub Actions CI/CD workflow for auto-publishing to VS Code Marketplace on push to main
- Added `typecheck` script for TypeScript type checking
- Updated Node.js engine requirement to 20+
- Various internal improvements to schema sanitization pipeline

## [1.0.0] - 2026-06-01

- Initial release
- AntigravityServer with CLIProxyAPI integration for Google OAuth authentication
- ThrottlingProxyServer with Gemini-incompatible schema sanitization and rate limiting
- Auto-registration of Antigravity models (Claude, Gemini) in Copilot Chat
- Sidebar dashboard with live server status, account quota, and controls
- Rate limiter with configurable cooldown, retries, and concurrency limits
- Concurrency queue for Thinking vs Standard model request management
- ThinkingStreamTransformer for reasoning content annotation
- Model auto-discovery from Antigravity API
- Automatic Copilot Chat model configuration via Language Models API or legacy settings
