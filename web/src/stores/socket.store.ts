import { create } from "zustand";
import type { Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@webchat/shared";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting";

interface SocketState {
  socket: AppSocket | null;
  connectionStatus: ConnectionStatus;
  setSocket: (socket: AppSocket) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  clearSocket: () => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  socket: null,
  connectionStatus: "disconnected",
  setSocket: (socket) => set({ socket }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  clearSocket: () => set({ socket: null, connectionStatus: "disconnected" }),
}));
