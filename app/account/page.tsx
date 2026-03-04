"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import Header from "@/components/Header";
import Card from "@/components/Card";
import { ShareIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        setUser(null);
        setHouseholdId(null);
        return;
      }

      const currentUser = data.user;
      setUser(currentUser);

      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (membership) {
        setHouseholdId(membership.household_id);
      } else {
        setHouseholdId(null);
      }
    };

    init();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setHouseholdId(null);
    router.replace("/login");
  };

  const inviteLink =
    householdId && typeof window !== "undefined"
      ? `${window.location.origin}/join?household=${householdId}`
      : "";

  const handleCreateHousehold = async () => {
    if (!user) return;

    const { data: household, error } = await supabase
      .from("households")
      .insert({ name: "Ons huishouden" })
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
  };

  const handleCopy = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      alert("Invite link gekopieerd!");
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const handleShare = async () => {
    if (!inviteLink) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Word lid van mijn huishouden",
          text: "Scan of open deze link om recepten te delen 🍳",
          url: inviteLink,
        });
      } else {
        await navigator.clipboard.writeText(inviteLink);
        alert("Link gekopieerd!");
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
      <main className="min-h-dvh bg-[var(--color-bg)] pt-16 pb-24">
        <div className="p-4 space-y-4">
          {/* Account info */}
          <Card>
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="space-y-2">
                {user?.email ? (
                  <>
                    <p className="text-sm text-gray-500">{user.email}</p>

                    <button
                      onClick={handleLogout}
                      className="text-sm text-gray-500 underline"
                    >
                      Uitloggen
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
                  <p className="text-sm text-gray-500 mt-1">
                    Laat iemand de QR-code scannen of verstuur een uitnodiging
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm">
                  <QRCodeCanvas value={inviteLink} size={200} />
                </div>

                <div className="flex gap-10">
                  <button
                    onClick={handleShare}
                    className="flex flex-col items-center text-gray-600 active:scale-95 transition"
                  >
                    <ShareIcon className="w-6 h-6 mb-1" />
                    <span className="text-xs">Deel</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className="flex flex-col items-center text-gray-600 active:scale-95 transition"
                  >
                    <ClipboardDocumentIcon className="w-6 h-6 mb-1" />
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

                <p className="text-sm text-gray-500">
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
