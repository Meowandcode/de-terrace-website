// ---------------------------------------------------------------------------
// De Terrace — editable configuration & menu data
// Replace the placeholder values below with the cafe's real details.
// ---------------------------------------------------------------------------

import espressoImg from "@/assets/menu/espresso.webp";
import caffeeLatteImg from "@/assets/menu/caffee-latte.webp";
import longBlackImg from "@/assets/menu/long-black.webp";
import piccoloImg from "@/assets/menu/piccolo.webp";
import americanoImg from "@/assets/menu/americano.webp";
import cappucinoImg from "@/assets/menu/cappucino.webp";
import flatWhiteImg from "@/assets/menu/flat-white.webp";
import coldBrewImg from "@/assets/menu/cold-brew.webp";
import matchaLatteImg from "@/assets/menu/matcha-latte.webp";
import chocolateImg from "@/assets/menu/coffee.webp";
import redVelvetImg from "@/assets/menu/red-velvet.webp";
import taroLatteImg from "@/assets/menu/taro-latte.webp";
import lemonTeaImg from "@/assets/menu/lemon-tea.webp";
import lycheeTeaImg from "@/assets/menu/lychee-tea.webp";
import milkTeaImg from "@/assets/menu/milk-tea.webp";
import sparklingYuzuImg from "@/assets/menu/sparkling-yuzu.webp";
import butterCroissantImg from "@/assets/menu/butter-croissant.webp";
import frenchToastImg from "@/assets/menu/french-toast.webp";
import eggBenedictImg from "@/assets/menu/egg-benedict.webp";
import truffleFriesImg from "@/assets/menu/truffle-fries.webp";
import chickenWaffleImg from "@/assets/menu/chicken-waffle.webp";
import beefSandwichImg from "@/assets/menu/beef-sandwich.webp";
import carbonaraImg from "@/assets/menu/carbonara.webp";
import bananaCakeImg from "@/assets/menu/banana-cake.webp";

export const CAFE = {
  /** International format, no "+" — e.g. 6281234567890 */
  whatsapp: "6289510830568",
  address:
    "Jl. Trunojoyo Jl. Kauman No.42, Sawahan Cantian, Kepatihan, Kec. Kaliwates, Kabupaten Jember, Jawa Timur 68131",
  email: "rickyduaproduction@gmail.com",
  instagram: "ricky_dua_",
};

export const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(CAFE.address)}`;
export const emailUrl = `mailto:${CAFE.email}`;
export const instagramUrl = `https://instagram.com/${CAFE.instagram}`;
export const whatsappUrl = `https://wa.me/${CAFE.whatsapp}`;

export const DEFAULT_MENU_STOCK = 10;

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  stock?: number;
};

export type MenuCategory = {
  id: "coffee" | "non-coffee" | "foods";
  title: string;
  items: MenuItem[];
};

export function createDefaultStockMap() {
  return MENU.reduce<Record<string, number>>((acc, category) => {
    category.items.forEach((item) => {
      acc[item.id] = DEFAULT_MENU_STOCK;
    });
    return acc;
  }, {});
}

export const MENU: MenuCategory[] = [
  {
    id: "coffee",
    title: "Coffee",
    items: [
      { id: "c1", name: "Expresso", price: 18, image: espressoImg },
      { id: "c2", name: "Caffee Latte", price: 32, image: caffeeLatteImg },
      { id: "c3", name: "Long Black", price: 26, image: longBlackImg },
      { id: "c4", name: "Piccolo", price: 24, image: piccoloImg },
      { id: "c5", name: "Americano", price: 30, image: americanoImg },
      { id: "c6", name: "Cappucino", price: 32, image: cappucinoImg },
      { id: "c7", name: "Flat White", price: 34, image: flatWhiteImg },
      { id: "c8", name: "Cold Brew", price: 36, image: coldBrewImg },
    ],
  },
  {
    id: "non-coffee",
    title: "Non Coffee",
    items: [
      { id: "n1", name: "Matcha Latte", price: 32, image: matchaLatteImg },
      { id: "n2", name: "Chocolate", price: 28, image: chocolateImg },
      { id: "n3", name: "Red Velvet", price: 30, image: redVelvetImg },
      { id: "n4", name: "Taro Latte", price: 30, image: taroLatteImg },
      { id: "n5", name: "Lemon Tea", price: 22, image: lemonTeaImg },
      { id: "n6", name: "Lychee Tea", price: 24, image: lycheeTeaImg },
      { id: "n7", name: "Milk Tea", price: 26, image: milkTeaImg },
      { id: "n8", name: "Sparkling Yuzu", price: 28, image: sparklingYuzuImg },
    ],
  },
  {
    id: "foods",
    title: "Foods",
    items: [
      { id: "f1", name: "Butter Croissant", price: 26, image: butterCroissantImg },
      { id: "f2", name: "French Toast", price: 34, image: frenchToastImg },
      { id: "f3", name: "Egg Benedict", price: 45, image: eggBenedictImg },
      { id: "f4", name: "Truffle Fries", price: 32, image: truffleFriesImg },
      { id: "f5", name: "Chicken Waffle", price: 48, image: chickenWaffleImg },
      { id: "f6", name: "Beef Sandwich", price: 46, image: beefSandwichImg },
      { id: "f7", name: "Carbonara", price: 52, image: carbonaraImg },
      { id: "f8", name: "Banana Cake", price: 24, image: bananaCakeImg },
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
