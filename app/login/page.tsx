"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { styles } from "@/lib/styles";
import Card from "@/components/Card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const handleLogin = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
          redirectTo,
        )}`,
      },
    });

    if (!error) {
      setSent(true);
    } else {
      console.error(error);
      alert("Er ging iets mis.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 min-h-dvh bg-[var(--color-bg)] pb-28">
      <div className="w-full max-w-sm space-y-6 pt-4">
        <Card className="p-5">
          <div className="flex flex-col gap-4">
            <h1 className="text-lg font-semibold text-center">Inloggen</h1>

            {sent ? (
              <p className="text-sm text-center text-gray-500">
                Open de Magic Link in je e-mail om in te kunnen loggen
              </p>
            ) : (
              <>
                <input
                  type="email"
                  placeholder="E-mailadres"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input.default}
                />

                <button
                  onClick={handleLogin}
                  className={`${styles.button.save} w-full`}
                >
                  Verstuur Magic Link
                </button>
              </>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
