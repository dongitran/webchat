import { describe, it, expect, afterEach } from "vitest";
import { useSocketStore } from "@/stores/socket.store.js";
import type { Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@webchat/shared";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

afterEach(() => {
  useSocketStore.setState({ socket: null, connectionStatus: "disconnected" });
});

describe("socket store", () => {
  it("has correct initial state", () => {
    const state = useSocketStore.getState();
    expect(state.socket).toBeNull();
    expect(state.connectionStatus).toBe("disconnected");
  });

  it("setSocket stores the socket instance", () => {
    const fakeSocket = { id: "sock-1" } as unknown as AppSocket;
    useSocketStore.getState().setSocket(fakeSocket);
    expect(useSocketStore.getState().socket).toBe(fakeSocket);
  });

  it("setConnectionStatus updates status", () => {
    useSocketStore.getState().setConnectionStatus("connected");
    expect(useSocketStore.getState().connectionStatus).toBe("connected");
  });

  it("clearSocket resets socket and status to disconnected", () => {
    const fakeSocket = { id: "sock-1" } as unknown as AppSocket;
    useSocketStore.getState().setSocket(fakeSocket);
    useSocketStore.getState().setConnectionStatus("connected");
    useSocketStore.getState().clearSocket();
    expect(useSocketStore.getState().socket).toBeNull();
    expect(useSocketStore.getState().connectionStatus).toBe("disconnected");
  });
});
