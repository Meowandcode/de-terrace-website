// ---------------------------------------------------------------------------
// De Terrace — editable configuration & menu data
// Replace the placeholder values below with the cafe's real details.
// ---------------------------------------------------------------------------

import coffeeImg from "@/assets/coffee.jpg";
import nonCoffeeImg from "@/assets/noncoffee.jpg";
import foodsImg from "@/assets/foods.jpg";

export const CAFE = {
  /** International format, no "+" — e.g. 6281234567890 */
  whatsapp: "6281234567890",
  address: "Jl. Contoh No. 12, Makassar, Indonesia",
  email: "hello@deterrace.coffee",
  instagram: "deterrace.coffee",
};

export const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(CAFE.address)}`;
export const emailUrl = `mailto:${CAFE.email}`;
export const instagramUrl = `https://instagram.com/${CAFE.instagram}`;
export const whatsappUrl = `https://wa.me/${CAFE.whatsapp}`;

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  image: string;
};

export type MenuCategory = {
  id: "coffee" | "non-coffee" | "foods";
  title: string;
  items: MenuItem[];
};

export const MENU: MenuCategory[] = [
  {
    id: "coffee",
    title: "Coffee",
    items: [
      { id: "c1", name: "Expresso", price: 18, image: coffeeImg },
      { id: "c2", name: "Caffee Latte", price: 32, image: coffeeImg },
      { id: "c3", name: "Long Black", price: 26, image: coffeeImg },
      { id: "c4", name: "Piccolo", price: 24, image: coffeeImg },
      { id: "c5", name: "Americano", price: 30, image: coffeeImg },
      { id: "c6", name: "Cappucino", price: 32, image: coffeeImg },
      { id: "c7", name: "Flat White", price: 34, image: coffeeImg },
      { id: "c8", name: "Cold Brew", price: 36, image: coffeeImg },
    ],
  },
  {
    id: "non-coffee",
    title: "Non Coffee",
    items: [
      { id: "n1", name: "Matcha Latte", price: 32, image: nonCoffeeImg },
      { id: "n2", name: "Chocolate", price: 28, image: nonCoffeeImg },
      { id: "n3", name: "Red Velvet", price: 30, image: nonCoffeeImg },
      { id: "n4", name: "Taro Latte", price: 30, image: nonCoffeeImg },
      { id: "n5", name: "Lemon Tea", price: 22, image: nonCoffeeImg },
      { id: "n6", name: "Lychee Tea", price: 24, image: nonCoffeeImg },
      { id: "n7", name: "Milk Tea", price: 26, image: nonCoffeeImg },
      { id: "n8", name: "Sparkling Yuzu", price: 28, image: nonCoffeeImg },
    ],
  },
  {
    id: "foods",
    title: "Foods",
    items: [
      { id: "f1", name: "Butter Croissant", price: 26, image: foodsImg },
      { id: "f2", name: "French Toast", price: 34, image: foodsImg },
      { id: "f3", name: "Egg Benedict", price: 45, image: foodsImg },
      { id: "f4", name: "Truffle Fries", price: 32, image: foodsImg },
      { id: "f5", name: "Chicken Waffle", price: 48, image: foodsImg },
      { id: "f6", name: "Beef Sandwich", price: 46, image: foodsImg },
      { id: "f7", name: "Carbonara", price: 52, image: foodsImg },
      { id: "f8", name: "Banana Cake", price: 24, image: foodsImg },
    ],
  },
];

export type CartLine = { id: string; name: string; price: number; qty: number };

export function buildWhatsappOrder(name: string, lines: CartLine[], total: number) {
  const body = [
    `Hi De Terrace, saya ${name || "-"} mau order:`,
    "",
    ...lines.map((l) => `- ${l.name} x${l.qty} : ${l.price * l.qty}`),
    "",
    `Total: ${total}`,
  ].join("\n");
  return `${whatsappUrl}?text=${encodeURIComponent(body)}`;
}
