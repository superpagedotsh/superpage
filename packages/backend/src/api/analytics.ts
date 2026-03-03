import { Response } from "express";
import { AccessLog, Resource, Store, Order } from "../models/index.js";
import { AuthenticatedRequest } from "./wallet-auth";
import mongoose from "mongoose";

export async function handleGetEarnings(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.creator) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const creatorId = new mongoose.Types.ObjectId(req.creator.id);
    const logs = await AccessLog.find({ creatorId }).sort({ accessedAt: -1 }).limit(50).lean();
    
    const resources = await Resource.find({ creatorId }).lean();
    const resourceMap = new Map(resources.map(r => [r._id.toString(), r]));

    const recentTransactions = logs.map((log) => {
      const resource = resourceMap.get(log.resourceId.toString());
      return {
        id: log._id.toString(),
        resourceId: log.resourceId.toString(),
        resourceName: resource?.name || "Unknown Resource",
        resourceType: resource?.type || "unknown",
        amount: log.amountUsdc,
        signature: log.paymentSignature,
        timestamp: log.accessedAt.toISOString(),
      };
    });

    // Top resources by earnings
    const resourceEarnings = new Map<string, { earnings: number; accessCount: number }>();
    logs.forEach((log) => {
      const resourceId = log.resourceId.toString();
      const current = resourceEarnings.get(resourceId) || { earnings: 0, accessCount: 0 };
      resourceEarnings.set(resourceId, {
        earnings: current.earnings + log.amountUsdc,
        accessCount: current.accessCount + 1,
      });
    });

    const topResources = Array.from(resourceEarnings.entries())
      .map(([resourceId, stats]) => {
        const resource = resourceMap.get(resourceId);
        return {
          id: resourceId,
          name: resource?.name || "Unknown",
          type: resource?.type || "unknown",
          earnings: stats.earnings,
          accessCount: stats.accessCount,
        };
      })
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 10);

    const totalEarnings = logs.reduce((sum, log) => sum + (log.amountUsdc || 0), 0);

    return res.json({ 
      totalEarnings,
      recentTransactions,
      topResources,
    });
  } catch (err: any) {
    console.error("[Analytics] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function handleGetAccessLogs(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.creator) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const creatorId = new mongoose.Types.ObjectId(req.creator.id);
    const limit = parseInt(req.query.limit as string) || 50;
    
    const logs = await AccessLog.find({ creatorId })
      .sort({ accessedAt: -1 })
      .limit(limit)
      .populate("resourceId", "name type")
      .lean();

    const formattedLogs = logs.map((log: any) => ({
      id: log._id.toString(),
      resourceId: log.resourceId?._id?.toString() || log.resourceId?.toString(),
      resourceName: log.resourceId?.name || "Unknown Resource",
      resourceType: log.resourceId?.type || "unknown",
      amount: log.amountUsdc,
      paymentSignature: log.paymentSignature,
      timestamp: log.accessedAt?.toISOString() || new Date().toISOString(),
    }));

    return res.json({ logs: formattedLogs });
  } catch (err: any) {
    console.error("[Analytics] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function handleGetChartData(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.creator) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const creatorId = new mongoose.Types.ObjectId(req.creator.id);
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await AccessLog.find({ 
      creatorId,
      accessedAt: { $gte: startDate }
    })
      .sort({ accessedAt: 1 })
      .lean();

    // Group by date
    const dailyData = new Map<string, { earnings: number; count: number }>();
    
    logs.forEach((log) => {
      const dateKey = log.accessedAt.toISOString().split('T')[0]; // YYYY-MM-DD
      const current = dailyData.get(dateKey) || { earnings: 0, count: 0 };
      dailyData.set(dateKey, {
        earnings: current.earnings + (log.amountUsdc || 0),
        count: current.count + 1,
      });
    });

    // Convert to array and format dates
    const chartData = Array.from(dailyData.entries())
      .map(([date, data]) => ({
        date,
        earnings: data.earnings,
        count: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalEarnings = logs.reduce((sum, log) => sum + (log.amountUsdc || 0), 0);
    const totalAccesses = logs.length;

    return res.json({ 
      chartData,
      totalEarnings,
      totalAccesses,
    });
  } catch (err: any) {
    console.error("[Analytics] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function handleGetOverview(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.creator) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const creatorId = new mongoose.Types.ObjectId(req.creator.id);

    const [logs, resources, stores, orders] = await Promise.all([
      AccessLog.find({ creatorId }).lean(),
      Resource.find({ creatorId }).lean(),
      Store.find({ creatorId }).lean(),
      Order.find({ status: 'confirmed' }).lean(),
    ]);

    // Filter orders for this creator's stores
    const storeIds = stores.map(s => s.id);
    const creatorOrders = orders.filter(o => storeIds.includes(o.storeId));

    // Calculate today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLogs = logs.filter(log => {
      const logDate = new Date(log.accessedAt);
      return logDate >= today;
    });

    const todayOrders = creatorOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= today;
    });

    const todayResourceEarnings = todayLogs.reduce((sum, log) => sum + (log.amountUsdc || 0), 0);
    const todayOrderEarnings = todayOrders.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);
    const todayEarnings = todayResourceEarnings + todayOrderEarnings;
    const todayAccesses = todayLogs.length;

    // Calculate total stats
    const totalResourceEarnings = logs.reduce((sum, log) => sum + (log.amountUsdc || 0), 0);
    const totalOrderEarnings = creatorOrders.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);
    const totalEarnings = totalResourceEarnings + totalOrderEarnings;
    const totalAccesses = logs.length;
    const activeResources = resources.filter((r) => r.isActive).length;
    const totalResources = resources.length;

    // Calculate by type breakdown
    const byType: Record<string, { count: number; earnings: number; accesses: number }> = {};
    
    resources.forEach((resource) => {
      const type = resource.type || "unknown";
      if (!byType[type]) {
        byType[type] = { count: 0, earnings: 0, accesses: 0 };
      }
      byType[type].count += 1;
    });

    // Add earnings and accesses by type
    logs.forEach((log) => {
      const resource = resources.find(r => r._id.toString() === log.resourceId.toString());
      if (resource) {
        const type = resource.type || "unknown";
        if (byType[type]) {
          byType[type].earnings += log.amountUsdc || 0;
          byType[type].accesses += 1;
        }
      }
    });

    return res.json({
      totalEarnings: parseFloat(totalEarnings.toFixed(3)),
      totalAccesses,
      totalResources,
      activeResources,
      todayEarnings: parseFloat(todayEarnings.toFixed(3)),
      todayAccesses,
      byType,
      storeCount: stores.length,
      orderCount: creatorOrders.length,
    });
  } catch (err: any) {
    console.error("[Analytics] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
