import WebSocket from "ws";
import { Room } from "../Room";

export interface Context {
  ws: WebSocket;
  id: string;
  roomId: string;
  getRoomOrError: (spaceId: string) => Room | null;
  sendMessageorError: (status: string, message: string) => void;
}
