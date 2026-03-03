"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCurrencyDisplay } from "@/lib/chain-config";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
import {
  Code,
  FileText,
  Globe,
  ShoppingBag,
  ArrowLeft,
  Loader2,
  Upload,
  CheckCircle,
  Plus,
  Store,
  Link as LinkIcon,
  Rss,
  FileDown,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type ResourceType = "api" | "file" | "article";

interface ResourceTypeOption {
  type: ResourceType;
  title: string;
  description: string;
  icon: typeof Code;
  color: string;
}

interface ShopifyStore {
  id: string;
  name: string;
  url: string;
  shop_domain: string;
}

const resourceTypes: ResourceTypeOption[] = [
  {
    type: "api",
    title: "API Proxy",
    description: "Monetize any API endpoint with pay-per-call",
    icon: Code,
    color: "text-sp-gold border-sp-gold/30 bg-sp-gold/10",
  },
  {
    type: "file",
    title: "File / Download",
    description: "Upload files or link to external URLs",
    icon: FileDown,
    color: "text-sp-gold border-sp-gold/30 bg-sp-gold/10",
  },
  {
    type: "article",
    title: "Blog / Content",
    description: "Paywall blogs, RSS feeds, or write content",
    icon: Rss,
    color: "text-sp-gold border-sp-gold/30 bg-sp-gold/10",
  },
];

export default function NewResourcePage() {
  const router = useRouter();
  const { token } = useAuth();

  const [step, setStep] = useState<"type" | "details">("type");
  const [selectedType, setSelectedType] = useState<ResourceType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceUsdc, setPriceUsdc] = useState("0.01");

  // API specific
  const [upstreamUrl, setUpstreamUrl] = useState("");
  const [method, setMethod] = useState("GET");

  // Blog/Content specific
  const [contentMode, setContentMode] = useState<"url" | "sitemap" | "write">("url");
  const [blogUrl, setBlogUrl] = useState("");
  const [content, setContent] = useState("");

  // File specific
  const [fileMode, setFileMode] = useState<"upload" | "link">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");

  const handleSelectType = (type: ResourceType) => {
    setSelectedType(type);
    setStep("details");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !token) return;

    setLoading(true);
    setError("");

    try {
      // Handle file upload separately (only for upload mode)
      if (selectedType === "file" && fileMode === "upload" && file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", name);
        formData.append("description", description);
        formData.append("priceUsdc", priceUsdc);

        const res = await fetch(`${API_URL}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to upload file");
        }

        router.push("/dashboard/resources");
        return;
      }

      // Build config based on type
      let config: Record<string, any> = {};
      switch (selectedType) {
        case "api":
          config = { upstream_url: upstreamUrl, method };
          break;
        case "file":
          // External file link
          config = {
            external_url: fileUrl,
            filename: fileName || fileUrl.split("/").pop() || "download",
            mode: "external"
          };
          break;
        case "article":
          // Blog/Content with different modes
          if (contentMode === "url") {
            config = { blog_url: blogUrl, mode: "url" };
          } else if (contentMode === "sitemap") {
            config = { sitemap_url: blogUrl, mode: "sitemap" };
          } else {
            config = { content, mode: "direct" };
          }
          break;
      }

      const res = await fetch(`${API_URL}/api/resources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: selectedType,
          name,
          description,
          priceUsdc: parseFloat(priceUsdc),
          config,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create resource");
      }

      router.push("/dashboard/resources");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Back button */}
      <Link
        href="/dashboard/resources"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-sp-gold transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Resources
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold text-foreground">Create New Resource</h1>

      {/* Step 1: Select Type */}
      {step === "type" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {resourceTypes.map((option) => (
            <button
              key={option.type}
              onClick={() => handleSelectType(option.type)}
              className={`p-6 rounded-2xl border text-left transition-all hover:scale-[1.02] hover:border-sp-gold hover:shadow-lg hover:shadow-sp-gold/10 ${option.color}`}
            >
              <option.icon className="h-8 w-8 mb-3" />
              <h3 className="font-bold text-foreground mb-1">{option.title}</h3>
              <p className="text-sm text-muted-foreground">{option.description}</p>
            </button>
          ))}

          {/* Shopify Store Option */}
          <Link
            href="/dashboard/stores"
            className="p-6 rounded-2xl border border-sp-gold/30 bg-sp-gold/10 text-left transition-all hover:scale-[1.02] hover:border-sp-gold hover:shadow-lg hover:shadow-sp-gold/10 group"
          >
            <ShoppingBag className="h-8 w-8 mb-3 text-sp-gold group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-foreground mb-1">Shopify Store</h3>
            <p className="text-sm text-muted-foreground">Connect and monetize your Shopify products</p>
            <div className="mt-3 flex items-center gap-1 text-sp-gold text-xs font-medium">
              <span>Go to Stores</span>
              <ArrowLeft className="h-3 w-3 rotate-180" />
            </div>
          </Link>
        </div>
      )}

      {/* Step 2: Details Form */}
      {step === "details" && selectedType && (
        <div className="bg-card border border-border rounded-2xl">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep("type")}
                className="p-2 rounded-lg text-muted-foreground hover:text-sp-gold hover:bg-sp-gold/10 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h3 className="font-bold text-lg text-foreground">
                  {resourceTypes.find((t) => t.type === selectedType)?.title}
                </h3>
                <p className="text-sm text-muted-foreground">Fill in the details for your resource</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Common Fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-foreground">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Premium API"
                    required
                    className="bg-muted border-border text-foreground focus:border-sp-gold"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-foreground">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does this resource provide?"
                    className="bg-muted border-border text-foreground focus:border-sp-gold"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="price" className="text-foreground">
                    Price ({getCurrencyDisplay()})
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.001"
                    min="0"
                    value={priceUsdc}
                    onChange={(e) => setPriceUsdc(e.target.value)}
                    required
                    className="bg-muted border-border text-foreground focus:border-sp-gold"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Price per access in {getCurrencyDisplay()}
                  </p>
                </div>
              </div>

              {/* Type-specific Fields */}
              {selectedType === "api" && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <h4 className="font-medium text-sm text-muted-foreground">API Configuration</h4>
                  <div>
                    <Label htmlFor="upstream" className="text-foreground">Upstream URL</Label>
                    <Input
                      id="upstream"
                      type="url"
                      value={upstreamUrl}
                      onChange={(e) => setUpstreamUrl(e.target.value)}
                      placeholder="https://api.example.com/endpoint"
                      required
                      className="bg-muted border-border text-foreground focus:border-sp-gold"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Requests will be proxied to this URL after payment
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="method" className="text-foreground">HTTP Method</Label>
                    <select
                      id="method"
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-foreground focus:border-sp-gold focus:outline-none"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedType === "file" && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <h4 className="font-medium text-sm text-muted-foreground">File Source</h4>

                  {/* Mode selector */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFileMode("upload")}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border transition-all font-medium ${
                        fileMode === "upload"
                          ? "border-sp-gold bg-sp-gold/10 text-sp-gold"
                          : "border-border text-muted-foreground hover:border-sp-gold/30 hover:text-sp-gold"
                      }`}
                    >
                      <Upload className="h-4 w-4" />
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setFileMode("link")}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border transition-all font-medium ${
                        fileMode === "link"
                          ? "border-sp-gold bg-sp-gold/10 text-sp-gold"
                          : "border-border text-muted-foreground hover:border-sp-gold/30 hover:text-sp-gold"
                      }`}
                    >
                      <LinkIcon className="h-4 w-4" />
                      External Link
                    </button>
                  </div>

                  {fileMode === "upload" ? (
                    <div>
                      <Label className="text-foreground">File</Label>
                      <div className="mt-2">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-xl cursor-pointer bg-muted hover:bg-muted/80 hover:border-sp-gold/30 transition-all">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {file ? (
                              <>
                                <CheckCircle className="h-8 w-8 text-sp-gold mb-2" />
                                <p className="text-sm text-foreground">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </>
                            ) : (
                              <>
                                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground">Max 50MB</p>
                              </>
                            )}
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="fileUrl" className="text-foreground">File URL</Label>
                        <Input
                          id="fileUrl"
                          type="url"
                          value={fileUrl}
                          onChange={(e) => setFileUrl(e.target.value)}
                          placeholder="https://example.com/files/document.pdf"
                          required
                          className="bg-muted border-border text-foreground focus:border-sp-gold"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          S3, Dropbox, Google Drive, or any direct download URL
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="fileName" className="text-foreground">File Name (optional)</Label>
                        <Input
                          id="fileName"
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                          placeholder="my-document.pdf"
                          className="bg-muted border-border text-foreground focus:border-sp-gold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedType === "article" && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <h4 className="font-medium text-sm text-muted-foreground">Blog / Content Source</h4>

                  {/* Mode selector */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setContentMode("url")}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all font-medium ${
                        contentMode === "url"
                          ? "border-sp-gold bg-sp-gold/10 text-sp-gold"
                          : "border-border text-muted-foreground hover:border-sp-gold/30 hover:text-sp-gold"
                      }`}
                    >
                      <Globe className="h-4 w-4" />
                      Blog URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentMode("sitemap")}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all font-medium ${
                        contentMode === "sitemap"
                          ? "border-sp-gold bg-sp-gold/10 text-sp-gold"
                          : "border-border text-muted-foreground hover:border-sp-gold/30 hover:text-sp-gold"
                      }`}
                    >
                      <Rss className="h-4 w-4" />
                      RSS / Sitemap
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentMode("write")}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all font-medium ${
                        contentMode === "write"
                          ? "border-sp-gold bg-sp-gold/10 text-sp-gold"
                          : "border-border text-muted-foreground hover:border-sp-gold/30 hover:text-sp-gold"
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                      Write
                    </button>
                  </div>

                  {contentMode === "url" && (
                    <div>
                      <Label htmlFor="blogUrl" className="text-foreground">Blog / Article URL</Label>
                      <Input
                        id="blogUrl"
                        type="url"
                        value={blogUrl}
                        onChange={(e) => setBlogUrl(e.target.value)}
                        placeholder="https://yourblog.com/premium-post"
                        required
                        className="bg-muted border-border text-foreground focus:border-sp-gold"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Paywall access to a specific blog post or article
                      </p>
                    </div>
                  )}

                  {contentMode === "sitemap" && (
                    <div>
                      <Label htmlFor="sitemapUrl" className="text-foreground">RSS Feed or Sitemap URL</Label>
                      <Input
                        id="sitemapUrl"
                        type="url"
                        value={blogUrl}
                        onChange={(e) => setBlogUrl(e.target.value)}
                        placeholder="https://yourblog.com/feed.xml"
                        required
                        className="bg-muted border-border text-foreground focus:border-sp-gold"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Paywall your entire blog feed or sitemap
                      </p>
                    </div>
                  )}

                  {contentMode === "write" && (
                    <div data-color-mode="light">
                      <Label htmlFor="content" className="text-foreground mb-2 block">Content (Markdown)</Label>
                      <MDEditor
                        value={content}
                        onChange={(val) => setContent(val || "")}
                        height={350}
                        preview="live"
                        textareaProps={{
                          placeholder: "# My Premium Content\n\nWrite your article in markdown...",
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Use the toolbar to format text, or write Markdown directly
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-sp-gold hover:bg-sp-gold/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-sp-gold/10 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Resource"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/resources")}
                  className="px-6 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-border transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
