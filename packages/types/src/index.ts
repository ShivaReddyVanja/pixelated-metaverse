export * from "../../../node_modules/.prisma/client"; 

export type JwtTokenPayload = {
 userId:string
 roomId:string
 name:string,
 iat:number,
 exp:number
}