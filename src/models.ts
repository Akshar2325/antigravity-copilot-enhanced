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

interface OpenAIModelsResponse {
  data: Array<{
    id: string;
    object: string;
    created?: number;
    owned_by?: string;
  }>;
}

/**
 * Model IDs that are now officially provided by Antigravity and should
 * not be surfaced as separate entries in Copilot Chat.
 */
const EXCLUDED_MODEL_IDS = new Set([
  "gemini-3-flash",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-agent",
]);

/**
 * Fetches models dynamically from CLIProxyAPI's /v1/models endpoint
 */
export async function fetchModelsFromServer(
  host: string,
  port: number,
): Promise<{ models: Record<string, CopilotModelConfig>; rawResponse: any }> {
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

            // Skip models now officially provided by Antigravity
            if (EXCLUDED_MODEL_IDS.has(modelId)) {
              continue;
            }

            const serverUrl = `http://${host}:${port}/v1`;
            const displayName = formatModelName(modelId);

            models[modelId] = {
              name: `Antigravity: ${displayName}`,
              url: serverUrl,
              model: modelId,
              toolCalling: true, // toolCalling: true for all models
              vision: true,      // vision: true for all models
              thinking: false,   // thinking: false for all models
              maxInputTokens: 128000,   // maxInputTokens: 128000 for all
              maxOutputTokens: 16000,   // maxOutputTokens: 16000 for all
              requiresAPIKey: false,
            };
          }

          resolve({ models, rawResponse: response });
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
 * Format model ID into a human-readable display name:
 * Removes "-" and adds space for each word, making the first letter capital.
 */
export function formatModelName(modelId: string): string {
  return modelId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
