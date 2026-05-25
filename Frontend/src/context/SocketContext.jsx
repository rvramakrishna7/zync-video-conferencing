/**
 * context/SocketContext.jsx — Global Socket.IO connection.
 *
 * WHY keep the socket in Context?
 *
 * Socket.IO connections are expensive to create — they involve a network
 * handshake. You want ONE connection per user session, shared across
 * all components (chat, video controls, reactions all use the same socket).
 *
 * If you created a new socket inside each component, you'd have multiple
 * connections and events firing multiple times. Putting it in Context
 * ensures a single connection is created once and reused everywhere.
 */

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();

  /**
   * useRef vs useState for the socket:
   *
   * useState — changing it causes a re-render
   * useRef   — changing it does NOT cause a re-render
   *
   * We use useRef because we never want the socket object changing to
   * trigger a component re-render. The socket just needs to exist and
   * be accessible. socketRef.current is how you access the value.
   */
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create the socket connection once when the component mounts
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
    // Without this, you'd leak socket connections
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
