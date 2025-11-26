import { User } from '../types';

export const login = async (username: string, password: string): Promise<{ user: User | null; error?: string }> => {
  try {
    // Attempt to initialize DB schema on login attempt to ensure tables exist
    await fetch('/api/init').catch(() => {});

    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password })
    });

    const data = await response.json();
    if (!response.ok) {
      return { user: null, error: data.error || 'Errore login' };
    }

    return { user: data.user };
  } catch (error) {
    console.error("Login API error:", error);
    return { user: null, error: "Errore di connessione al server." };
  }
};

export const register = async (firstName: string, lastName: string, username: string, password: string): Promise<{ user: User | null; error?: string }> => {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', firstName, lastName, username, password })
    });

    const data = await response.json();
    if (!response.ok) return { user: null, error: data.error };
    return { user: data.user };
  } catch (error) {
    return { user: null, error: "Errore di connessione." };
  }
};

export const updateUserProfile = async (userId: string, data: Partial<User>): Promise<User> => {
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'updateProfile', userId, data })
  });
  
  const res = await response.json();
  if (!response.ok) throw new Error(res.error);
  return res.user;
};

// ADMIN FUNCTIONS

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch('/api/admin');
    if (!response.ok) return [];
    return await response.json();
  } catch (e) {
    return [];
  }
};

export const createUser = async (username: string, password: string): Promise<User> => {
  const response = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'createUser', username, password })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
};

export const updateUserStatus = async (userId: string, isActive: boolean, expiresAt: string | null): Promise<void> => {
  await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'updateStatus', userId, isActive, expiresAt })
  });
};

export const changeUserPassword = async (userId: string, newPass: string): Promise<void> => {
  await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'changePassword', userId, password: newPass })
  });
};