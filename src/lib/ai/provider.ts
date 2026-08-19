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

  async generateStructured<T>(
    options: GenerateStructuredOptions
  ): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      temperature: options.temperature ?? 0.7,
      messages: [
        ...(options.system ? [{ role: "system" as const, content: options.system }] : []),
        { role: "user" as const, content: options.prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "structured_output",
          strict: true,
          schema: options.schema,
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error(`Empty response from ${this.config.name}`);
    }

    return JSON.parse(content) as T;
  }

  async ping(): Promise<{ ok: boolean; model: string }> {
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [{ role: "user", content: "Reply with the single word: pong" }],
      max_tokens: 10,
    });
    return { ok: true, model: response.model ?? this.config.model };
  }
}

export function getProvider(name: AiProviderName): AiProvider {
  return new AiProvider(providerDefaults[name]);
}

export function getActiveProvider(): AiProvider {
  const name = (process.env.AI_PROVIDER ?? "gemini") as AiProviderName;
  return getProvider(name);
}