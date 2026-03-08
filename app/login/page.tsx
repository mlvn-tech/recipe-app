"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { styles } from "@/lib/styles";
import Card from "@/components/Card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });
    setLoading(false);

    if (!error) {
      setSent(true);
    } else {
      console.error(error);
      alert("Er ging iets mis.");
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    setLoading(false);

    if (!error) {
      router.replace(redirectTo);
    } else {
      alert("Ongeldige code, probeer opnieuw.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-[var(--color-bg)] pb-28">
      <div className="w-full max-w-sm space-y-6 pt-4">
        <Card className="p-5">
          <div className="flex flex-col gap-4">
            <h1 className="text-lg font-semibold text-center">Inloggen</h1>
            <p className="text-sm text-center text-[var(--color-text-secondary)]">
              Vul het e-mailadres in waar we de inlogcode naartoe mogen sturen
            </p>
            {!sent ? (
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
                  disabled={loading}
                  className={`${styles.button.save} w-full`}
                >
                  {loading ? "Versturen..." : "Stuur inlogcode"}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-center text-[var(--color-text-secondary)]">
                  Vul de 6-cijferige code in die we naar{" "}
                  <strong>{email}</strong>
                  hebben gestuurd
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className={`${styles.input.default} text-center text-2xl tracking-widest`}
                />
                <button
                  onClick={handleVerify}
                  disabled={loading || code.length < 6}
                  className={`${styles.button.save} w-full`}
                >
                  {loading ? "Controleren..." : "Inloggen"}
                </button>
                <button
                  onClick={() => setSent(false)}
                  className="text-sm text-center text-gray-400"
                >
                  Verkeerd e-mailadres? Ga terug
                </button>
              </>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
