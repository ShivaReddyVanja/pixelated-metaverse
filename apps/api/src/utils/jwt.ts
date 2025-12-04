import { SignJWT, jwtVerify } from "jose";
import dotenv from "dotenv"

dotenv.config()

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function createToken(payload:any,exp:any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(secret);
}

export async function verifyToken(token:any) {
  const { payload } = await jwtVerify(token, secret);
  return payload;
}
