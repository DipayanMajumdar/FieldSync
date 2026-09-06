"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Network,
  GanttChart,
  ChartNoAxesCombined,
  TriangleAlert,
  Camera,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Menu,
  UserCog,
  HardHat,
  Crown,
  Activity,
} from "lucide-react";
import { useEffect, useState } from "react";

type UserRole = "field_engineer" | "project_manager" | "admin";

type LoggedInUser = {
  email: string;
  name: string;
  role: UserRole;
};

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    roles: ["project_manager", "admin"],
  },
  {
    label: "Projects",
    icon: FolderKanban,
    path: "/projects",
    roles: ["project_manager", "admin"],
  },
  {
    label: "WBS Explorer",
    icon: Network,
    path: "/wbs",
    roles: ["project_manager", "admin"],
  },
  {
    label: "Gantt Chart",
    icon: GanttChart,
    path: "/gantt",
    roles: ["project_manager", "admin"],
  },
  {
    label: "S-Curve",
    icon: ChartNoAxesCombined,
    path: "/s-curve",
    roles: ["project_manager", "admin"],
  },
  {
    label: "Delay Alerts",
    icon: TriangleAlert,
    path: "/delay-alerts",
    roles: ["project_manager", "admin"],
    badge: "12",
  },
  {
    label: "Field Evidence",
    icon: Camera,
    path: "/field-evidence",
    roles: ["field_engineer", "project_manager", "admin"],
  },
  {
    label: "AI Review Queue",
    icon: Sparkles,
    path: "/ai-review",
    roles: ["project_manager", "admin"],
    badge: "4",
  },
];

export default function Sidebar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<LoggedInUser | null>(null);

  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem("fs_user");

        if (!storedUser) {
          setUser(null);
          return;
        }

        const parsed = JSON.parse(storedUser);

        const normalizedRole =
          parsed.role === "field_worker"
            ? "field_engineer"
            : parsed.role;

        setUser({
          email: parsed.email || "",
          name: parsed.name || "",
          role: normalizedRole,
        });
      } catch {
        setUser(null);
      }
    };

    loadUser();

    window.addEventListener("storage", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
    };
  }, []);

  /*
   * IMPORTANT:
   * Do NOT default an unknown/missing user to project_manager.
   * That was causing users to see PM navigation when the role
   * was not correctly available.
   */
  const role = user?.role;

  const visibleMenuItems = role
    ? menuItems.filter((item) => item.roles.includes(role))
    : [];

  const canAccessSettings = role === "admin";

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(path);
  };

  const navigate = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("fs_user");
    localStorage.removeItem("fs_token");
    localStorage.removeItem("fieldsync_user");

    router.push("/");
  };

  const getRoleLabel = () => {
    switch (role) {
      case "field_engineer":
        return "Field Engineer";

      case "project_manager":
        return "Project Manager";

      case "admin":
        return "System Administrator";

      default:
        return "User";
    }
  };

  const getRoleDescription = () => {
    switch (role) {
      case "field_engineer":
        return "Field Operations";

      case "project_manager":
        return "Project Management";

      case "admin":
        return "Full System Access";

      default:
        return "Authorized User";
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case "field_engineer":
        return <HardHat size={13} />;

      case "admin":
        return <Crown size={13} />;

      default:
        return <UserCog size={13} />;
    }
  };

  const getInitials = () => {
    if (!user?.name) {
      if (role === "field_engineer") return "FE";
      if (role === "admin") return "AD";
      return "PM";
    }

    const words = user.name.trim().split(/\s+/);

    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }

    return user.name.slice(0, 2).toUpperCase();
  };

  const getRoleColor = () => {
    switch (role) {
      case "field_engineer":
        return "bg-[#2f7d4a]";

      case "admin":
        return "bg-[#C47A44]";

      case "project_manager":
        return "bg-[#68364B]";

      default:
        return "bg-[#536563]";
    }
  };

  return (
    <>
      {/* ================= MOBILE TOP BAR ================= */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/[0.08] bg-[#102A2A] px-4 text-white shadow-[0_8px_30px_rgba(16,42,42,0.22)] lg:hidden">
        <button
          onClick={() => navigate(role === "field_engineer" ? "/field-evidence" : "/dashboard")}
          className="group flex items-center gap-3"
          title="FieldSync"
        >
          <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-[#68364B] text-sm font-extrabold shadow-lg shadow-black/20 transition-transform duration-200 group-hover:scale-105">
            <span className="relative z-10">FS</span>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-[#C47A44]" />
          </div>

          <div className="text-lg font-bold tracking-tight">
            Field<span className="text-[#C47A44]">Sync</span>
          </div>
        </button>

        <button
          onClick={() => setCollapsed(false)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-[#B8C1BF] transition-all hover:bg-white/10 hover:text-white active:scale-95"
          aria-label="Open menu"
        >
          <Menu size={21} />
        </button>
      </header>

      {/* ================= MOBILE OVERLAY ================= */}
      {!collapsed && (
        <button
          onClick={() => setCollapsed(true)}
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] lg:hidden"
          aria-label="Close menu"
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen flex-col
          border-r border-white/[0.08] bg-[#102A2A] text-white
          shadow-[12px_0_45px_rgba(16,42,42,0.20)]
          transition-all duration-300 ease-out

          ${
            collapsed
              ? "w-[255px] -translate-x-full lg:w-[82px] lg:translate-x-0"
              : "w-[270px] translate-x-0"
          }
        `}
      >
        {/* ================= BRAND HEADER ================= */}
        <div
          className={`
            relative flex h-[84px] shrink-0 items-center
            border-b border-white/[0.07]
            ${collapsed ? "justify-center px-3" : "px-[20px]"}
          `}
        >
          {/* subtle top accent */}
          <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C47A44]/50 to-transparent" />

          <button
            onClick={() => {
              navigate(role === "field_engineer" ? "/field-evidence" : "/dashboard");
              setCollapsed(true);
            }}
            className="group flex items-center"
            title="FieldSync"
          >
            <div className="relative flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-[13px] bg-[#68364B] text-sm font-extrabold shadow-lg shadow-black/20 transition-transform duration-200 group-hover:scale-105">
              <span className="relative z-10">FS</span>
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#C47A44]" />
            </div>

            {!collapsed && (
              <div className="ml-3 text-[20px] font-bold tracking-[-0.6px]">
                Field<span className="text-[#C47A44]">Sync</span>
              </div>
            )}
          </button>

          {/* Mobile Close */}
          <button
            onClick={() => setCollapsed(true)}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] text-[#AAB5B2] transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* ================= USER ROLE MINI HEADER ================= */}
        {!collapsed && role && (
          <div className="mx-3 mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white ${getRoleColor()}`}
              >
                {getInitials()}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {user?.name || getRoleLabel()}
                </p>

                <div className="mt-0.5 flex items-center gap-1 text-[12px] text-[#81908D]">
                  {getRoleIcon()}
                  <span className="truncate">{getRoleDescription()}</span>
                </div>
              </div>

              <Activity
                size={14}
                className="ml-auto shrink-0 text-[#2f7d4a]"
              />
            </div>
          </div>
        )}

        {/* ================= NAVIGATION ================= */}
        <nav
          className={`
            flex-1 overflow-y-auto py-5
            ${collapsed ? "px-3" : "px-[13px]"}
          `}
        >
          {!collapsed && (
            <div className="mb-3 flex items-center justify-between px-3">
              <p className="text-[12px] font-bold tracking-[1.5px] text-[#71807D]">
                WORKSPACE
              </p>

              <span className="h-1.5 w-1.5 rounded-full bg-[#C47A44]" />
            </div>
          )}

          <div className="space-y-1">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.label}
                  onClick={() => {
                    navigate(item.path);
                    setCollapsed(true);
                  }}
                  title={collapsed ? item.label : undefined}
                  className={`
                    group relative flex h-[47px] w-full items-center
                    overflow-hidden rounded-[13px]
                    transition-all duration-200

                    ${collapsed ? "justify-center px-0" : "px-3"}

                    ${
                      active
                        ? "bg-[#68364B] text-white shadow-[0_8px_22px_rgba(104,54,75,0.28)]"
                        : "text-[#AAB5B2] hover:bg-white/[0.055] hover:text-white"
                    }
                  `}
                >
                  {/* Active indicator */}
                  {active && (
                    <span className="absolute bottom-2.5 left-0 top-2.5 w-[3px] rounded-r-full bg-[#C47A44]" />
                  )}

                  <span
                    className={`
                      flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]
                      transition-all duration-200
                      ${
                        active
                          ? "bg-white/[0.10] text-white"
                          : "bg-transparent text-[#8F9B98] group-hover:bg-white/[0.06] group-hover:text-white"
                      }
                    `}
                  >
                    <Icon
                      size={18}
                      strokeWidth={active ? 2.1 : 1.8}
                    />
                  </span>

                  {!collapsed && (
                    <>
                      <span className="ml-3 whitespace-nowrap text-sm font-semibold">
                        {item.label}
                      </span>

                      {item.badge && (
                        <span
                          className={`
                            ml-auto flex h-[21px] min-w-[22px] items-center
                            justify-center rounded-full px-1.5
                            text-[12px] font-extrabold
                            ${
                              active
                                ? "bg-[#C47A44] text-white"
                                : "bg-[#68364B] text-[#EEDFE5]"
                            }
                          `}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}

                  {collapsed && item.badge && (
                    <span className="absolute right-0 top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-[#102A2A] bg-[#C47A44] px-1 text-[11px] font-extrabold text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* No user loaded state */}
          {!collapsed && !role && (
            <div className="mx-1 mt-4 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-3 text-sm leading-4 text-[#71807D]">
              Loading workspace...
            </div>
          )}
        </nav>

        {/* ================= BOTTOM AREA ================= */}
        <div
          className={`
            shrink-0 border-t border-white/[0.07]
            ${collapsed ? "px-3 py-3" : "px-[13px] py-4"}
          `}
        >
          {/* Settings */}
          {canAccessSettings && (
            <button
              onClick={() => {
                navigate("/settings");
                setCollapsed(true);
              }}
              title={collapsed ? "Settings" : undefined}
              className={`
                group flex h-[46px] w-full items-center rounded-[13px]
                transition-all duration-200
                ${collapsed ? "justify-center px-0" : "px-3"}
                ${
                  isActive("/settings")
                    ? "bg-[#68364B] text-white shadow-[0_8px_22px_rgba(104,54,75,0.25)]"
                    : "text-[#AAB5B2] hover:bg-white/[0.055] hover:text-white"
                }
              `}
            >
              <span
                className={`
                  flex h-8 w-8 items-center justify-center rounded-[10px]
                  ${
                    isActive("/settings")
                      ? "bg-white/[0.10]"
                      : "group-hover:bg-white/[0.06]"
                  }
                `}
              >
                <Settings size={18} strokeWidth={1.8} />
              </span>

              {!collapsed && (
                <span className="ml-3 text-sm font-semibold">
                  Settings
                </span>
              )}
            </button>
          )}

          {/* User Card */}
          {role && (
            <div
              className={`
                ${canAccessSettings ? "mt-2" : ""}
                flex items-center rounded-[13px]
                border border-white/[0.05] bg-white/[0.035]
                ${collapsed ? "justify-center p-2" : "px-2.5 py-2.5"}
              `}
            >
              <div
                className={`flex h-[35px] w-[35px] shrink-0 items-center justify-center rounded-[10px] text-sm font-extrabold text-white ${getRoleColor()}`}
              >
                {getInitials()}
              </div>

              {!collapsed && (
                <div className="ml-2.5 min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">
                    {user?.name || getRoleLabel()}
                  </div>

                  <div className="mt-0.5 flex items-center gap-1 text-[12px] text-[#71807D]">
                    {getRoleIcon()}
                    <span className="truncate">
                      {getRoleDescription()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Sign Out"
            className={`
              mt-2 flex h-[38px] w-full items-center justify-center
              rounded-xl border border-white/[0.07]
              text-[#71807D] transition-all duration-200
              hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-300
              ${collapsed ? "" : "gap-2"}
            `}
          >
            <LogOut size={15} />

            {!collapsed && (
              <span className="text-sm font-semibold">Sign Out</span>
            )}
          </button>

          {/* Collapse */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`
              mt-2 flex h-[38px] w-full items-center justify-center
              rounded-xl border border-white/[0.07]
              text-[#71807D] transition-all duration-200
              hover:border-white/[0.10] hover:bg-white/[0.055] hover:text-white
              ${collapsed ? "" : "gap-2"}
            `}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight size={17} />
            ) : (
              <>
                <ChevronLeft size={17} />

                <span className="text-sm font-semibold">
                  Collapse Menu
                </span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}