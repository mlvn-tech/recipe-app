"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (!error) {
      setSent(true);
    } else {
      alert("Er ging iets mis.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-xl font-semibold text-center">Inloggen</h1>

        {sent ? (
          <p className="text-sm text-center text-gray-500">
            Check je e-mail om in te loggen.
          </p>
        ) : (
          <>
            <input
              type="email"
              placeholder="E-mailadres"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-sm"
            />

            <button
              onClick={handleLogin}
              className="w-full bg-black text-white rounded-xl py-3 text-sm"
            >
              Verstuur magic link
            </button>
          </>
        )}
      </div>
    </main>
  );
}
