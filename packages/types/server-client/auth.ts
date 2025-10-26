// Response types
export interface SignupSuccessResponse {
    message: string;
  }
  
  export interface SignupErrorResponse {
    message: string;
  }
  
  export interface SigninSuccessResponse {
    message: string;
    jwt_token: string;
  }
  
  export interface SigninErrorResponse {
    message: string;
    code?: string; // for Prisma error codes
  }
