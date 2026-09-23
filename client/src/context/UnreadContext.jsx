import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import api from "../api/axios";
const UnreadContext = createContext();
export function UnreadProvider({ children }) {
  const { user } = useAuth();
  const socket = useSocket();
  const [unreadTotal, setUnreadTotal] = useState(0);
  const refreshUnread = async () => {
    if (!user) return;
    try {
      const res = await api.get("/chat/conversations");
      const total = res.data.reduce(
        (sum, conv) => sum + (conv.unreadCount || 0),
        0,
      );
      setUnreadTotal(total);
    } catch (err) {
      // fail silently here; this is a background indicator, not a critical action
    }
  };
  useEffect(() => {
    refreshUnread();
  }, [user]);
  useEffect(() => {
    if (!socket) return;
    socket.on("newMessage", refreshUnread);
    return () => socket.off("newMessage", refreshUnread);
  }, [socket]);
  return (
    <UnreadContext.Provider value={{ unreadTotal, refreshUnread }}>
      {" "}
      {children}{" "}
    </UnreadContext.Provider>
  );
}
export function useUnread() {
  return useContext(UnreadContext);
}
