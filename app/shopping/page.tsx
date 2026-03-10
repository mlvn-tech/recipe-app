"use client";
import clsx from "clsx";

import { Suspense, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Card from "@/components/Card";

import { Plus, Trash2, Check, RefreshCw, ChevronLeft } from "lucide-react";

import Icon from "@/components/icons";
import { useRouter, useSearchParams } from "next/navigation";

type ShoppingItem = {
  id: string;
  name: string;
  amount: string;
  checked: boolean;
};

function AnimatedItem({
  children,
  visible,
}: {
  children: React.ReactNode;
  visible: boolean;
}) {
  const [height, setHeight] = useState<number | "auto">("auto");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible && ref.current) {
      const h = ref.current.offsetHeight;
      setHeight(h);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setHeight(0);
        });
      });
    }
  }, [visible]);

  return (
    <div
      ref={ref}
      style={{
        height: height === "auto" ? "auto" : height,
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transition: "height 0.3s ease, opacity 0.25s ease",
      }}
    >
      {children}
    </div>
  );
}

function SwipeableItem({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);
  const threshold = 80;

  const rubberband = (x: number, limit: number) => {
    const abs = Math.abs(x);
    const elastic = limit * (1 - Math.exp(-abs / limit));
    return -elastic;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setSwiping(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientX - startX.current;
    if (diff < 0) setOffsetX(rubberband(diff, threshold));
  };

  const onTouchEnd = () => {
    setSwiping(false);
    if (offsetX < -threshold * 0.7) onDelete();
    else setOffsetX(0);
  };

  const progress = Math.min(Math.abs(offsetX) / threshold, 1);
  const pillWidth = Math.max(0, Math.abs(offsetX) - 10);
  const pillOpacity = Math.min(progress * 2, 1);

  return (
    <div className="relative flex items-center">
      <div
        className="absolute right-0 flex items-center justify-center bg-red-500 rounded-full"
        style={{
          width: pillWidth,
          height: 28,
          top: "50%",
          transform: "translateY(-50%)",
          opacity: pillOpacity,
          transition: swiping ? "none" : "width 0.3s ease, opacity 0.3s ease",
        }}
      >
        {progress > 0.5 && (
          <Icon icon={Trash2} size={16} className="text-white shrink-0" />
        )}
      </div>

      <div
        className="relative w-full overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swiping
            ? "none"
            : "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function ShoppingPage() {
  return (
    <Suspense
      fallback={
        <p className="p-8 text-[var(--color-text-secondary)]">Laden…</p>
      }
    >
      <ShoppingPageContent />
    </Suspense>
  );
}

function ShoppingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const weekStart = searchParams.get("week");

  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [newName, setNewName] = useState("");
  const [justChecked, setJustChecked] = useState<Set<string>>(new Set());
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [isScrolled, setIsScrolled] = useState(false);

  const [householdId, setHouseholdId] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const loadHousehold = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", userId)
        .maybeSingle();

      setHouseholdId(membership?.household_id || null);
    };

    loadHousehold();
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      if (!householdId) return;

      const { data } = await supabase
        .from("shopping_list")
        .select("*")
        .eq("household_id", householdId)
        .order("created_at", { ascending: false });

      setItems(data || []);
      setLoading(false);
    };

    fetchItems();
  }, [householdId]);

  const loadFromWeek = async () => {
    if (!weekStart || !householdId) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    setLoadingWeek(true);

    const { data } = await supabase
      .from("week_plans")
      .select("recipes(*)")
      .eq("household_id", householdId)
      .eq("week_start", weekStart);

    const allIngredients: string[] = [];
    data?.forEach((item: any) => {
      if (item.recipes?.ingredients) {
        allIngredients.push(...item.recipes.ingredients);
      }
    });

    const unique = [
      ...new Set(allIngredients.map((i) => i.trim().toLowerCase())),
    ].filter((i) => !i.startsWith("#"));

    const existingNames = items.map((i) => i.name.toLowerCase());
    const toInsert = unique
      .filter((name) => !existingNames.includes(name))
      .map((name) => ({
        name,
        amount: null,
        checked: false,
        household_id: householdId,
        user_id: userId,
      }));

    if (toInsert.length > 0) {
      const { data: inserted } = await supabase
        .from("shopping_list")
        .insert(toInsert)
        .select();

      if (inserted) setItems((prev) => [...inserted, ...prev]);
    }

    setLoadingWeek(false);
  };

  const addItem = async () => {
    if (!newName.trim() || !householdId) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    const { data } = await supabase
      .from("shopping_list")
      .insert([
        {
          name: newName.trim(),
          amount: null,
          checked: false,
          household_id: householdId,
          user_id: userId,
        },
      ])
      .select()
      .single();

    if (data) {
      setItems((prev) => [data, ...prev]);
      setNewName("");
    }
  };

  const toggleChecked = async (item: ShoppingItem) => {
    await supabase
      .from("shopping_list")
      .update({ checked: !item.checked })
      .eq("id", item.id)
      .eq("household_id", householdId);

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)),
    );
  };

  const updateName = async (item: ShoppingItem, name: string) => {
    await supabase
      .from("shopping_list")
      .update({ name })
      .eq("id", item.id)
      .eq("household_id", householdId);

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, name } : i)),
    );
  };

  const deleteItem = async (id: string) => {
    await supabase
      .from("shopping_list")
      .delete()
      .eq("id", id)
      .eq("household_id", householdId);

    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearChecked = async () => {
    await supabase
      .from("shopping_list")
      .delete()
      .eq("household_id", householdId)
      .eq("checked", true);

    setItems((prev) => prev.filter((i) => !i.checked));
  };

  const clearAll = async () => {
    await supabase
      .from("shopping_list")
      .delete()
      .eq("household_id", householdId);

    setItems([]);
  };

  const visibleUnchecked = items.filter((i) => !i.checked);
  const checkedItems = items.filter((i) => i.checked);

  return (
    <>
      <main
        className="min-h-screen bg-[var(--color-bg)]"
        style={{
          paddingBottom: "calc(5rem + env(safe-area-inset-bottom))",
        }}
      >
        {/* Hero header */}
        <div
          className="px-4 sticky z-10 bg-[var(--color-bg)]/90 backdrop-blur-md pb-3 max-w-4xl mx-auto"
          style={{
            top: 0,
            paddingTop: "calc(env(safe-area-inset-top) + 1rem)",
          }}
        >
          <button
            onClick={() => router.push("/week")}
            className="flex items-center gap-1 text-[var(--color-text-secondary)] active:opacity-70 transition-opacity mb-1 -ml-1"
          >
            <Icon icon={ChevronLeft} size={20} />
            <span className="text-sm">Weekplanner</span>
          </button>
          <h1
            className={clsx(
              "font-bold text-gray-900 leading-tight tracking-tight transition-all duration-300",
              isScrolled ? "text-base mb-2" : "text-[2rem] mb-3",
            )}
          >
            Boodschappenlijst
          </h1>
        </div>

        <div className="px-4 max-w-4xl mx-auto space-y-3 pt-4">
          {loading ? (
            <Card className="p-5 animate-pulse space-y-3">
              <div className="h-4 bg-[var(--color-surface-secondary)] rounded w-1/3" />
              <div className="h-4 bg-[var(--color-surface-secondary)] rounded w-2/3" />
              <div className="h-4 bg-[var(--color-surface-secondary)] rounded w-1/2" />
            </Card>
          ) : (
            <>
              {weekStart && (
                <button
                  onClick={loadFromWeek}
                  disabled={loadingWeek}
                  className="w-full flex justify-center gap-2 py-2.5 px-4 rounded-2xl bg-[var(--color-bg)] border border-gray-200 text-xs font-medium text-gray-700 active:scale-95 transition"
                >
                  <Icon
                    icon={RefreshCw}
                    size={15}
                    className={clsx(
                      "text-[var(--color-text-tertiary)]",
                      loadingWeek && "animate-spin",
                    )}
                  />
                  {loadingWeek
                    ? "Laden..."
                    : "Laad ingrediënten vanuit weekplanner"}
                </button>
              )}

              <Card className="p-5">
                {/* Header van de card */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-[var(--color-text)]">
                    Te kopen
                  </span>
                  {items.length > 0 && (
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Weet je zeker dat je alle boodschappen wilt verwijderen?",
                          )
                        ) {
                          clearAll();
                        }
                      }}
                      className="text-xs text-red-400 active:text-red-500 transition-colors"
                    >
                      Verwijder alles
                    </button>
                  )}
                </div>

                {/* Nieuw item toevoegen */}
                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[var(--color-border)]">
                  <button
                    onClick={addItem}
                    className="h-5 w-5 shrink-0 flex items-center justify-center"
                  >
                    <Icon
                      icon={Plus}
                      size={16}
                      className="text-[var(--color-text-tertiary)]"
                    />
                  </button>
                  <input
                    type="text"
                    placeholder="Voeg item toe..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addItem()}
                    onBlur={() => addItem()}
                    inputMode="text"
                    enterKeyHint="done"
                    className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-[var(--color-text-tertiary)] text-[var(--color-text)] min-w-0"
                  />
                </div>

                {/* Onafgevinkte items */}
                <ul className="space-y-0">
                  {visibleUnchecked.map((item) => {
                    const isJustChecked = justChecked.has(item.id);
                    return (
                      <AnimatedItem
                        key={item.id}
                        visible={!removingIds.has(item.id)}
                      >
                        <li className="pb-3">
                          <SwipeableItem onDelete={() => deleteItem(item.id)}>
                            <div className="relative flex items-center gap-3 py-1">
                              <button
                                onClick={() => toggleChecked(item)}
                                className={clsx(
                                  "h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200",
                                  isJustChecked
                                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                                    : "border-[var(--color-border)] bg-transparent",
                                )}
                              >
                                {isJustChecked && (
                                  <Icon
                                    icon={Check}
                                    size={12}
                                    className="text-white"
                                  />
                                )}
                              </button>
                              <textarea
                                value={item.name}
                                onChange={(e) =>
                                  updateName(item, e.target.value)
                                }
                                rows={1}
                                className={clsx(
                                  "flex-1 text-sm bg-transparent focus:outline-none transition-all duration-200 resize-none overflow-hidden min-w-0 text-[var(--color-text)]",
                                  isJustChecked &&
                                    "text-[var(--color-text-tertiary)] line-through",
                                )}
                                onInput={(e) => {
                                  const el = e.target as HTMLTextAreaElement;
                                  el.style.height = "auto";
                                  el.style.height = el.scrollHeight + "px";
                                }}
                              />
                            </div>
                          </SwipeableItem>
                        </li>
                      </AnimatedItem>
                    );
                  })}
                </ul>

                {/* Afgevinkte items */}
                {checkedItems.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mt-2 mb-4 pt-4 border-t border-[var(--color-border)]">
                      <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
                        Afgevinkt
                      </p>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              "Weet je zeker dat je alle afgevinkte boodschappen wilt verwijderen?",
                            )
                          ) {
                            clearChecked();
                          }
                        }}
                        className="text-xs text-red-400 active:text-red-500 transition-colors"
                      >
                        Verwijder alles
                      </button>
                    </div>

                    <ul className="space-y-0">
                      {checkedItems.map((item) => (
                        <AnimatedItem
                          key={item.id}
                          visible={!removingIds.has(item.id)}
                        >
                          <li className="pb-3">
                            <SwipeableItem onDelete={() => deleteItem(item.id)}>
                              <div className="flex items-center gap-3 py-1">
                                <button
                                  onClick={() => toggleChecked(item)}
                                  className="h-5 w-5 rounded-md border-2 border-[var(--color-accent)] bg-[var(--color-accent)] flex items-center justify-center shrink-0 transition"
                                >
                                  <Icon
                                    icon={Check}
                                    size={12}
                                    className="text-white"
                                  />
                                </button>
                                <span className="flex-1 text-sm text-[var(--color-text-tertiary)] line-through">
                                  {item.name}
                                </span>
                              </div>
                            </SwipeableItem>
                          </li>
                        </AnimatedItem>
                      ))}
                    </ul>
                  </>
                )}
              </Card>
            </>
          )}
        </div>
      </main>
    </>
  );
}
