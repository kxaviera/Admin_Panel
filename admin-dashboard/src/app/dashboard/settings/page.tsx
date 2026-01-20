"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [firebaseStatus, setFirebaseStatus] = useState<{
    nodeEnv?: string;
    firebase?: { projectIdSet: boolean; clientEmailSet: boolean; privateKeySet: boolean };
  } | null>(null);
  const [projectId, setProjectId] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [savingFirebase, setSavingFirebase] = useState(false);

  const initialName = useMemo(() => user?.name || "", [user?.name]);
  const initialPhone = useMemo(() => user?.phone || "", [user?.phone]);
  const [profileName, setProfileName] = useState(initialName);
  const [profilePhone, setProfilePhone] = useState(initialPhone);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.config.getFirebaseStatus();
        setFirebaseStatus(res.data.data);
      } catch (e: any) {
        // Only admins can load this; avoid noisy UI
        console.error("Failed to load firebase config status", e?.response?.data || e);
      }
    };
    load();
  }, []);

  useEffect(() => {
    // keep inputs in sync when store updates
    setProfileName(user?.name || "");
    setProfilePhone(user?.phone || "");
  }, [user?.name, user?.phone]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await apiClient.auth.updateProfile({ name: profileName, phone: profilePhone });
      const u = res.data?.data?.user;
      if (u) {
        const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || profileName;
        updateUser({
          ...(user as any),
          name: fullName,
          phone: u.phone || profilePhone,
          email: u.email || user?.email,
        });
      }
      toast.success("Profile updated");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Enter current and new password");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setSavingPassword(true);
    try {
      await apiClient.auth.updatePassword(currentPassword, newPassword);
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  const saveFirebase = async () => {
    setSavingFirebase(true);
    try {
      await apiClient.config.setFirebase(projectId, clientEmail, privateKey);
      toast.success("Saved. Restart backend to apply.");
      const res = await apiClient.config.getFirebaseStatus();
      setFirebaseStatus(res.data.data);
      setProjectId("");
      setClientEmail("");
      setPrivateKey("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to save Firebase config");
    } finally {
      setSavingFirebase(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your admin account and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={saveProfile}>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} />
              </div>
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Update Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={changePassword}>
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? "Saving..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle>App Configuration</CardTitle>
            <CardDescription>Configure application settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="surge-multiplier">Surge Pricing Multiplier</Label>
                <Input id="surge-multiplier" type="number" defaultValue="1.5" step="0.1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commission">Platform Commission (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  defaultValue="0"
                  disabled
                  title="Zero commission model - Subscription-based"
                />
                <p className="text-xs text-gray-500">
                  Using subscription-based model (zero commission)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cancellation-fee">Cancellation Fee (₹)</Label>
                <Input id="cancellation-fee" type="number" defaultValue="50" />
              </div>
              <Button>Save Settings</Button>
            </div>
          </CardContent>
        </Card>

        {/* Firebase Backend Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Firebase (Backend) Configuration</CardTitle>
            <CardDescription>
              Save Firebase Admin service-account values to backend <code>.env</code> (development only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border p-3 text-sm">
                <div className="font-medium">Status</div>
                <div className="text-gray-600">
                  Env: <span className="font-mono">{firebaseStatus?.nodeEnv || "unknown"}</span>
                </div>
                <div className="text-gray-600">
                  Project ID: {firebaseStatus?.firebase?.projectIdSet ? "SET" : "MISSING"} • Client Email:{" "}
                  {firebaseStatus?.firebase?.clientEmailSet ? "SET" : "MISSING"} • Private Key:{" "}
                  {firebaseStatus?.firebase?.privateKeySet ? "SET" : "MISSING"}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="firebase-project-id">FIREBASE_PROJECT_ID</Label>
                <Input
                  id="firebase-project-id"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="your-firebase-project-id"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firebase-client-email">FIREBASE_CLIENT_EMAIL</Label>
                <Input
                  id="firebase-client-email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="your-service-account@project.iam.gserviceaccount.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firebase-private-key">FIREBASE_PRIVATE_KEY</Label>
                <textarea
                  id="firebase-private-key"
                  className="w-full min-h-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder={"-----BEGIN PRIVATE KEY-----\n...\\n-----END PRIVATE KEY-----\n"}
                />
                <p className="text-xs text-gray-500">
                  Paste the multi-line key as-is. After saving, restart backend to apply.
                </p>
              </div>

              <Button onClick={saveFirebase} disabled={savingFirebase}>
                {savingFirebase ? "Saving..." : "Save Firebase Config"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Manage your notification settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <input type="checkbox" className="h-5 w-5" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New User Sign-ups</p>
                  <p className="text-sm text-gray-500">Get notified when users register</p>
                </div>
                <input type="checkbox" className="h-5 w-5" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Driver Verifications</p>
                  <p className="text-sm text-gray-500">Pending driver verifications</p>
                </div>
                <input type="checkbox" className="h-5 w-5" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Payment Alerts</p>
                  <p className="text-sm text-gray-500">Failed or disputed payments</p>
                </div>
                <input type="checkbox" className="h-5 w-5" defaultChecked />
              </div>
              <Button>Save Preferences</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

