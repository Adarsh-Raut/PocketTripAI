import OpenAI from "openai";

export const AI_PROVIDERS = ["gemini", "groq", "ollama"] as const;
export type AiProviderName = (typeof AI_PROVIDERS)[number];

export interface AiProviderConfig {
  name: AiProviderName;
  baseUrl: string;
  apiKey: string;
  model: string;
  jsonModel?: string;
}

export interface GenerateStructuredOptions {
  system?: string;
  prompt: string;
  schema: Record<string, unknown>;
  temperature?: number;
  maxTokens?: number;
}

const providerDefaults: Record<AiProviderName, AiProviderConfig> = {
  gemini: {
    name: "gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    apiKey: process.env.GEMINI_API_KEY ?? "",
    model: process.env.GEMINI_MODEL ?? "gemini-3.6-flash",
  },
  groq: {
    name: "groq",
    baseUrl: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY ?? "",
    model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
  },
  ollama: {
    name: "ollama",
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
    apiKey: "ollama",
    model: process.env.OLLAMA_MODEL ?? "qwen3:8b",
  },
};

const GROQ_MODEL_PRIORITY = [
  "llama-3.3-70b-versatile",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.6-27b",
  "llama-3.1-8b-instant",
];

let resolvedGroqModel: string | null = null;

function errorStatus(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  ) {
    return (error as { status: number }).status;
  }
  return undefined;
}

export class AiProvider {
  private client: OpenAI;
  readonly config: AiProviderConfig;

  constructor(config: AiProviderConfig) {
    this.config = config;
    this.client = new OpenAI({
      baseURL: config.baseUrl,
      apiKey: config.apiKey,
    });
  }

  private async resolveGroqModel(): Promise<string> {
    if (resolvedGroqModel) return resolvedGroqModel;

    try {
      const models = await this.client.models.list();
      const available = new Set(models.data.map((m) => m.id));
      resolvedGroqModel =
        GROQ_MODEL_PRIORITY.find((m) => available.has(m)) ?? this.config.model;
    } catch {
      resolvedGroqModel = this.config.model;
    }
    return resolvedGroqModel;
  }

  private async modelsToTry(): Promise<string[]> {
    if (this.config.name !== "groq") {
      return [this.config.model];
    }
    const explicit = process.env.GROQ_MODEL;
    const resolved = await this.resolveGroqModel();
    const models: string[] = [];
    if (explicit && explicit !== resolved) {
      models.push(explicit);
    }
    models.push(resolved);
    return models;
  }

  async generateStructured<T>(
    options: GenerateStructuredOptions
  ): Promise<T> {
    const messages = [
      ...(options.system
        ? [{ role: "system" as const, content: options.system }]
        : []),
      { role: "user" as const, content: options.prompt },
    ];
    const temperature = options.temperature ?? 0.7;
    const maxTokens =
      options.maxTokens ?? (this.config.name === "groq" ? 6000 : undefined);

    for (const model of await this.modelsToTry()) {
      try {
        const response = await this.client.chat.completions.create({
          model,
          temperature,
          ...(maxTokens ? { max_tokens: maxTokens } : {}),
          messages,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "structured_output",
              strict: true,
              schema: options.schema,
            },
          },
        });
        return this.parseContent(response.choices[0]?.message?.content);
      } catch (error) {
        const status = errorStatus(error);
        if (status === 404) {
          continue;
        }
        if (status === 400 || status === 422) {
          try {
            const response = await this.client.chat.completions.create({
              model,
              temperature,
              ...(maxTokens ? { max_tokens: maxTokens } : {}),
              messages,
              response_format: { type: "json_object" },
            });
            return this.parseContent(response.choices[0]?.message?.content);
          } catch (error2) {
            throw error2;
          }
        }
        throw error;
      }
    }

    throw new Error(`No working model for ${this.config.name}`);
  }

  private parseContent<T>(content: string | null | undefined): T {
    if (!content) {
      throw new Error(`Empty response from ${this.config.name}`);
    }
    return JSON.parse(content) as T;
  }

  async ping(): Promise<{ ok: boolean; model: string }> {
    let lastError: unknown;
    for (const model of await this.modelsToTry()) {
      try {
        const response = await this.client.chat.completions.create({
          model,
          messages: [{ role: "user", content: "Reply with the single word: pong" }],
          max_tokens: 10,
        });
        return { ok: true, model: response.model ?? model };
      } catch (error) {
        lastError = error;
        if (errorStatus(error) !== 404) {
          throw error;
        }
      }
    }
    throw lastError ?? new Error(`No working model for ${this.config.name}`);
  }
}

export function getProvider(name: AiProviderName): AiProvider {
  return new AiProvider(providerDefaults[name]);
}

export function getActiveProvider(): AiProvider {
  const name = (process.env.AI_PROVIDER ?? "gemini") as AiProviderName;
  return getProvider(name);
}