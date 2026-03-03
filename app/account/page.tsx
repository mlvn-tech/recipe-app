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
    const fetchMembership = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUser(user);

      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (membership) {
        setHouseholdId(membership.household_id);
      }
    };

    fetchMembership();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
      // Alleen loggen als het geen cancel is
      if (err.name !== "AbortError") {
        console.error("Share failed:", err);
      }
    }
  };

  return (
    <>
      <Header title="Account" onBack={() => router.back()} />
      <main className="min-h-dvh bg-[var(--color-bg)] pt-16 pb-24">
        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <p className="text-sm text-gray-500">{user?.email}</p>

            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 underline"
            >
              Uitloggen
            </button>
          </div>

          {/* Invite Card */}

          {householdId && (
            <Card>
              <div className="flex flex-col items-center text-center space-y-6">
                {/* Titel */}
                <div>
                  <h2 className="text-lg font-semibold">Nodig iemand uit</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Deel de uitnodiging of laat iemand de QR-code scannen.
                  </p>
                </div>

                {/* QR */}
                <div className="bg-white p-4 rounded-2xl shadow-sm">
                  <QRCodeCanvas value={inviteLink} size={200} />
                </div>

                {/* Actie iconen */}
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
        </div>
      </main>
    </>
  );
}
