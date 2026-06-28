/**
 * context/SocketContext.jsx — Global Socket.IO connection.
 */

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();

  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Socket connection once when the component mounts
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      autoConnect: true,
      reconnectionAttempts: 5,      // try to reconnect 5 times if connection drops
      reconnectionDelay: 1000,      // wait 1 second between reconnect attempts
    });

    socketRef.current = socket;

    // Built-in socket.io events
    socket.on("connect", () => {
      console.log("🔌 Socket connected:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      setIsConnected(false);
    });

    // Cleanup: disconnect when the app unmounts (tab close, etc.)
    // Without this, socket connections leaks
    return () => {
      socket.disconnect();
    };
  }, []); // empty array = run once on mount

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used inside <SocketProvider>");
  }
  return context;
};
