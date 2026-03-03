"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Loader2,
  ExternalLink,
  ShoppingCart,
  Calendar,
  Mail,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Order {
  id: string;
  store_id: string;
  order_intent_id: string;
  email: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  subtotal_amount: string;
  shipping_amount: string;
  tax_amount: string;
  total_amount: string;
  currency: string;
  status: string;
  shopify_order_id: string | null;
  created_at: string;
}

interface Store {
  id: string;
  name: string;
  url: string;
  currency: string;
}

export default function OrdersPage() {
  const { token } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchStores();
    }
  }, [token]);

  useEffect(() => {
    if (selectedStore && token) {
      fetchOrders(selectedStore);
    }
  }, [selectedStore, token]);

  const fetchStores = async () => {
    if (!token) return;
    try {
      // Use authenticated endpoint to get only user's stores
      const res = await fetch(`${API_URL}/api/stores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Handle {success: true, data: {stores: [...]}} format
        const storesList = data.data?.stores || data.stores || [];
        setStores(storesList);
        if (storesList.length > 0) {
          setSelectedStore(storesList[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch stores:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (storeId: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const encodedStoreId = encodeURIComponent(storeId);
      // Use authenticated endpoint to get orders for user's store
      const res = await fetch(`${API_URL}/api/stores/${encodedStoreId}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        console.log("Orders fetched:", data);
        // Handle {orders: [...]} format
        setOrders(data.orders || data || []);
      } else {
        console.error("Failed to fetch orders:", res.status, await res.text());
        setOrders([]);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return (
          <Badge className="bg-sp-coral/20 text-sp-coral border-sp-coral/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        );
      case "fulfilled":
        return (
          <Badge className="bg-sp-blue/20 text-sp-blue border-sp-blue/30">
            <Package className="h-3 w-3 mr-1" />
            Fulfilled
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground border-border">
            <Clock className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  const extractShopifyOrderNumber = (shopifyId: string | null) => {
    if (!shopifyId) return null;
    const match = shopifyId.match(/\/(\d+)$/);
    return match ? match[1] : shopifyId;
  };

  const getShopifyAdminUrl = (storeUrl: string, shopifyId: string | null) => {
    if (!shopifyId) return null;
    const orderNumber = extractShopifyOrderNumber(shopifyId);
    if (!orderNumber) return null;
    const domain = storeUrl.replace("https://", "").replace("http://", "");
    return `https://admin.shopify.com/store/${domain.split(".")[0]}/orders/${orderNumber}`;
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your x402 orders
          </p>
        </div>
      </div>

      {/* Store Selector */}
      {stores.length > 0 && (
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-muted-foreground">Store:</label>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="bg-card border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sp-coral"
          >
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 hover:border-sp-coral/30 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted-foreground font-medium">Total Orders</p>
            <div className="h-10 w-10 rounded-xl bg-sp-coral/10 group-hover:bg-sp-coral flex items-center justify-center transition-colors">
              <ShoppingCart className="h-5 w-5 text-sp-coral group-hover:text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground">{orders.length}</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 hover:border-sp-coral/30 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted-foreground font-medium">Total Revenue</p>
            <div className="h-10 w-10 rounded-xl bg-sp-coral/10 group-hover:bg-sp-coral flex items-center justify-center transition-colors">
              <DollarSign className="h-5 w-5 text-sp-coral group-hover:text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {formatCurrency(
              orders
                .reduce((sum, order) => sum + parseFloat(order.total_amount), 0)
                .toFixed(2),
              orders[0]?.currency || "USD"
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 hover:border-sp-coral/30 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted-foreground font-medium">Confirmed Orders</p>
            <div className="h-10 w-10 rounded-xl bg-sp-coral/10 group-hover:bg-sp-coral flex items-center justify-center transition-colors">
              <CheckCircle className="h-5 w-5 text-sp-coral group-hover:text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {orders.filter((o) => o.status === "confirmed").length}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-card border border-border rounded-2xl">
        <div className="p-6 border-b border-border">
          <h3 className="font-bold text-lg text-foreground">Recent Orders</h3>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-sp-coral" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-sp-coral/10 flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-sp-coral" />
              </div>
              <p className="text-foreground text-lg font-bold mb-2">
                No orders yet
              </p>
              <p className="text-muted-foreground text-sm">
                Orders will appear here once customers complete checkout
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const store = stores.find((s) => s.id === order.store_id);
                return (
                  <div
                    key={order.id}
                    className="border border-border rounded-2xl p-6 hover:border-sp-coral/30 transition-all group bg-muted"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-foreground">
                            Order {order.id}
                          </h3>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {order.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(order.created_at)}
                          </div>
                          {order.shopify_order_id && (
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              Shopify #{extractShopifyOrderNumber(order.shopify_order_id)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-sp-coral">
                          {formatCurrency(order.total_amount, order.currency)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.items.length} item(s)
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="border-t border-border pt-3 mt-3">
                      <div className="text-xs text-muted-foreground mb-2">Items:</div>
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="text-sm text-foreground flex justify-between"
                          >
                            <span>
                              Product {item.productId.split("/").pop()}
                            </span>
                            <span className="text-muted-foreground">
                              Qty: {item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                      {store && order.shopify_order_id && (
                        <button
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sp-coral/10 text-sp-coral hover:bg-sp-coral hover:text-white transition-colors text-xs font-medium"
                          onClick={() => {
                            const url = getShopifyAdminUrl(
                              store.url,
                              order.shopify_order_id
                            );
                            if (url) window.open(url, "_blank");
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                          View in Shopify
                        </button>
                      )}
                      <button
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted text-muted-foreground hover:text-sp-coral hover:bg-sp-coral/10 transition-colors text-xs font-medium"
                        onClick={() => {
                          navigator.clipboard.writeText(order.id);
                        }}
                      >
                        Copy Order ID
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
