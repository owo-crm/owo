"use client";

type ValidateResponse = {
  ok: true;
  token: string;
};

let tokenCache: string | null = null;
let tokenPromise: Promise<string> | null = null;

export async function getApiToken() {
  if (tokenCache) return tokenCache;
  if (tokenPromise) return tokenPromise;

  tokenPromise = fetch("/api/v1/auth/validate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      debug: {
        telegram_id: "seed-owner",
        display_name: "OWO Seed Owner",
        email: "owner@owo.local",
      },
    }),
  })
    .then(async (response) => {
      const data = (await response.json()) as ValidateResponse | { ok: false; error: string };
      if (!response.ok || !data || !("ok" in data) || data.ok !== true) {
        throw new Error("AUTH_VALIDATE_FAILED");
      }
      tokenCache = data.token;
      return data.token;
    })
    .finally(() => {
      tokenPromise = null;
    });

  return tokenPromise;
}

export async function apiFetch(input: string, init?: RequestInit) {
  const token = await getApiToken();
  const headers = new Headers(init?.headers ?? {});
  headers.set("authorization", `Bearer ${token}`);
  if (!headers.has("content-type") && init?.body) {
    headers.set("content-type", "application/json");
  }
  return fetch(input, {
    ...init,
    headers,
  });
}

