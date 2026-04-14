const ASAAS_BASE_URLS = {
  sandbox: "https://sandbox.asaas.com/api/v3",
  production: "https://api.asaas.com/v3",
} as const

export class AsaasError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string
  ) {
    super(`Asaas API error ${status}: ${body}`)
    this.name = "AsaasError"
  }
}

function getBaseUrl(): string {
  const env = process.env.ASAAS_ENVIRONMENT ?? "sandbox"
  return env === "production" ? ASAAS_BASE_URLS.production : ASAAS_BASE_URLS.sandbox
}

function getApiKey(): string {
  const key = process.env.ASAAS_API_KEY
  if (!key) throw new Error("ASAAS_API_KEY environment variable is not set")
  return key
}

export async function asaasFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = `${getBaseUrl()}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "access_token": getApiKey(),
      ...init.headers,
    },
  })

  const text = await res.text()

  if (!res.ok) {
    throw new AsaasError(res.status, text)
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return text as unknown as T
  }
}
