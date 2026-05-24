import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

export interface OpenAIClientConfig {
  apiKey: string;
  baseURL?: string;
}

interface StructuredPromptOptions<Schema extends z.ZodType> {
  model: string;
  schema: Schema;
  schemaName: string;
  prompt: string;
  instructions?: string;
  temperature: number;
  clientConfig?: OpenAIClientConfig;
  maxTokens?: number;
}

function getOpenAI(clientConfig?: OpenAIClientConfig) {
  return new OpenAI({
    apiKey: clientConfig?.apiKey ?? process.env.OPENAI_API_KEY,
    baseURL: clientConfig?.baseURL,
  });
}

function getChatMaxTokenOption(model: string, maxTokens?: number) {
  if (!maxTokens) {
    return {};
  }

  const normalizedModel = model.trim().toLowerCase();
  if (
    normalizedModel.startsWith("gpt-5") ||
    normalizedModel.startsWith("o1") ||
    normalizedModel.startsWith("o3") ||
    normalizedModel.startsWith("o4")
  ) {
    return { max_completion_tokens: maxTokens };
  }

  return { max_tokens: maxTokens };
}

function getResponsesMaxTokenOption(maxTokens?: number) {
  if (!maxTokens) {
    return {};
  }

  return { max_output_tokens: maxTokens };
}

function getTemperatureOption(model: string, temperature: number) {
  const normalizedModel = model.trim().toLowerCase();
  if (
    normalizedModel.startsWith("gpt-5") ||
    normalizedModel.startsWith("o1") ||
    normalizedModel.startsWith("o3") ||
    normalizedModel.startsWith("o4")
  ) {
    return {};
  }

  return { temperature };
}

export function shouldUseResponsesApi(
  model: string,
  clientConfig?: OpenAIClientConfig
) {
  const normalizedModel = model.trim().toLowerCase();
  return (
    !clientConfig?.baseURL &&
    (normalizedModel.startsWith("gpt-5") ||
      normalizedModel.startsWith("o1") ||
      normalizedModel.startsWith("o3") ||
      normalizedModel.startsWith("o4"))
  );
}

export async function generateStructuredJsonFromPrompt<
  Schema extends z.ZodType
>({
  model,
  schema,
  schemaName,
  prompt,
  instructions,
  temperature,
  clientConfig,
  maxTokens,
}: StructuredPromptOptions<Schema>): Promise<z.infer<Schema>> {
  const client = getOpenAI(clientConfig);

  if (shouldUseResponsesApi(model, clientConfig)) {
    const response = await client.responses.parse({
      model,
      input: prompt,
      ...(instructions ? { instructions } : {}),
      text: {
        format: zodTextFormat(schema, schemaName),
      },
      ...getTemperatureOption(model, temperature),
      ...getResponsesMaxTokenOption(maxTokens),
    });

    if (response.output_parsed === null) {
      throw new Error(`OpenAI returned no parsed ${schemaName} output.`);
    }

    return schema.parse(response.output_parsed);
  }

  const completion = await client.chat.completions.create({
    model,
    messages: [
      ...(instructions
        ? [{ role: "system" as const, content: instructions }]
        : []),
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    ...getTemperatureOption(model, temperature),
    ...getChatMaxTokenOption(model, maxTokens),
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error(`OpenAI returned an empty ${schemaName} payload.`);
  }

  return schema.parse(JSON.parse(raw) as unknown);
}
