import { trpc } from "@/lib/trpc";
import {
  ChefHat,
  Edit,
  Package,
  Plus,
  Store,
  Trash2,
  UtensilsCrossed,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatKES } from "@shared/currency";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

const STATUS_CONFIG = {
  placed: { label: "Placed", color: "bg-blue-100 text-blue-700" },
  preparing: { label: "Preparing", color: "bg-yellow-100 text-yellow-700" },
  on_the_way: { label: "On the Way", color: "bg-orange-100 text-orange-700" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
} as const;

// ── Restaurants Tab ───────────────────────────────────────────────────────────

function RestaurantsTab() {
  const utils = trpc.useUtils();
  const { data: restaurants, isLoading } = trpc.restaurants.list.useQuery({});
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    cuisine: "",
    deliveryTime: "30-45 min",
    deliveryFee: "260",
    rating: "4.5",
    imageUrl: "",
  });

  const createMutation = trpc.restaurants.create.useMutation({
    onSuccess: () => {
      utils.restaurants.list.invalidate();
      setShowForm(false);
      resetForm();
      toast.success("Restaurant created");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.restaurants.update.useMutation({
    onSuccess: () => {
      utils.restaurants.list.invalidate();
      setShowForm(false);
      resetForm();
      toast.success("Restaurant updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.restaurants.delete.useMutation({
    onSuccess: () => {
      utils.restaurants.list.invalidate();
      toast.success("Restaurant deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      cuisine: "",
      deliveryTime: "30-45 min",
      deliveryFee: "260",
      rating: "4.5",
      imageUrl: "",
    });
    setEditId(null);
  };

  const handleEdit = (restaurant: any) => {
    setForm({
      name: restaurant.name,
      description: restaurant.description || "",
      cuisine: restaurant.cuisine || "",
      deliveryTime: restaurant.deliveryTime || "30-45 min",
      deliveryFee: restaurant.deliveryFee || "260",
      rating: restaurant.rating?.toString() || "4.5",
      imageUrl: restaurant.imageUrl || "",
    });
    setEditId(restaurant.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      cuisine: form.cuisine,
      deliveryTime: form.deliveryTime,
      deliveryFee: form.deliveryFee,
      rating: form.rating,
      imageUrl: form.imageUrl,
    };
    if (editId) {
      updateMutation.mutate({ id: editId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isLoading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowForm(true)} className="gap-2">
        <Plus className="w-4 h-4" /> Add Restaurant
      </Button>

      <div className="space-y-2">
        {restaurants?.map((restaurant) => (
          <div key={restaurant.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold">{restaurant.name}</h3>
              <p className="text-xs text-muted-foreground">
                {restaurant.cuisine} · ⭐ {restaurant.rating} · {restaurant.deliveryTime}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(restaurant)}>
                <Edit className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm(`Delete "${restaurant.name}"?`)) deleteMutation.mutate({ id: restaurant.id });
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Restaurant" : "Add Restaurant"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Cuisine</Label>
              <Input
                value={form.cuisine}
                onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Delivery Time</Label>
                <Input
                  value={form.deliveryTime}
                  onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Delivery Fee (KES)</Label>
                <Input
                  type="number"
                  value={form.deliveryFee}
                  onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Rating</Label>
              <Input
                type="number"
                step="0.1"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-white"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editId ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Menu Items Tab ────────────────────────────────────────────────────────────

function MenuItemsTab() {
  const utils = trpc.useUtils();
  const { data: restaurants } = trpc.restaurants.list.useQuery({});
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    isAvailable: true,
    isPopular: false,
    categoryId: undefined as number | undefined,
  });

  const { data: categories } = trpc.menu.getCategories.useQuery(
    { restaurantId: selectedRestaurantId! },
    { enabled: !!selectedRestaurantId }
  );

  const { data: menuItems, isLoading } = trpc.menu.getAllItems.useQuery(
    { restaurantId: selectedRestaurantId! },
    { enabled: !!selectedRestaurantId }
  );

  const createMutation = trpc.menu.createItem.useMutation({
    onSuccess: () => {
      utils.menu.getAllItems.invalidate();
      setShowForm(false);
      resetForm();
      toast.success("Menu item created");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.menu.updateItem.useMutation({
    onSuccess: () => {
      utils.menu.getAllItems.invalidate();
      setShowForm(false);
      resetForm();
      toast.success("Menu item updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.menu.deleteItem.useMutation({
    onSuccess: () => {
      utils.menu.getAllItems.invalidate();
      toast.success("Menu item deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      price: "",
      isAvailable: true,
      isPopular: false,
      categoryId: undefined,
    });
    setEditId(null);
  };

  const handleEdit = (item: any) => {
    setForm({
      name: item.name,
      description: item.description || "",
      price: item.price,
      isAvailable: item.isAvailable,
      isPopular: item.isPopular,
      categoryId: item.categoryId,
    });
    setEditId(item.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurantId || !form.categoryId) {
      toast.error("Please select a restaurant and category");
      return;
    }
    const payload = {
      restaurantId: selectedRestaurantId,
      ...form,
      price: form.price,
    };
    if (editId) {
      updateMutation.mutate({ id: editId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Select Restaurant</Label>
        <Select value={selectedRestaurantId?.toString() || ""} onValueChange={(v) => setSelectedRestaurantId(parseInt(v))}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a restaurant..." />
          </SelectTrigger>
          <SelectContent>
            {restaurants?.map((r) => (
              <SelectItem key={r.id} value={r.id.toString()}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedRestaurantId && (
        <>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Menu Item
          </Button>

          {isLoading ? (
            <div className="text-center py-10">Loading...</div>
          ) : (
            <div className="space-y-2">
              {menuItems?.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {item.isPopular && (
                        <Badge className="bg-orange-100 text-orange-700 text-xs border-0">Popular</Badge>
                      )}
                      {!item.isAvailable && (
                        <Badge className="bg-gray-100 text-gray-600 text-xs border-0">Unavailable</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatKES(parseFloat(item.price))}
                      {item.description ? ` · ${item.description.slice(0, 50)}...` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(item)}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Delete "${item.name}"?`)) deleteMutation.mutate({ id: item.id });
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {menuItems?.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <p>No menu items yet. Add some!</p>
                </div>
              )}
            </div>
          )}

          {/* Add/Edit Dialog */}
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editId ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label>Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Category *</Label>
                  <Select value={form.categoryId?.toString() || ""} onValueChange={(v) => setForm({ ...form, categoryId: parseInt(v) })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Price (KES) *</Label>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPopular"
                    checked={form.isPopular}
                    onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="isPopular" className="cursor-pointer">
                    Mark as Popular
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={form.isAvailable}
                    onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="isAvailable" className="cursor-pointer">
                    Available
                  </Label>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-white"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editId ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

// ── SMS Logs Tab ────────────────────────────────────────────────────────────────

function SmsLogsTab() {
  const { data: logs, isLoading } = trpc.notifications.listLogs.useQuery();

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">SMS Notification Logs</h3>
        <p className="text-sm text-blue-700">
          SMS notifications sent to customers when order status changes to "On the Way" or "Delivered".
        </p>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : logs && logs.length > 0 ? (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Phone</th>
                  <th className="px-4 py-3 text-left font-medium">Message</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Sent At</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id} className="border-b border-border hover:bg-muted/50">
                    <td className="px-4 py-3 font-mono text-xs">{log.phoneNumber}</td>
                    <td className="px-4 py-3 text-xs max-w-xs truncate">{log.message}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={log.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}
                      >
                        {log.error ? 'Failed' : 'Sent'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-lg p-6 text-center">
          <p className="text-muted-foreground">No SMS logs yet</p>
        </div>
      )}
    </div>
  );
}

// ── Orders Tab ────────────────────────────────────────────────────────────────

function OrdersTab() {
  const utils = trpc.useUtils();
  const { data: orders, isLoading } = trpc.orders.adminList.useQuery({});

  const updateStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      utils.orders.adminList.invalidate();
      toast.success("Order status updated");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-center py-10">Loading orders...</div>;

  return (
    <div className="space-y-4">
      {orders?.map((orderData) => (
        <div key={orderData.order.id} className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Order #{orderData.order.id}</h3>
              <p className="text-xs text-muted-foreground">
                {new Date(orderData.order.createdAt).toLocaleString()}
              </p>
            </div>
            <Badge className={STATUS_CONFIG[orderData.order.status as keyof typeof STATUS_CONFIG]?.color}>
              {STATUS_CONFIG[orderData.order.status as keyof typeof STATUS_CONFIG]?.label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Delivery Address</p>
              <p className="font-medium">{orderData.order.deliveryAddress}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Total</p>
              <p className="font-medium">{formatKES(parseFloat(orderData.order.totalAmount))}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Update Status</Label>
            <Select
              value={orderData.order.status}
              onValueChange={(status) => updateStatus.mutate({ id: orderData.order.id, status: status as any })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placed">Placed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="on_the_way">On the Way</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
      {orders?.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <p>No orders yet</p>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-sm px-4">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <h2
            className="text-2xl font-bold text-foreground mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Access Denied
          </h2>
          <p className="text-muted-foreground mb-6">
            You need admin privileges to access this panel.
          </p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="py-8 text-white"
        style={{
          background: "linear-gradient(135deg, oklch(0.18 0.02 30) 0%, oklch(0.30 0.08 32) 100%)",
        }}
      >
        <div className="container">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Admin Panel
              </h1>
              <p className="text-white/60 text-sm">Manage your FoodBites platform</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <Tabs defaultValue="restaurants">
          <TabsList className="mb-6 bg-white border border-border">
            <TabsTrigger value="restaurants" className="gap-2">
              <Store className="w-4 h-4" /> Restaurants
            </TabsTrigger>
            <TabsTrigger value="menu" className="gap-2">
              <UtensilsCrossed className="w-4 h-4" /> Menu Items
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <Package className="w-4 h-4" /> Orders
            </TabsTrigger>
            <TabsTrigger value="sms-logs" className="gap-2">
              <AlertTriangle className="w-4 h-4" /> SMS Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="restaurants">
            <RestaurantsTab />
          </TabsContent>
          <TabsContent value="menu">
            <MenuItemsTab />
          </TabsContent>
          <TabsContent value="orders">
            <OrdersTab />
          </TabsContent>
          <TabsContent value="sms-logs">
            <SmsLogsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
