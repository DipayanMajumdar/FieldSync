"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Bell,
  ShieldCheck,
  User,
  Users,
  FolderKanban,
  Bot,
  Mail,
  LockKeyhole,
  Check,
  Save,
  X,
  Settings as SettingsIcon,
  ChevronRight,
  SlidersHorizontal,
  Activity,
  Database,
  Server,
  BrainCircuit,
  AlertTriangle,
  UserCog,
  UserCheck,
  UserX,
  Search,
  BriefcaseBusiness,
  ClipboardCheck,
  FileCheck2,
  Clock3,
  ShieldAlert,
  Gauge,
  RefreshCw,
  Eye,
  EyeOff,
  CircleDot,
  BarChart3,
  Workflow,
  KeyRound,
} from "lucide-react";

type UserRole = "Admin" | "Project Manager" | "Field Engineer";

type AdminUser = {
  id: number;
  initials: string;
  name: string;
  email: string;
  role: UserRole;
  status: "Active" | "Inactive";
};

const ADMIN_USERS: AdminUser[] = [
  {
    id: 1,
    initials: "SD",
    name: "Sohan Das",
    email: "admin@fieldsync.com",
    role: "Admin",
    status: "Active",
  },
  {
    id: 2,
    initials: "PM",
    name: "Project Manager",
    email: "manager@fieldsync.com",
    role: "Project Manager",
    status: "Active",
  },
  {
    id: 3,
    initials: "FE",
    name: "Field Engineer",
    email: "engineer@fieldsync.com",
    role: "Field Engineer",
    status: "Active",
  },
];

const PROJECTS = [
  {
    code: "P-001",
    name: "Metro Line 3",
    location: "Urban Infrastructure",
    manager: "Project Manager",
    status: "Active",
    progress: 68,
  },
  {
    code: "P-002",
    name: "NH-48 Bridge Reconstruction",
    location: "Highway Infrastructure",
    manager: "Project Manager",
    status: "Active",
    progress: 42,
  },
];

export default function SettingsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState(true);
  const [delayAlerts, setDelayAlerts] = useState(true);
  const [aiAlerts, setAiAlerts] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);

  const [aiEnabled, setAiEnabled] = useState(true);
  const [manualApproval, setManualApproval] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [auditLogging, setAuditLogging] = useState(true);

  const [confidenceThreshold, setConfidenceThreshold] = useState("80");
  const [delayThreshold, setDelayThreshold] = useState("5");

  const [searchUser, setSearchUser] = useState("");
  const [userStatus, setUserStatus] = useState<
    Record<number, "Active" | "Inactive">
  >({
    1: "Active",
    2: "Active",
    3: "Active",
  });

  const [saved, setSaved] = useState(false);

  const filteredUsers = useMemo(() => {
    const query = searchUser.trim().toLowerCase();

    if (!query) {
      return ADMIN_USERS;
    }

    return ADMIN_USERS.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
    );
  }, [searchUser]);

  const handleSave = () => {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const toggleUserStatus = (id: number) => {
    setUserStatus((current) => ({
      ...current,
      [id]: current[id] === "Active" ? "Inactive" : "Active",
    }));
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f6f3]">
      <div className="h-1 bg-[#68364b]" />

      <div className="mx-auto w-full max-w-[1540px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <header className="relative mb-6 overflow-hidden rounded-[28px] bg-[#102a2a] px-5 py-6 shadow-[0_18px_50px_rgba(16,42,42,0.14)] sm:px-7 sm:py-7 lg:px-9 lg:py-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/[0.06]" />
          <div className="pointer-events-none absolute -bottom-40 right-[16%] h-80 w-80 rounded-full border border-[#c47a44]/10" />
          <div className="pointer-events-none absolute left-[44%] top-8 h-28 w-28 rounded-full border border-[#68364b]/20" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#68364b] text-white">
                  <SettingsIcon size={15} />
                </div>

                <span className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#c47a44] sm:text-sm">
                  Administrator Control Center
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#aebbb7]">
                  Admin
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl lg:text-[42px]">
                Settings & Control
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aebbb7] sm:text-sm">
                Manage users, projects, permissions, AI behaviour,
                alerts and system preferences from one control surface.
              </p>
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.09] sm:w-fit"
            >
              <ArrowLeft size={15} />
              Back to Dashboard
            </button>
          </div>
        </header>

        {/* =====================================================
            SYSTEM OVERVIEW
        ===================================================== */}
        <section className="mb-6">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#c47a44]">
                System Overview
              </p>

              <h2 className="mt-1 text-lg font-bold tracking-tight text-[#24302f]">
                FieldSync at a glance
              </h2>
            </div>

            <div className="hidden items-center gap-2 rounded-full bg-[#edf7f0] px-3 py-1.5 text-[12px] font-bold text-[#2f7d4a] sm:flex">
              <CircleDot size={11} />
              All core services operational
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminMetric
              icon={Users}
              label="Total Users"
              value="03"
              detail="2 operational roles"
            />

            <AdminMetric
              icon={FolderKanban}
              label="Active Projects"
              value="02"
              detail="Infrastructure projects"
            />

            <AdminMetric
              icon={FileCheck2}
              label="Evidence Records"
              value="27"
              detail="Latest registry activity"
            />

            <AdminMetric
              icon={AlertTriangle}
              label="Delay Alerts"
              value="04"
              detail="Requires monitoring"
              accent
            />
          </div>
        </section>

        {/* =====================================================
            SERVICE HEALTH
        ===================================================== */}
        <section className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="overflow-hidden rounded-[22px] border border-[#dfe4df] bg-white shadow-[0_10px_35px_rgba(36,48,47,0.045)]">
            <SectionHeader
              icon={<Activity size={18} />}
              eyebrow="Operations"
              title="System Health"
              description="Current service availability across the FieldSync platform"
            />

            <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-6">
              <HealthCard
                icon={Server}
                title="Backend API"
                status="Operational"
                detail="Response healthy"
              />

              <HealthCard
                icon={Database}
                title="Database"
                status="Connected"
                detail="Supabase connection"
              />

              <HealthCard
                icon={BrainCircuit}
                title="AI Worker"
                status="Available"
                detail="Review service online"
              />
            </div>
          </div>

          <div className="rounded-[22px] border border-[#dfe4df] bg-[#102a2a] p-5 text-white shadow-[0_10px_35px_rgba(16,42,42,0.08)] sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-extrabold uppercase tracking-[0.17em] text-[#c47a44]">
                  Environment
                </p>

                <h3 className="mt-1 text-base font-bold">
                  Production Ready
                </h3>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.07] text-[#c47a44]">
                <Gauge size={19} />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <StatusLine label="API availability" value="100%" />
              <StatusLine label="System logging" value="Active" />
              <StatusLine label="Last sync" value="Just now" />
            </div>
          </div>
        </section>

        {/* =====================================================
            USER & ROLE MANAGEMENT
        ===================================================== */}
        <section className="mb-6 overflow-hidden rounded-[22px] border border-[#dfe4df] bg-white shadow-[0_10px_35px_rgba(36,48,47,0.045)]">
          <SectionHeader
            icon={<UserCog size={18} />}
            eyebrow="Administration"
            title="User & Role Management"
            description="Review platform users and manage their active access state"
          />

          <div className="border-b border-[#e5e9e5] p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-[360px]">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa39f]"
                />

                <input
                  value={searchUser}
                  onChange={(event) =>
                    setSearchUser(event.target.value)
                  }
                  placeholder="Search users, email or role..."
                  className="h-10 w-full rounded-xl border border-[#d9dfdb] bg-[#fafbf9] pl-9 pr-3 text-sm text-[#24302f] outline-none transition placeholder:text-[#a2aaa7] focus:border-[#68364b] focus:ring-2 focus:ring-[#68364b]/10"
                />
              </div>

              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#68364b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#592d40]"
              >
                <Users size={14} />
                User Directory
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead>
                <tr className="border-b border-[#e5e9e5] bg-[#fafbf9]">
                  <th className="px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#8b9692]">
                    User
                  </th>

                  <th className="px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#8b9692]">
                    Role
                  </th>

                  <th className="px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#8b9692]">
                    Access
                  </th>

                  <th className="px-5 py-3 text-right text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#8b9692]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => {
                  const status = userStatus[user.id];

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-[#eef1ee] last:border-b-0"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3e9ed] text-sm font-extrabold text-[#68364b]">
                            {user.initials}
                          </div>

                          <div>
                            <p className="text-sm font-bold text-[#24302f]">
                              {user.name}
                            </p>

                            <p className="mt-0.5 text-sm text-[#8a9390]">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f1ed] px-2.5 py-1.5 text-[12px] font-bold text-[#805d45]">
                          <BriefcaseBusiness size={11} />
                          {user.role}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] font-extrabold ${
                            status === "Active"
                              ? "bg-[#edf7f0] text-[#2f7d4a]"
                              : "bg-[#f5f5f4] text-[#7e8784]"
                          }`}
                        >
                          {status === "Active" ? (
                            <UserCheck size={11} />
                          ) : (
                            <UserX size={11} />
                          )}

                          {status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(user.id)}
                          disabled={user.id === 1}
                          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition ${
                            user.id === 1
                              ? "cursor-not-allowed border-[#e5e9e5] bg-[#f7f8f6] text-[#a0a7a4]"
                              : status === "Active"
                                ? "border-[#eadfe3] bg-white text-[#68364b] hover:bg-[#f8f3f5]"
                                : "border-[#dce9df] bg-[#edf7f0] text-[#2f7d4a] hover:bg-[#e4f3e8]"
                          }`}
                        >
                          {status === "Active"
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* =====================================================
            PROJECT MANAGEMENT
        ===================================================== */}
        <section className="mb-6 overflow-hidden rounded-[22px] border border-[#dfe4df] bg-white shadow-[0_10px_35px_rgba(36,48,47,0.045)]">
          <SectionHeader
            icon={<FolderKanban size={18} />}
            eyebrow="Projects"
            title="Project Management"
            description="Monitor active infrastructure projects and their assigned managers"
          />

          <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-2">
            {PROJECTS.map((project) => (
              <div
                key={project.code}
                className="rounded-2xl border border-[#e3e8e4] bg-[#fafbf9] p-4 transition hover:border-[#d6c8cd] hover:bg-white sm:p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-[#102a2a] px-2 py-1 text-[12px] font-extrabold tracking-wide text-white">
                        {project.code}
                      </span>

                      <span className="rounded-full bg-[#edf7f0] px-2 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#2f7d4a]">
                        {project.status}
                      </span>
                    </div>

                    <h3 className="mt-3 text-sm font-bold text-[#24302f]">
                      {project.name}
                    </h3>

                    <p className="mt-1 text-sm text-[#8a9390]">
                      {project.location}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#dfe4df] bg-white text-[#68736f] transition hover:border-[#68364b] hover:text-[#68364b]"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[12px] font-bold uppercase tracking-wide text-[#8b9692]">
                      Progress
                    </span>

                    <span className="text-sm font-extrabold text-[#68364b]">
                      {project.progress}%
                    </span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-[#e7ebe7]">
                    <div
                      className="h-full rounded-full bg-[#68364b]"
                      style={{
                        width: `${project.progress}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#e5e9e5] pt-4">
                  <div className="flex items-center gap-2 text-sm text-[#71807d]">
                    <User size={13} />
                    {project.manager}
                  </div>

                  <button className="text-sm font-bold text-[#68364b] hover:underline">
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================
            ACCESS CONTROL
        ===================================================== */}
        <section className="mb-6 overflow-hidden rounded-[22px] border border-[#dfe4df] bg-white shadow-[0_10px_35px_rgba(36,48,47,0.045)]">
          <SectionHeader
            icon={<ShieldCheck size={18} />}
            eyebrow="Security"
            title="Access Control"
            description="Review capabilities available across platform roles"
          />

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-[#e5e9e5] bg-[#fafbf9]">
                  <th className="px-5 py-3 text-left text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#8b9692]">
                    Capability
                  </th>
                  <th className="px-5 py-3 text-center text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#8b9692]">
                    Admin
                  </th>
                  <th className="px-5 py-3 text-center text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#8b9692]">
                    Project Manager
                  </th>
                  <th className="px-5 py-3 text-center text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#8b9692]">
                    Field Engineer
                  </th>
                </tr>
              </thead>

              <tbody>
                <PermissionRow
                  icon={FolderKanban}
                  label="Project Management"
                  admin
                  manager
                />

                <PermissionRow
                  icon={Workflow}
                  label="WBS Management"
                  admin
                  manager
                />

                <PermissionRow
                  icon={ClipboardCheck}
                  label="Evidence Submission"
                  admin
                  manager
                  engineer
                />

                <PermissionRow
                  icon={FileCheck2}
                  label="Evidence Approval"
                  admin
                  manager
                />

                <PermissionRow
                  icon={Bot}
                  label="AI Review"
                  admin
                  manager
                />

                <PermissionRow
                  icon={ShieldAlert}
                  label="System Configuration"
                  admin
                />
              </tbody>
            </table>
          </div>
        </section>

        {/* =====================================================
            AI CONFIGURATION
        ===================================================== */}
        <section className="mb-6 overflow-hidden rounded-[22px] border border-[#dfe4df] bg-white shadow-[0_10px_35px_rgba(36,48,47,0.045)]">
          <SectionHeader
            icon={<BrainCircuit size={18} />}
            eyebrow="Intelligence"
            title="AI Review Configuration"
            description="Control how AI-assisted evidence review behaves"
          />

          <div className="p-4 sm:p-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <ControlCard
                icon={Bot}
                title="AI Review Engine"
                description="Allow AI to analyse submitted field evidence."
                enabled={aiEnabled}
                onClick={() => setAiEnabled(!aiEnabled)}
              />

              <ControlCard
                icon={ShieldCheck}
                title="Manual Approval Required"
                description="Require human verification before AI suggestions are applied."
                enabled={manualApproval}
                onClick={() =>
                  setManualApproval(!manualApproval)
                }
              />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Minimum AI Confidence"
                value={confidenceThreshold}
                onChange={setConfidenceThreshold}
                options={[
                  { value: "70", label: "70%" },
                  { value: "75", label: "75%" },
                  { value: "80", label: "80%" },
                  { value: "85", label: "85%" },
                  { value: "90", label: "90%" },
                ]}
              />

              <div className="rounded-xl border border-[#e3e8e4] bg-[#fafbf9] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f3e9ed] text-[#68364b]">
                    <BarChart3 size={16} />
                  </div>

                  <div>
                    <p className="text-[12px] font-extrabold uppercase tracking-wide text-[#8a9390]">
                      Current threshold
                    </p>

                    <p className="mt-1 text-lg font-extrabold text-[#24302f]">
                      {confidenceThreshold}%
                    </p>

                    <p className="mt-1 text-sm leading-4 text-[#71807d]">
                      Suggestions below this confidence remain
                      subject to manual review.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            ALERT CONFIGURATION
        ===================================================== */}
        <section className="mb-6 overflow-hidden rounded-[22px] border border-[#dfe4df] bg-white shadow-[0_10px_35px_rgba(36,48,47,0.045)]">
          <SectionHeader
            icon={<AlertTriangle size={18} />}
            eyebrow="Monitoring"
            title="Alert Configuration"
            description="Define how schedule and system alerts are surfaced"
          />

          <div className="px-4 sm:px-6">
            <SettingRow
              icon={Bell}
              title="Delay Alerts"
              description="Enable schedule variance and delayed activity alerts."
              enabled={delayAlerts}
              onClick={() => setDelayAlerts(!delayAlerts)}
            />

            <SettingRow
              icon={ShieldAlert}
              title="Critical Alerts"
              description="Highlight high-severity project and system issues."
              enabled={criticalAlerts}
              onClick={() =>
                setCriticalAlerts(!criticalAlerts)
              }
            />

            <SettingRow
              icon={Activity}
              title="Audit Logging"
              description="Record important administrative and project actions."
              enabled={auditLogging}
              onClick={() =>
                setAuditLogging(!auditLogging)
              }
            />

            <div className="border-b border-[#e5e9e5] py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Delay Threshold"
                  value={delayThreshold}
                  onChange={setDelayThreshold}
                  options={[
                    { value: "3", label: "3 Days" },
                    { value: "5", label: "5 Days" },
                    { value: "7", label: "7 Days" },
                    { value: "10", label: "10 Days" },
                  ]}
                />

                <div className="flex items-center gap-3 rounded-xl border border-[#e3e8e4] bg-[#fafbf9] p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f5f1ed] text-[#c47a44]">
                    <Clock3 size={16} />
                  </div>

                  <div>
                    <p className="text-[12px] font-extrabold uppercase tracking-wide text-[#8a9390]">
                      Alert policy
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#24302f]">
                      Trigger after {delayThreshold} days
                    </p>

                    <p className="mt-0.5 text-sm text-[#71807d]">
                      Applies to delayed project activities.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            NOTIFICATIONS
        ===================================================== */}
        <section className="mb-6 overflow-hidden rounded-[22px] border border-[#dfe4df] bg-white shadow-[0_10px_35px_rgba(36,48,47,0.045)]">
          <SectionHeader
            icon={<Bell size={18} />}
            eyebrow="Communication"
            title="Notifications"
            description="Choose which administrative updates you want to receive"
          />

          <div className="px-4 sm:px-6">
            <SettingRow
              icon={Bell}
              title="Push Notifications"
              description="Receive important project updates and alerts."
              enabled={notifications}
              onClick={() =>
                setNotifications(!notifications)
              }
            />

            <SettingRow
              icon={Bot}
              title="AI Review Alerts"
              description="Receive notifications when AI review requires attention."
              enabled={aiAlerts}
              onClick={() => setAiAlerts(!aiAlerts)}
            />

            <SettingRow
              icon={Mail}
              title="Email Updates"
              description="Receive periodic project and system reports."
              enabled={emailUpdates}
              onClick={() =>
                setEmailUpdates(!emailUpdates)
              }
            />
          </div>
        </section>

        {/* =====================================================
            PROFILE / SECURITY
        ===================================================== */}
        <section className="mb-6 grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-[22px] border border-[#dfe4df] bg-white shadow-[0_10px_35px_rgba(36,48,47,0.045)]">
            <SectionHeader
              icon={<User size={18} />}
              eyebrow="Administrator"
              title="Profile Information"
              description="Current administrator account"
            />

            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-4 rounded-2xl border border-[#e5e9e5] bg-[#fafbf9] p-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#68364b] text-sm font-extrabold text-white">
                  SD
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-[#24302f]">
                      Sohan Das
                    </h3>

                    <span className="rounded-full bg-[#f3e9ed] px-2 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#68364b]">
                      Administrator
                    </span>
                  </div>

                  <p className="mt-1 break-words text-sm text-[#71807d]">
                    admin@fieldsync.com
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <FormField
                  label="Full Name"
                  defaultValue="Sohan Das"
                />

                <FormField
                  label="Role"
                  defaultValue="System Administrator"
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[22px] border border-[#dfe4df] bg-white shadow-[0_10px_35px_rgba(36,48,47,0.045)]">
            <SectionHeader
              icon={<LockKeyhole size={18} />}
              eyebrow="Protection"
              title="Security"
              description="Administrator account protection"
            />

            <div className="px-4 sm:px-6">
              <SecurityRow
                icon={KeyRound}
                title="Password"
                description="Password authentication is enabled."
                action="Change Password"
              />

              <SecurityRow
                icon={ShieldCheck}
                title="Two-Factor Authentication"
                description="Additional authentication layer."
                action="Enabled"
                positive
              />

              <SecurityRow
                icon={Eye}
                title="Session Protection"
                description="Authenticated sessions are protected."
                action="Protected"
                positive
                last
              />
            </div>
          </div>
        </section>

        {/* =====================================================
            SAVE BAR
        ===================================================== */}
        <div className="sticky bottom-3 z-20 mb-6 flex flex-col gap-2 rounded-2xl border border-[#dfe4df] bg-white/95 p-3 shadow-[0_14px_40px_rgba(36,48,47,0.13)] backdrop-blur-md sm:bottom-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:p-4">
          {saved && (
            <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#edf7f0] px-4 py-2.5 text-sm font-semibold text-[#2f7d4a] sm:mr-auto sm:w-fit">
              <Check size={15} />
              Settings saved for this session
            </div>
          )}

          <button
            onClick={() => router.push("/dashboard")}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#dcd5d1] bg-white px-5 text-sm font-semibold text-[#52605e] transition hover:bg-[#f8f5f3] sm:w-auto"
          >
            <X size={15} />
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#68364b] px-5 text-sm font-semibold text-white shadow-md shadow-[#68364b]/20 transition hover:bg-[#592d40] sm:w-auto"
          >
            <Save size={15} />
            Save Configuration
          </button>
        </div>

        {/* =====================================================
            FOOTER
        ===================================================== */}
        <footer className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t border-[#dfe4df] py-5 text-center text-[12px] text-[#8a9390] sm:py-6 sm:text-sm">
          <span className="font-extrabold text-[#68364b]">
            FieldSync
          </span>

          <span>•</span>

          <span>
            Infrastructure Progress Tracking Platform
          </span>

          <span>•</span>

          <span>Admin Control Center</span>

          <span>•</span>

          <span>v1.0</span>
        </footer>
      </div>
    </main>
  );
}

/* =========================================================
   ADMIN METRIC
========================================================= */

function AdminMetric({
  icon: Icon,
  label,
  value,
  detail,
  accent = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-[0_8px_25px_rgba(36,48,47,0.035)] ${
        accent
          ? "border-[#ead9df]"
          : "border-[#dfe4df]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            accent
              ? "bg-[#f5eee8] text-[#c47a44]"
              : "bg-[#f3e9ed] text-[#68364b]"
          }`}
        >
          <Icon size={18} />
        </div>

        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#9aa39f]">
          Live
        </span>
      </div>

      <p className="mt-4 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#8a9390]">
        {label}
      </p>

      <div className="mt-1 flex items-end gap-2">
        <span className="text-2xl font-extrabold tracking-tight text-[#24302f]">
          {value}
        </span>

        <span className="pb-1 text-[12px] font-medium text-[#8a9390]">
          records
        </span>
      </div>

      <p className="mt-1 text-[12px] text-[#9aa39f]">
        {detail}
      </p>
    </div>
  );
}

/* =========================================================
   HEALTH CARD
========================================================= */

function HealthCard({
  icon: Icon,
  title,
  status,
  detail,
}: {
  icon: LucideIcon;
  title: string;
  status: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e3e8e4] bg-[#fafbf9] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#68364b] shadow-sm">
          <Icon size={16} />
        </div>

        <span className="flex items-center gap-1.5 text-[12px] font-extrabold text-[#2f7d4a]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4c956f]" />
          {status}
        </span>
      </div>

      <p className="mt-4 text-sm font-bold text-[#24302f]">
        {title}
      </p>

      <p className="mt-1 text-[12px] text-[#8a9390]">
        {detail}
      </p>
    </div>
  );
}

/* =========================================================
   STATUS LINE
========================================================= */

function StatusLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-[#aebbb7]">
        {label}
      </span>

      <span className="text-sm font-bold text-white">
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   PERMISSION ROW
========================================================= */

function PermissionRow({
  icon: Icon,
  label,
  admin = false,
  manager = false,
  engineer = false,
}: {
  icon: LucideIcon;
  label: string;
  admin?: boolean;
  manager?: boolean;
  engineer?: boolean;
}) {
  return (
    <tr className="border-b border-[#eef1ee] last:border-b-0">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3e9ed] text-[#68364b]">
            <Icon size={14} />
          </div>

          <span className="text-sm font-bold text-[#24302f]">
            {label}
          </span>
        </div>
      </td>

      <PermissionCell enabled={admin} />
      <PermissionCell enabled={manager} />
      <PermissionCell enabled={engineer} />
    </tr>
  );
}

/* =========================================================
   PERMISSION CELL
========================================================= */

function PermissionCell({
  enabled,
}: {
  enabled: boolean;
}) {
  return (
    <td className="px-5 py-4 text-center">
      {enabled ? (
        <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-[#edf7f0] text-[#2f7d4a]">
          <Check size={13} />
        </span>
      ) : (
        <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-[#f2f3f1] text-[#a1a8a5]">
          <X size={12} />
        </span>
      )}
    </td>
  );
}

/* =========================================================
   CONTROL CARD
========================================================= */

function ControlCard({
  icon: Icon,
  title,
  description,
  enabled,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#e3e8e4] bg-[#fafbf9] p-4">
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            enabled
              ? "bg-[#f3e9ed] text-[#68364b]"
              : "bg-[#f0f2ef] text-[#8a9390]"
          }`}
        >
          <Icon size={17} />
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#24302f] sm:text-sm">
            {title}
          </h3>

          <p className="mt-1 text-sm leading-4 text-[#71807d]">
            {description}
          </p>
        </div>
      </div>

      <Toggle
        enabled={enabled}
        onClick={onClick}
      />
    </div>
  );
}

/* =========================================================
   SECURITY ROW
========================================================= */

function SecurityRow({
  icon: Icon,
  title,
  description,
  action,
  positive = false,
  last = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action: string;
  positive?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between ${
        !last ? "border-b border-[#e5e9e5]" : ""
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f3e9ed] text-[#68364b]">
          <Icon size={16} />
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#24302f]">
            {title}
          </h3>

          <p className="mt-1 text-sm leading-4 text-[#71807d]">
            {description}
          </p>
        </div>
      </div>

      <span
        className={`flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold ${
          positive
            ? "bg-[#edf7f0] text-[#2f7d4a]"
            : "border border-[#dfe4df] bg-white text-[#68364b]"
        }`}
      >
        {positive && <Check size={11} />}
        {action}
      </span>
    </div>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-[#e5e9e5] px-4 py-5 sm:px-6">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3e9ed] text-[#68364b]">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#c47a44]">
          {eyebrow}
        </p>

        <h2 className="mt-0.5 text-base font-bold text-[#24302f]">
          {title}
        </h2>

        <p className="mt-0.5 text-sm text-[#71807d] sm:text-sm">
          {description}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   TOGGLE
========================================================= */

function Toggle({
  enabled,
  onClick,
}: {
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        enabled ? "Disable setting" : "Enable setting"
      }
      aria-pressed={enabled}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
        enabled ? "bg-[#68364b]" : "bg-[#d7d2cf]"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled
            ? "translate-x-6"
            : "translate-x-1"
        }`}
      />
    </button>
  );
}

/* =========================================================
   SETTING ROW
========================================================= */

function SettingRow({
  icon: Icon,
  title,
  description,
  enabled,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#e5e9e5] py-4 last:border-b-0 sm:py-5">
      <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition sm:h-10 sm:w-10 ${
            enabled
              ? "bg-[#f3e9ed] text-[#68364b]"
              : "bg-[#f1f3f1] text-[#8a9390]"
          }`}
        >
          <Icon size={17} strokeWidth={1.8} />
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#24302f] sm:text-sm">
            {title}
          </h3>

          <p className="mt-1 max-w-[650px] text-sm leading-4 text-[#71807d] sm:text-sm sm:leading-5">
            {description}
          </p>
        </div>
      </div>

      <Toggle
        enabled={enabled}
        onClick={onClick}
      />
    </div>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
  label,
  defaultValue,
  disabled = false,
}: {
  label: string;
  defaultValue: string;
  disabled?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-[#65716e]">
        {label}
      </label>

      <input
        defaultValue={defaultValue}
        disabled={disabled}
        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
          disabled
            ? "cursor-not-allowed border-[#e5e9e5] bg-[#f7f8f6] text-[#8a9390]"
            : "border-[#d9dfdb] bg-white text-[#24302f] focus:border-[#68364b] focus:ring-2 focus:ring-[#68364b]/10"
        }`}
      />
    </div>
  );
}

/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-[#65716e]">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full min-w-0 rounded-xl border border-[#d9dfdb] bg-white px-3 py-3 text-sm text-[#24302f] outline-none transition focus:border-[#68364b] focus:ring-2 focus:ring-[#68364b]/10 sm:px-4 sm:text-sm"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

