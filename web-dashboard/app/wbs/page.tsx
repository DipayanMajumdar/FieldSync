"use client";

import {
  Activity,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  Layers3,
  RefreshCw,
  Target,
  TriangleAlert,
} from "lucide-react";

import { useEffect, useState } from "react";
import { getWBSTree, getProjects } from "@/lib/api";

type WBSNode = {
  id: number;
  parent_id: number | null;
  level: number;
  code: string;
  name: string;
  unit: string;
  planned_qty: number;
  weight: number;
  planned_start: string | null;
  planned_end: string | null;
  status: string;
  pct_complete: number;
  actual_qty: number;
  computed_status?: string;
  planned_pct_complete?: number;
  variance?: number;
  children?: WBSNode[];
};

const LEVEL_LABELS = [
  "",
  "L1 Project",
  "L2 Phase",
  "L3 Area",
  "L4 Milestone",
  "L5 Activity",
  "L6 Task",
];

const LEVEL_STYLES = [
  "",
  "bg-[#f1e9ed] text-[#68364b] border-[#e1d2d9]",
  "bg-[#eaf0f3] text-[#3e6272] border-[#d5e1e6]",
  "bg-[#e8f2f1] text-[#356b68] border-[#d1e5e3]",
  "bg-[#edf3ea] text-[#52704c] border-[#dbe7d7]",
  "bg-[#f8f0e5] text-[#966334] border-[#ecdfcd]",
  "bg-[#f6e9e5] text-[#9a5949] border-[#ead5cf]",
];

function getDynamicStatus(
  pct: number,
  endStr: string | null,
  computedStatus?: string
) {
  const status =
    computedStatus ||
    (() => {
      if (pct >= 100) return "COMPLETED";

      if (
        endStr &&
        new Date() > new Date(endStr) &&
        pct < 100
      ) {
        return "OVERDUE";
      }

      if (pct > 0) return "IN_PROGRESS";

      return "NOT_STARTED";
    })();

  switch (status) {
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d5e8dc] bg-[#eef7f1] px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-[#47745e]">
          <CircleCheck size={11} />
          COMPLETED
        </span>
      );

    case "OVERDUE":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#efd5d5] bg-[#fbefef] px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-[#a34c4c]">
          <TriangleAlert size={11} />
          OVERDUE
        </span>
      );

    case "IN_PROGRESS":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d5e0e8] bg-[#edf3f7] px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-[#496c7d]">
          <Activity size={11} />
          IN PROGRESS
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e1e4e2] bg-[#f5f6f5] px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#7c8582]">
          <CircleDashed size={11} />
          NOT STARTED
        </span>
      );
  }
}

function buildTree(nodes: WBSNode[]): WBSNode[] {
  const map: Record<number, WBSNode> = {};

  nodes.forEach((node) => {
    map[node.id] = {
      ...node,
      children: [],
    };
  });

  const roots: WBSNode[] = [];

  nodes.forEach((node) => {
    if (
      node.parent_id &&
      map[node.parent_id]
    ) {
      map[node.parent_id].children!.push(
        map[node.id]
      );
    } else {
      roots.push(map[node.id]);
    }
  });

  return roots;
}

function WBSRow({
  node,
  depth = 0,
  defaultExpanded = true,
}: {
  node: WBSNode;
  depth?: number;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] =
    useState(defaultExpanded);

  const hasChildren =
    (node.children?.length ?? 0) > 0;

  const progress = Math.min(
    100,
    Math.max(0, node.pct_complete ?? 0)
  );

  const levelStyle =
    LEVEL_STYLES[node.level] ||
    LEVEL_STYLES[1];

  const status =
    node.computed_status ||
    (progress >= 100
      ? "COMPLETED"
      : node.planned_end &&
        new Date() > new Date(node.planned_end) &&
        progress < 100
      ? "OVERDUE"
      : progress > 0
      ? "IN_PROGRESS"
      : "NOT_STARTED");

  const progressColor =
    status === "OVERDUE"
      ? "bg-[#a34c4c]"
      : status === "COMPLETED"
      ? "bg-[#4c7565]"
      : status === "IN_PROGRESS"
      ? "bg-[#68364b]"
      : "bg-[#b5bbb8]";

  return (
    <>
      <tr className="group border-b border-[#ecefed] transition-colors hover:bg-[#fafbf9]">
        {/* NODE */}
        <td className="min-w-[360px] px-4 py-3.5">
          <div
            className="flex items-center gap-2.5"
            style={{
              paddingLeft: depth * 24,
            }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() =>
                  setExpanded((value) => !value)
                }
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[#8d9794] transition hover:bg-[#f0f2f0] hover:text-[#68364b]"
              >
                {expanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>
            ) : (
              <span className="w-6 shrink-0" />
            )}

            <span
              className={`shrink-0 rounded-md border px-2 py-1 text-[7px] font-extrabold uppercase tracking-wide ${levelStyle}`}
            >
              {LEVEL_LABELS[node.level]}
            </span>

            <span className="shrink-0 rounded-md bg-[#f5f6f4] px-2 py-1 font-mono text-[12px] font-semibold text-[#7c8582]">
              {node.code}
            </span>

            <span className="min-w-0 truncate text-sm font-bold text-[#35413f]">
              {node.name}
            </span>
          </div>
        </td>

        {/* STATUS */}
        <td className="whitespace-nowrap px-4 py-3.5 text-center">
          {getDynamicStatus(
            progress,
            node.planned_end,
            node.computed_status
          )}
        </td>

        {/* PROGRESS */}
        <td className="min-w-[180px] px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="h-1.5 min-w-[90px] flex-1 overflow-hidden rounded-full bg-[#e7e9e7]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <span className="w-11 text-right text-sm font-extrabold text-[#35413f]">
              {progress.toFixed(1)}%
            </span>
          </div>
        </td>

        {/* QUANTITY */}
        <td className="whitespace-nowrap px-4 py-3.5 text-right">
          <span className="text-sm font-bold text-[#35413f]">
            {node.actual_qty?.toFixed(1) ?? "0"}
          </span>

          <span className="mx-1 text-[12px] text-[#a2aaa7]">
            /
          </span>

          <span className="text-sm font-medium text-[#7e8986]">
            {node.planned_qty?.toFixed(1) ?? "0"}
          </span>

          <span className="ml-1 text-[12px] font-semibold text-[#9aa3a0]">
            {node.unit}
          </span>
        </td>

        {/* START */}
        <td className="whitespace-nowrap px-4 py-3.5">
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#788380]">
            <CalendarDays
              size={11}
              className="text-[#9ba4a1]"
            />

            {node.planned_start
              ? new Date(
                  node.planned_start
                ).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </div>
        </td>

        {/* END */}
        <td className="whitespace-nowrap px-4 py-3.5">
          <div
            className={`flex items-center gap-1.5 text-[12px] font-medium ${
              status === "OVERDUE"
                ? "text-[#a34c4c]"
                : "text-[#788380]"
            }`}
          >
            <CalendarDays
              size={11}
              className={
                status === "OVERDUE"
                  ? "text-[#a34c4c]"
                  : "text-[#9ba4a1]"
              }
            />

            {node.planned_end
              ? new Date(
                  node.planned_end
                ).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </div>
        </td>
      </tr>

      {expanded &&
        hasChildren &&
        node.children!.map((child) => (
          <WBSRow
            key={child.id}
            node={child}
            depth={depth + 1}
            defaultExpanded={defaultExpanded}
          />
        ))}
    </>
  );
}

export default function WBSPage() {
  const [nodes, setNodes] = useState<WBSNode[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState<
    string | null
  >(null);
  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);
  const [projectName, setProjectName] =
    useState<string>("");
  const [expandKey, setExpandKey] =
    useState<boolean>(true);

  const fetchData = async () => {
    try {
      setError(null);

      const projs = await getProjects();

      if (!projs || projs.length === 0) {
        setNodes([]);
        setLoading(false);
        return;
      }

      setProjectName(projs[0].name || "");

      const data = await getWBSTree(
        projs[0].id
      );

      setNodes(
        Array.isArray(data) ? data : []
      );

      setLastUpdated(new Date());
    } catch (e: any) {
      console.error("WBS fetch error:", e);

      setError(
        e?.message ||
          "Failed to load WBS data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const interval = setInterval(
      fetchData,
      10000
    );

    return () => clearInterval(interval);
  }, []);

  const tree = buildTree(nodes);

  const totalNodes = nodes.length;

  const completedNodes = nodes.filter(
    (node) =>
      (node.pct_complete ?? 0) >= 100
  ).length;

  const activeNodes = nodes.filter(
    (node) => {
      const pct =
        node.pct_complete ?? 0;

      return pct > 0 && pct < 100;
    }
  ).length;

  const overdueNodes = nodes.filter(
    (node) =>
      node.computed_status === "OVERDUE" ||
      ((node.pct_complete ?? 0) < 100 &&
        !!node.planned_end &&
        new Date() >
          new Date(node.planned_end))
  ).length;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f6f4]">
      {/* TOP ACCENT */}
      <div className="h-1 w-full bg-[#68364b]" />

      <div className="px-4 py-5 sm:px-6 sm:py-7 md:px-8 lg:px-10 lg:py-8">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <header className="relative mb-6 overflow-hidden rounded-[24px] border border-[#dddeda] bg-[#102a2a] px-5 py-6 shadow-[0_18px_50px_rgba(16,42,42,0.10)] sm:px-7 sm:py-7 lg:px-9 lg:py-8">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/[0.05]" />

          <div className="absolute -bottom-20 right-[25%] h-44 w-44 rounded-full border border-[#c47a44]/10" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#68364b] text-white">
                  <Layers3 size={14} />
                </div>

                <span className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#c47a44] sm:text-sm">
                  Work Breakdown Structure
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">
                WBS Tree
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aab7b4] sm:text-sm">
                6-Level Work Breakdown Structure
                {projectName
                  ? ` — ${projectName}`
                  : ""}
              </p>

              {lastUpdated && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.05] px-3 py-1.5 text-[12px] font-semibold text-[#b9c4c1]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6da98d] opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#6da98d]" />
                  </span>

                  Live · {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              <button
                type="button"
                onClick={() =>
                  setExpandKey(true)
                }
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.06] px-4 text-sm font-bold text-[#d7dfdd] transition hover:bg-white/[0.10]"
              >
                <ChevronDown size={14} />
                Expand All
              </button>

              <button
                type="button"
                onClick={() =>
                  setExpandKey(false)
                }
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.06] px-4 text-sm font-bold text-[#d7dfdd] transition hover:bg-white/[0.10]"
              >
                <ChevronRight size={14} />
                Collapse All
              </button>

              <button
                type="button"
                onClick={fetchData}
                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#c47a44] px-4 text-sm font-bold text-white transition hover:bg-[#d08a55]"
              >
                <RefreshCw size={13} />
                Refresh
              </button>
            </div>
          </div>
        </header>

        {/* =====================================================
            QUICK STATS
        ===================================================== */}
        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-[18px] border border-[#dfe2de] bg-white p-4 shadow-[0_8px_30px_rgba(36,48,47,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#8b9693]">
                Total Nodes
              </span>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f2e8ec] text-[#68364b]">
                <Layers3 size={15} />
              </div>
            </div>

            <p className="mt-2 text-2xl font-extrabold text-[#24302f]">
              {loading ? "—" : totalNodes}
            </p>
          </div>

          <div className="rounded-[18px] border border-[#dfe2de] bg-white p-4 shadow-[0_8px_30px_rgba(36,48,47,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#8b9693]">
                In Progress
              </span>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf3f7] text-[#496c7d]">
                <Activity size={15} />
              </div>
            </div>

            <p className="mt-2 text-2xl font-extrabold text-[#24302f]">
              {loading ? "—" : activeNodes}
            </p>
          </div>

          <div className="rounded-[18px] border border-[#dfe2de] bg-white p-4 shadow-[0_8px_30px_rgba(36,48,47,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#8b9693]">
                Completed
              </span>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef5f1] text-[#4c7565]">
                <CircleCheck size={15} />
              </div>
            </div>

            <p className="mt-2 text-2xl font-extrabold text-[#24302f]">
              {loading ? "—" : completedNodes}
            </p>
          </div>

          <div className="rounded-[18px] border border-[#eadede] bg-white p-4 shadow-[0_8px_30px_rgba(36,48,47,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#8b9693]">
                Overdue
              </span>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fbefef] text-[#a34c4c]">
                <TriangleAlert size={15} />
              </div>
            </div>

            <p className="mt-2 text-2xl font-extrabold text-[#a34c4c]">
              {loading ? "—" : overdueNodes}
            </p>
          </div>
        </section>

        {/* =====================================================
            ERROR
        ===================================================== */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-[18px] border border-[#efd2d2] bg-[#fff7f7] p-4 text-sm text-[#a34c4c]">
            <TriangleAlert
              size={16}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-bold">
                Unable to load WBS data
              </p>

              <p className="mt-1 text-sm text-[#a96565]">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* =====================================================
            TABLE
        ===================================================== */}
        {!loading && !error && (
          <section className="overflow-hidden rounded-[22px] border border-[#dfe2de] bg-white shadow-[0_10px_35px_rgba(36,48,47,0.055)]">
            {/* TABLE HEADER */}
            <div className="flex flex-col gap-3 border-b border-[#e6e9e6] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <div className="flex items-center gap-2">
                  <Target
                    size={14}
                    className="text-[#c47a44]"
                  />

                  <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#8b9693]">
                    Project Structure
                  </p>
                </div>

                <p className="mt-1 text-sm font-bold text-[#35413f]">
                  Planned vs Actual Progress
                </p>
              </div>

              <div className="flex items-center gap-2 text-[12px] text-[#8b9693]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4c7565]" />
                Auto-updating every 10 seconds
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="border-b border-[#e4e7e4] bg-[#f7f8f6]">
                    <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#89938f]">
                      Node
                    </th>

                    <th className="px-4 py-3 text-center text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#89938f]">
                      Status
                    </th>

                    <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#89938f]">
                      Progress
                    </th>

                    <th className="px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#89938f]">
                      Actual / Planned
                    </th>

                    <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#89938f]">
                      Start
                    </th>

                    <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#89938f]">
                      End
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {tree.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-16 text-center"
                      >
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f2e8ec] text-[#68364b]">
                          <Layers3 size={22} />
                        </div>

                        <p className="mt-3 text-sm font-bold text-[#35413f]">
                          No WBS nodes found
                        </p>

                        <p className="mt-1 text-sm text-[#8b9693]">
                          No work breakdown data is
                          currently available.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    tree.map((node) => (
                      <WBSRow
                        key={`${node.id}-${expandKey}`}
                        node={node}
                        defaultExpanded={
                          expandKey
                        }
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* TABLE FOOTER */}
            <div className="flex flex-col gap-3 border-t border-[#e6e9e6] bg-[#fafbf9] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#68364b]" />
                  <span className="text-[12px] text-[#7c8582]">
                    In Progress
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#4c7565]" />
                  <span className="text-[12px] text-[#7c8582]">
                    Completed
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#a34c4c]" />
                  <span className="text-[12px] text-[#7c8582]">
                    Overdue
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#8b9693]">
                <RefreshCw size={11} />
                Live project data
              </div>
            </div>
          </section>
        )}

        {/* =====================================================
            LOADING
        ===================================================== */}
        {loading && (
          <section className="rounded-[22px] border border-[#dfe2de] bg-white p-12 text-center shadow-[0_10px_35px_rgba(36,48,47,0.04)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f2e8ec] text-[#68364b]">
              <RefreshCw
                size={20}
                className="animate-spin"
              />
            </div>

            <p className="mt-4 text-sm font-bold text-[#35413f]">
              Loading WBS tree...
            </p>

            <p className="mt-1 text-sm text-[#8b9693]">
              Fetching the latest project structure
              and progress data.
            </p>
          </section>
        )}

        {/* =====================================================
            FOOTER
        ===================================================== */}
        <footer className="mt-7 flex flex-col items-center justify-between gap-2 border-t border-[#dfe2de] py-5 text-[12px] text-[#8a9491] sm:flex-row sm:text-sm">
          <p className="font-medium">
            FieldSync Project Management
          </p>

          <div className="flex items-center gap-1.5">
            <CircleCheck
              size={12}
              className="text-[#4c7565]"
            />
            WBS data synchronized
          </div>
        </footer>
      </div>
    </div>
  );
}