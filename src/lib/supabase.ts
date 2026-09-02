import { createClient } from "@supabase/supabase-js";

import type { CartLine } from "@/lib/deterrace";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const supabaseAnonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder-anon-key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith("http"));
}

export async function getCurrentSession() {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function isAdminUser(user: { app_metadata?: Record<string, unknown> } | null | undefined) {
  return user?.app_metadata?.["role"] === "admin";
}

export async function signInAdmin(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase belum dikonfigurasi. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env.",
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!isAdminUser(data.user)) {
    await supabase.auth.signOut();
    throw new Error("Akun ini belum memiliki akses admin.");
  }
  return data;
}

export async function signOutAdmin() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type MenuStockRow = {
  id: string;
  menu_id: string;
  item_name: string;
  stock: number;
  updated_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  menu_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
};

export type OrderRow = {
  id: string;
  customer_name: string;
  total: number;
  status: OrderStatus;
  source: string;
  created_at: string;
  order_items: OrderItemRow[];
};

export async function fetchMenuStock() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase belum dikonfigurasi. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env.",
    );
  }

  const { data, error } = await supabase
    .from("menu_inventory")
    .select("*")
    .order("item_name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as MenuStockRow[];
}

export async function updateMenuStock(menuId: string, itemName: string, stock: number) {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase belum dikonfigurasi. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env.",
    );
  }

  const safeStock = Math.max(0, Number(stock) || 0);

  const { data, error } = await supabase
    .from("menu_inventory")
    .upsert(
      {
        menu_id: menuId,
        item_name: itemName,
        stock: safeStock,
      },
      { onConflict: "menu_id" },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as MenuStockRow;
}

export async function fetchOrdersWithItems() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase belum dikonfigurasi. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env.",
    );
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as OrderRow[];
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase belum dikonfigurasi. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env.",
    );
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as OrderRow;
}

export async function cancelOrderAndRestoreStock(id: string) {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase belum dikonfigurasi. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env.",
    );
  }

  const { error } = await supabase.rpc("cancel_order_and_restore_stock", {
    order_id_input: id,
  });

  if (error) {
    throw error;
  }
}

export async function saveOrderToSupabase(name: string, lines: CartLine[], total: number) {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase belum dikonfigurasi. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env.",
    );
  }

  const { data, error } = await supabase.rpc("create_order_and_reserve_stock", {
    customer_name_input: name.trim() || "Guest",
    total_input: total,
    items_input: lines.map((line) => ({
      menu_id: line.id,
      item_name: line.name,
      quantity: line.qty,
      unit_price: line.price,
      line_total: line.price * line.qty,
    })),
  });

  if (error) throw error;
  return data as { id: string };
}
