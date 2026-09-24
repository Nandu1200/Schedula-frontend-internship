"use client";

import { useEffect, useState } from "react";

type SettingsSection =
  | "profile"
  | "password"
  | "notifications"
  | "platform";

type AdminProfile = {
  name: string;
  email: string;
};

type NotificationSettings = {
  appointments: boolean;
  payments: boolean;
  doctorVerification: boolean;
  system: boolean;
};

type PlatformSettings = {
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  appointmentDuration: number;
};

const PROFILE_STORAGE_KEY = "schedula_admin_profile";
const PASSWORD_STORAGE_KEY = "registeredAdminPassword";
const NOTIFICATION_STORAGE_KEY = "schedula_admin_notification_settings";
const PLATFORM_STORAGE_KEY = "schedula_admin_platform_settings";
const DEFAULT_PASSWORD = "admin123";

const defaultProfile: AdminProfile = {
  name: "Admin",
  email: "admin@schedula.com",
};

const defaultNotifications: NotificationSettings = {
  appointments: true,
  payments: true,
  doctorVerification: true,
  system: true,
};

const defaultPlatformSettings: PlatformSettings = {
  platformName: "Schedula",
  supportEmail: "support@schedula.com",
  maintenanceMode: false,
  appointmentDuration: 30,
};

const sections: Array<{
  id: SettingsSection;
  title: string;
  description: string;
}> = [
  {
    id: "profile",
    title: "Profile Settings",
    description: "Manage your admin profile information.",
  },
  {
    id: "password",
    title: "Password Settings",
    description: "Update your admin account password.",
  },
  {
    id: "notifications",
    title: "Notification Settings",
    description: "Control admin notification preferences.",
  },
  {
    id: "platform",
    title: "Platform Settings",
    description: "Manage basic Schedula platform settings.",
  },
];

const notificationItems: Array<{
  key: keyof NotificationSettings;
  title: string;
  description: string;
}> = [
  {
    key: "appointments",
    title: "Appointment notifications",
    description: "Receive notifications about appointment activity.",
  },
  {
    key: "payments",
    title: "Payment notifications",
    description: "Receive notifications about payment activity.",
  },
  {
    key: "doctorVerification",
    title: "Doctor verification notifications",
    description: "Receive notifications about doctor verification activity.",
  },
  {
    key: "system",
    title: "System notifications",
    description: "Receive important platform and system notifications.",
  },
];

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("profile");

  const [profile, setProfile] = useState<AdminProfile>(defaultProfile);
  const [name, setName] = useState(defaultProfile.name);
  const [email, setEmail] = useState(defaultProfile.email);
  const [saveMessage, setSaveMessage] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const [notifications, setNotifications] =
    useState<NotificationSettings>(defaultNotifications);
  const [notificationMessage, setNotificationMessage] = useState("");

  const [platformSettings, setPlatformSettings] =
    useState<PlatformSettings>(defaultPlatformSettings);
  const [platformMessage, setPlatformMessage] = useState("");

  useEffect(() => {
    const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);

    if (!storedProfile) {
      return;
    }

    try {
      const parsedProfile = JSON.parse(storedProfile) as Partial<AdminProfile>;

      const nextProfile = {
        name:
          typeof parsedProfile.name === "string"
            ? parsedProfile.name
            : defaultProfile.name,
        email:
          typeof parsedProfile.email === "string"
            ? parsedProfile.email
            : defaultProfile.email,
      };

      setProfile(nextProfile);
      setName(nextProfile.name);
      setEmail(nextProfile.email);
    } catch {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const storedNotifications = localStorage.getItem(
      NOTIFICATION_STORAGE_KEY,
    );

    if (!storedNotifications) {
      return;
    }

    try {
      const parsed =
        JSON.parse(storedNotifications) as Partial<NotificationSettings>;

      setNotifications({
        appointments:
          typeof parsed.appointments === "boolean"
            ? parsed.appointments
            : defaultNotifications.appointments,
        payments:
          typeof parsed.payments === "boolean"
            ? parsed.payments
            : defaultNotifications.payments,
        doctorVerification:
          typeof parsed.doctorVerification === "boolean"
            ? parsed.doctorVerification
            : defaultNotifications.doctorVerification,
        system:
          typeof parsed.system === "boolean"
            ? parsed.system
            : defaultNotifications.system,
      });
    } catch {
      localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const storedPlatform = localStorage.getItem(PLATFORM_STORAGE_KEY);

    if (!storedPlatform) {
      return;
    }

    try {
      const parsed =
        JSON.parse(storedPlatform) as Partial<PlatformSettings>;

      setPlatformSettings({
        platformName:
          typeof parsed.platformName === "string"
            ? parsed.platformName
            : defaultPlatformSettings.platformName,
        supportEmail:
          typeof parsed.supportEmail === "string"
            ? parsed.supportEmail
            : defaultPlatformSettings.supportEmail,
        maintenanceMode:
          typeof parsed.maintenanceMode === "boolean"
            ? parsed.maintenanceMode
            : defaultPlatformSettings.maintenanceMode,
        appointmentDuration:
          typeof parsed.appointmentDuration === "number"
            ? parsed.appointmentDuration
            : defaultPlatformSettings.appointmentDuration,
      });
    } catch {
      localStorage.removeItem(PLATFORM_STORAGE_KEY);
    }
  }, []);

  const handleSaveProfile = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setSaveMessage("Name and email are required.");
      return;
    }

    const nextProfile: AdminProfile = {
      name: trimmedName,
      email: trimmedEmail,
    };

    localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify(nextProfile),
    );

    setProfile(nextProfile);
    setName(nextProfile.name);
    setEmail(nextProfile.email);
    setSaveMessage("Profile updated successfully.");

    window.dispatchEvent(new Event("admin-profile-updated"));
  };

  const getStoredPassword = () => {
    return (
      localStorage.getItem(PASSWORD_STORAGE_KEY) ??
      localStorage.getItem("admin_password") ??
      DEFAULT_PASSWORD
    );
  };

  const handleChangePassword = () => {
    const storedPassword = getStoredPassword();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage("Please fill in all password fields.");
      return;
    }

    if (currentPassword !== storedPassword) {
      setPasswordMessage("Current password is incorrect.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage("New password must be at least 6 characters.");
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordMessage(
        "New password must be different from the current password.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("New password and confirm password do not match.");
      return;
    }

    localStorage.setItem(PASSWORD_STORAGE_KEY, newPassword);

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage("Password updated successfully.");
  };

  const handleNotificationToggle = (
    key: keyof NotificationSettings,
  ) => {
    setNotifications((current) => {
      const next = {
        ...current,
        [key]: !current[key],
      };

      localStorage.setItem(
        NOTIFICATION_STORAGE_KEY,
        JSON.stringify(next),
      );

      return next;
    });

    setNotificationMessage("Notification preferences updated.");
  };

  const handleSavePlatformSettings = () => {
    const trimmedName = platformSettings.platformName.trim();
    const trimmedEmail = platformSettings.supportEmail.trim();

    if (!trimmedName || !trimmedEmail) {
      setPlatformMessage("Platform name and support email are required.");
      return;
    }

    if (platformSettings.appointmentDuration < 15) {
      setPlatformMessage(
        "Appointment duration must be at least 15 minutes.",
      );
      return;
    }

    if (platformSettings.appointmentDuration > 120) {
      setPlatformMessage(
        "Appointment duration cannot be more than 120 minutes.",
      );
      return;
    }

    const nextSettings: PlatformSettings = {
      ...platformSettings,
      platformName: trimmedName,
      supportEmail: trimmedEmail,
    };

    localStorage.setItem(
      PLATFORM_STORAGE_KEY,
      JSON.stringify(nextSettings),
    );

    setPlatformSettings(nextSettings);
    setPlatformMessage("Platform settings updated successfully.");
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-semibold text-emerald-600">
            Admin Portal
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Settings
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Manage your admin account and basic Schedula platform settings.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <nav className="space-y-1" aria-label="Settings navigation">
              {sections.map((section) => {
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(section.id);
                      setSaveMessage("");
                      setPasswordMessage("");
                      setNotificationMessage("");
                      setPlatformMessage("");
                    }}
                    className={`w-full rounded-xl px-4 py-3 text-left transition ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-sm font-semibold">
                      {section.title}
                    </p>

                    <p
                      className={`mt-1 text-xs ${
                        isActive
                          ? "text-emerald-600"
                          : "text-slate-500"
                      }`}
                    >
                      {section.description}
                    </p>
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            {activeSection === "profile" && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Profile Settings
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manage your administrator profile information.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="admin-name"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Name
                    </label>

                    <input
                      id="admin-name"
                      type="text"
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                        setSaveMessage("");
                      }}
                      placeholder="Enter admin name"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="admin-email"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Email
                    </label>

                    <input
                      id="admin-email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setSaveMessage("");
                      }}
                      placeholder="Enter admin email"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Save Profile
                  </button>

                  {saveMessage && (
                    <p
                      className={`text-sm font-medium ${
                        saveMessage.includes("successfully")
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                      role="status"
                      aria-live="polite"
                    >
                      {saveMessage}
                    </p>
                  )}
                </div>

                <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Current saved profile
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {profile.name}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {profile.email}
                  </p>
                </div>
              </div>
            )}

            {activeSection === "password" && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Password Settings
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Change the password used for the admin account.
                </p>

                <div className="mt-6 max-w-2xl space-y-4">
                  <div>
                    <label
                      htmlFor="current-password"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Current Password
                    </label>

                    <input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(event) => {
                        setCurrentPassword(event.target.value);
                        setPasswordMessage("");
                      }}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="new-password"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      New Password
                    </label>

                    <input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(event) => {
                        setNewPassword(event.target.value);
                        setPasswordMessage("");
                      }}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Confirm Password
                    </label>

                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setPasswordMessage("");
                      }}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleChangePassword}
                    className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Change Password
                  </button>

                  {passwordMessage && (
                    <p
                      className={`text-sm font-medium ${
                        passwordMessage.includes("successfully")
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                      role="status"
                      aria-live="polite"
                    >
                      {passwordMessage}
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Notification Settings
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Choose which admin notifications you want to receive.
                </p>

                <div className="mt-6 space-y-4">
                  {notificationItems.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {item.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {item.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifications[item.key]}
                        aria-label={`Toggle ${item.title}`}
                        onClick={() =>
                          handleNotificationToggle(item.key)
                        }
                        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                          notifications[item.key]
                            ? "bg-emerald-600"
                            : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                            notifications[item.key]
                              ? "left-6"
                              : "left-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                {notificationMessage && (
                  <p
                    className="mt-4 text-sm font-medium text-emerald-600"
                    role="status"
                    aria-live="polite"
                  >
                    {notificationMessage}
                  </p>
                )}
              </div>
            )}

            {activeSection === "platform" && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Platform Settings
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manage basic Schedula platform configuration.
                </p>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="platform-name"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Platform Name
                    </label>

                    <input
                      id="platform-name"
                      type="text"
                      value={platformSettings.platformName}
                      onChange={(event) => {
                        setPlatformSettings((current) => ({
                          ...current,
                          platformName: event.target.value,
                        }));
                        setPlatformMessage("");
                      }}
                      placeholder="Enter platform name"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="support-email"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Support Email
                    </label>

                    <input
                      id="support-email"
                      type="email"
                      value={platformSettings.supportEmail}
                      onChange={(event) => {
                        setPlatformSettings((current) => ({
                          ...current,
                          supportEmail: event.target.value,
                        }));
                        setPlatformMessage("");
                      }}
                      placeholder="Enter support email"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Maintenance Mode
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Temporarily mark the platform as under maintenance.
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={platformSettings.maintenanceMode}
                        aria-label="Toggle maintenance mode"
                        onClick={() => {
                          setPlatformSettings((current) => ({
                            ...current,
                            maintenanceMode: !current.maintenanceMode,
                          }));
                          setPlatformMessage("");
                        }}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                          platformSettings.maintenanceMode
                            ? "bg-emerald-600"
                            : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                            platformSettings.maintenanceMode
                              ? "left-6"
                              : "left-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="appointment-duration"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Default Appointment Duration
                    </label>

                    <select
                      id="appointment-duration"
                      value={platformSettings.appointmentDuration}
                      onChange={(event) => {
                        setPlatformSettings((current) => ({
                          ...current,
                          appointmentDuration: Number(event.target.value),
                        }));
                        setPlatformMessage("");
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                      <option value={90}>90 minutes</option>
                      <option value={120}>120 minutes</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={handleSavePlatformSettings}
                    className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Save Platform Settings
                  </button>

                  {platformMessage && (
                    <p
                      className={`text-sm font-medium ${
                        platformMessage.includes("successfully")
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                      role="status"
                      aria-live="polite"
                    >
                      {platformMessage}
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
