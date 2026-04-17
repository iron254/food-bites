import { useAuth } from "@/_core/hooks/useAuth";
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
    minOrder: "1300",
    isOpen: true,
    featured: false,
    address: "",
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
      setEditId(null);
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

  const resetForm = () =>
    setForm({
      name: "",
      description: "",
      cuisine: "",
      deliveryTime: "30-45 min",
      deliveryFee: "2.99",
      minOrder: "10.00",
      isOpen: true,
      featured: false,
      address: "",
    });

  const handleEdit = (r: any) => {
    setEditId(r.id);
    setForm({
      name: r.name,
      description: r.description ?? "",
      cuisine: r.cuisine,
      deliveryTime: r.deliveryTime ?? "30-45 min",
      deliveryFee: r.deliveryFee ?? "260",
      minOrder: r.minOrder ?? "1300",
      isOpen: r.isOpen ?? true,
      featured: r.featured ?? false,
      address: r.address ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      updateMutation.mutate({ id: editId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {restaurants?.length ?? 0} restaurants
        </p>
        <Button
          size="sm"
          className="bg-primary hover:bg-primary/90 text-white gap-2"
          onClick={() => {
            setEditId(null);
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4" /> Add Restaurant
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {restaurants?.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-border p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground text-sm">{r.name}</p>
                  {r.featured && (
                    <Badge className="bg-primary/10 text-primary text-xs border-0">Featured</Badge>
                  )}
                  <Badge
                    className={`text-xs border-0 ${
                      r.isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {r.isOpen ? "Open" : "Closed"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{r.cuisine} · {r.deliveryTime}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEdit(r)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Delete "${r.name}"?`)) deleteMutation.mutate({ id: r.id });
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Restaurant" : "Add Restaurant"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <Label>Cuisine *</Label>
                <Input
                  value={form.cuisine}
                  onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
                  placeholder="e.g. Pizza, Sushi"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Delivery Time</Label>
                <Input
                  value={form.deliveryTime}
                  onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })}
                  placeholder="30-45 min"
                />
              </div>
              <div className="space-y-1">
                <Label>Delivery Fee (KES)</Label>
                <Input
                  value={form.deliveryFee}
                  onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })}
                  placeholder="260"
                />
              </div>
              <div className="space-y-1">
                <Label>Min Order (KES)</Label>
                <Input
                  value={form.minOrder}
                  onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
                  placeholder="1300"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isOpen}
                    onChange={(e) => setForm({ ...form, isOpen: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Open</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Featured</span>
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
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
      setEditId(null);
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

  const resetForm = () =>
    setForm({ name: "", description: "", price: "", isAvailable: true, isPopular: false, categoryId: undefined });

  const handleEdit = (item: any) => {
    setEditId(item.id);
    setForm({
      name: item.name,
      description: item.description ?? "",
      price: item.price,
      isAvailable: item.isAvailable ?? true,
      isPopular: item.isPopular ?? false,
      categoryId: item.categoryId ?? undefined,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurantId) return;
    if (editId) {
      updateMutation.mutate({ id: editId, ...form });
    } else {
      createMutation.mutate({ restaurantId: selectedRestaurantId, ...form });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Select
          value={selectedRestaurantId?.toString() ?? ""}
          onValueChange={(v) => setSelectedRestaurantId(parseInt(v))}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Select restaurant" />
          </SelectTrigger>
          <SelectContent>
            {restaurants?.map((r) => (
              <SelectItem key={r.id} value={r.id.toString()}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedRestaurantId && (
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white gap-2"
            onClick={() => {
              setEditId(null);
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        )}
      </div>

      {!selectedRestaurantId ? (
        <div className="text-center py-12 text-muted-foreground">
          <UtensilsCrossed className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Select a restaurant to manage its menu</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {menuItems?.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-border p-3 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-foreground">{item.name}</p>
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
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Price (KES) *</Label>
                <Input
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="1300"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Select
                  value={form.categoryId?.toString() ?? "none"}
                  onValueChange={(v) =>
                    setForm({ ...form, categoryId: v === "none" ? undefined : parseInt(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                />
                <span className="text-sm">Available</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPopular}
                  onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
                />
                <span className="text-sm">Popular</span>
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
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

  const statusOptions = ["placed", "preparing", "on_the_way", "delivered", "cancelled"] as const;

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">{orders?.length ?? 0} orders total</p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {orders?.map(({ order, userName, restaurantName }) => {
            const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.placed;
            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-border p-4 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-foreground">Order #{order.id}</span>
                    <Badge className={`${status.color} text-xs border-0`}>{status.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {userName ?? "Guest"} · {restaurantName ?? "Restaurant"} ·{" "}
                    {formatKES(parseFloat(order.totalAmount))}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {order.deliveryAddress}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/orders/${order.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs h-7">
                      View
                    </Button>
                  </Link>
                  <Select
                    value={order.status}
                    onValueChange={(v) =>
                      updateStatus.mutate({
                        id: order.id,
                        status: v as typeof statusOptions[number],
                      })
                    }
                  >
                    <SelectTrigger className="w-32 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                          {STATUS_CONFIG[s].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
          {orders?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No orders yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Admin Page ────────────────────────────────────────────────────────────────

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
        </Tabs>
      </div>
    </div>
  );
}
