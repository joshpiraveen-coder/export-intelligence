"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, Save, User, Lock, Shield, Building2, Calendar } from "lucide-react";
import { updateProfile, changePassword } from "@/app/actions";
import { formatDate } from "@/lib/utils";

interface SettingsClientProps {
  user: {
    name: string | null;
    email: string | null;
    role: string;
    companyName: string | null;
    createdAt: Date;
  };
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  COMPANY_ADMIN: "Company Admin",
  EXPORT_MANAGER: "Export Manager",
  VIEWER: "Viewer",
};

export function SettingsClient({ user }: SettingsClientProps) {
  const { update } = useSession();
  const [name, setName] = useState(user.name || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim()) return toast.error("Name cannot be empty");
    setSavingProfile(true);
    try {
      await updateProfile({ name });
      await update({ name });
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return toast.error("Fill in all password fields");
    if (newPassword !== confirmPassword) return toast.error("New passwords do not match");
    setSavingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Account Overview */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <User size={16} className="text-primary" /> Profile
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary/60 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email</label>
            <input
              type="email"
              value={user.email || ""}
              disabled
              className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">Email is used to sign in and cannot be changed here.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 border border-border">
              <Shield size={14} className="text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-sm font-medium text-foreground truncate">{roleLabels[user.role] || user.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 border border-border">
              <Building2 size={14} className="text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Company</p>
                <p className="text-sm font-medium text-foreground truncate">{user.companyName || "—"}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar size={12} />
            Member since {formatDate(user.createdAt)}
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {savingProfile ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </div>

      {/* Password */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Lock size={16} className="text-primary" /> Change Password
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary/60 transition-all"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>
          </div>
          <button
            onClick={handleChangePassword}
            disabled={savingPassword}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-xl font-medium text-sm text-foreground hover:bg-secondary transition-colors disabled:opacity-60"
          >
            {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            {savingPassword ? "Updating…" : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
