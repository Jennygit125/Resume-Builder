import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext(undefined);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Hydrate user from localStorage on mount
  useEffect(() => {
    const firstName = localStorage.getItem("first_name");
    const token = localStorage.getItem("access_token");
    if (firstName && token) {
      setUser({ firstName });
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);