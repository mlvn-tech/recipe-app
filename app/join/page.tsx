"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Card from "@/components/Card";
import { styles } from "@/lib/styles";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace(`/login?redirect=/join`);
      return;
    }

    const { data: household } = await supabase
      .from("households")
      .select("id")
      .eq("invite_code", code.trim().toUpperCase())
      .maybeSingle();

    if (!household) {
      setError("Ongeldige code, probeer opnieuw.");
      setLoading(false);
      return;
    }

    const { data: existing } = await supabase
      .from("household_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("household_id", household.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("household_members").insert({
        household_id: household.id,
        user_id: user.id,
      });
    }

    setLoading(false);
    router.replace("/");
  };

  return (
    <>
      <Header title="Join huishouden" showBack={false} />
      <main
        style={{ paddingTop: "var(--header-height)" }}
        className="min-h-screen flex items-center justify-center px-6 bg-[var(--color-bg)]"
      >
        <div className="w-full max-w-sm">
          <Card className="p-5">
            <div className="flex flex-col gap-4">
              <h1 className="text-lg font-semibold text-center">
                Voer de huishoudcode in
              </h1>
              <p className="text-sm text-center text-gray-500">
                Vraag de code op bij iemand van het huishouden
              </p>
              <input
                type="text"
                placeholder="ABC123"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className={`${styles.input.default} text-center text-2xl tracking-widest uppercase`}
                maxLength={8}
              />
              {error && (
                <p className="text-sm text-center text-red-500">{error}</p>
              )}
              <button
                onClick={handleJoin}
                disabled={loading || code.length < 4}
                className={`${styles.button.save} w-full`}
              >
                {loading ? "Bezig..." : "Doe mee"}
              </button>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}
