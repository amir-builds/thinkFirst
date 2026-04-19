import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentStudent = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/student/current`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setStudent(data.data.student);
      } else {
        setStudent(null);
      }
    } catch {
      setStudent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentStudent();
  }, [fetchCurrentStudent]);

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/student/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    }
    setStudent(null);
  };

  return (
    <AuthContext.Provider value={{ student, loading, logout, refetch: fetchCurrentStudent }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
