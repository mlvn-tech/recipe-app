"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { Share, Copy, Pencil, Check } from "lucide-react";
import { generateInviteCode } from "@/lib/generateInviteCode";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        setUser(null);
        setHouseholdId(null);
        setInviteCode(null);
        setLoading(false);
        return;
      }

      const currentUser = data.user;
      setUser(currentUser);
      setName(currentUser.user_metadata?.name ?? "");

      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id, households:households(invite_code)")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (membership) {
        setHouseholdId(membership.household_id);
        setInviteCode((membership.households as any)?.invite_code ?? null);
      } else {
        setHouseholdId(null);
        setInviteCode(null);
      }

      if (membership && !(membership.households as any)?.invite_code) {
        const newCode = generateInviteCode();
        await supabase
          .from("households")
          .update({ invite_code: newCode })
          .eq("id", membership.household_id);
        setInviteCode(newCode);
      }

      setLoading(false);
    };

    init();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setHouseholdId(null);
    setInviteCode(null);
    router.replace("/login");
  };

  const handleSaveName = async () => {
    setSavingName(true);
    await supabase.auth.updateUser({ data: { name: name.trim() } });
    setSavingName(false);
    setEditingName(false);
  };

  const handleCreateHousehold = async () => {
    if (!user) return;

    const newCode = generateInviteCode();

    const { data: household, error } = await supabase
      .from("households")
      .insert({ name: "Ons huishouden", invite_code: newCode })
      .select()
      .single();

    if (error) {
      console.error("CREATE HOUSEHOLD ERROR:", error);
      return;
    }

    await supabase.from("household_members").insert({
      household_id: household.id,
      user_id: user.id,
    });

    setHouseholdId(household.id);
    setInviteCode(newCode);
  };

  const handleCopy = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const handleShare = async () => {
    if (!inviteCode) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Word lid van mijn huishouden",
          text: `Gebruik deze code om mijn huishouden te joinen: ${inviteCode}`,
        });
      } else {
        await navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") console.error("Share failed:", err);
    }
  };

  return (
    <main
      className="min-h-dvh bg-[var(--color-bg)] pb-32"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
    >
      {/* Hero */}
      <div className="px-5 pb-6">
        <h1 className="text-[2rem] font-bold text-gray-900 leading-tight tracking-tight">
          Account
        </h1>
      </div>

      <div className="px-5 space-y-6">
        {loading ? (
          // Skeleton — zelfde hoogte als de echte content zodat de nav niet verspringt
          <div className="space-y-6 animate-pulse">
            <div>
              <div className="h-4 w-24 bg-gray-100 rounded mb-3" />
              <div className="bg-white border border-gray-200 rounded-3xl px-5 py-4 h-14" />
            </div>
            <div>
              <div className="h-4 w-16 bg-gray-100 rounded mb-3" />
              <div className="bg-white border border-gray-200 rounded-3xl px-5 py-4 h-14" />
            </div>
            <div>
              <div className="h-4 w-24 bg-gray-100 rounded mb-3" />
              <div className="bg-white border border-gray-200 rounded-3xl px-5 py-6 h-48" />
            </div>
          </div>
        ) : (
          <>
            {/* Account sectie */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">
                Ingelogd als
              </h3>
              <div className="bg-white border border-gray-200 rounded-3xl px-5 py-4 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-800">
                  {user?.email ?? "—"}
                </p>
                <button
                  onClick={handleLogout}
                  className="text-xs font-medium text-[var(--color-accent)]"
                >
                  Uitloggen
                </button>
              </div>
            </div>

            {/* Naam sectie */}
            {user?.email && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">
                  Naam
                </h3>
                <div className="bg-white border border-gray-200 rounded-3xl px-5 py-4 flex items-center justify-between gap-3">
                  {editingName ? (
                    <>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ fontSize: "16px" }}
                        autoFocus
                        className="flex-1 bg-transparent text-sm font-medium text-gray-800 focus:outline-none"
                        placeholder="Je naam"
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={savingName}
                        className="text-sm font-medium text-[var(--color-accent)]"
                      >
                        {savingName ? "..." : "Opslaan"}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-800 flex-1">
                        {name || (
                          <span className="text-gray-400">Nog geen naam</span>
                        )}
                      </p>
                      <button
                        onClick={() => setEditingName(true)}
                        className="text-xs font-medium text-[var(--color-accent)]"
                      >
                        Wijzig
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* CASE 1: Heeft household */}
            {user?.email && householdId && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">
                  Huishouden
                </h3>
                <div className="bg-white border border-gray-200 rounded-3xl px-5 py-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-1">
                    Samen recepten verzamelen?
                  </h2>
                  <p className="text-sm text-gray-400 mb-6">
                    Laat iemand de QR-code scannen of deel de uitnodigingscode
                  </p>

                  <div className="flex items-center gap-5">
                    <div className="py-3 px-6 rounded-2xl shrink-0">
                      <QRCodeCanvas value={inviteCode ?? ""} size={80} />
                      <div className="pt-4">
                        <p className="flex justify-center text-lg font-semibold tracking-widest text-gray-900">
                          {inviteCode}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 flex-1">
                      <button
                        onClick={handleShare}
                        className="flex justify-center gap-2 py-2.5 px-4 rounded-full bg-[var(--color-bg)] border border-gray-200 text-xs font-medium text-gray-700 active:scale-95 transition"
                      >
                        <Share size={14} strokeWidth={1.5} />
                        Deel
                      </button>
                      <button
                        onClick={handleCopy}
                        className="flex justify-center gap-2 py-2.5 px-4 rounded-full bg-[var(--color-bg)] border border-gray-200 text-xs font-medium text-gray-700 active:scale-95 transition"
                      >
                        <Copy size={14} strokeWidth={1.5} />
                        {copied ? "Gekopieerd!" : "Kopieer"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CASE 2: Geen household */}
            {user?.email && !householdId && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  Huishouden
                </p>
                <div className="bg-white border border-gray-200 rounded-3xl px-5 py-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-1">
                    Nog geen huishouden
                  </h2>
                  <p className="text-sm text-gray-400 mb-6">
                    Maak een huishouden aan of voeg je bij een bestaand
                    huishouden met een code.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleCreateHousehold}
                      className="w-full py-3 rounded-2xl bg-gray-900 text-white text-sm font-medium active:scale-95 transition"
                    >
                      Maak huishouden aan
                    </button>
                    <button
                      onClick={() => router.push("/join")}
                      className="w-full py-3 rounded-2xl border border-gray-200 text-sm font-medium text-gray-700 active:scale-95 transition"
                    >
                      Join met code
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Niet ingelogd */}
            {!user && (
              <div className="bg-white border border-gray-200 rounded-3xl px-5 py-4 text-center">
                <p className="text-sm text-gray-400">Niet ingelogd</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
