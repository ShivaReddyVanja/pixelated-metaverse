import {z} from "zod";

const userSignupSchema = z.object({
    username: z.string().max(30).min(1,"username cannot be empty"),
    email :z.string().max(60).email("must be a valid email address"),
    password:z.string().max(30).min(8,"password must be min 8 characters"),
})

const userSigninSchema = z.object({
    username : z.string().max(30).min(1,"username is required"),
    password: z.string().max(30)
})
const mapUploadSchema = z.object({
    name: z.string().max(30).min(1,"Name is required"),
    width: z.number().int().positive(),
    height:z.number().int().positive(),
    thumbnail:z.string().url("Invalid url for image"),
    data: z.any()
})
const createSpaceSchema = z.object({
    name:z.string().max(30),
    description:z.string().max(100),
    mapId : z.string(),
})
const jwtPayloadSchema = z.object({
    userId:z.string(),
    role: z.enum(["user","admin"])
})


export {userSigninSchema,userSignupSchema,mapUploadSchema,createSpaceSchema,jwtPayloadSchema}