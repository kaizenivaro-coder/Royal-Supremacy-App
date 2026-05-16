const baseUrl = import.meta.env?.BASE_URL ?? "/";

export function publicAsset(path: string) {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}${path.replace(/^\/+/, "")}`;
}
