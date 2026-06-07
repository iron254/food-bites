import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowLeft, TrendingUp, Package, DollarSign, BarChart3, X } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatKES } from "@shared/currency";

export default function FinancialReports() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-5xl mb-4">🔒</p>
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">Only admins can view financial reports</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Fetch financial data
  const { data: summary, isLoading: summaryLoading } = trpc.reports.financialSummary.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const { data: dailyRevenue, isLoading: dailyLoading } = trpc.reports.dailyRevenue.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const { data: ordersByStatus, isLoading: statusLoading } = trpc.reports.ordersByStatus.useQuery();

  const { data: paymentMethods, isLoading: methodsLoading } =
    trpc.reports.paymentMethodBreakdown.useQuery();

  const isLoading = summaryLoading || dailyLoading || statusLoading || methodsLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Financial Reports</h1>
              <p className="text-sm text-muted-foreground">Revenue and order analytics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white border-b border-border">
        <div className="container py-4">
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start ? dateRange.start.toISOString().split("T")[0] : ""}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    start: e.target.value ? new Date(e.target.value) : undefined,
                  }))
                }
                className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end ? dateRange.end.toISOString().split("T")[0] : ""}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    end: e.target.value ? new Date(e.target.value) : undefined,
                  }))
                }
                className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {(dateRange.start || dateRange.end) && (
              <Button variant="outline" size="sm" onClick={() => setDateRange({})}>
                <X className="w-4 h-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Revenue */}
              <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-foreground">
                      {formatKES(summary?.totalRevenue || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </Card>

              {/* Total Orders */}
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                    <p className="text-3xl font-bold text-foreground">{summary?.totalOrders || 0}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </Card>

              {/* Average Order Value */}
              <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Avg Order Value</p>
                    <p className="text-3xl font-bold text-foreground">
                      {formatKES(summary?.avgOrderValue || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Orders by Status */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Orders by Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {ordersByStatus &&
                  Object.entries(ordersByStatus).map(([status, count]) => (
                    <div
                      key={status}
                      className="p-4 bg-muted rounded-lg text-center border border-border"
                    >
                      <p className="text-sm text-muted-foreground capitalize mb-1">
                        {status.replace(/_/g, " ")}
                      </p>
                      <p className="text-2xl font-bold text-foreground">{count}</p>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Payment Methods */}
            {paymentMethods && Object.keys(paymentMethods).length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(paymentMethods).map(([method, count]) => (
                    <div
                      key={method}
                      className="p-4 bg-muted rounded-lg text-center border border-border"
                    >
                      <p className="text-sm text-muted-foreground capitalize mb-1">{method}</p>
                      <p className="text-2xl font-bold text-foreground">{count}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Daily Revenue Chart */}
            {dailyRevenue && dailyRevenue.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Daily Revenue Trend</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 font-semibold">Date</th>
                        <th className="text-right py-2 px-2 font-semibold">Revenue</th>
                        <th className="text-right py-2 px-2 font-semibold">Visual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyRevenue.map((day, idx) => {
                        const maxRevenue = Math.max(...dailyRevenue.map((d) => d.revenue));
                        const percentage = (day.revenue / maxRevenue) * 100;

                        return (
                          <tr key={idx} className="border-b border-border hover:bg-muted/50">
                            <td className="py-3 px-2">{day.date}</td>
                            <td className="text-right py-3 px-2 font-medium">
                              {formatKES(day.revenue)}
                            </td>
                            <td className="py-3 px-2">
                              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-orange-400 to-red-500 h-full rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
