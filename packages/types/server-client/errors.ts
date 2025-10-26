// packages/types/src/errors.ts

export type AppErrorType =
  | "VALIDATION_ERROR"
  | "USER_ALREADY_EXISTS"
  | "USER_NOT_FOUND"
  | "INVALID_PASSWORD"
  | "INTERNAL_SERVER_ERROR";

type ErrorMap = {
  [key in AppErrorType]: {
    statusCode: number;
    message: string;
  };
};

export const ErrorDefinitions: ErrorMap = {
  VALIDATION_ERROR: { statusCode: 400, message: "Validation failed" },
  USER_ALREADY_EXISTS: { statusCode: 409, message: "Username or email already exists" },
  USER_NOT_FOUND: { statusCode: 404, message: "User not found" },
  INVALID_PASSWORD: { statusCode: 401, message: "Invalid password" },
  INTERNAL_SERVER_ERROR: { statusCode: 500, message: "Something went wrong" },
};
