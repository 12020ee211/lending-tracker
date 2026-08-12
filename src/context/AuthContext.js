import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getUsers, saveUsers } from "../services/github";

const MASTER_ADMIN = process.env.REACT_APP_MASTER_ADMIN_EMAIL || "pamisettymobile@gmail.com";
const SESSION_KEY = "ledger_session";

const AuthContext = createContext(null);

// Simple deterministic hash (not cryptographic — data lives in a private repo)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "ledger_salt_v1");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const s = sessionStorage.getItem(SESSION_KEY);
    return s ? JSON.parse(s) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Persist session
  useEffect(() => {
    if (currentUser) sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    else sessionStorage.removeItem(SESSION_KEY);
  }, [currentUser]);

  const register = useCallback(async ({ name, email, password, phone }) => {
    setLoading(true);
    setError(null);
    try {
      const { users, sha } = await getUsers();
      const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (exists) throw new Error("An account with this email already exists.");

      const hashed = await hashPassword(password);
      const isMaster = email.toLowerCase() === MASTER_ADMIN.toLowerCase();

      const newUser = {
        id: crypto.randomUUID(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || "",
        passwordHash: hashed,
        role: isMaster ? "master_admin" : "viewer",
        createdAt: new Date().toISOString(),
        active: true,
      };

      await saveUsers([...users, newUser], sha);
      const { passwordHash: _, ...safe } = newUser;
      setCurrentUser(safe);
      return safe;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setLoading(true);
    setError(null);
    try {
      const { users } = await getUsers();
      const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
      if (!user) throw new Error("No account found with that email.");
      if (!user.active) throw new Error("This account has been deactivated. Contact an administrator.");

      const hashed = await hashPassword(password);
      if (hashed !== user.passwordHash) throw new Error("Incorrect password.");

      const { passwordHash: _, ...safe } = user;
      setCurrentUser(safe);
      return safe;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    if (!currentUser) return;
    const { users } = await getUsers();
    const updated = users.find((u) => u.id === currentUser.id);
    if (updated) {
      const { passwordHash: _, ...safe } = updated;
      setCurrentUser(safe);
    }
  }, [currentUser]);

  const can = useCallback(
    (action) => {
      if (!currentUser) return false;
      const role = currentUser.role;
      const perms = {
        master_admin: ["view", "add_loan", "edit_loan", "delete_loan", "manage_users"],
        admin: ["view", "add_loan", "edit_loan", "delete_loan", "manage_users"],
        editor: ["view", "add_loan", "edit_loan"],
        viewer: ["view"],
      };
      return (perms[role] || []).includes(action);
    },
    [currentUser]
  );

  return (
    <AuthContext.Provider value={{ currentUser, loading, error, setError, register, login, logout, refreshCurrentUser, can, MASTER_ADMIN }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
