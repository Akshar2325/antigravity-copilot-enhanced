import * as http from "http";

export interface CopilotModelConfig {
  name: string;
  url: string;
  model: string; // The model ID to send in API requests
  toolCalling: boolean;
  vision: boolean;
  thinking: boolean;
  maxInputTokens: number;
  maxOutputTokens: number;
  requiresAPIKey: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  toolCalling: boolean;
  vision: boolean;
  thinking: boolean;
}

// Fallback static models (used when server is not available)
// URL is a placeholder that gets rewritten by rewriteModelUrls() in extension.ts
const PLACEHOLDER_URL = "http://127.0.0.1:8317/v1";

export const ANTIGRAVITY_MODELS: Record<string, CopilotModelConfig> = {
  // ── Gemini 3 Flash family ─────────────────────────────────────────────────
  "gemini-3-flash": {
    name: "Antigravity: Gemini 3 Flash",
    url: PLACEHOLDER_URL,
    model: "gemini-3-flash",
    toolCalling: true,
    vision: true,
    thinking: false,
    maxInputTokens: 1048576,
    maxOutputTokens: 8192,
    requiresAPIKey: false,
  },
  "gemini-3-flash-agent": {
    name: "Antigravity: Gemini 3 Flash Agent",
    url: PLACEHOLDER_URL,
    model: "gemini-3-flash-agent",
    toolCalling: true,
    vision: true,
    thinking: false,
    maxInputTokens: 1048576,
    maxOutputTokens: 8192,
    requiresAPIKey: false,
  },

  // ── Gemini 3 Pro family ───────────────────────────────────────────────────
  "gemini-3-pro-low": {
    name: "Antigravity: Gemini 3 Pro Low",
    url: PLACEHOLDER_URL,
    model: "gemini-3-pro-low",
    toolCalling: true,
    vision: true,
    thinking: false,
    maxInputTokens: 2097152,
    maxOutputTokens: 8192,
    requiresAPIKey: false,
  },
  "gemini-3-pro-high": {
    name: "Antigravity: Gemini 3 Pro High",
    url: PLACEHOLDER_URL,
    model: "gemini-3-pro-high",
    toolCalling: true,
    vision: true,
    thinking: false,
    maxInputTokens: 2097152,
    maxOutputTokens: 8192,
    requiresAPIKey: false,
  },
  "gemini-pro-agent": {
    name: "Antigravity: Gemini Pro Agent",
    url: PLACEHOLDER_URL,
    model: "gemini-pro-agent",
    toolCalling: true,
    vision: true,
    thinking: false,
    maxInputTokens: 2097152,
    maxOutputTokens: 8192,
    requiresAPIKey: false,
  },

  // ── Gemini 3.1 family ─────────────────────────────────────────────────────
  "gemini-3.1-pro-low": {
    name: "Antigravity: Gemini 3.1 Pro Low",
    url: PLACEHOLDER_URL,
    model: "gemini-3.1-pro-low",
    toolCalling: true,
    vision: false, // text-only per server config
    thinking: false,
    maxInputTokens: 2097152,
    maxOutputTokens: 8192,
    requiresAPIKey: false,
  },
  "gemini-3.1-flash-image": {
    name: "Antigravity: Gemini 3.1 Flash Image",
    url: PLACEHOLDER_URL,
    model: "gemini-3.1-flash-image",
    toolCalling: true,
    vision: true,
    thinking: false,
    maxInputTokens: 1048576,
    maxOutputTokens: 8192,
    requiresAPIKey: false,
  },
  "gemini-3.1-flash-lite": {
    name: "Antigravity: Gemini 3.1 Flash Lite",
    url: PLACEHOLDER_URL,
    model: "gemini-3.1-flash-lite",
    toolCalling: true,
    vision: true,
    thinking: false,
    maxInputTokens: 1048576,
    maxOutputTokens: 8192,
    requiresAPIKey: false,
  },

  // ── Gemini 3.5 family ─────────────────────────────────────────────────────
  "gemini-3.5-flash-low": {
    name: "Antigravity: Gemini 3.5 Flash Low",
    url: PLACEHOLDER_URL,
    model: "gemini-3.5-flash-low",
    toolCalling: true,
    vision: true,
    thinking: false,
    maxInputTokens: 1048576,
    maxOutputTokens: 8192,
    requiresAPIKey: false,
  },

  // ── Claude 4.6 family ─────────────────────────────────────────────────────
  "claude-sonnet-4-6": {
    name: "Antigravity: Claude Sonnet 4.6",
    url: PLACEHOLDER_URL,
    model: "claude-sonnet-4-6",
    toolCalling: true,
    vision: true,
    thinking: false,
    maxInputTokens: 200000,
    maxOutputTokens: 8192,
    requiresAPIKey: false,
  },
  "claude-opus-4-6-thinking": {
    name: "Antigravity: Claude Opus 4.6 (Thinking)",
    url: PLACEHOLDER_URL,
    model: "claude-opus-4-6-thinking",
    toolCalling: true,
    vision: true,
    thinking: true,
    maxInputTokens: 32000, // conservative to avoid quota exhaustion
    maxOutputTokens: 2048,
    requiresAPIKey: false,
  },

  // ── GPT-OSS ───────────────────────────────────────────────────────────────
  "gpt-oss-120b-medium": {
    name: "Antigravity: GPT-OSS 120B (Medium)",
    url: PLACEHOLDER_URL,
    model: "gpt-oss-120b-medium",
    toolCalling: false, // no function calling support
    vision: true,
    thinking: false,
    maxInputTokens: 128000,
    maxOutputTokens: 4096,
    requiresAPIKey: false,
  },
};

export const MODEL_LIST: ModelInfo[] = [
  {
    id: "gemini-3-flash",
    name: "Gemini 3 Flash",
    toolCalling: true,
    vision: true,
    thinking: false,
  },
  {
    id: "gemini-3-flash-agent",
    name: "Gemini 3 Flash Agent",
    toolCalling: true,
    vision: true,
    thinking: false,
  },
  {
    id: "gemini-3-pro-low",
    name: "Gemini 3 Pro Low",
    toolCalling: true,
    vision: true,
    thinking: false,
  },
  {
    id: "gemini-3-pro-high",
    name: "Gemini 3 Pro High",
    toolCalling: true,
    vision: true,
    thinking: false,
  },
  {
    id: "gemini-pro-agent",
    name: "Gemini Pro Agent",
    toolCalling: true,
    vision: true,
    thinking: false,
  },
  {
    id: "gemini-3.1-pro-low",
    name: "Gemini 3.1 Pro Low",
    toolCalling: true,
    vision: false,
    thinking: false,
  },
  {
    id: "gemini-3.1-flash-image",
    name: "Gemini 3.1 Flash Image",
    toolCalling: true,
    vision: true,
    thinking: false,
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    toolCalling: true,
    vision: true,
    thinking: false,
  },
  {
    id: "gemini-3.5-flash-low",
    name: "Gemini 3.5 Flash Low",
    toolCalling: true,
    vision: true,
    thinking: false,
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    toolCalling: true,
    vision: true,
    thinking: false,
  },
  {
    id: "claude-opus-4-6-thinking",
    name: "Claude Opus 4.6 (Thinking)",
    toolCalling: true,
    vision: true,
    thinking: true,
  },
  {
    id: "gpt-oss-120b-medium",
    name: "GPT-OSS 120B (Medium)",
    toolCalling: false,
    vision: true,
    thinking: false,
  },
];

interface OpenAIModelsResponse {
  data: Array<{
    id: string;
    object: string;
    created?: number;
    owned_by?: string;
  }>;
}

/**
 * Fetches models dynamically from CLIProxyAPI's /v1/models endpoint
 */
export async function fetchModelsFromServer(
  host: string,
  port: number,
): Promise<Record<string, CopilotModelConfig>> {
  return new Promise((resolve, reject) => {
    const options: http.RequestOptions = {
      hostname: host,
      port: port,
      path: "/v1/models",
      method: "GET",
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`Server returned status ${res.statusCode}`));
            return;
          }

          const response: OpenAIModelsResponse = JSON.parse(body);
          const models: Record<string, CopilotModelConfig> = {};

          for (const model of response.data) {
            const modelId = model.id;
            const serverUrl = `http://${host}:${port}/v1`;

            // Prefer known, curated model specs where available.
            // This avoids advertising unrealistic token limits that can cause immediate upstream 429s.
            const known = ANTIGRAVITY_MODELS[modelId];
            if (known) {
              models[modelId] = {
                ...known,
                url: serverUrl,
                model: modelId,
              };
              continue;
            }

            const displayName = formatModelName(modelId);
            models[modelId] = {
              name: `Antigravity: ${displayName}`,
              url: serverUrl,
              model: modelId,
              toolCalling: inferToolCalling(modelId),
              vision: inferVision(modelId),
              thinking: inferThinking(modelId),
              maxInputTokens: inferContextWindow(modelId),
              maxOutputTokens: inferMaxOutputTokens(modelId),
              requiresAPIKey: false,
            };
          }

          resolve(models);
        } catch (error) {
          reject(new Error(`Failed to parse models response: ${error}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(new Error(`Failed to fetch models: ${error.message}`));
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout while fetching models"));
    });

    req.end();
  });
}

/**
 * Format model ID into a human-readable display name
 */
function formatModelName(modelId: string): string {
  // Handle Claude patterns
  if (modelId.includes("claude")) {
    if (modelId.includes("opus")) {
      const version = modelId.match(/(\d+[-.]?\d*)/)?.[1] ?? "";
      if (modelId.includes("thinking")) {
        return `Claude Opus ${version} (Thinking)`;
      }
      return `Claude Opus ${version}`;
    }
    if (modelId.includes("sonnet")) {
      const version = modelId.match(/(\d+[-.]?\d*)/)?.[1] ?? "";
      if (modelId.includes("thinking")) {
        return `Claude Sonnet ${version} (Thinking)`;
      }
      return `Claude Sonnet ${version}`;
    }
    if (modelId.includes("haiku")) {
      const version = modelId.match(/(\d+[-.]?\d*)/)?.[1] ?? "";
      return `Claude Haiku ${version}`;
    }
  }

  if (modelId.includes("gemini")) {
    // Clean up gemini model names
    let name = modelId
      .replace("gemini-", "Gemini ")
      .replace(/-preview.*$/, " (Preview)")
      .replace(/-/g, " ");
    // Capitalize properly
    name = name.replace(/\b\w/g, (c) => c.toUpperCase());
    return name;
  }

  // Default: capitalize and replace dashes
  return modelId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Model family specifications - easy to update when specs change
 * These are used to infer capabilities from model IDs
 */
const MODEL_SPECS = {
  gemini: {
    flash: { context: 1048576, output: 8192 }, // 1M context
    pro: { context: 2097152, output: 8192 }, // 2M context
    default: { context: 1048576, output: 8192 }, // 1M default
  },
  claude: {
    default: { context: 200000, output: 8192 }, // 200k context
  },
  gpt4: {
    default: { context: 128000, output: 4096 },
  },
  thinking: {
    // Keep thinking context and outputs very conservative.
    // Advertising huge token limits causes Copilot to request overly large generations,
    // which quickly trips upstream provider quotas (429 RESOURCE_EXHAUSTED).
    maxContext: 32000,
    maxOutput: 2048,
  },
  fallback: {
    context: 128000,
    output: 4096,
  },
};

/**
 * Infer context window size based on model ID
 */
function inferContextWindow(modelId: string): number {
  const id = modelId.toLowerCase();

  // Thinking models get reduced context to avoid quota exhaustion
  if (id.includes("thinking")) {
    return MODEL_SPECS.thinking.maxContext;
  }

  if (id.includes("gemini")) {
    if (id.includes("flash")) return MODEL_SPECS.gemini.flash.context;
    if (id.includes("pro")) return MODEL_SPECS.gemini.pro.context;
    return MODEL_SPECS.gemini.default.context;
  }

  if (id.includes("claude")) {
    return MODEL_SPECS.claude.default.context;
  }

  if (id.includes("gpt-4") || id.includes("gpt-oss")) {
    return MODEL_SPECS.gpt4.default.context;
  }

  return MODEL_SPECS.fallback.context;
}

/**
 * Infer max output tokens based on model ID
 */
function inferMaxOutputTokens(modelId: string): number {
  const id = modelId.toLowerCase();

  // Thinking models get strict output limit
  if (id.includes("thinking")) {
    return MODEL_SPECS.thinking.maxOutput;
  }

  if (id.includes("gemini")) {
    return MODEL_SPECS.gemini.default.output;
  }

  if (id.includes("claude")) {
    return MODEL_SPECS.claude.default.output;
  }

  return MODEL_SPECS.fallback.output;
}

/**
 * Infer if a model supports tool calling based on its ID
 */
function inferToolCalling(modelId: string): boolean {
  const noToolModels = ["gpt-oss", "basic"];
  return !noToolModels.some((pattern) =>
    modelId.toLowerCase().includes(pattern),
  );
}

/**
 * Infer if a model supports vision based on its ID.
 * Gemini and Claude models are multimodal by default.
 * Only explicitly text-only variants (e.g. gemini-3.1-pro-low) are excluded.
 */
function inferVision(modelId: string): boolean {
  const id = modelId.toLowerCase();

  // Known text-only models
  const textOnlyPatterns = ["3.1-pro-low", "lite", "basic"];
  if (textOnlyPatterns.some((p) => id.includes(p))) {
    return false;
  }

  // Gemini and Claude are vision by default
  if (id.includes("gemini") || id.includes("claude")) {
    return true;
  }

  // For other models, look for explicit vision keywords
  const visionKeywords = ["image", "vision", "computer-use", "multimodal"];
  return visionKeywords.some((keyword) => id.includes(keyword));
}

/**
 * Infer if a model supports thinking/reasoning based on its ID
 */
function inferThinking(modelId: string): boolean {
  return modelId.toLowerCase().includes("thinking");
}
