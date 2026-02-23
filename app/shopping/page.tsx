"use client";
import { styles } from "@/lib/styles";
import clsx from "clsx";

import { Suspense, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Card from "@/components/Card";
import {
  PlusIcon,
  TrashIcon,
  CheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
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
    if (diff < 0) {
      setOffsetX(rubberband(diff, threshold));
    }
  };

  const onTouchEnd = () => {
    setSwiping(false);
    if (offsetX < -threshold * 0.7) {
      onDelete();
    } else {
      setOffsetX(0);
    }
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
          height: 32,
          top: "50%",
          transform: "translateY(-50%)",
          opacity: pillOpacity,
          transition: swiping ? "none" : "width 0.3s ease, opacity 0.3s ease",
        }}
      >
        {progress > 0.5 && (
          <Icon icon={TrashIcon} size={16} className="text-white shrink-0" />
        )}
      </div>

      <div
        className="relative w-full bg-white overflow-hidden"
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
    <Suspense fallback={<p className="p-8">Laden...</p>}>
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

  useEffect(() => {
    document.querySelectorAll("textarea").forEach((el) => {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    });
  }, [items]);

  useEffect(() => {
    const fetchItems = async () => {
      const { data } = await supabase
        .from("shopping_list")
        .select("*")
        .order("created_at", { ascending: false });

      setItems(data || []);
      setLoading(false);
    };

    fetchItems();
  }, []);

  const loadFromWeek = async () => {
    if (!weekStart) return;
    setLoadingWeek(true);

    const { data } = await supabase
      .from("week_plans")
      .select("recipes(*)")
      .eq("week_start", weekStart);

    if (!data) {
      setLoadingWeek(false);
      return;
    }

    const allIngredients: string[] = [];
    data.forEach((item: any) => {
      if (item.recipes?.ingredients) {
        allIngredients.push(...item.recipes.ingredients);
      }
    });

    const unique = [
      ...new Set(allIngredients.map((i) => i.trim().toLowerCase())),
    ];
    const existingNames = items.map((i) => i.name.toLowerCase());
    const toInsert = unique
      .filter((name) => !existingNames.includes(name))
      .map((name) => ({ name, amount: null, checked: false }));

    if (toInsert.length === 0) {
      setLoadingWeek(false);
      return;
    }

    const { data: inserted, error } = await supabase
      .from("shopping_list")
      .insert(toInsert)
      .select();

    if (!error && inserted) {
      setItems((prev) => [...inserted, ...prev]);
    }

    setLoadingWeek(false);
  };

  const addItem = async () => {
    if (!newName.trim()) return;

    const { data, error } = await supabase
      .from("shopping_list")
      .insert([{ name: newName.trim(), amount: null }])
      .select()
      .single();

    if (!error && data) {
      setItems((prev) => [data, ...prev]);
      setNewName("");
    }
  };

  const toggleChecked = async (item: ShoppingItem) => {
    if (!item.checked) {
      setJustChecked((prev) => new Set(prev).add(item.id));
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, checked: true } : i)),
      );

      await supabase
        .from("shopping_list")
        .update({ checked: true })
        .eq("id", item.id);

      setTimeout(() => {
        setJustChecked((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }, 800);
    } else {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, checked: false } : i)),
      );

      await supabase
        .from("shopping_list")
        .update({ checked: false })
        .eq("id", item.id);
    }
  };

  const updateName = async (item: ShoppingItem, name: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, name } : i)),
    );
    await supabase.from("shopping_list").update({ name }).eq("id", item.id);
  };

  const deleteItem = async (id: string) => {
    setRemovingIds((prev) => new Set(prev).add(id));
    setTimeout(async () => {
      const { error } = await supabase
        .from("shopping_list")
        .delete()
        .eq("id", id);
      if (!error) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    }, 350);
  };

  const clearChecked = async () => {
    const checkedIds = items.filter((i) => i.checked).map((i) => i.id);
    if (checkedIds.length === 0) return;

    const { error } = await supabase
      .from("shopping_list")
      .delete()
      .in("id", checkedIds);

    if (!error) {
      setItems((prev) => prev.filter((i) => !i.checked));
    }
  };

  const clearAll = async () => {
    const { error } = await supabase
      .from("shopping_list")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (!error) {
      setItems([]);
    }
  };

  const visibleUnchecked = items.filter(
    (i) => !i.checked || justChecked.has(i.id),
  );
  const checkedItems = items.filter((i) => i.checked && !justChecked.has(i.id));

  if (loading) return <p className="p-8">Laden...</p>;

  return (
    <>
      <Header title="Boodschappenlijst" onBack={() => router.back()} />

      <main className="min-h-screen bg-[var(--color-bg)] pt-20 pb-30">
        <div className="px-4 max-w-4xl mx-auto space-y-4">
          {weekStart && (
            <button
              onClick={loadFromWeek}
              disabled={loadingWeek}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:scale-95 transition shadow-sm"
            >
              <Icon
                icon={ArrowPathIcon}
                size={16}
                className={`text-gray-400 ${loadingWeek ? "animate-spin" : ""}`}
              />
              {loadingWeek
                ? "Laden..."
                : "Laad ingrediënten vanuit weekplanner"}
            </button>
          )}

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-800">Te kopen</p>
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
                  className="text-xs text-red-400 hover:text-red-500 transition"
                >
                  Verwijder alles
                </button>
              )}
            </div>

            {/* Toevoeg-rij */}
            <li className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100 list-none">
              <button
                onClick={addItem}
                className="h-5 w-5 shrink-0 flex items-center justify-center"
              >
                <Icon
                  icon={PlusIcon}
                  size={16}
                  className="text-gray-400 hover:text-gray-500 transition"
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
                className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-gray-400 min-w-0"
              />
            </li>

            {/* Boodschappen lijst */}
            <ul>
              {visibleUnchecked.map((item) => {
                const isJustChecked = justChecked.has(item.id);
                return (
                  <AnimatedItem
                    key={item.id}
                    visible={!removingIds.has(item.id)}
                  >
                    <li className="pb-4">
                      <SwipeableItem onDelete={() => deleteItem(item.id)}>
                        <div className="relative flex items-center gap-3 py-1">
                          <button
                            onClick={() => toggleChecked(item)}
                            className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                              isJustChecked
                                ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                                : "border-gray-300"
                            }`}
                          >
                            {isJustChecked && (
                              <Icon
                                icon={CheckIcon}
                                size={12}
                                className="text-white"
                              />
                            )}
                          </button>

                          <textarea
                            value={item.name}
                            onChange={(e) => updateName(item, e.target.value)}
                            rows={1}
                            className={`flex-1 text-sm bg-transparent border-b border-transparent focus:outline-none transition-all duration-200 resize-none overflow-hidden min-w-0 ${
                              isJustChecked ? "text-gray-400 line-through" : ""
                            }`}
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
                <div className="flex items-center justify-between mt-2 mb-4 pt-6 border-t border-gray-100">
                  <p className="text-sm text-gray-400 font-semibold">
                    Afgevinkte boodschappen
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
                    className="text-xs text-red-400 hover:text-red-500 transition"
                  >
                    Verwijder alles
                  </button>
                </div>

                <ul>
                  {checkedItems.map((item) => (
                    <AnimatedItem
                      key={item.id}
                      visible={!removingIds.has(item.id)}
                    >
                      <li className="pb-4">
                        <SwipeableItem onDelete={() => deleteItem(item.id)}>
                          <div className="flex items-center gap-3 py-1">
                            <button
                              onClick={() => toggleChecked(item)}
                              className="h-5 w-5 rounded-md border-2 border-[var(--color-accent)] bg-[var(--color-accent)] flex items-center justify-center shrink-0 transition"
                            >
                              <Icon
                                icon={CheckIcon}
                                size={12}
                                className="text-white"
                              />
                            </button>

                            <span className="flex-1 text-sm text-gray-400 line-through">
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
        </div>
      </main>
    </>
  );
}
