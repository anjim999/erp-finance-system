// src/pages/SettingsPage.jsx - Settings Page
import { useState, useEffect } from "react";
import { FaUser, FaBuilding, FaBell, FaPalette, FaShieldAlt, FaSave, FaKey, FaEye, FaEyeSlash, FaCreditCard } from "react-icons/fa";
import { toast } from "react-toastify";
import { Card, Input, Textarea, Button, Select } from "../components/common";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import BillingSettings from "../components/settings/BillingSettings";
import api from "../api/axiosClient";

export default function SettingsPage() {
    const { auth, updateUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [profile, setProfile] = useState({
        name: "",
        email: "",
        phone: "",
        designation: "",
        address: "",
        avatar: "",
    });

    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await api.get("/api/account/profile");
            if (res.data) {
                setProfile({
                    name: res.data.name || "",
                    email: res.data.email || "",
                    phone: res.data.phone || "",
                    designation: res.data.designation || "",
                    address: res.data.address || "",
                    avatar: res.data.avatar || "",
                });
            }
        } catch (error) {
            console.error("Failed to fetch profile");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put("/api/account/profile", profile);
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            return toast.error("Passwords don't match");
        }
        if (passwords.new.length < 8) {
            return toast.error("Password must be at least 8 characters");
        }
        setSaving(true);
        try {
            await api.put("/api/account/change-password", {
                currentPassword: passwords.current,
                newPassword: passwords.new,
            });
            toast.success("Password changed successfully");
            setPasswords({ current: "", new: "", confirm: "" });
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to change password");
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: "profile", label: "Profile", icon: <FaUser /> },
        { id: "security", label: "Security", icon: <FaShieldAlt /> },
        { id: "billing", label: "Billing", icon: <FaCreditCard /> },
        { id: "appearance", label: "Appearance", icon: <FaPalette /> },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold theme-text-primary">Settings</h1>
                <p className="theme-text-muted">Manage your account and preferences</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-64 flex-shrink-0">
                    <Card padding="sm">
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === tab.id
                                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                                        : "theme-text-secondary hover:theme-bg-tertiary"
                                        }`}
                                >
                                    {tab.icon}
                                    <span className="font-medium">{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </Card>
                </div>

                <div className="flex-1">
                    {activeTab === "profile" && (
                        <Card title="Profile Settings" padding="lg">
                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Full Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required />
                                    <Input label="Email" type="email" value={profile.email} disabled />
                                    <Input label="Phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                                    <Input label="Designation" value={profile.designation} onChange={(e) => setProfile({ ...profile, designation: e.target.value })} />
                                </div>
                                <Textarea label="Address" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} rows={3} />
                                <div className="flex justify-end">
                                    <Button type="submit" icon={<FaSave />} loading={saving}>Save Changes</Button>
                                </div>
                            </form>
                        </Card>
                    )}

                    {activeTab === "security" && (
                        <Card title="Security Settings" padding="lg">
                            <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
                                <h3 className="font-semibold theme-text-primary flex items-center gap-2"><FaKey /> Change Password</h3>
                                <div className="relative">
                                    <Input label="Current Password" type={showPasswords.current ? "text" : "password"} value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} required />
                                    <button type="button" onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })} className="absolute right-3 top-9 theme-text-muted">
                                        {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                <div className="relative">
                                    <Input label="New Password" type={showPasswords.new ? "text" : "password"} value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} required />
                                    <button type="button" onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })} className="absolute right-3 top-9 theme-text-muted">
                                        {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                <div className="relative">
                                    <Input label="Confirm Password" type={showPasswords.confirm ? "text" : "password"} value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} required />
                                    <button type="button" onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })} className="absolute right-3 top-9 theme-text-muted">
                                        {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                <Button type="submit" loading={saving}>Change Password</Button>
                            </form>
                        </Card>
                    )}

                    {activeTab === "billing" && <BillingSettings />}

                    {activeTab === "appearance" && (
                        <Card title="Appearance Settings" padding="lg">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 rounded-lg theme-bg-tertiary">
                                    <div>
                                        <p className="font-medium theme-text-primary">Dark Mode</p>
                                        <p className="text-sm theme-text-muted">Toggle dark/light theme</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={theme === "dark"} onChange={toggleTheme} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-300 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
