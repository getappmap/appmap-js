import { readFile } from 'fs/promises';
import { buildAppMap, AppMap } from '@appland/models';

const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
function checkSource(data: unknown): asserts data is Record<string, unknown> {
  if (!record(data) || !Array.isArray(data.events) || !Array.isArray(data.classMap))
    throw new TypeError('expected events and classMap arrays');
  const classes: unknown[] = [...data.classMap];
  for (const co of classes) {
    if (
      !record(co) ||
      typeof co.name !== 'string' ||
      typeof co.type !== 'string' ||
      (co.children !== undefined && !Array.isArray(co.children))
    )
      throw new TypeError('malformed classMap entry');
    if (Array.isArray(co.children)) classes.push(...co.children);
  }
  const ids = new Set<number>();
  const threads = new Map<unknown, number[]>();
  for (const event of data.events) {
    if (
      !record(event) ||
      !Number.isSafeInteger(event.id) ||
      Number(event.id) <= 0 ||
      (event.event !== 'call' && event.event !== 'return') ||
      ids.has(Number(event.id))
    )
      throw new TypeError('malformed or duplicate event');
    ids.add(Number(event.id));
    const stack = threads.get(event.thread_id) || [];
    if (event.event === 'call') stack.push(Number(event.id));
    else if (stack.pop() !== event.parent_id)
      throw new TypeError('return does not match an active call');
    threads.set(event.thread_id, stack);
  }
}
export async function loadRecording(file: string): Promise<AppMap> {
  try {
    const data: unknown = JSON.parse(await readFile(file, 'utf8'));
    checkSource(data);
    return buildAppMap().source(data).build();
  } catch (cause) {
    throw new TypeError(`Invalid AppMap ${file}: ${String(cause)}`);
  }
}
