# Change Log

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
