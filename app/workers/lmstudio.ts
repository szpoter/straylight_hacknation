import { localModelIds, SYSTEM_PROMPT, taskInstructions, taskGrammar, taskSpecs, type ModelTaskKind } from '../src/lib/rag/model-tasks';

const origin = 'http://127.0.0.1:1234';
const model = localModelIds['qwen-27b'];

function auth(token?: string): Record<string, string> {
  return token ? { authorization: 'Bearer ' + token } : {};
}

export async function hasPreviewModel(token?: string) {
  try {
    const response = await fetch(origin + '/v1/models', {
      redirect: 'error', signal: AbortSignal.timeout(1500), headers: auth(token),
    });
    return response.ok && (await response.json()).data.some((m: {id?: string}) => m.id === model);
  } catch { return false; }
}

export async function lmStudioCompletion(kind: ModelTaskKind, input: Parameters<typeof taskGrammar>[1],
  prompt: string, signal: AbortSignal, token?: string) {
  const system = kind === 'answer_evidence' ? SYSTEM_PROMPT : taskInstructions[kind];
  const budget = taskSpecs[kind].tokens;
  const response = await fetch(origin + '/api/v1/chat', {
    method: 'POST', redirect: 'error', signal, headers: { ...auth(token), 'content-type': 'application/json' },
    body: JSON.stringify({ model, stream: false, temperature: 0.1, reasoning: 'off', store: false, integrations: [],
      max_output_tokens: budget, input: prompt,
      system_prompt: input ? system + '\nZwróć wyłącznie JSON zgodny ze schematem: ' + JSON.stringify(taskGrammar(kind, input)) : system }),
  });
  if (!response.ok) return { reason: 'http_' + response.status };
  const result = await response.json();
  if (result.model_instance_id !== model) return { reason: 'model_mismatch' };
  if (result.stats?.reasoning_output_tokens !== 0) return { model, reason: 'unexpected_reasoning' };
  if (result.stats.total_output_tokens >= budget) return { model, reason: 'token_limit' };
  if (result.output?.length !== 1 || result.output[0]?.type !== 'message') return { model, reason: 'unexpected_output' };
  return { model, content: result.output[0].content, reason: 'invalid_output' };
}
