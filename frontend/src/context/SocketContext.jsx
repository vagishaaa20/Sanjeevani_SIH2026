import { createContext } from "react";
export const SocketContext = createContext(null);
export function SocketProvider({ children }) {
  return <SocketContext.Provider value={{ socket: null }}>{children}</SocketContext.Provider>;
}