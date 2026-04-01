{{#if (eq modelProvider "Bedrock")}}
import { BedrockModel } from "@strands-agents/sdk";

export function loadModel() {
  return new BedrockModel({
    modelId: "global.anthropic.claude-sonnet-4-5-20250929-v1:0",
  });
}
{{/if}}
{{#if (eq modelProvider "Anthropic")}}
import { AnthropicModel } from "@strands-agents/sdk";

const IDENTITY_ENV_VAR = "{{identityProviders.[0].envVarName}}";

function getApiKey(): string {
  if (process.env.LOCAL_DEV === "1") {
    const apiKey = process.env[IDENTITY_ENV_VAR];
    if (!apiKey) {
      throw new Error(
        `${IDENTITY_ENV_VAR} not found. Add ${IDENTITY_ENV_VAR}=your-key to .env.local`
      );
    }
    return apiKey;
  }
  // In deployed environments, AgentCore Identity provides the key via env var
  return process.env[IDENTITY_ENV_VAR] ?? "";
}

export function loadModel() {
  return new AnthropicModel({
    apiKey: getApiKey(),
    modelId: "claude-sonnet-4-5-20250514",
  });
}
{{/if}}
{{#if (eq modelProvider "OpenAI")}}
import { OpenAIModel } from "@strands-agents/sdk";

const IDENTITY_ENV_VAR = "{{identityProviders.[0].envVarName}}";

function getApiKey(): string {
  if (process.env.LOCAL_DEV === "1") {
    const apiKey = process.env[IDENTITY_ENV_VAR];
    if (!apiKey) {
      throw new Error(
        `${IDENTITY_ENV_VAR} not found. Add ${IDENTITY_ENV_VAR}=your-key to .env.local`
      );
    }
    return apiKey;
  }
  return process.env[IDENTITY_ENV_VAR] ?? "";
}

export function loadModel() {
  return new OpenAIModel({
    apiKey: getApiKey(),
    modelId: "gpt-4.1",
  });
}
{{/if}}
{{#if (eq modelProvider "Gemini")}}
import { GeminiModel } from "@strands-agents/sdk";

const IDENTITY_ENV_VAR = "{{identityProviders.[0].envVarName}}";

function getApiKey(): string {
  if (process.env.LOCAL_DEV === "1") {
    const apiKey = process.env[IDENTITY_ENV_VAR];
    if (!apiKey) {
      throw new Error(
        `${IDENTITY_ENV_VAR} not found. Add ${IDENTITY_ENV_VAR}=your-key to .env.local`
      );
    }
    return apiKey;
  }
  return process.env[IDENTITY_ENV_VAR] ?? "";
}

export function loadModel() {
  return new GeminiModel({
    apiKey: getApiKey(),
    modelId: "gemini-2.5-flash",
  });
}
{{/if}}
