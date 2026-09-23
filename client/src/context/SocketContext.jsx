import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
const SocketContext = createContext();
export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();
  useEffect(() => {
    if (!user) {
      if (socket) socket.disconnect();
      setSocket(null);
      return;
    }
    const token = localStorage.getItem("token");
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', { auth: { token } });
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [user]);
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}
export function useSocket() {
  return useContext(SocketContext);
}
