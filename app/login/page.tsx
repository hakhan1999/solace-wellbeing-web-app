"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Leaf, ShieldCheck, Building2, UserRound } from "lucide-react";
import Image from "next/image";
import { Pick } from "@/components/solace/ui";

type LoginRole = "admin" | "hr" | "employee";

const roles = [
  {
    value: "admin" as const,
    label: "Consultant / Admin",
    icon: ShieldCheck,
  },
  {
    value: "hr" as const,
    label: "Corporate HR",
    icon: Building2,
  },
  {
    value: "employee" as const,
    label: "Employee",
    icon: UserRound,
  },
];

export default function LoginPage() {
  const router = useRouter();

  const [role, setRole] = useState<LoginRole>("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (role !== "admin") {
      setError("This role is coming soon. Please use Consultant / Admin.");
      return;
    }

    if (username.trim() !== "admin" || password !== "Solace@123") {
      setError("Incorrect username or password.");
      return;
    }

    try {
      sessionStorage.setItem("solace-demo-auth", "admin");
      setSubmitting(true);
      router.replace("/");
    } catch {
      setError("Browser storage is unavailable. Please enable it and retry.");
    }
  }

  return (
    <main className="solace-login">
      <section className="solace-login-intro">
        <div className="login-brand">
          <Image
            src="/logo.png"
            alt="Solace logo"
            width={190}
            height={51}
            priority
          />
        </div>

        <div className="login-intro-copy">
          <span className="login-eyebrow">PEOPLE FIRST, ALWAYS</span>

          <h1>A healthier workplace starts here.</h1>

          <p>
            Bring your people, activities and wellbeing programs together in one
            thoughtful workspace.
          </p>
        </div>
      </section>

      <section className="solace-login-form-area">
        <div className="solace-login-card">
          <span className="login-eyebrow">WELCOME TO SOLACE</span>
          <h2>Sign in to your workspace</h2>
          <p className="login-description">
            Choose your role and enter your credentials.
          </p>

          <form onSubmit={handleLogin}>
            <div className="login-field">
              <span>Sign in as</span>

              <Pick
                label="Sign in as"
                value={role}
                onChange={(value) => {
                  setRole(value as LoginRole);
                  setError("");
                }}
                options={[
                  { value: "admin", label: "Consultant / Admin" },
                  { value: "hr", label: "Corporate HR — Coming soon" },
                  { value: "employee", label: "Employee — Coming soon" },
                ]}
              />
            </div>

            <label className="login-field">
              Username
              <input
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                required
                disabled={role !== "admin" || submitting}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>

            <label className="login-field">
              Password
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                disabled={role !== "admin" || submitting}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {role !== "admin" && (
              <p className="login-role-message">
                {role === "hr" ? "Corporate HR" : "Employee"} login is coming
                soon. Select Consultant / Admin to explore the demo.
              </p>
            )}

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={role !== "admin" || submitting}
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="login-demo-credentials">
            <strong>Demo credentials</strong>
            <span>Username: admin</span>
            <span>Password: Solace@123</span>
          </div>
        </div>
      </section>
    </main>
  );
}
