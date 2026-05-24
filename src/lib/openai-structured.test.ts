import assert from "node:assert/strict";
import test from "node:test";
import { shouldUseResponsesApi } from "@/lib/openai-structured";

test("shouldUseResponsesApi routes direct OpenAI reasoning models to Responses", () => {
  assert.equal(shouldUseResponsesApi("gpt-5"), true);
  assert.equal(shouldUseResponsesApi("gpt-5-mini"), true);
  assert.equal(shouldUseResponsesApi("o3"), true);
});

test("shouldUseResponsesApi keeps non-reasoning and compatible-baseURL models on chat completions", () => {
  assert.equal(shouldUseResponsesApi("gpt-4.1"), false);
  assert.equal(
    shouldUseResponsesApi("gpt-5", {
      apiKey: "test",
      baseURL: "https://api.moonshot.cn/v1",
    }),
    false
  );
});
