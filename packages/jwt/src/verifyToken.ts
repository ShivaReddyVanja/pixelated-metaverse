import { jwtVerify } from "jose";
import { jwtSecret } from "./config";
import {JwtTokenPayload} from "@myapp/types"


export async function verifyToken(token: string):Promise<JwtTokenPayload> {
  const { payload } = await jwtVerify(token, jwtSecret);
  return payload as JwtTokenPayload;
}
