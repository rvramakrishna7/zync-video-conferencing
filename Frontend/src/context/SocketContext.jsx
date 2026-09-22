/**
 * context/SocketContext.jsx
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
    
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      autoConnect: true,
      reconnectionAttempts: 5,      
      reconnectionDelay: 1000,      
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

   
    return () => {
      socket.disconnect();
    };
  }, []); 

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
