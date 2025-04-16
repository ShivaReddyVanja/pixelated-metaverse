import {Request } from "express"
interface customRequest extends Request{
    userId?:string
}

export {customRequest};