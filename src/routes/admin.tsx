import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { CustomCursor } from "@/components/deterrace/CustomCursor";
import { MENU } from "@/lib/deterrace";
import {
  cancelOrderAndRestoreStock,
  fetchMenuStock,
  fetchOrdersWithItems,
  getCurrentSession,
  isAdminUser,
  isSupabaseConfigured,
  signOutAdmin,
  type MenuStockRow,
  type OrderRow,
  type OrderStatus,
  updateMenuStock,
  updateOrderStatus,
} from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/admin/login") return;
    const session = await getCurrentSession();
    if (!session || !isAdminUser(session.user)) {
      throw redirect({ to: "/admin/login" });
    }
  },
  component: AdminDashboard,
});

const statusOptions: OrderStatus[] = ["pending", "confirmed", "completed", "cancelled"];

function AdminDashboard() {
  const location = useLocation();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [menuInventory, setMenuInventory] = useState<MenuStockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingStockId, setSavingStockId] = useState<string | null>(null);

  const loadMenuInventory = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError(
        "Supabase belum dikonfigurasi. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env.",
      );
      return;
    }

    try {
      const rows = await fetchMenuStock();
      setMenuInventory(rows);
    } catch (err) {
      console.error("Failed to load menu inventory:", err);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError(
        "Supabase belum dikonfigurasi. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env.",
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchOrdersWithItems();
      setOrders(data);
    } catch (err) {
      console.error("Failed to load orders:", err);
      setError("Gagal mengambil data order dari Supabase.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMenuInventory();
    void loadOrders();
  }, [loadMenuInventory, loadOrders]);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setSavingId(orderId);
    setError(null);

    try {
      if (status === "cancelled") {
        await cancelOrderAndRestoreStock(orderId);
        setOrders((prev) => prev.filter((order) => order.id !== orderId));
        return;
      }

      const updatedOrder = await updateOrderStatus(orderId, status);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: updatedOrder.status } : order,
        ),
      );
    } catch (err) {
      console.error("Failed to update order status:", err);
      setError("Gagal memperbarui status order.");
    } finally {
      setSavingId(null);
    }
  };

  const menuRows = MENU.flatMap((category) =>
    category.items.map((item) => {
      const currentStock = menuInventory.find((row) => row.menu_id === item.id)?.stock ?? 0;
      return {
        menuId: item.id,
        itemName: item.name,
        stock: currentStock,
      };
    }),
  );

  const handleStockUpdate = async (menuId: string, itemName: string, stock: number) => {
    setSavingStockId(menuId);
    setError(null);

    try {
      const updated = await updateMenuStock(menuId, itemName, stock);
      setMenuInventory((prev) => {
        const existing = prev.find((row) => row.menu_id === menuId);
        if (existing) {
          return prev.map((row) => (row.menu_id === menuId ? { ...row, ...updated } : row));
        }
        return [...prev, updated];
      });
    } catch (err) {
      console.error("Failed to update menu stock:", err);
      setError("Gagal memperbarui stok menu.");
    } finally {
      setSavingStockId(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutAdmin();
      window.location.href = "/admin/login";
    } catch (err) {
      console.error("Admin logout failed:", err);
      setError("Gagal keluar dari akun admin.");
    }
  };

  if (location.pathname === "/admin/login") {
    return <Outlet />;
  }

  return (
    <>
      <CustomCursor force />
      <main className="min-h-screen bg-[#f6efe8] px-4 py-8 text-[#1e1a17] md:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex flex-col gap-4 border-b border-[#d3b9a1] pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7a5a45]">
                De Terrace
              </p>
              <h1 className="mt-2 text-4xl font-light tracking-tight md:text-5xl">
                Admin Dashboard
              </h1>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void loadOrders()}
                className="rounded-full border border-[#2d2019] px-4 py-2 text-sm font-medium text-[#2d2019] transition-opacity hover:opacity-80"
              >
                Refresh data
              </button>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="rounded-full bg-[#2d2019] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
              >
                Logout
              </button>
            </div>
          </header>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="mb-8 rounded-3xl border border-[#e5d4c5] bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#8a6a58]">Inventory</p>
                <h2 className="mt-2 text-2xl font-light">Stok menu hari ini</h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {menuRows.map((row) => (
                <div
                  key={row.menuId}
                  className="rounded-2xl border border-[#efd9ca] bg-[#fffaf6] p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[#2b221f]">{row.itemName}</p>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#7a5a45]">
                      {row.stock <= 0 ? "Habis" : "Ready"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={row.stock}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value || 0);
                        void handleStockUpdate(row.menuId, row.itemName, nextValue);
                      }}
                      className="w-full rounded-full border border-[#d7bca6] bg-white px-3 py-2 text-sm text-[#2b221f] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => void handleStockUpdate(row.menuId, row.itemName, row.stock)}
                      disabled={savingStockId === row.menuId}
                      className="rounded-full bg-[#2d2019] px-3 py-2 text-xs font-medium uppercase tracking-[0.15em] text-white disabled:opacity-50"
                    >
                      {savingStockId === row.menuId ? "..." : "Save"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {loading ? (
            <div className="rounded-3xl bg-white/80 p-8 text-center text-sm text-[#5f4c41] shadow-sm">
              Memuat data order...
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-3xl bg-white/80 p-8 text-center text-sm text-[#5f4c41] shadow-sm">
              Belum ada order masuk.
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-3xl border border-[#e5d4c5] bg-white p-5 shadow-sm md:p-6"
                >
                  <div className="flex flex-col gap-4 border-b border-[#f0e6de] pb-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[#8a6a58]">
                        Order #{order.id.slice(0, 8)}
                      </p>
                      <h2 className="mt-2 text-2xl font-light">{order.customer_name}</h2>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-[#f5e8df] px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-[#563e34]">
                        {order.source}
                      </span>
                      <label className="flex items-center gap-2 text-sm text-[#4a372f]">
                        <span>Status</span>
                        <select
                          value={order.status}
                          onChange={(event) =>
                            void handleStatusChange(order.id, event.target.value as OrderStatus)
                          }
                          disabled={savingId === order.id}
                          className="rounded-full border border-[#d7bca6] bg-[#fffaf6] px-3 py-1.5 text-sm text-[#2d2019] outline-none"
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[#8a6a58]">Waktu</p>
                      <p className="mt-2 text-base text-[#2b221f]">
                        {new Date(order.created_at).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[#8a6a58]">
                        Jumlah item
                      </p>
                      <p className="mt-2 text-base text-[#2b221f]">{order.order_items.length}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[#8a6a58]">Total</p>
                      <p className="mt-2 text-base font-medium text-[#2b221f]">
                        Rp {Number(order.total).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 overflow-hidden rounded-2xl border border-[#efd9ca]">
                    <table className="min-w-full text-left text-sm text-[#2b221f]">
                      <thead className="bg-[#f8f1ec] text-[#614a3c]">
                        <tr>
                          <th className="px-4 py-3 font-medium">Menu</th>
                          <th className="px-4 py-3 font-medium">Qty</th>
                          <th className="px-4 py-3 font-medium">Harga</th>
                          <th className="px-4 py-3 font-medium">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.order_items.map((item) => (
                          <tr key={item.id} className="border-t border-[#f0e6de]">
                            <td className="px-4 py-3">{item.item_name}</td>
                            <td className="px-4 py-3">{item.quantity}</td>
                            <td className="px-4 py-3">
                              Rp {Number(item.unit_price).toLocaleString("id-ID")}
                            </td>
                            <td className="px-4 py-3">
                              Rp {Number(item.line_total).toLocaleString("id-ID")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
