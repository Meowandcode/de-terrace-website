import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";

import { getCurrentSession, isAdminUser, signInAdmin } from "@/lib/supabase";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void getCurrentSession().then((session) => {
      if (session && isAdminUser(session.user)) {
        void navigate({ to: "/admin", replace: true });
      }
    });
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await signInAdmin(email, password);
      await navigate({ to: "/admin", replace: true });
    } catch (err) {
      console.error("Admin login failed:", err);
      setError(err instanceof Error ? err.message : "Login gagal. Periksa email dan password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6efe8] px-4 text-[#1e1a17]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm md:p-8"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7a5a45]">
          De Terrace
        </p>
        <h1 className="mt-3 text-4xl font-light">Admin Login</h1>

        <label className="mt-8 block text-sm text-[#4a372f]">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[#d7bca6] px-3 py-2 outline-none"
          />
        </label>

        <label className="mt-4 block text-sm text-[#4a372f]">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[#d7bca6] px-3 py-2 outline-none"
          />
        </label>

        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-full bg-[#2d2019] px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? "Memproses..." : "Login"}
        </button>
      </form>
    </main>
  );
}
