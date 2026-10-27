export function isOrpcErrorWithCode(
  error: unknown,
  code: "NOT_FOUND" | "BAD_REQUEST" | "FORBIDDEN"
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}
