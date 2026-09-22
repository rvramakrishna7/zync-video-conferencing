/**
 * context/AuthContext.jsx 
 */

import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";


const AuthContext = createContext(null);


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

 
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("zync_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
       
        const { data } = await authAPI.getMe();
        setUser(data.user);
      } catch {
       
        localStorage.removeItem("zync_token");
      } finally {
        setLoading(false); 
      }
    };

    restoreSession();
  }, []);

  
  const login = (token, userData) => {
    localStorage.setItem("zync_token", token);
    setUser(userData);
  };


  const logout = () => {
    localStorage.removeItem("zync_token");
    setUser(null);
  };

  
  const value = {
    user,       
    loading,    
    login,
    logout,
    isAuthenticated: !!user, 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
};
