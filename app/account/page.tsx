"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import Header from "@/components/Header";
import Card from "@/components/Card";
import { Share, Copy } from "lucide-react";

import { generateInviteCode } from "@/lib/generateInviteCode";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        setUser(null);
        setHouseholdId(null);
        setInviteCode(null);
        return;
      }

      const currentUser = data.user;
      setUser(currentUser);

      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id, households(invite_code)")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (membership) {
        setHouseholdId(membership.household_id);
        setInviteCode((membership.households as any)?.invite_code ?? null);
      } else {
        setHouseholdId(null);
        setInviteCode(null);
      }
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

  const inviteLink =
    householdId && typeof window !== "undefined"
      ? `${window.location.origin}/join?household=${householdId}`
      : "";

  const handleCreateHousehold = async () => {
    if (!user) return;

    const inviteCode = generateInviteCode();

    const { data: household, error } = await supabase
      .from("households")
      .insert({
        name: "Ons huishouden",
        invite_code: inviteCode,
      })
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
    setInviteCode(household.invite_code);
  };

  const handleCopy = async () => {
    if (!inviteCode) return;

    try {
      await navigator.clipboard.writeText(inviteCode);
      alert("Invite code gekopieerd!");
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
        alert("Invite code gekopieerd!");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Share failed:", err);
      }
    }
  };

  return (
    <>
      <Header title="Account" showBack={false} />
      <main
        style={{ paddingTop: "var(--header-height)" }}
        className="min-h-dvh bg-[var(--color-bg)] pb-24"
      >
        <div className="px-4 space-y-4 pt-4">
          {/* Account info */}
          <Card>
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="space-y-2">
                {user?.email ? (
                  <>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {user.email}
                    </p>

                    <button
                      onClick={handleLogout}
                      className="text-sm text-[var(--color-accent)]"
                    >
                      Log uit
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-500">Niet ingelogd</p>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* CASE 1: User heeft household */}
          {user?.email && householdId && (
            <Card>
              <div className="flex flex-col items-center text-center space-y-6">
                <div>
                  <h2 className="text-lg font-semibold">
                    Samen recepten verzamelen?
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    Laat iemand de QR-code scannen of verstuur een uitnodiging
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm">
                  <QRCodeCanvas value={inviteCode ?? ""} size={200} />
                </div>

                {/* Invite code zichtbaar */}
                <div className="text-2xl tracking-widest font-semibold">
                  {inviteCode}
                </div>

                <div className="flex gap-10">
                  <button
                    onClick={handleShare}
                    className="flex flex-col items-center text-gray-600 active:scale-95 transition"
                  >
                    <Share size={24} className="mb-1 text-gray-600" />
                    <span className="text-xs">Deel</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className="flex flex-col items-center text-gray-600 active:scale-95 transition"
                  >
                    <Copy size={24} className="mb-1 text-gray-600" />
                    <span className="text-xs">Kopieer</span>
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* CASE 2: User heeft GEEN household */}
          {user?.email && !householdId && (
            <Card>
              <div className="space-y-4 text-center">
                <h2 className="text-lg font-semibold">Nog geen huishouden</h2>

                <p className="text-sm text-[var(--color-text-secondary)]">
                  Maak een huishouden aan om recepten te delen.
                </p>

                <button
                  onClick={handleCreateHousehold}
                  className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white"
                >
                  Maak huishouden aan
                </button>
              </div>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
