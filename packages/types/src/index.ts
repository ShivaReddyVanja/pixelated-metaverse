export * from "../../../node_modules/.prisma/client";
export * from "./event";

export type JwtTokenPayload = {
    userId: string
    roomId: string
    name: string,
    iat: number,
    exp: number
}

export type Player = {
    x: number,
    y: number,
    socketId: string,
    id: string
}
