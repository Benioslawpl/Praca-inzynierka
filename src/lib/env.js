export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("Brak wymaganej zmiennej JWT_SECRET.");
  }

  return secret;
}
