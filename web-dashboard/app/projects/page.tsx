"use client";

import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  TriangleAlert,
  TrendingUp,
  Layers3,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getDashboard, getProjects } from "@/lib/api";

type BackendProject = {
  id: number;
  code: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
};

type Project = {
  id: string;
  backendId: number;
  name: string;
  location: string;
  manager: string;
  type: string;
  progress: number;
  status: string;
  start: string;
  end: string;
  activities: number;
  delayed: number;
};

export default function ProjectsPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Projects");

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        setError("");

        const backendProjects: BackendProject[] = await getProjects();

        const formattedProjects: Project[] = await Promise.all(
          backendProjects.map(async (project) => {
            let progress = 0;
            let activities = 0;
            let delayed = 0;
            let start = "—";
            let end = "—";

            try {
              const dashboard = await getDashboard(project.id);

              progress = Number(
                dashboard?.overall_progress_pct ?? 0
              );

              activities =
                dashboard?.stats?.total_activities ??
                (Array.isArray(dashboard?.nodes)
                  ? dashboard.nodes.length
                  : 0);

              delayed = dashboard?.stats?.delayed ?? 0;

              const nodes: any[] = dashboard?.nodes ?? [];

              const starts = nodes
                .map((n: any) => n.planned_start)
                .filter(Boolean);

              const ends = nodes
                .map((n: any) => n.planned_end)
                .filter(Boolean);

              if (starts.length > 0) {
                start = new Date(
                  Math.min(
                    ...starts.map((d: string) =>
                      new Date(d).getTime()
                    )
                  )
                ).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
              }

              if (ends.length > 0) {
                end = new Date(
                  Math.max(
                    ...ends.map((d: string) =>
                      new Date(d).getTime()
                    )
                  )
                ).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
              }
            } catch (dashboardError) {
              console.error(
                `Dashboard fetch failed for project ${project.id}:`,
                dashboardError
              );
            }

            let status = "On Track";

            if (delayed > 0) {
              status = "Delayed";
            } else if (progress < 50) {
              status = "At Risk";
            }

            return {
              id: `P-${String(project.id).padStart(3, "0")}`,
              backendId: project.id,
              name: project.name || "Untitled Project",
              location: "Infrastructure Project Site",
              manager: "Project Manager",
              type:
                project.description
                  ?.split("—")[0]
                  ?.trim() || "Infrastructure Project",
              progress,
              status,
              start,
              end,
              activities,
              delayed,
            };
          })
        );

        setProjects(formattedProjects);
      } catch (err) {
        console.error("Projects fetch error:", err);
        setError("Failed to load projects");
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  const totalProjects = projects.length;

  const activeProjects = projects.filter(
    (project) =>
      project.status !== "Completed" &&
      project.progress < 100
  ).length;

  const atRiskProjects = projects.filter(
    (project) =>
      project.status === "At Risk" ||
      project.status === "Delayed"
  ).length;

  const completedProjects = projects.filter(
    (project) => project.progress >= 100
  ).length;

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const query = search.toLowerCase();

      const matchesSearch =
        project.name.toLowerCase().includes(query) ||
        project.id.toLowerCase().includes(query) ||
        project.type.toLowerCase().includes(query);

      let matchesFilter = true;

      if (filter === "Active") {
        matchesFilter =
          project.status !== "Completed" &&
          project.progress < 100;
      }

      if (filter === "At Risk") {
        matchesFilter =
          project.status === "At Risk" ||
          project.status === "Delayed";
      }

      return matchesSearch && matchesFilter;
    });
  }, [projects, search, filter]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f6f4]">
      {/* =========================================================
          TOP ACCENT
      ========================================================= */}
      <div className="h-1 w-full bg-[#68364b]" />

      <div className="px-4 py-5 sm:px-6 sm:py-7 md:px-8 lg:px-10 lg:py-8">
        {/* =======================================================
            HEADER
        ======================================================= */}
        <header className="relative mb-7 overflow-hidden rounded-[24px] border border-[#dddeda] bg-[#102a2a] px-5 py-6 shadow-[0_18px_50px_rgba(16,42,42,0.10)] sm:px-7 sm:py-7 lg:px-9 lg:py-8">
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/[0.055]" />
          <div className="absolute -right-5 -top-12 h-40 w-40 rounded-full border border-white/[0.04]" />
          <div className="absolute -bottom-28 left-[42%] h-64 w-64 rounded-full border border-[#c47a44]/10" />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#68364b] text-white">
                  <FolderKanban size={14} />
                </div>

                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#c47a44] sm:text-[10px]">
                  Project Management
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">
                Project Portfolio
              </h1>

              <p className="mt-2 max-w-xl text-xs leading-6 text-[#aab7b4] sm:text-sm">
                Manage and monitor all infrastructure projects
                from one centralized workspace.
              </p>
            </div>

            <button
              type="button"
              className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#c47a44] px-5 text-xs font-bold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#d08a55] sm:w-fit"
            >
              <Plus
                size={16}
                className="transition-transform group-hover:rotate-90"
              />
              New Project
            </button>
          </div>
        </header>

        {/* =======================================================
            SUMMARY
        ======================================================= */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {/* TOTAL */}
          <div className="group relative overflow-hidden rounded-[20px] border border-[#dfe2de] bg-white p-4 shadow-[0_8px_30px_rgba(36,48,47,0.045)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(36,48,47,0.08)] sm:p-5">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#68364b]/[0.035] transition group-hover:scale-125" />

            <div className="relative flex items-start justify-between gap-2">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#8b9693] sm:text-[10px]">
                  Total Projects
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#24302f]">
                  {loading ? "—" : totalProjects}
                </h2>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2e8ec] text-[#68364b]">
                <FolderKanban size={18} />
              </div>
            </div>

            <div className="relative mt-4 flex items-center gap-1.5 text-[10px] text-[#8b9693]">
              <Layers3 size={12} />
              Across all project locations
            </div>
          </div>

          {/* ACTIVE */}
          <div className="group relative overflow-hidden rounded-[20px] border border-[#dfe2de] bg-white p-4 shadow-[0_8px_30px_rgba(36,48,47,0.045)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(36,48,47,0.08)] sm:p-5">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#4c7565]/[0.04] transition group-hover:scale-125" />

            <div className="relative flex items-start justify-between gap-2">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#8b9693] sm:text-[10px]">
                  Active Projects
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#24302f]">
                  {loading ? "—" : activeProjects}
                </h2>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef5f1] text-[#4c7565]">
                <Activity size={18} />
              </div>
            </div>

            <div className="relative mt-4 flex items-center gap-1.5 text-[10px] text-[#8b9693]">
              <TrendingUp size={12} />
              Currently under execution
            </div>
          </div>

          {/* RISK */}
          <div className="group relative overflow-hidden rounded-[20px] border border-[#eadede] bg-white p-4 shadow-[0_8px_30px_rgba(36,48,47,0.045)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(36,48,47,0.08)] sm:p-5">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#a34c4c]/[0.035] transition group-hover:scale-125" />

            <div className="relative flex items-start justify-between gap-2">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#8b9693] sm:text-[10px]">
                  At Risk
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#a34c4c]">
                  {loading ? "—" : atRiskProjects}
                </h2>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f9eaea] text-[#a34c4c]">
                <TriangleAlert size={18} />
              </div>
            </div>

            <div className="relative mt-4 flex items-center gap-1.5 text-[10px] text-[#8b9693]">
              <TriangleAlert size={12} />
              Projects requiring attention
            </div>
          </div>

          {/* COMPLETED */}
          <div className="group relative overflow-hidden rounded-[20px] border border-[#dfe2de] bg-white p-4 shadow-[0_8px_30px_rgba(36,48,47,0.045)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(36,48,47,0.08)] sm:p-5">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#4c7565]/[0.04] transition group-hover:scale-125" />

            <div className="relative flex items-start justify-between gap-2">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#8b9693] sm:text-[10px]">
                  Completed
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#24302f]">
                  {loading ? "—" : completedProjects}
                </h2>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef5f1] text-[#4c7565]">
                <CheckCircle2 size={18} />
              </div>
            </div>

            <div className="relative mt-4 flex items-center gap-1.5 text-[10px] text-[#8b9693]">
              <CheckCircle2 size={12} />
              Successfully completed projects
            </div>
          </div>
        </section>

        {/* =======================================================
            SEARCH / FILTER TOOLBAR
        ======================================================= */}
        <section className="mt-5 rounded-[20px] border border-[#dfe2de] bg-white p-3 shadow-[0_8px_30px_rgba(36,48,47,0.035)] sm:mt-6 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa3a0]"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="h-11 w-full rounded-xl border border-[#e3e5e2] bg-[#f8f9f7] pl-10 pr-4 text-xs text-[#24302f] outline-none transition focus:border-[#68364b] focus:bg-white focus:ring-4 focus:ring-[#68364b]/[0.07] placeholder:text-[#9aa3a0]"
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-[#f3f4f2] p-1 lg:flex lg:w-fit">
              {["All Projects", "Active", "At Risk"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-lg px-3 py-2.5 text-[10px] font-bold transition sm:px-4 sm:text-[11px] ${
                    filter === item
                      ? "bg-[#68364b] text-white shadow-sm"
                      : "text-[#788380] hover:bg-white hover:text-[#35413f]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* =======================================================
            ERROR
        ======================================================= */}
        {error && (
          <div className="mt-5 rounded-xl border border-[#f0caca] bg-[#fff5f5] px-4 py-3 text-xs font-medium text-[#a34c4c]">
            {error}
          </div>
        )}

        {/* =======================================================
            PROJECT PORTFOLIO
        ======================================================= */}
        <section className="mt-7 sm:mt-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c47a44]" />

                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#9a898f] sm:text-[10px]">
                  Project Portfolio
                </p>
              </div>

              <h2 className="mt-1.5 text-lg font-bold tracking-tight text-[#24302f] sm:text-xl">
                All Projects
              </h2>
            </div>

            <div className="rounded-full border border-[#dfe2de] bg-white px-3 py-1.5 text-[9px] font-bold text-[#7f8986] sm:text-[10px]">
              {filteredProjects.length} projects
            </div>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="rounded-[22px] border border-[#dfe2de] bg-white p-10 text-center shadow-[0_8px_30px_rgba(36,48,47,0.035)]">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#dddfe0] border-t-[#68364b]" />

              <p className="mt-4 text-xs font-medium text-[#71807d]">
                Loading projects...
              </p>
            </div>
          )}

          {/* EMPTY */}
          {!loading && !error && filteredProjects.length === 0 && (
            <div className="rounded-[22px] border border-dashed border-[#d4d9d5] bg-white p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2e8ec] text-[#68364b]">
                <FolderKanban size={25} />
              </div>

              <p className="mt-4 text-sm font-bold text-[#24302f]">
                No projects found
              </p>

              <p className="mt-1 text-xs text-[#71807d]">
                Try changing your search or filter.
              </p>
            </div>
          )}

          {/* PROJECT CARDS */}
          {!loading && filteredProjects.length > 0 && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {filteredProjects.map((project) => {
                const progress = Math.min(
                  Math.max(project.progress, 0),
                  100
                );

                const statusStyle =
                  project.status === "At Risk"
                    ? "bg-[#fff1e4] text-[#a85f2e] border-[#f4dcc6]"
                    : project.status === "Delayed"
                    ? "bg-[#f9eaea] text-[#a34c4c] border-[#efd2d2]"
                    : project.status === "Completed"
                    ? "bg-[#eef5f1] text-[#4c7565] border-[#d7e9df]"
                    : "bg-[#eef5f1] text-[#4c7565] border-[#d7e9df]";

                return (
                  <article
                    key={project.backendId}
                    className="group relative overflow-hidden rounded-[22px] border border-[#dfe2de] bg-white shadow-[0_8px_30px_rgba(36,48,47,0.04)] transition duration-300 hover:-translate-y-1 hover:border-[#cdb9c1] hover:shadow-[0_18px_45px_rgba(36,48,47,0.09)]"
                  >
                    {/* TOP ACCENT */}
                    <div
                      className={`h-1 w-full ${
                        project.status === "Delayed"
                          ? "bg-[#a34c4c]"
                          : project.status === "At Risk"
                          ? "bg-[#c47a44]"
                          : project.status === "Completed"
                          ? "bg-[#4c7565]"
                          : "bg-[#68364b]"
                      }`}
                    />

                    <div className="p-5 sm:p-6">
                      {/* CARD HEADER */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f2e8ec] text-[#68364b] transition duration-300 group-hover:bg-[#68364b] group-hover:text-white">
                            <FolderKanban size={19} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#68364b]">
                                {project.id}
                              </span>

                              <span
                                className={`rounded-full border px-2 py-1 text-[7px] font-extrabold uppercase tracking-wide ${statusStyle}`}
                              >
                                {project.status}
                              </span>
                            </div>

                            <h3 className="mt-1.5 line-clamp-2 text-sm font-bold leading-5 tracking-[-0.01em] text-[#24302f] sm:text-[15px]">
                              {project.name}
                            </h3>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="shrink-0 rounded-lg p-2 text-[#9aa3a0] transition hover:bg-[#f5f2f0] hover:text-[#68364b] sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <MoreHorizontal size={17} />
                        </button>
                      </div>

                      {/* META */}
                      <div className="mt-5 flex flex-col gap-2 text-[10px]">
                        <div className="flex items-center gap-2 text-[#71807d]">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f5f6f4] text-[#7e8986]">
                            <MapPin size={12} />
                          </div>

                          <span className="truncate">
                            {project.location}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[#8a9491]">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#c47a44]" />
                          <span>{project.type}</span>
                        </div>
                      </div>

                      {/* PROGRESS PANEL */}
                      <div className="mt-5 rounded-xl border border-[#e7e9e6] bg-[#f8f9f7] p-4">
                        <div className="mb-2.5 flex items-center justify-between">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#89938f]">
                              Project Progress
                            </span>
                          </div>

                          <span className="text-sm font-extrabold text-[#24302f]">
                            {project.progress.toFixed(0)}%
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-[#e3e5e2]">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              project.status === "Delayed"
                                ? "bg-[#a34c4c]"
                                : project.status === "At Risk"
                                ? "bg-[#c47a44]"
                                : "bg-[#68364b]"
                            }`}
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* DETAILS */}
                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-[#e7e9e6] bg-white p-3">
                          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#9aa3a0]">
                            Start Date
                          </p>

                          <p className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-[#35413f]">
                            <CalendarDays
                              size={12}
                              className="text-[#68364b]"
                            />
                            <span className="truncate">
                              {project.start}
                            </span>
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#e7e9e6] bg-white p-3">
                          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#9aa3a0]">
                            End Date
                          </p>

                          <p className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-[#35413f]">
                            <CalendarDays
                              size={12}
                              className="text-[#c47a44]"
                            />
                            <span className="truncate">
                              {project.end}
                            </span>
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#e7e9e6] bg-[#fafbf9] p-3">
                          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#9aa3a0]">
                            Activities
                          </p>

                          <p className="mt-1 text-sm font-extrabold text-[#35413f]">
                            {project.activities}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#efdada] bg-[#fffafa] p-3">
                          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#9aa3a0]">
                            Delayed
                          </p>

                          <p className="mt-1 text-sm font-extrabold text-[#a34c4c]">
                            {project.delayed}
                          </p>
                        </div>
                      </div>

                      {/* FOOTER */}
                      <div className="mt-5 flex flex-col gap-3 border-t border-[#e8ebe8] pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-[9px] uppercase tracking-[0.1em] text-[#9aa3a0]">
                            Project Manager
                          </p>

                          <p className="mt-1 truncate text-[10px] font-bold text-[#4d5956]">
                            {project.manager}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => router.push("/wbs")}
                          className="group/btn flex w-full items-center justify-center gap-2 rounded-xl bg-[#68364b] px-4 py-2.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-[#592d40] hover:shadow-md sm:w-fit"
                        >
                          View Project
                          <ArrowRight
                            size={13}
                            className="transition-transform group-hover/btn:translate-x-1"
                          />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* =======================================================
            FOOTER
        ======================================================= */}
        <footer className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-[#dfe2de] py-5 text-[9px] text-[#8a9491] sm:flex-row sm:text-[10px]">
          <p className="font-medium">
            FieldSync Project Management
          </p>

          <div className="flex items-center gap-1.5">
            <CheckCircle2
              size={12}
              className="text-[#4c7565]"
            />
            All project data synchronized
          </div>
        </footer>
      </div>
    </div>
  );
}