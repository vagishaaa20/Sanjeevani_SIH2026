import { createContext } from "react";
export const LanguageContext = createContext(null);
export function LanguageProvider({ children }) {
  return <LanguageContext.Provider value={{ locale: "en" }}>{children}</LanguageContext.Provider>;
}