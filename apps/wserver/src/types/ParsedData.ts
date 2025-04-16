export type ParsedData =
  | {
      event: "create";
      name: string;
      width: number;
      height: number;
      spaceId: string;
      objectsArray: any[];
    }
  | {
      event: "join" | "leave";
      token: string;
      spaceId: string;
    }
  | {
      event: "move";
      token: string;
      spaceId: string;
      x: number;
      y: number;
    };
