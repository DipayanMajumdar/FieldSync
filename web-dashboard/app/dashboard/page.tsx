"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getWBSTree,
  getSubmissions,
  getProject,
  getAIQueue,
  getProjects,
} from "@/lib/api";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Camera,
  CheckCircle2,
  Clock3,
  MapPin,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Workflow,
} from "lucide-react";

export default function DashboardPage() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [aiQueue, setAiQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async (manual = false) => {
    if (manual) setRefreshing(true);

    try {
      const projs = await getProjects();

      if (!projs || projs.length === 0) {
        setLoading(false);
        return;
      }

      const projectId = projs[0].id;

      const [projData, treeData, recentSubs, queue] = await Promise.all([
        getProject(projectId).catch(() => null),
        getWBSTree(projectId).catch(() => []),
        getSubmissions({ limit: 5 }).catch(() => []),
        getAIQueue().catch(() => []),
      ]);

      setProject(projData);
      setNodes(Array.isArray(treeData) ? treeData : []);
      setSubs(Array.isArray(recentSubs) ? recentSubs : []);
      setAiQueue(Array.isArray(queue) ? queue : []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("fs_user");

    if (userStr) {
      try {
        const u = JSON.parse(userStr);

        if (u.role === "field_engineer" || u.role === "field_worker") {
          window.location.href = "/field-evidence";
          return;
        }
      } catch {
        // Ignore malformed local storage data.
      }
    }

    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const rootNode = useMemo(
    () => nodes.find((n) => !n.parent_id),
    [nodes]
  );

  const l2Nodes = useMemo(
    () => nodes.filter((n) => n.parent_id === rootNode?.id),
    [nodes, rootNode]
  );

  const overallProgress = Math.min(
    100,
    Math.max(0, Number(rootNode?.pct_complete || 0))
  );

  const completedPhases = useMemo(
    () =>
      l2Nodes.filter(
        (node) => Number(node.pct_complete || 0) >= 100
      ).length,
    [l2Nodes]
  );

  const averagePhaseProgress = useMemo(() => {
    if (l2Nodes.length === 0) return 0;

    const total = l2Nodes.reduce(
      (sum, node) => sum + Number(node.pct_complete || 0),
      0
    );

    return total / l2Nodes.length;
  }, [l2Nodes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6F4] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1450px]">
          <div className="mb-6 h-32 animate-pulse rounded-3xl bg-white border border-[#e7e8e5]" />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl bg-white border border-[#e7e8e5]"
              />
            ))}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="h-[400px] animate-pulse rounded-2xl bg-white border border-[#e7e8e5]" />
            <div className="h-[400px] animate-pulse rounded-2xl bg-white border border-[#e7e8e5]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F5F6F4] px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-[1450px]">

        {/* Header */}
        <header className="mb-6 rounded-3xl bg-[#102A2A] p-5 text-white shadow-[0_14px_40px_rgba(16,42,42,0.13)] sm:p-7 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[1.8px] text-[#C47A44] sm:text-[10px]">
                <Workflow size={14} />
                Project Control Centre
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Project Dashboard
              </h1>

              <p className="mt-2 max-w-2xl text-xs leading-5 text-white/60 sm:text-sm">
                {project?.name || "Pipeline Expansion — Sector 7B"}
              </p>

              {project?.code && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-white/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C47A44]" />
                  {project.code}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 lg:min-w-[310px] lg:items-end">
              <div className="flex items-center justify-between gap-3 lg:justify-end">
                {lastUpdated && (
                  <div className="flex items-center gap-2 text-[10px] font-medium text-[#9ec8ae]">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#75c08d] opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#75c08d]" />
                    </span>
                    Live · {lastUpdated.toLocaleTimeString()}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fetchData(true)}
                  disabled={refreshing}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/75 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  <RefreshCw
                    size={14}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>

              <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 lg:w-[310px]">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[1.2px] text-white/50">
                    Overall Progress
                  </span>

                  <span className="text-xl font-bold text-white">
                    {overallProgress.toFixed(1)}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#C47A44] transition-all duration-700"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>

                <div className="mt-2 flex justify-between text-[9px] text-white/40">
                  <span>Project completion</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* KPI Cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Activity}
            label="Active Phases"
            value={l2Nodes.length}
            detail={`${completedPhases} completed`}
            iconClass="bg-[#eef4f3] text-[#276060]"
          />

          <MetricCard
            icon={TrendingUp}
            label="Average Phase Progress"
            value={`${averagePhaseProgress.toFixed(1)}%`}
            detail="Across L2 phases"
            iconClass="bg-[#f7eee8] text-[#C47A44]"
          />

          <MetricCard
            icon={Camera}
            label="Recent Updates"
            value={subs.length}
            detail="Latest field submissions"
            iconClass="bg-[#f5edf1] text-[#68364B]"
          />

          <MetricCard
            icon={ShieldCheck}
            label="Pending AI Reviews"
            value={aiQueue.length}
            detail={aiQueue.length > 0 ? "Requires attention" : "Queue is clear"}
            iconClass={
              aiQueue.length > 0
                ? "bg-[#fff5e9] text-[#b96d2f]"
                : "bg-[#edf7f0] text-[#43815a]"
            }
          />
        </section>

        {/* Main Content */}
        <section className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">

          {/* Phase Progress */}
          <div className="overflow-hidden rounded-2xl border border-[#e3e5e2] bg-white shadow-[0_8px_30px_rgba(36,48,47,0.045)]">
            <div className="border-b border-[#eceeeb] px-4 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[1.5px] text-[#C47A44]">
                    <Workflow size={13} />
                    Work Breakdown
                  </div>

                  <h2 className="text-base font-bold text-[#24302F] sm:text-lg">
                    Phase Progress Rollup
                  </h2>

                  <p className="mt-1 text-[11px] text-[#7a8582] sm:text-xs">
                    Live progress across Level 2 project phases
                  </p>
                </div>

                <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-[#f1f5f4] text-[#276060] sm:flex">
                  <Activity size={17} />
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {l2Nodes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#dfe3df] bg-[#fafbfa] px-4 py-12 text-center">
                  <Workflow
                    size={26}
                    className="mx-auto text-[#aab2af]"
                  />
                  <p className="mt-3 text-sm font-semibold text-[#68736f]">
                    No phases found
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {l2Nodes.map((node, index) => {
                    const progress = Math.min(
                      100,
                      Math.max(0, Number(node.pct_complete || 0))
                    );

                    return (
                      <div key={node.id}>
                        <div className="mb-2 flex items-end justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#f2f4f2] text-[9px] font-bold text-[#6b7673]">
                                {String(index + 1).padStart(2, "0")}
                              </span>

                              <p className="truncate text-xs font-bold text-[#35413f] sm:text-sm">
                                {node.code} - {node.name}
                              </p>
                            </div>
                          </div>

                          <span className="shrink-0 text-xs font-bold text-[#24302F]">
                            {progress.toFixed(1)}%
                          </span>
                        </div>

                        <div className="ml-8 h-2 overflow-hidden rounded-full bg-[#edf0ed]">
                          <div
                            className="h-full rounded-full bg-[#68364B] transition-all duration-700"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <div className="ml-8 mt-1.5 flex justify-between text-[9px] text-[#9aa39f]">
                          <span>
                            {progress >= 100
                              ? "Completed"
                              : progress > 0
                              ? "In progress"
                              : "Not started"}
                          </span>

                          <span>{Math.round(progress)} / 100</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-[#eceeeb] bg-[#fafbf9] px-4 py-3 sm:px-6">
              <div className="flex items-center justify-between text-[10px] font-semibold text-[#7d8784]">
                <span>Total phases</span>
                <span className="text-[#24302F]">
                  {l2Nodes.length}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Field Evidence */}
          <div className="overflow-hidden rounded-2xl border border-[#e3e5e2] bg-white shadow-[0_8px_30px_rgba(36,48,47,0.045)]">
            <div className="border-b border-[#eceeeb] px-4 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[1.5px] text-[#C47A44]">
                    <Camera size={13} />
                    Field Activity
                  </div>

                  <h2 className="text-base font-bold text-[#24302F] sm:text-lg">
                    Recent Field Evidence
                  </h2>

                  <p className="mt-1 text-[11px] text-[#7a8582] sm:text-xs">
                    Latest submissions received from the field
                  </p>
                </div>

                <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-[#f7f1f3] text-[#68364B] sm:flex">
                  <Camera size={17} />
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {subs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#dfe3df] bg-[#fafbfa] px-4 py-12 text-center">
                  <Camera
                    size={26}
                    className="mx-auto text-[#aab2af]"
                  />
                  <p className="mt-3 text-sm font-semibold text-[#68736f]">
                    No recent submissions
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subs.map((sub) => (
                    <div
                      key={sub.id}
                      className="group flex items-center gap-3 rounded-xl border border-[#eceeeb] bg-[#fcfdfc] p-3 transition hover:border-[#d8ddda] hover:bg-white sm:gap-4 sm:p-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3f5f3] text-[#7b8582] transition group-hover:bg-[#f7f1f3] group-hover:text-[#68364B] sm:h-11 sm:w-11">
                        <Camera size={19} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs font-bold text-[#35413f] sm:text-sm">
                            {sub.wbs_node_name || "Activity Update"}
                          </p>

                          {sub.gps_lat && (
                            <span className="hidden shrink-0 items-center gap-1 rounded-full bg-[#edf7f0] px-2 py-1 text-[8px] font-bold text-[#43815a] sm:flex">
                              <ShieldCheck size={10} />
                              Verified
                            </span>
                          )}
                        </div>

                        <p className="mt-1 flex items-center gap-1.5 text-[9px] text-[#8a9491] sm:text-[10px]">
                          <Clock3 size={11} />
                          {new Date(sub.captured_at).toLocaleString()}
                        </p>

                        {sub.gps_lat && (
                          <span className="mt-1 flex items-center gap-1 text-[9px] text-[#9aa39f] sm:hidden">
                            <MapPin size={10} />
                            GPS Verified
                          </span>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#68364B] sm:text-base">
                            +{sub.pct_complete}%
                          </p>

                          <p className="text-[8px] font-semibold uppercase tracking-wide text-[#9aa39f]">
                            Progress
                          </p>
                        </div>

                        <ArrowUpRight
                          size={14}
                          className="hidden text-[#b0b7b4] transition group-hover:text-[#68364B] sm:block"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-[#eceeeb] bg-[#fafbf9] px-4 py-3 sm:px-6">
              <div className="flex items-center justify-between text-[10px] font-semibold text-[#7d8784]">
                <span>Showing latest submissions</span>
                <span className="text-[#24302F]">
                  {subs.length}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Project Health Strip */}
        <section className="mt-5 rounded-2xl border border-[#e3e5e2] bg-white p-4 shadow-[0_8px_30px_rgba(36,48,47,0.045)] sm:p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <HealthItem
              icon={CheckCircle2}
              label="Completed Phases"
              value={completedPhases}
              tone="green"
            />

            <HealthItem
              icon={Activity}
              label="Active Monitoring"
              value={l2Nodes.length - completedPhases}
              tone="teal"
            />

            <HealthItem
              icon={AlertTriangle}
              label="AI Queue"
              value={aiQueue.length}
              tone={aiQueue.length > 0 ? "orange" : "green"}
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t border-[#e1e4e1] py-5 text-center text-[9px] text-[#909996] sm:text-[10px]">
          <span className="font-bold text-[#68364B]">
            FieldSync
          </span>

          <span>•</span>

          <span>
            Infrastructure Progress Tracking Platform
          </span>

          <span>•</span>

          <span>Live Project Control</span>
        </footer>
      </div>
    </div>
  );
}

/* ---------- Reusable Components ---------- */

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  iconClass,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  detail: string;
  iconClass: string;
}) {
  return (
    <div className="group rounded-2xl border border-[#e3e5e2] bg-white p-4 shadow-[0_8px_25px_rgba(36,48,47,0.035)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(36,48,47,0.07)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={18} />
        </div>

        <ArrowUpRight
          size={15}
          className="text-[#c4cac7] transition group-hover:text-[#68364B]"
        />
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[#7d8784]">
          {label}
        </p>

        <p className="mt-1 text-2xl font-bold tracking-tight text-[#24302F] sm:text-3xl">
          {value}
        </p>

        <p className="mt-1 text-[9px] font-medium text-[#9aa39f] sm:text-[10px]">
          {detail}
        </p>
      </div>
    </div>
  );
}

function HealthItem({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: number;
  tone: "green" | "teal" | "orange";
}) {
  const styles = {
    green: {
      box: "bg-[#edf7f0]",
      icon: "text-[#43815a]",
    },
    teal: {
      box: "bg-[#eef4f3]",
      icon: "text-[#276060]",
    },
    orange: {
      box: "bg-[#fff5e9]",
      icon: "text-[#b96d2f]",
    },
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#eceeeb] bg-[#fcfdfc] p-3.5 sm:p-4">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles[tone].box} ${styles[tone].icon}`}
      >
        <Icon size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.7px] text-[#7d8784]">
          {label}
        </p>
      </div>

      <span className="text-lg font-bold text-[#24302F]">
        {value}
      </span>
    </div>
  );
}

