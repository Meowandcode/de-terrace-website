import { useState } from "react";

import { DEFAULT_MENU_STOCK, type MenuCategory, type MenuItem } from "@/lib/deterrace";

type Props = {
  category: MenuCategory;
  onOrder: (item: MenuItem) => void;
  stockMap: Record<string, number>;
};

export function MenuDetail({ category, onOrder, stockMap }: Props) {
  const [selected, setSelected] = useState<MenuItem>(category.items[0]!);
  const [hovering, setHovering] = useState(false);
  const [added, setAdded] = useState(false);

  const selectedStock = stockMap[selected.id] ?? DEFAULT_MENU_STOCK;
  const isSoldOut = selectedStock <= 0;
  const orderLabel = isSoldOut
    ? "Habis"
    : added
      ? "Masuk Keranjang"
      : hovering
        ? "Klik to order"
        : "Order";

  const handleOrder = () => {
    if (isSoldOut) return;
    onOrder(selected);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  const left = category.items.slice(0, Math.ceil(category.items.length / 2));
  const right = category.items.slice(Math.ceil(category.items.length / 2));

  return (
    <section
      id={category.id}
      className="sticky top-0 flex h-screen w-full flex-col overflow-hidden bg-cream md:flex-row"
    >
      <div className="flex flex-1 flex-col justify-center px-8 py-10 md:px-16">
        <h2 className="text-5xl font-light tracking-tight text-coffee-dark sm:text-7xl md:text-8xl">
          {category.title}
        </h2>
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4 md:mt-16 md:gap-y-7">
          {[left, right].map((col, ci) => (
            <ul key={ci} className="space-y-4 md:space-y-7">
              {col.map((item) => {
                const itemStock = stockMap[item.id] ?? DEFAULT_MENU_STOCK;
                const soldOut = itemStock <= 0;

                return (
                  <li key={item.id} className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelected(item)}
                      className={`cursor-hover-target text-left text-sm transition-opacity duration-300 md:text-base ${
                        selected.id === item.id
                          ? "text-coffee-dark opacity-100"
                          : "text-coffee-dark/70 hover:opacity-100"
                      } ${soldOut ? "line-through opacity-60" : ""}`}
                    >
                      {item.name}
                    </button>
                    {soldOut && (
                      <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-coffee-dark/60">
                        Kosong
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      </div>

      <div className="relative h-1/2 w-full md:h-full md:w-1/2">
        <img
          src={selected.image}
          alt={selected.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute bottom-0 right-0 flex">
          <button
            onClick={handleOrder}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            disabled={isSoldOut}
            className="cursor-hover-target min-w-36 bg-coffee-dark px-5 py-4 text-left text-lg font-light text-cream transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50 md:min-w-44 md:px-7 md:py-6 md:text-2xl"
          >
            {orderLabel}
          </button>
          <div className="flex min-w-18 items-center justify-center bg-cream px-4 py-4 text-lg font-light text-coffee-dark md:min-w-24 md:py-6 md:text-2xl">
            {selected.price}
          </div>
        </div>
      </div>
    </section>
  );
}
