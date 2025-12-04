import { SignJWT } from "jose";
import { jwtSecret } from "./config";

export async function createToken(payload: any,expTime:string) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expTime)
    .sign(jwtSecret);
}
