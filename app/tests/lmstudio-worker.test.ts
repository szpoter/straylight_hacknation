import { afterEach, expect, it, vi } from 'vitest';
import { SYSTEM_PROMPT } from '../src/lib/rag/model-tasks';
import { hasPreviewModel, lmStudioCompletion } from '../workers/lmstudio';

const model = 'qwen/qwen3.8-27b';
afterEach(() => vi.unstubAllGlobals());

it('requires the exact served model and uses only the localhost API', async () => {
  const fetch = vi.fn()
    .mockResolvedValueOnce(Response.json({ data: [{id: 'another-model'}] }))
    .mockResolvedValueOnce(Response.json({ data: [{id: model}] }));
  vi.stubGlobal('fetch', fetch);
  expect(await hasPreviewModel()).toBe(false);
  expect(await hasPreviewModel('synthetic-token')).toBe(true);
  expect(fetch).toHaveBeenLastCalledWith('http://127.0.0.1:1234/v1/models',
    expect.objectContaining({ redirect: 'error', headers: {authorization: 'Bearer synthetic-token'} }));
});

it('rejects substituted or truncated completions and returns only final content', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  async function run(id: string, tokens: number, reasoning = 0, part = 'message') {
    fetch.mockResolvedValueOnce(Response.json({model_instance_id: id, stats: {total_output_tokens: tokens, reasoning_output_tokens: reasoning},
      output: [{type: part, content:'synthetic final answer'}]}));
    return lmStudioCompletion('answer_evidence', undefined, 'Test publiczny', new AbortController().signal);
  }
  expect(await run('another-model', 8)).toEqual({reason:'model_mismatch'});
  expect(await run(model, 700)).toMatchObject({reason:'token_limit'});
  expect(await run(model, 8, 1)).toMatchObject({reason:'unexpected_reasoning'});
  expect(await run(model, 8, 0, 'tool_call')).toMatchObject({reason:'unexpected_output'});
  expect(await run(model, 8)).toMatchObject({model, content:'synthetic final answer'});
  const [url, init] = fetch.mock.lastCall ?? [];
  expect(url).toBe('http://127.0.0.1:1234/api/v1/chat');
  expect(init.redirect).toBe('error');
  expect(JSON.parse(init.body)).toMatchObject({model, stream:false, store:false, reasoning:'off', integrations:[], system_prompt:SYSTEM_PROMPT, input:'Test publiczny'});
});
