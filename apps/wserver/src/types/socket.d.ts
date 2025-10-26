// types/socket.d.ts
import "socket.io";

declare module "socket.io" {
  interface Socket {
    data: {
      user?: {
        userId: string;
        email?: string;
        [key: string]: any;
      };
    };
  }
}
