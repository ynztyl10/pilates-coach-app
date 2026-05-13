import { vi } from 'vitest';

export function mockFetch(responseMap: Record<string, (...args: any[]) => Promise<Response>>) {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    const path = new URL(url).pathname + new URL(url).search;

    for (const [key, handler] of Object.entries(responseMap)) {
      if (path === key || url.endsWith(key)) {
        return handler();
      }
    }

    return new Response(JSON.stringify({ code: 'NOT_FOUND', message: 'Mock not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as any;

  return () => {
    globalThis.fetch = originalFetch;
  };
}

export function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}
