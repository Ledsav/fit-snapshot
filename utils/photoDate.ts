export function parsePhotoDateString(raw?: string | null): Date {
  if (!raw) return new Date();

  const normalized =
    raw.includes("T") && raw.includes("Z")
      ? raw
      : raw.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");

  const parsed = new Date(normalized);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}
