"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getTxUrl, getCurrencyDisplay } from "@/lib/chain-config";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface AccessLog {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  amount: number;
  paymentSignature: string;
  timestamp: string;
}

interface TopResource {
  id: string;
  name: string;
  type: string;
  earnings: number;
  accessCount: number;
}

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [period, setPeriod] = useState<"7" | "30" | "90">("30");
  const [chartData, setChartData] = useState<any[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [topResources, setTopResources] = useState<TopResource[]>([]);
  const [totals, setTotals] = useState({ earnings: 0, accesses: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [chartRes, logsRes, earningsRes] = await Promise.all([
          fetch(`${API_URL}/api/analytics/chart?days=${period}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/analytics/access?limit=50`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/analytics/earnings`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (chartRes.ok) {
          const data = await chartRes.json();
          setChartData(data.chartData || []);
          setTotals({
            earnings: data.totalEarnings || 0,
            accesses: data.totalAccesses || 0,
          });
        }
        if (logsRes.ok) {
          const data = await logsRes.json();
          setLogs(data.logs || []);
        }
        if (earningsRes.ok) {
          const data = await earningsRes.json();
          setTopResources(data.topResources || []);
        }
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, period]);

  const formatUSDC = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-sp-blue" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your earnings and resource performance</p>
        </div>
        <div className="flex items-center gap-2 bg-muted p-1 rounded-xl">
          {(["7", "30", "90"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                period === p
                  ? "bg-sp-blue text-white shadow-lg shadow-sp-blue/10"
                  : "text-muted-foreground hover:text-sp-blue hover:bg-sp-blue/10"
              }`}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card border border-border rounded-2xl p-6 hover:border-sp-blue/30 transition-colors group">
          <div className="text-sm text-muted-foreground mb-1">Period Earnings</div>
          <div className="text-3xl font-bold text-sp-blue">
            {formatUSDC(totals.earnings)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Last {period} days</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 hover:border-sp-blue/30 transition-colors group">
          <div className="text-sm text-muted-foreground mb-1">Total Accesses</div>
          <div className="text-3xl font-bold text-foreground">{totals.accesses}</div>
          <div className="text-xs text-muted-foreground mt-1">Last {period} days</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 hover:border-sp-blue/30 transition-colors group">
          <div className="text-sm text-muted-foreground mb-1">Avg per Access</div>
          <div className="text-3xl font-bold text-foreground">
            {formatUSDC(totals.accesses ? totals.earnings / totals.accesses : 0)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{getCurrencyDisplay()} per request</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 hover:border-sp-blue/30 transition-colors group">
          <div className="text-sm text-muted-foreground mb-1">Daily Avg</div>
          <div className="text-3xl font-bold text-foreground">
            {formatUSDC(totals.earnings / parseInt(period))}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{getCurrencyDisplay()} per day</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Earnings Over Time */}
        <div className="bg-card border border-border rounded-2xl">
          <div className="p-6 border-b border-border">
            <h3 className="font-bold text-lg text-foreground">Earnings Over Time</h3>
          </div>
          <div className="p-6">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb30" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                    }}
                    labelStyle={{ color: "#6b7280" }}
                    formatter={(value: number) => [formatUSDC(value), "Earnings"]}
                    labelFormatter={formatDate}
                  />
                  <Line
                    type="monotone"
                    dataKey="earnings"
                    stroke="#16a34a"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data for this period
              </div>
            )}
          </div>
        </div>

        {/* Accesses Over Time */}
        <div className="bg-card border border-border rounded-2xl">
          <div className="p-6 border-b border-border">
            <h3 className="font-bold text-lg text-foreground">Accesses Over Time</h3>
          </div>
          <div className="p-6">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb30" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                    }}
                    labelStyle={{ color: "#6b7280" }}
                    formatter={(value: number) => [value, "Accesses"]}
                    labelFormatter={formatDate}
                  />
                  <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data for this period
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Resources & Recent Logs */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Resources */}
        <div className="bg-card border border-border rounded-2xl">
          <div className="p-6 border-b border-border">
            <h3 className="font-bold text-lg text-foreground">Top Resources</h3>
          </div>
          <div className="p-6">
            {topResources.length > 0 ? (
              <div className="space-y-4">
                {topResources.slice(0, 5).map((resource, i) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-6">{i + 1}.</span>
                      <div>
                        <p className="font-bold text-foreground">{resource.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {resource.type} • {resource.accessCount} accesses
                        </p>
                      </div>
                    </div>
                    <span className="font-medium text-sp-blue">
                      {formatUSDC(resource.earnings)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No resources yet
              </div>
            )}
          </div>
        </div>

        {/* Recent Access Logs */}
        <div className="bg-card border border-border rounded-2xl">
          <div className="p-6 border-b border-border">
            <h3 className="font-bold text-lg text-foreground">Recent Transactions</h3>
          </div>
          <div className="p-6">
            {logs.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-sm font-bold text-foreground">{log.resourceName}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(log.timestamp)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sp-blue">
                        {formatUSDC(log.amount)}
                      </span>
                      <a
                        href={getTxUrl(log.paymentSignature)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-sp-blue transition-colors"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No transactions yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
