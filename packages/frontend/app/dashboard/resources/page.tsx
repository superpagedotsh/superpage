"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/providers/auth-provider";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreVertical,
  Code,
  FileText,
  Globe,
  ShoppingBag,
  ExternalLink,
  Pencil,
  Trash2,
  Loader2,
  Copy,
  Check,
  Eye,
  Package,
  DollarSign,
  Filter,
  Store,
} from "lucide-react";
import { getCurrencyDisplay } from "@/lib/chain-config";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Resource {
  id: string;
  slug: string;
  type: "api" | "file" | "article" | "shopify";
  name: string;
  description: string | null;
  priceUsdc: number;
  isActive: boolean;
  isPublic: boolean;
  accessCount: number;
  totalEarnings: number;
  createdAt: string;
}

interface StoreProduct {
  _id: string;
  storeId: string;
  variantId: string;
  name: string;
  description: string | null;
  image: string | null;
  price: string;
  currency: string;
  inventory: number | null;
  storeName?: string;
  metadata?: {
    productId?: string;
    handle?: string;
    sku?: string;
  };
}

interface ShopifyStore {
  _id: string;
  id: string;
  name: string;
  shopDomain: string;
}

const typeIcons = {
  api: Code,
  file: FileText,
  article: Globe,
  shopify: ShoppingBag,
};

const typeColors = {
  api: "text-sp-blue bg-sp-blue/10",
  file: "text-sp-gold bg-sp-gold/10",
  article: "text-sp-coral bg-sp-coral/10",
  shopify: "text-sp-pink bg-sp-pink/10",
};

export default function ResourcesPage() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const [resources, setResources] = useState<Resource[]>([]);
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [stores, setStores] = useState<ShopifyStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Filtering state
  const [activeTab, setActiveTab] = useState<"all" | "api" | "file" | "article" | "stores">("all");
  const [selectedStore, setSelectedStore] = useState<string>("all");

  // Check for tab query parameter on mount
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "stores") {
      setActiveTab("stores");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        // Fetch user's stores first (authenticated endpoint)
        const storesRes = await fetch(`${API_URL}/api/stores`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        let storesData: ShopifyStore[] = [];
        if (storesRes.ok) {
          const data = await storesRes.json();
          // Handle {success: true, data: {stores: [...]}} format
          storesData = data.data?.stores || data.stores || [];
          setStores(storesData);
        }

        // Fetch resources (authenticated)
        const resRes = await fetch(`${API_URL}/api/resources`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resRes.ok) {
          const data = await resRes.json();
          setResources(data.resources || []);
        }

        // Fetch products only for user's stores
        if (storesData.length > 0) {
          const allProducts: StoreProduct[] = [];

          // Fetch products for each store the user owns
          for (const store of storesData) {
            try {
              const productsRes = await fetch(`${API_URL}/x402/stores/${store.id}/products`);
              if (productsRes.ok) {
                const productsData = await productsRes.json();
                const products = productsData.products || [];
                // Enrich with store name
                const enriched = products.map((p: StoreProduct) => ({
                  ...p,
                  storeName: store.name || store.id,
                }));
                allProducts.push(...enriched);
              }
            } catch (err) {
              console.error(`Failed to fetch products for store ${store.id}:`, err);
            }
          }

          setStoreProducts(allProducts);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      const res = await fetch(`${API_URL}/api/resources/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setResources((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete resource:", err);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product from x402?")) return;

    try {
      const res = await fetch(`${API_URL}/api/store-products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setStoreProducts((prev) => prev.filter((p) => p._id !== productId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete product");
      }
    } catch (err) {
      console.error("Failed to delete product:", err);
      alert("Failed to delete product");
    }
  };

  const copyEndpoint = (resource: Resource) => {
    const endpoint = `${API_URL}/x402/resource/${resource.slug || resource.id}`;
    navigator.clipboard.writeText(endpoint);
    setCopiedId(resource.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
    return formatted + ' ' + getCurrencyDisplay();
  };

  const handlePreview = async (resource: Resource) => {
    setPreviewResource(resource);
    setLoadingPreview(true);
    setPreviewData(null);

    try {
      if (resource.type === "shopify") {
        // Fetch store details and products
        const storeRes = await fetch(`${API_URL}/x402/stores`);
        if (storeRes.ok) {
          const stores = await storeRes.json();
          const store = stores.find((s: any) =>
            resource.slug === s.id || resource.name.includes(s.name)
          );

          if (store) {
            const [productsRes, ordersRes] = await Promise.all([
              fetch(`${API_URL}/x402/stores/${store.id}/products`),
              fetch(`${API_URL}/x402/stores/${store.id}/orders`)
            ]);

            const productsData = productsRes.ok ? await productsRes.json() : null;
            const ordersData = ordersRes.ok ? await ordersRes.json() : null;

            setPreviewData({
              store,
              products: productsData?.products || [],
              orders: ordersData || [],
            });
          }
        }
      } else {
        // For other types, fetch resource details
        const res = await fetch(`${API_URL}/api/resources/${resource.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPreviewData(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch preview:", err);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Filter resources and products
  const filteredResources = resources.filter((r) => {
    if (activeTab === "all") return true;
    if (activeTab === "stores") return false; // Don't show resources in stores tab
    return r.type === activeTab;
  });

  const filteredProducts = storeProducts.filter((p) => {
    if (activeTab !== "stores") return false;
    if (selectedStore === "all") return true;
    return p.storeId === selectedStore;
  });

  const totalItems = activeTab === "stores" ? filteredProducts.length : filteredResources.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-sp-gold" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Resources</h1>
          <p className="text-muted-foreground mt-1">Manage your paywalled content & store products</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/stores">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border border-border text-foreground hover:bg-sp-gold/10 hover:border-sp-gold/30 transition-colors">
              <Store className="h-4 w-4" />
              <span className="text-sm font-medium">Manage Stores</span>
            </button>
          </Link>
          <Link href="/dashboard/resources/new">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sp-gold text-white hover:bg-sp-gold/90 transition-colors shadow-lg shadow-sp-gold/10">
              <Plus className="h-4 w-4" />
              <span className="text-sm font-bold">New Resource</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
            activeTab === "all"
              ? "bg-sp-gold text-white shadow-lg shadow-sp-gold/10"
              : "text-muted-foreground hover:text-sp-gold hover:bg-sp-gold/10"
          }`}
        >
          All ({resources.length})
        </button>
        <button
          onClick={() => setActiveTab("api")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "api"
              ? "bg-sp-gold text-white shadow-lg shadow-sp-gold/10"
              : "text-muted-foreground hover:text-sp-gold hover:bg-sp-gold/10"
          }`}
        >
          <Code className="h-4 w-4" />
          API ({resources.filter((r) => r.type === "api").length})
        </button>
        <button
          onClick={() => setActiveTab("file")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "file"
              ? "bg-sp-gold text-white shadow-lg shadow-sp-gold/10"
              : "text-muted-foreground hover:text-sp-gold hover:bg-sp-gold/10"
          }`}
        >
          <FileText className="h-4 w-4" />
          Files ({resources.filter((r) => r.type === "file").length})
        </button>
        <button
          onClick={() => setActiveTab("article")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "article"
              ? "bg-sp-gold text-white shadow-lg shadow-sp-gold/10"
              : "text-muted-foreground hover:text-sp-gold hover:bg-sp-gold/10"
          }`}
        >
          <Globe className="h-4 w-4" />
          Articles ({resources.filter((r) => r.type === "article").length})
        </button>
        <button
          onClick={() => {
            setActiveTab("stores");
            setSelectedStore("all");
          }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "stores"
              ? "bg-sp-gold text-white shadow-lg shadow-sp-gold/10"
              : "text-muted-foreground hover:text-sp-gold hover:bg-sp-gold/10"
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          Store Products ({storeProducts.length})
        </button>
      </div>

      {/* Store Filter (only visible when stores tab is active) */}
      {activeTab === "stores" && stores.length > 0 && (
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter by store:</span>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sp-gold"
          >
            <option value="all">All Stores ({storeProducts.length})</option>
            {stores.map((store) => {
              const count = storeProducts.filter((p) => p.storeId === store.id).length;
              return (
                <option key={store.id} value={store.id}>
                  {store.name} ({count})
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Resources List */}
      {totalItems === 0 ? (
        <div className="bg-card border border-border rounded-2xl">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-sp-gold/10 flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-sp-gold" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              {activeTab === "stores" ? "No products imported" : "No resources yet"}
            </h3>
            <p className="text-muted-foreground text-sm mb-6 text-center max-w-sm">
              {activeTab === "stores"
                ? "Import products from your Shopify stores to sell via x402"
                : `Create your first paywalled resource to start earning ${getCurrencyDisplay()}`}
            </p>
            {activeTab === "stores" ? (
              <Link href="/dashboard/stores">
                <button className="px-4 py-2 rounded-xl bg-sp-gold text-white hover:bg-sp-gold/90 transition-colors shadow-lg shadow-sp-gold/10 font-bold">
                  Go to Stores
                </button>
              </Link>
            ) : (
              <Link href="/dashboard/resources/new">
                <button className="px-4 py-2 rounded-xl bg-sp-gold text-white hover:bg-sp-gold/90 transition-colors shadow-lg shadow-sp-gold/10 font-bold">
                  Create Resource
                </button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {/* Render Store Products */}
          {activeTab === "stores" &&
            filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-card border border-border hover:border-sp-gold/30 transition-all rounded-2xl p-4 group"
              >
                <div className="flex items-start gap-4">
                    {/* Product Image */}
                    <div className="h-16 w-16 rounded-xl overflow-hidden bg-sp-gold/10 flex-shrink-0">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-sp-gold" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-foreground truncate">{product.name}</h3>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-sp-gold/10 text-sp-gold">
                          {product.storeName}
                        </span>
                      </div>
                      {product.description && (
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 text-sp-gold font-medium">
                          <DollarSign className="h-3 w-3" />
                          {parseFloat(product.price).toFixed(2)} {product.currency}
                        </span>
                        {product.inventory !== null && (
                          <>
                            <span>•</span>
                            <span>Stock: {product.inventory}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>SKU: {product.variantId}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {product.metadata?.productId && (() => {
                        const store = stores.find((s) => s.id === product.storeId);
                        if (!store?.shopDomain) return null;
                        const prefix = 'gid://shopify/Product/';
                        const productId = product.metadata.productId.startsWith(prefix)
                          ? product.metadata.productId.slice(prefix.length)
                          : product.metadata.productId;
                        return (
                          <a
                            href={`https://${store.shopDomain}/admin/products/${productId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg text-muted-foreground hover:text-sp-gold hover:bg-sp-gold/10 transition-colors"
                            title="Edit in Shopify Admin"
                          >
                            <Pencil className="h-4 w-4" />
                          </a>
                        );
                      })()}
                      {product.metadata?.handle && (() => {
                        const store = stores.find((s) => s.id === product.storeId);
                        if (!store?.shopDomain) return null;
                        return (
                          <a
                            href={`https://${store.shopDomain}/products/${product.metadata.handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg text-muted-foreground hover:text-sp-gold hover:bg-sp-gold/10 transition-colors"
                            title="View on Shopify store"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        );
                      })()}
                      <button
                        onClick={() => {
                          const endpoint = `${API_URL}/x402/checkout?storeId=${product.storeId}&variantId=${product.variantId}`;
                          navigator.clipboard.writeText(endpoint);
                          setCopiedId(product._id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className="p-2 rounded-lg text-muted-foreground hover:text-sp-gold hover:bg-sp-gold/10 transition-colors"
                        title="Copy checkout link"
                      >
                        {copiedId === product._id ? (
                          <Check className="h-4 w-4 text-sp-gold" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete from x402"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
            ))}

          {/* Render Resources */}
          {activeTab !== "stores" &&
            filteredResources.map((resource) => {
              const Icon = typeIcons[resource.type];
              return (
                <div
                  key={resource.id}
                  className="bg-card border border-border hover:border-sp-gold/30 transition-all rounded-2xl p-4 group"
                >
                  <div className="flex items-start gap-4">
                    {/* Type Icon */}
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-sp-gold/10 text-sp-gold group-hover:bg-sp-gold group-hover:text-white transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-foreground truncate">{resource.name}</h3>
                          {!resource.isActive && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                              Inactive
                            </span>
                          )}
                        </div>
                        {resource.description && (
                          <p className="text-sm text-muted-foreground truncate mb-2">
                            {resource.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="capitalize">{resource.type}</span>
                          <span>•</span>
                          <span className="text-sp-gold font-medium">{formatCurrency(resource.priceUsdc)}</span>
                          <span>•</span>
                          <span>{resource.accessCount || 0} accesses</span>
                          <span>•</span>
                          <span className="text-sp-gold font-medium">{formatCurrency(resource.totalEarnings || 0)} earned</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePreview(resource)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-sp-gold hover:bg-sp-gold/10 transition-colors"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => copyEndpoint(resource)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-sp-gold hover:bg-sp-gold/10 transition-colors"
                          title="Copy endpoint"
                        >
                          {copiedId === resource.id ? (
                            <Check className="h-4 w-4 text-sp-gold" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                        <a
                          href={`${API_URL}/x402/resource/${resource.slug || resource.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg text-muted-foreground hover:text-sp-gold hover:bg-sp-gold/10 transition-colors"
                          title="Open in new tab"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 rounded-lg text-muted-foreground hover:text-sp-gold hover:bg-sp-gold/10 transition-colors">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/resources/${resource.id}/edit`}
                                className="flex items-center gap-2 text-foreground hover:text-sp-gold"
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(resource.id)}
                              className="text-red-400 focus:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
              );
            })}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewResource} onOpenChange={() => setPreviewResource(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {previewResource && (
                <>
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${typeColors[previewResource.type]}`}>
                    {(() => {
                      const Icon = typeIcons[previewResource.type];
                      return <Icon className="h-5 w-5" />;
                    })()}
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{previewResource.name}</div>
                    <div className="text-sm text-muted-foreground font-normal capitalize">
                      {previewResource.type} Resource
                    </div>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {loadingPreview ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-sp-gold" />
            </div>
          ) : previewData ? (
            <div className="space-y-6">
              {previewResource?.type === "shopify" && previewData.store ? (
                <>
                  {/* Store Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase">Store Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Store Name</div>
                        <div className="text-sm">{previewData.store.name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Currency</div>
                        <div className="text-sm">{previewData.store.currency || "USD"}</div>
                      </div>
                    </div>
                    {previewData.store.url && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Store URL</div>
                        <a
                          href={previewData.store.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-sp-gold hover:underline flex items-center gap-1"
                        >
                          {previewData.store.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Products */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                        Products ({previewData.products.length})
                      </h3>
                    </div>
                    {previewData.products.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {previewData.products.slice(0, 10).map((product: any) => (
                          <div key={product.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted border border-border">
                            {product.image && (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-12 w-12 rounded object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{product.name}</div>
                              <div className="text-xs text-muted-foreground">{formatCurrency(parseFloat(product.price))}</div>
                            </div>
                            {product.inventory !== undefined && (
                              <div className="text-xs text-muted-foreground">
                                Stock: {product.inventory}
                              </div>
                            )}
                          </div>
                        ))}
                        {previewData.products.length > 10 && (
                          <div className="text-xs text-muted-foreground text-center py-2">
                            +{previewData.products.length - 10} more products
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-8">No products yet</div>
                    )}
                  </div>

                  {/* Orders */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                        Recent Orders ({previewData.orders.length})
                      </h3>
                      {previewData.orders.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="text-xs"
                        >
                          <Link href="/dashboard/orders">View All</Link>
                        </Button>
                      )}
                    </div>
                    {previewData.orders.length > 0 ? (
                      <div className="space-y-2">
                        {previewData.orders.slice(0, 5).map((order: any) => (
                          <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
                            <div className="flex items-center gap-3">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="text-sm font-medium">{order.id}</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-sp-gold">
                                {formatCurrency(parseFloat(order.total_amount))}
                              </div>
                              <div className="text-xs text-muted-foreground capitalize">{order.status}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-8">No orders yet</div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Description</div>
                    <div className="text-sm">{previewResource?.description || "No description"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Price</div>
                    <div className="text-sm">{formatCurrency(previewResource?.priceUsdc || 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Stats</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Accesses:</span> {previewResource?.accessCount}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Earned:</span> {formatCurrency(previewResource?.totalEarnings || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No preview data available
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
