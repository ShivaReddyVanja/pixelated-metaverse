export const jwtSecret = new TextEncoder().encode(
  process.env.JWT_SECRET || ""
);

if (!process.env.JWT_SECRET) {
  console.warn("[@shared/jwt] Warning: JWT_SECRET is missing.");
}
