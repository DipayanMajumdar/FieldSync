"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getWBSTree, getProjects } from "@/lib/api";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Disc3,
  ListTodo,
  RefreshCw,
  CalendarDays,
  CircleDot,
} from "lucide-react";

type WBSNode = {
  id: number | string;
  code?: string;
  name?: string;
  level?: number;
  parent_id?: number | string | null;
  planned_start?: string | null;
  planned_end?: string | null;
  pct_complete?: number | null;
  planned_pct_complete?: number | null;
  variance?: number | null;
  computed_status?: string | null;
};

type TreeNode = WBSNode & {
  children: TreeNode[];
};

type TimelineNode = WBSNode & {
  depth: number;
};

const DAY_MS = 1000 * 60 * 60 * 24;

export default function GanttPage() {
  const router = useRouter();

  const [nodes, setNodes] = useState<WBSNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filter, setFilter] = useState("All");
  const [selectedId, setSelectedId] = useState<number | string | null>(
    null
  );

  const fetchData = async (manual = false) => {
    try {
      if (manual) setRefreshing(true);

      const projs = await getProjects();

      if (!projs || projs.length === 0) {
        setNodes([]);
        return;
      }

      const data = await getWBSTree(projs[0].id);

      setNodes(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(error);
      setNodes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* =========================================================
     TREE
  ========================================================= */

  const buildTree = (data: WBSNode[]): TreeNode[] => {
    const map: Record<string, TreeNode> = {};

    data.forEach((node) => {
      map[String(node.id)] = {
        ...node,
        children: [],
      };
    });

    const roots: TreeNode[] = [];

    data.forEach((node) => {
      const current = map[String(node.id)];

      if (
        node.parent_id !== null &&
        node.parent_id !== undefined &&
        map[String(node.parent_id)]
      ) {
        map[String(node.parent_id)].children.push(current);
      } else {
        roots.push(current);
      }
    });

    return roots;
  };

  const flattenTree = (
    tree: TreeNode[],
    depth = 0,
    result: TimelineNode[] = []
  ) => {
    tree.forEach((node) => {
      result.push({
        ...node,
        depth,
      });

      if (node.children.length > 0) {
        flattenTree(node.children, depth + 1, result);
      }
    });

    return result;
  };

  const allTimelineNodes = useMemo(() => {
    return flattenTree(buildTree(nodes));
  }, [nodes]);

  /* =========================================================
     ACTIVITIES
  ========================================================= */

  const activities = useMemo(() => {
    return allTimelineNodes.filter((node) => {
      return (
        node.planned_start &&
        node.planned_end
      );
    });
  }, [allTimelineNodes]);

  const getStatus = (node: WBSNode) => {
    const pct = Number(node.pct_complete ?? 0);
    const variance =
      node.variance === null ||
      node.variance === undefined
        ? null
        : Number(node.variance);

    const backendStatus = String(
      node.computed_status ?? ""
    ).toUpperCase();

    if (backendStatus === "COMPLETED" || pct >= 100) {
      return "COMPLETED";
    }

    if (
      backendStatus === "OVERDUE" ||
      backendStatus === "DELAYED" ||
      (variance !== null && variance < -10)
    ) {
      return "DELAYED";
    }

    if (
      backendStatus === "AT_RISK" ||
      (variance !== null && variance < 0)
    ) {
      return "AT_RISK";
    }

    return "IN_PROGRESS";
  };

  const filteredActivities = useMemo(() => {
    if (filter === "All") {
      return activities;
    }

    return activities.filter((activity) => {
      const status = getStatus(activity);

      if (filter === "Completed") {
        return status === "COMPLETED";
      }

      if (filter === "Delayed") {
        return status === "DELAYED";
      }

      if (filter === "At Risk") {
        return status === "AT_RISK";
      }

      if (filter === "On Track") {
        return status === "IN_PROGRESS";
      }

      return true;
    });
  }, [activities, filter]);

  /* =========================================================
     STATS
  ========================================================= */

  const stats = useMemo(() => {
    let completed = 0;
    let risk = 0;
    let delayed = 0;
    let onTrack = 0;

    activities.forEach((activity) => {
      const status = getStatus(activity);

      if (status === "COMPLETED") {
        completed++;
      } else if (status === "DELAYED") {
        delayed++;
      } else if (status === "AT_RISK") {
        risk++;
      } else {
        onTrack++;
      }
    });

    return {
      total: activities.length,
      completed,
      risk,
      delayed,
      onTrack,
    };
  }, [activities]);

  /* =========================================================
     TIMELINE
  ========================================================= */

  const {
    minDate,
    maxDate,
    totalDays,
    timelineDays,
  } = useMemo(() => {
    const validStarts = activities
      .map((activity) =>
        activity.planned_start
          ? new Date(activity.planned_start).getTime()
          : NaN
      )
      .filter((value) => !Number.isNaN(value));

    const validEnds = activities
      .map((activity) =>
        activity.planned_end
          ? new Date(activity.planned_end).getTime()
          : NaN
      )
      .filter((value) => !Number.isNaN(value));

    if (
      validStarts.length === 0 ||
      validEnds.length === 0
    ) {
      const fallbackStart = new Date("2026-09-01T00:00:00");
      const fallbackEnd = new Date("2026-11-08T00:00:00");

      const days =
        Math.ceil(
          (fallbackEnd.getTime() -
            fallbackStart.getTime()) /
            DAY_MS
        ) + 1;

      return {
        minDate: fallbackStart,
        maxDate: fallbackEnd,
        totalDays: days,
        timelineDays: Array.from(
          { length: days },
          (_, index) => {
            const date = new Date(fallbackStart);
            date.setDate(
              fallbackStart.getDate() + index
            );
            return date;
          }
        ),
      };
    }

    const minTime = Math.min(...validStarts);
    const maxTime = Math.max(...validEnds);

    const start = new Date(minTime);
    const end = new Date(maxTime);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const days =
      Math.max(
        1,
        Math.ceil(
          (end.getTime() - start.getTime()) / DAY_MS
        ) + 1
      );

    return {
      minDate: start,
      maxDate: end,
      totalDays: days,
      timelineDays: Array.from(
        { length: days },
        (_, index) => {
          const date = new Date(start);
          date.setDate(start.getDate() + index);
          return date;
        }
      ),
    };
  }, [activities]);

  const months = useMemo(() => {
    const result: {
      label: string;
      days: number;
      startIndex: number;
    }[] = [];

    if (timelineDays.length === 0) {
      return result;
    }

    let currentMonthKey = "";

    timelineDays.forEach((date, index) => {
      const key = `${date.getFullYear()}-${date.getMonth()}`;

      if (key !== currentMonthKey) {
        currentMonthKey = key;

        result.push({
          label: date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
          days: 1,
          startIndex: index,
        });
      } else {
        result[result.length - 1].days++;
      }
    });

    return result;
  }, [timelineDays]);

  const dateRangeStr = `${minDate.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  )} — ${maxDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;

  /* =========================================================
     BAR CALCULATION
  ========================================================= */

  const getBarPosition = (node: WBSNode) => {
    if (!node.planned_start || !node.planned_end) {
      return {
        left: 0,
        width: 0,
      };
    }

    const start = new Date(node.planned_start);
    const end = new Date(node.planned_end);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const timelineStart = minDate.getTime();

    const startOffset =
      (start.getTime() - timelineStart) / DAY_MS;

    const duration =
      Math.max(
        1,
        (end.getTime() - start.getTime()) / DAY_MS + 1
      );

    const left =
      (startOffset / totalDays) * 100;

    const width =
      (duration / totalDays) * 100;

    return {
      left: Math.max(0, left),
      width: Math.min(
        100 - Math.max(0, left),
        Math.max(0.8, width)
      ),
    };
  };

  const getStatusStyle = (node: WBSNode) => {
    const status = getStatus(node);

    if (status === "COMPLETED") {
      return {
        bar: "bg-[#315f78]",
        progress: "bg-[#21485c]",
        text: "text-[#315f78]",
        badge: "bg-[#e8f0f4]",
        label: "Completed",
      };
    }

    if (status === "DELAYED") {
      return {
        bar: "bg-[#b84e4e]",
        progress: "bg-[#8f3939]",
        text: "text-[#b84e4e]",
        badge: "bg-[#f9eaea]",
        label: "Delayed",
      };
    }

    if (status === "AT_RISK") {
      return {
        bar: "bg-[#c47a44]",
        progress: "bg-[#a85f2f]",
        text: "text-[#b56832]",
        badge: "bg-[#fbf1e8]",
        label: "At Risk",
      };
    }

    return {
      bar: "bg-[#4c8068]",
      progress: "bg-[#315f50]",
      text: "text-[#367b52]",
      badge: "bg-[#edf7f0]",
      label: "On Track",
    };
  };

  const getProgressWidth = (node: WBSNode) => {
    return Math.min(
      100,
      Math.max(0, Number(node.pct_complete ?? 0))
    );
  };

  /* =========================================================
     SELECTED ACTIVITY
  ========================================================= */

  const selectedActivity = useMemo(() => {
    return activities.find(
      (activity) => activity.id === selectedId
    );
  }, [activities, selectedId]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f6f3]">
      <div className="h-1 bg-[#68364b]" />

      <div className="mx-auto w-full max-w-[1550px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <header className="relative mb-6 overflow-hidden rounded-[26px] bg-[#102a2a] px-5 py-6 shadow-[0_18px_50px_rgba(16,42,42,0.13)] sm:px-7 sm:py-7 lg:px-9 lg:py-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/[0.06]" />

          <div className="pointer-events-none absolute -bottom-36 right-[18%] h-72 w-72 rounded-full border border-[#c47a44]/10" />

          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#68364b] text-white">
                  <CalendarDays size={14} />
                </div>

                <span className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#c47a44] sm:text-sm">
                  Planning & Execution
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">
                  Gantt Chart
                </h1>

                {!loading && (
                  <span className="rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-[12px] font-bold text-[#c7d1ce]">
                    {stats.total} activities
                  </span>
                )}
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aebbb7] sm:text-sm">
                Visualize planned activity timelines, progress
                and execution status across the project.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={14}
                  className={
                    refreshing ? "animate-spin" : ""
                  }
                />
                Refresh Timeline
              </button>

              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#24302f] transition hover:bg-[#f4f1ef]"
              >
                <ArrowLeft size={14} />
                Dashboard
              </button>
            </div>
          </div>
        </header>

        {/* =====================================================
            KPI CARDS
        ===================================================== */}
        <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <StatCard
            icon={ListTodo}
            label="Total Activities"
            value={loading ? "—" : stats.total}
            tone="burgundy"
          />

          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={loading ? "—" : stats.completed}
            tone="green"
          />

          <StatCard
            icon={AlertTriangle}
            label="At Risk"
            value={loading ? "—" : stats.risk}
            tone="orange"
          />

          <StatCard
            icon={Disc3}
            label="Delayed"
            value={loading ? "—" : stats.delayed}
            tone="red"
          />
        </section>

        {/* =====================================================
            TOOLBAR
        ===================================================== */}
        <section className="mb-5 flex flex-col gap-3 rounded-[20px] border border-[#dfe4df] bg-white p-3 shadow-[0_8px_28px_rgba(36,48,47,0.04)] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full overflow-x-auto rounded-xl border border-[#e2e6e3] bg-[#f7f8f6] p-1 lg:w-fit">
            {[
              "All",
              "On Track",
              "At Risk",
              "Delayed",
              "Completed",
            ].map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold transition sm:px-4 sm:text-sm ${
                  filter === item
                    ? "bg-[#68364b] text-white shadow-sm"
                    : "text-[#697572] hover:bg-white hover:text-[#24302f]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 px-1 text-sm font-semibold text-[#7b8582] sm:px-2 sm:text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays size={14} />
              <span>{dateRangeStr}</span>
            </div>

            {lastUpdated && (
              <span className="hidden text-[12px] text-[#a0a8a5] xl:block">
                Updated{" "}
                {lastUpdated.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </section>

        {/* =====================================================
            GANTT CARD
        ===================================================== */}
        <section className="overflow-hidden rounded-[22px] border border-[#dfe4df] bg-white shadow-[0_10px_35px_rgba(36,48,47,0.045)]">
          <div className="flex flex-col gap-3 border-b border-[#e5e9e5] px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#c47a44]">
                Project Schedule
              </p>

              <h2 className="mt-1 text-base font-bold text-[#24302f]">
                Project Timeline
              </h2>

              <p className="mt-1 text-sm leading-5 text-[#71807d] sm:text-sm">
                Click an activity bar to view its live progress
                information.
              </p>
            </div>

            <div className="flex items-center gap-2 text-[12px] font-semibold text-[#8a9390]">
              <CircleDot size={12} className="text-[#68364b]" />
              Live WBS schedule
            </div>
          </div>

          {loading ? (
            <GanttLoading />
          ) : filteredActivities.length === 0 ? (
            <GanttEmpty
              filtered={filter !== "All"}
              onReset={() => setFilter("All")}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <div className="flex min-w-[1250px]">
                  {/* =================================================
                      LEFT ACTIVITY PANEL
                  ================================================= */}
                  <div className="sticky left-0 z-20 w-[330px] shrink-0 border-r border-[#dfe4df] bg-white">
                    {/* Header */}
                    <div className="h-[82px] border-b border-[#dfe4df] bg-[#f7f8f6] px-4 py-3">
                      <div className="flex h-full flex-col justify-end">
                        <span className="text-[12px] font-extrabold uppercase tracking-[0.15em] text-[#89938f]">
                          Work Breakdown
                        </span>

                        <span className="mt-2 text-[12px] font-semibold text-[#a0a8a5]">
                          Activity
                        </span>
                      </div>
                    </div>

                    {/* Rows */}
                    {filteredActivities.map(
                      (node, index) => {
                        const statusStyle =
                          getStatusStyle(node);

                        return (
                          <button
                            type="button"
                            key={node.id}
                            onClick={() =>
                              setSelectedId(node.id)
                            }
                            className={`flex h-[74px] w-full items-center border-b border-[#edf0ed] px-4 text-left transition ${
                              selectedId === node.id
                                ? "bg-[#faf4f6]"
                                : "hover:bg-[#fafbf9]"
                            }`}
                          >
                            <div className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f3e9ed] text-[12px] font-extrabold text-[#68364b]">
                              {String(index + 1).padStart(
                                2,
                                "0"
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-bold text-[#283432]">
                                  {node.name ||
                                    "Unnamed Activity"}
                                </span>
                              </div>

                              <div className="mt-1 flex items-center gap-2">
                                <span className="font-mono text-[11px] uppercase tracking-wide text-[#9aa29f]">
                                  {node.code || "—"}
                                </span>

                                <span
                                  className={`rounded-full px-1.5 py-0.5 text-[7px] font-extrabold uppercase ${statusStyle.badge} ${statusStyle.text}`}
                                >
                                  {statusStyle.label}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>

                  {/* =================================================
                      TIMELINE
                  ================================================= */}
                  <div className="relative min-w-[920px] flex-1">
                    {/* Month header */}
                    <div className="flex h-[41px] border-b border-[#dfe4df] bg-white">
                      {months.map((month) => (
                        <div
                          key={`${month.label}-${month.startIndex}`}
                          className="flex flex-col shrink-0 items-center justify-center border-r border-[#e5e9e5] text-[10px] sm:text-[11px] font-extrabold text-[#5f6b68] leading-tight text-center px-1 overflow-hidden"
                          style={{
                            width: `${(month.days / totalDays) * 100}%`,
                          }}
                        >
                          <span className="truncate w-full">{month.label.split(' ')[0]}</span>
                          <span className="truncate w-full">{month.label.split(' ')[1]}</span>
                        </div>
                      ))}
                    </div>

                    {/* Days */}
                    <div className="flex h-[41px] border-b border-[#dfe4df] bg-[#f7f8f6]">
                      {timelineDays.map(
                        (date, index) => (
                          <div
                            key={index}
                            className="flex min-w-[30px] flex-1 items-center justify-center border-r border-[#e8ece9] text-[11px] font-semibold text-[#8d9693]"
                          >
                            {date.getDate()}
                          </div>
                        )
                      )}
                    </div>

                    {/* Rows */}
                    <div className="relative">
                      {/* Vertical grid */}
                      <div className="pointer-events-none absolute inset-0 flex">
                        {timelineDays.map(
                          (_, index) => (
                            <div
                              key={index}
                              className="min-w-[30px] flex-1 border-r border-[#f0f2f0]"
                            />
                          )
                        )}
                      </div>

                      {filteredActivities.map(
                        (node) => {
                          const position =
                            getBarPosition(node);

                          const statusStyle =
                            getStatusStyle(node);

                          const progress =
                            getProgressWidth(node);

                          const isSelected =
                            selectedId === node.id;

                          return (
                            <div
                              key={node.id}
                              className={`relative h-[74px] border-b border-[#edf0ed] transition ${
                                isSelected
                                  ? "bg-[#fcf8f9]"
                                  : ""
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedId(
                                    node.id
                                  )
                                }
                                className={`absolute top-1/2 h-9 -translate-y-1/2 overflow-hidden rounded-lg text-left shadow-sm transition hover:brightness-105 hover:shadow-md ${
                                  statusStyle.bar
                                } ${
                                  isSelected
                                    ? "ring-2 ring-[#68364b]/25 ring-offset-1"
                                    : ""
                                }`}
                                style={{
                                  left: `${position.left}%`,
                                  width: `${position.width}%`,
                                  minWidth: "34px",
                                }}
                                title={`${node.name || "Activity"} — ${progress.toFixed(1)}%`}
                              >
                                {/* progress fill */}
                                <div
                                  className={`absolute inset-y-0 left-0 opacity-40 ${statusStyle.progress}`}
                                  style={{
                                    width: `${progress}%`,
                                  }}
                                />

                                <div className="relative z-10 flex h-full items-center justify-between gap-2 px-2.5">
                                  <span className="truncate text-[12px] font-extrabold text-white sm:text-sm">
                                    {progress > 0
                                      ? `${Math.round(progress)}%`
                                      : "0%"}
                                  </span>

                                  {position.width >
                                    9 && (
                                    <span className="hidden truncate text-[11px] font-semibold text-white/90 xl:block">
                                      {node.name}
                                    </span>
                                  )}
                                </div>
                              </button>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* =================================================
                  LEGEND
              ================================================= */}
              <div className="flex flex-col gap-3 border-t border-[#dfe4df] bg-[#fafbf9] px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5 sm:px-6">
                <span className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#5d6966]">
                  Activity Status
                </span>

                <LegendItem
                  color="bg-[#4c8068]"
                  label="On Track"
                />

                <LegendItem
                  color="bg-[#c47a44]"
                  label="At Risk"
                />

                <LegendItem
                  color="bg-[#b84e4e]"
                  label="Delayed"
                />

                <LegendItem
                  color="bg-[#315f78]"
                  label="Completed"
                />
              </div>
            </>
          )}
        </section>

        {/* =====================================================
            SELECTED ACTIVITY DETAIL
        ===================================================== */}
        {selectedActivity && (
          <section className="mt-5 overflow-hidden rounded-[20px] border border-[#dfe4df] bg-white shadow-[0_8px_28px_rgba(36,48,47,0.04)]">
            <div className="flex flex-col gap-3 border-b border-[#e5e9e5] px-4 py-4 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#c47a44]">
                  Selected Activity
                </p>

                <h3 className="mt-1 truncate text-sm font-bold text-[#24302f]">
                  {selectedActivity.name}
                </h3>
              </div>

              <button
                onClick={() => setSelectedId(null)}
                className="flex w-fit items-center gap-1.5 rounded-lg border border-[#e0e4e1] px-3 py-2 text-[12px] font-bold text-[#6f7976] transition hover:bg-[#f7f8f6]"
              >
                Close
                <span>×</span>
              </button>
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
              <DetailItem
                label="Activity Code"
                value={selectedActivity.code || "—"}
              />

              <DetailItem
                label="Planned Start"
                value={formatDate(
                  selectedActivity.planned_start
                )}
              />

              <DetailItem
                label="Planned End"
                value={formatDate(
                  selectedActivity.planned_end
                )}
              />

              <DetailItem
                label="Current Progress"
                value={`${Number(
                  selectedActivity.pct_complete ?? 0
                ).toFixed(1)}%`}
              />
            </div>
          </section>
        )}

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

          <span>v1.0</span>
        </footer>
      </div>
    </main>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  tone: "burgundy" | "green" | "orange" | "red";
}) {
  const styles = {
    burgundy: {
      icon: "bg-[#f3e9ed] text-[#68364b]",
      value: "text-[#68364b]",
    },
    green: {
      icon: "bg-[#edf7f0] text-[#367b52]",
      value: "text-[#367b52]",
    },
    orange: {
      icon: "bg-[#fbf1e8] text-[#b56832]",
      value: "text-[#b56832]",
    },
    red: {
      icon: "bg-[#f9eaea] text-[#b84e4e]",
      value: "text-[#b84e4e]",
    },
  };

  return (
    <div className="rounded-[18px] border border-[#dfe4df] bg-white p-4 shadow-[0_7px_25px_rgba(36,48,47,0.035)] sm:p-5">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles[tone].icon}`}
        >
          <Icon size={16} />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9aa29f]">
          WBS
        </span>
      </div>

      <p className="mt-4 text-[12px] font-semibold uppercase tracking-wide text-[#78837f] sm:text-sm">
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-extrabold tracking-tight ${styles[tone].value}`}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   LEGEND ITEM
========================================================= */

function LegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[12px] font-semibold text-[#65716e]">
      <span
        className={`h-2.5 w-2.5 rounded-full ${color}`}
      />

      {label}
    </div>
  );
}

/* =========================================================
   DETAIL ITEM
========================================================= */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#e3e8e4] bg-[#fafbf9] p-3.5">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#929b98]">
        {label}
      </p>

      <p className="mt-1.5 truncate text-sm font-bold text-[#34413e]">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function GanttEmpty({
  filtered,
  onReset,
}: {
  filtered: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-5 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e9f1ef] text-[#315f5a]">
        <CalendarDays size={27} />
      </div>

      <h3 className="mt-5 text-base font-bold text-[#24302f]">
        {filtered
          ? "No activities match this filter"
          : "No scheduled activities"}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-5 text-[#71807d]">
        {filtered
          ? "Try another activity status to view the project timeline."
          : "Activities with planned start and end dates will appear here on the Gantt timeline."}
      </p>

      {filtered && (
        <button
          onClick={onReset}
          className="mt-5 rounded-xl border border-[#dcd5d1] bg-white px-4 py-2.5 text-sm font-bold text-[#24302f] transition hover:border-[#68364b] hover:text-[#68364b]"
        >
          Show all activities
        </button>
      )}
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function GanttLoading() {
  return (
    <div className="animate-pulse p-4 sm:p-6">
      <div className="h-[82px] rounded-xl bg-[#eef1ee]" />

      <div className="mt-2 space-y-2">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="h-[74px] rounded-xl bg-[#f3f5f3]"
          />
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(
  value?: string | null
) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}