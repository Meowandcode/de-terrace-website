import { useState } from "react";

import { buildWhatsappOrder, type CartLine } from "@/lib/deterrace";

export function OrderSection({ lines }: { lines: CartLine[] }) {
  const [name, setName] = useState("");
  const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);

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
          {lines.map((l) => (
            <li key={l.id} className="flex items-baseline justify-between gap-6">
              <span>
                {l.name} {l.qty}
              </span>
              <span>{l.price * l.qty}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 border-t border-cream/60 pt-3 text-sm text-cream md:text-base">
          <div className="flex items-baseline justify-between">
            <span>Total</span>
            <span>{total}</span>
          </div>
        </div>
      </div>

      <div className="mt-12 flex justify-end md:mt-16">
        <a
          href={buildWhatsappOrder(name, lines, total)}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-hover-target text-3xl font-light text-cream transition-opacity duration-300 hover:opacity-70 md:text-5xl"
        >
          Click to Order
        </a>
      </div>
    </section>
  );
}
