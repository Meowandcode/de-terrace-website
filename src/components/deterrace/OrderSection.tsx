import { useState } from "react";

import { buildWhatsappOrder, DEFAULT_MENU_STOCK, type CartLine } from "@/lib/deterrace";
import { isSupabaseConfigured, saveOrderToSupabase } from "@/lib/supabase";

export function OrderSection({
  lines,
  stockMap,
  onUpdateQty,
  onRemove,
}: {
  lines: CartLine[];
  stockMap: Record<string, number>;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);

  const handleOrder = async () => {
    if (lines.length === 0) return;

    const orderUrl = buildWhatsappOrder(name, lines, total);

    if (!isSupabaseConfigured()) {
      setStatusMessage(
        "Supabase belum terhubung — WhatsApp tetap dibuka, tapi order belum tersimpan.",
      );
      window.open(orderUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      await saveOrderToSupabase(name, lines, total);
      setStatusMessage("Pesanan berhasil disimpan ke database Supabase.");
    } catch (error) {
      console.error("Failed to save order to Supabase:", error);
      setStatusMessage("Gagal menyimpan ke Supabase, tapi order masih bisa dikirim via WhatsApp.");
    } finally {
      setIsSubmitting(false);
      window.open(orderUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <section
      id="order"
      className="sticky top-0 flex h-screen w-full flex-col justify-center overflow-hidden bg-coffee-dark px-8 py-12 md:px-16"
    >
      <h2 className="text-5xl font-light tracking-tight text-cream sm:text-7xl md:text-8xl">
        Your Order
      </h2>

      <div className="mt-10 max-w-3xl md:mt-16">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Input Your Name..."
          className="cursor-hover-target w-full border-none bg-transparent text-xl font-light text-cream outline-none placeholder:text-cream/70 md:text-3xl"
        />

        <ul className="mt-6 space-y-1 text-sm text-cream/85 md:text-base">
          {lines.length === 0 && (
            <li className="text-cream/50">Belum ada pesanan — pilih menu lalu klik Order.</li>
          )}
          {lines.map((l) => {
            const stock = stockMap[l.id] ?? DEFAULT_MENU_STOCK;
            const soldOut = stock <= 0;

            return (
              <li key={l.id} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label={`Kurangi ${l.name}`}
                    onClick={() => onUpdateQty(l.id, l.qty - 1)}
                    className="cursor-hover-target h-6 w-6 rounded-full border border-cream/60 text-sm text-cream transition-opacity duration-300 hover:opacity-70"
                  >
                    −
                  </button>
                  <span>
                    {l.name} x{l.qty}
                    {soldOut ? " • Kosong" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span>{l.price * l.qty}</span>
                  <button
                    type="button"
                    aria-label={`Cancel ${l.name}`}
                    onClick={() => onRemove(l.id)}
                    className="cursor-hover-target text-xs uppercase tracking-[0.2em] text-cream/70 transition-opacity duration-300 hover:text-cream"
                  >
                    Cancel
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-10 border-t border-cream/60 pt-3 text-sm text-cream md:text-base">
          <div className="flex items-baseline justify-between">
            <span>Total</span>
            <span>{total}</span>
          </div>
        </div>

        {statusMessage && (
          <p className="mt-4 text-sm text-cream/80 md:text-base">{statusMessage}</p>
        )}
      </div>

      <div className="mt-12 flex justify-end md:mt-16">
        <button
          type="button"
          onClick={handleOrder}
          disabled={isSubmitting || lines.length === 0}
          className="cursor-hover-target text-3xl font-light text-cream transition-opacity duration-300 hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50 md:text-5xl"
        >
          {isSubmitting ? "Menyimpan..." : "Click to Order"}
        </button>
      </div>
    </section>
  );
}
