"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser, refreshAuth, registerUser } from "@/lib/auth.api";
import { ApiError } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getButtonText(loading: boolean, mode: "login" | "register"): string {
  if (loading) {
    return "Submitting...";
  }
  return mode === "login" ? "Sign in" : "Create account";
}

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  async function onSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const nameValue = formData.get("name");
    const emailValue = formData.get("email");
    const passwordValue = formData.get("password");
    const name = typeof nameValue === "string" ? nameValue.trim() : "";
    const email = typeof emailValue === "string" ? emailValue.trim() : "";
    const password = typeof passwordValue === "string" ? passwordValue : "";

    const nextFieldErrors: { name?: string; email?: string; password?: string } = {};
    if (mode === "register" && !name) {
      nextFieldErrors.name = "Name is required.";
    }
    if (!email) {
      nextFieldErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextFieldErrors.email = "Enter a valid email address.";
    }
    if (!password) {
      nextFieldErrors.password = "Password is required.";
    } else if (password.length < 6) {
      nextFieldErrors.password = "Password must be at least 6 characters.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setLoading(false);
      return;
    }

    try {
      if (mode === "login") {
        await loginUser(email, password);
      } else {
        await registerUser(name, email, password);
      }
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      if (mode === "login" && error instanceof ApiError && error.status === 401) {
        try {
          await refreshAuth();
          router.push("/dashboard");
          router.refresh();
          return;
        } catch (refreshError) {
          setMessage((refreshError as Error).message);
          return;
        }
      }
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const buttonText = getButtonText(loading, mode);

  return (
    <div className="w-full max-w-md">
      <div className="relative flex items-center rounded-full bg-white/5 border border-white/10 p-1 mb-8 overflow-hidden">
        <div
          aria-hidden
          className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-[var(--accent-1)] transition-transform duration-300 ease-out ${
            mode === "register" ? "translate-x-full" : "translate-x-0"
          }`}
        />
        <button
          type="button"
          onClick={() => setMode("login")}
          aria-pressed={mode === "login"}
          className={`flex-1 rounded-full px-4 py-2 text-sm transition-colors ${
            mode === "login"
              ? "text-[#0D0D0D]"
              : "text-white/70 hover:text-white"
          } relative z-10`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          aria-pressed={mode === "register"}
          className={`flex-1 rounded-full px-4 py-2 text-sm transition-colors ${
            mode === "register"
              ? "text-[#0D0D0D]"
              : "text-white/70 hover:text-white"
          } relative z-10`}
        >
          Register
        </button>
      </div>

      <div
        className={`glass rounded-3xl p-8 border border-white/10 transition-[min-height] duration-300 ease-out ${
          mode === "register" ? "min-h-[430px]" : "min-h-[370px]"
        }`}
      >
        <h2 className="text-2xl font-semibold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="text-sm text-white/60 mt-2">
          {mode === "login"
            ? "Sign in to your expense workspace."
            : "Start tracking daily expenses in minutes."}
        </p>

        {message ? (
          <div className="mt-4 rounded-xl border border-[var(--accent-3)]/40 bg-[rgba(255,0,153,0.1)] px-4 py-2 text-sm text-white">
            {message}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <div
            className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
              mode === "register" ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                name="name"
                required={mode === "register"}
                aria-invalid={Boolean(fieldErrors.name)}
              />
              {fieldErrors.name ? (
                <p className="text-xs text-[var(--accent-3)]">{fieldErrors.name}</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required aria-invalid={Boolean(fieldErrors.email)} />
            {fieldErrors.email ? (
              <p className="text-xs text-[var(--accent-3)]">{fieldErrors.email}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              aria-invalid={Boolean(fieldErrors.password)}
            />
            {fieldErrors.password ? (
              <p className="text-xs text-[var(--accent-3)]">{fieldErrors.password}</p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {buttonText}
          </Button>
        </form>
      </div>
    </div>
  );
}
