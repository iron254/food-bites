import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const [smsOnOrderOnTheWay, setSmsOnOrderOnTheWay] = useState(true);
  const [smsOnOrderDelivered, setSmsOnOrderDelivered] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const { data: preferences, isLoading: isFetching } = trpc.notifications.getPreferences.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isFetching) {
      setIsLoading(false);
    }
  }, [isFetching]);

  const updateMutation = trpc.notifications.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success("Notification preferences updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update preferences");
    },
  });

  useEffect(() => {
    if (preferences !== undefined) {
      if (preferences) {
        setSmsOnOrderOnTheWay(preferences.smsOnOrderOnTheWay);
        setSmsOnOrderDelivered(preferences.smsOnOrderDelivered);
      }
      setIsLoading(false);
    }
  }, [preferences]);

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      smsOnOrderOnTheWay,
      smsOnOrderDelivered,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please Log In</CardTitle>
            <CardDescription>You need to be logged in to access settings</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold mb-8">Settings</h1>

          {/* Profile Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                <p className="text-lg font-medium">{user?.name || "Not provided"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <p className="text-lg font-medium">{user?.email || "Not provided"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences Section */}
          <Card>
            <CardHeader>
              <CardTitle>SMS Notifications</CardTitle>
              <CardDescription>Control when you receive SMS updates about your orders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* On the Way Notification */}
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-1">
                      <Label className="text-base font-medium cursor-pointer">
                        Order On the Way
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Receive SMS when your order is on the way to you
                      </p>
                    </div>
                    <Switch
                      checked={smsOnOrderOnTheWay}
                      onCheckedChange={setSmsOnOrderOnTheWay}
                      className="ml-4"
                    />
                  </div>

                  {/* Delivered Notification */}
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-1">
                      <Label className="text-base font-medium cursor-pointer">
                        Order Delivered
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Receive SMS when your order has been delivered
                      </p>
                    </div>
                    <Switch
                      checked={smsOnOrderDelivered}
                      onCheckedChange={setSmsOnOrderDelivered}
                      className="ml-4"
                    />
                  </div>

                  {/* Save Button */}
                  <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="w-full mt-6"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Preferences"
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
