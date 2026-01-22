"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
  id: string;
  username: string;
  displayName?: string;
  role: "user" | "admin";
};

export function AuthStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadUser() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    setUser(null);
  }

  useEffect(() => {
    loadUser();
  }, []);

  if (isLoading) {
    return (
      <div className="text-xs uppercase tracking-[0.3em] text-white/50">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/50">
        <span>Guest</span>
        <Link href="/sign-in" className="text-cyber-cyan hover:text-cyber-neon">
          Sign in
        </Link>
        <Link href="/sign-up" className="text-cyber-cyan hover:text-cyber-neon">
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/50">
      <span>{user.displayName || user.username}</span>
      {user.role === "admin" ? (
        <Link
          href="/dashboard"
          className="text-cyber-cyan hover:text-cyber-neon"
        >
          Admin
        </Link>
      ) : null}
      <button
        type="button"
        onClick={handleSignOut}
        className="text-cyber-cyan hover:text-cyber-neon"
      >
        Sign out
      </button>
    </div>
  );
}
