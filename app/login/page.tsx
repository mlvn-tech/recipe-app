"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { styles } from "@/lib/styles";

type Step = "email" | "code" | "name";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);

    if (!error) {
      setStep("code");
    } else {
      console.error(error);
      alert("Er ging iets mis.");
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    setLoading(false);

    if (!error) {
      // Check of de gebruiker al een naam heeft
      const existingName = data.user?.user_metadata?.name;
      if (!existingName) {
        setIsNewUser(true);
        setStep("name");
      } else {
        router.replace(redirectTo);
      }
    } else {
      alert("Ongeldige code, probeer opnieuw.");
    }
  };

  const handleSaveName = async () => {
    if (!name.trim()) {
      router.replace(redirectTo);
      return;
    }

    setLoading(true);
    await supabase.auth.updateUser({ data: { name: name.trim() } });
    setLoading(false);

    router.replace(redirectTo);
  };

  return (
    <main
      className="min-h-dvh bg-[var(--color-bg)] flex flex-col justify-center px-5 pb-16"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 2rem)" }}
    >
      <div className="w-full max-w-sm mx-auto">
        {/* Stap 1 — Email */}
        {step === "email" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-[2rem] font-bold text-gray-900 leading-tight tracking-tight mb-2">
                Welkom
              </h1>
              <p className="text-sm text-gray-400">
                Vul je e-mailadres in om een inlogcode te ontvangen.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl px-5 py-6 space-y-4">
              <input
                type="email"
                placeholder="E-mailadres"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ fontSize: "16px" }}
                className="w-full rounded-2xl bg-[var(--color-bg)] border border-gray-200 px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition"
              />
              <div className="flex justify-center">
                <button
                  onClick={handleLogin}
                  disabled={loading || !email.trim()}
                  className="px-10 py-3 rounded-full bg-[var(--color-accent)] text-white text-sm font-medium disabled:opacity-40 active:scale-95 transition"
                >
                  {loading ? "Versturen..." : "Stuur inlogcode"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stap 2 — Code */}
        {step === "code" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-[2rem] font-bold text-gray-900 leading-tight tracking-tight mb-2">
                Check je mail
              </h1>
              <p className="text-sm text-gray-400">
                We hebben een 6-cijferige code gestuurd naar{" "}
                <span className="font-medium text-gray-700">{email}</span>.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl px-5 py-6 space-y-4">
              <input
                type="text"
                inputMode="numeric"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                style={{ fontSize: "16px" }}
                className="w-full rounded-2xl bg-[var(--color-bg)] border border-gray-200 px-4 py-3 text-gray-800 placeholder:text-gray-400 text-center text-2xl tracking-widest focus:outline-none focus:border-gray-300 transition"
              />
              <div className="flex justify-center">
                <button
                  onClick={handleVerify}
                  disabled={loading || code.length < 6}
                  className="px-10 py-3 rounded-full bg-[var(--color-accent)] text-white text-sm font-medium disabled:opacity-40 active:scale-95 transition"
                >
                  {loading ? "Controleren..." : "Inloggen"}
                </button>
              </div>
            </div>

            <button
              onClick={() => setStep("email")}
              className="w-full text-sm text-center text-gray-400"
            >
              Verkeerd e-mailadres? Ga terug
            </button>
          </div>
        )}

        {/* Stap 3 — Naam */}
        {step === "name" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-[2rem] font-bold text-gray-900 leading-tight tracking-tight mb-2">
                Hoe heet je?
              </h1>
              <p className="text-sm text-gray-400">
                Dan kunnen we je persoonlijk begroeten
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl px-5 py-6 space-y-4">
              <input
                type="text"
                placeholder="Je naam"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ fontSize: "16px" }}
                className="w-full rounded-2xl bg-[var(--color-bg)] border border-gray-200 px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition"
              />
              <div className="flex justify-center">
                <button
                  onClick={handleSaveName}
                  disabled={loading}
                  className="px-10 bg-[var(--color-accent)] py-3 rounded-full text-white text-sm font-medium disabled:opacity-40 active:scale-95 transition"
                >
                  {loading ? "Opslaan..." : "Doorgaan"}
                </button>
              </div>
            </div>
            <button
              onClick={() => router.replace(redirectTo)}
              className="w-full text-sm text-center text-gray-400"
            >
              Overslaan
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
