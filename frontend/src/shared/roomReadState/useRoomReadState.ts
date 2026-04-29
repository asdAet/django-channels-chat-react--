import { useContext } from "react";

import { RoomReadStateContext } from "./context";

export const useRoomReadController = () => {
  return useContext(RoomReadStateContext);
};

export const useRoomReadState = (
  roomId: string | number | null | undefined,
) => {
  const context = useRoomReadController();
  return context.getRoomState(roomId);
};
