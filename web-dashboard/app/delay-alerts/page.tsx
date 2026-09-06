"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Search,
  TriangleAlert,
  Clock3,
  ShieldAlert,
  AlertCircle,
  Eye,
  Activity,
  CalendarDays,
  MapPin,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { getDelayAlerts, getProjects } from "@/lib/api";

type AlertStatus = "Delayed" | "At Risk";

type BackendAlert = {
  activity_id: number;
  wbs_id: number;
  wbs_code: string;
  activity_name: string;
  planned_qty: number;
  actual_qty: number;
  progress: number;
  status: AlertStatus;
  unit: string;
};

type Activity = BackendAlert & {
  phase: string;
  owner: string;
  location: string;
  plannedEnd: string;
  currentDate: string;
  variance: number;
  reason: string;
};

export default function DelayAlertsPage() {
  const router = useRouter();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [filter, setFilter] = useState<"All" | AlertStatus>("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAlerts() {
    try {
      setLoading(true);
      setError("");

      const projs = await getProjects();

      if (!projs || projs.length === 0) {
        setActivities([]);
        setLoading(false);
        return;
      }

      const data = await getDelayAlerts(projs[0].id);

      const mappedActivities: Activity[] = (
        data?.alerts ?? []
      ).map((item: BackendAlert) => ({
        ...item,

        phase:
          item.wbs_code === "EXC-01"
            ? "Site Preparation & Earthwork"
            : "Foundation & Structural Works",

        owner: "Project Team",
        location: "Project Site",

        plannedEnd: "Not available",
        currentDate: "Current",

        variance:
          item.status === "Delayed"
            ? -Math.max(
                1,
                Math.round(100 - item.progress)
              )
            : -Math.max(
                1,
                Math.round(70 - item.progress)
              ),

        reason:
          item.status === "Delayed"
            ? "Progress is below the expected schedule"
            : "Progress requires close monitoring",
      }));

      setActivities(mappedActivities);
    } catch (err) {
      console.error(err);
      setError(
        "Failed to load delay alerts. Please check the backend."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  const delayedCount = activities.filter(
    (item) => item.status === "Delayed"
  ).length;

  const riskCount = activities.filter(
    (item) => item.status === "At Risk"
  ).length;

  const totalAlerts = activities.length;

  const filteredActivities = useMemo(() => {
    const query = search.toLowerCase().trim();

    return activities.filter((activity) => {
      const matchesFilter =
        filter === "All" || activity.status === filter;

      const matchesSearch =
        !query ||
        activity.wbs_code
          .toLowerCase()
          .includes(query) ||
        activity.activity_name
          .toLowerCase()
          .includes(query) ||
        activity.owner.toLowerCase().includes(query) ||
        activity.location.toLowerCase().includes(query) ||
        activity.phase.toLowerCase().includes(query) ||
        activity.reason.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [activities, filter, search]);

  const averageProgress =
    activities.length > 0
      ? Math.round(
          activities.reduce(
            (sum, item) => sum + Number(item.progress || 0),
            0
          ) / activities.length
        )
      : 0;

  const projectStatus =
    delayedCount > 0
      ? "At Risk"
      : riskCount > 0
      ? "Monitoring"
      : "On Track";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f6f3]">
      {/* TOP ACCENT */}
      <div className="h-1 bg-[#68364b]" />

      <div className="mx-auto max-w-[1540px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <header className="relative mb-6 overflow-hidden rounded-[26px] bg-[#102a2a] px-5 py-6 shadow-[0_18px_50px_rgba(16,42,42,0.12)] sm:px-7 sm:py-7 lg:px-9 lg:py-8">
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/[0.055]" />

          <div className="pointer-events-none absolute -bottom-36 right-[20%] h-72 w-72 rounded-full border border-[#c47a44]/[0.10]" />

          <div className="relative z-10">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="mb-6 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-[#aebbb7] transition hover:text-white sm:text-sm"
            >
              <ArrowLeft size={15} />
              Dashboard
            </button>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c47a44]" />

                  <span className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#c47a44] sm:text-sm">
                    Project Monitoring
                  </span>
                </div>

                <h1 className="text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">
                  Delay Alerts
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aebbb7] sm:text-sm">
                  Identify delayed and at-risk activities
                  before they impact the project schedule.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.045] px-3 py-2 text-[12px] font-semibold text-[#b8c3c0]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c47a44] opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c47a44]" />
                  </span>

                  Live monitoring
                </div>

                <button
                  type="button"
                  onClick={loadAlerts}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.06] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/[0.10]"
                >
                  <RefreshCw
                    size={14}
                    className={
                      loading ? "animate-spin" : ""
                    }
                  />
                  Refresh
                </button>

                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c47a44] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#b46c39]"
                >
                  <Download size={14} />
                  Export Report
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* =====================================================
            PROJECT OVERVIEW
        ===================================================== */}
        <section className="mb-5 overflow-hidden rounded-[22px] border border-[#dfe4df] bg-white shadow-[0_8px_30px_rgba(36,48,47,0.045)]">
          <div className="flex flex-col lg:flex-row lg:items-stretch">
            {/* PROJECT */}
            <div className="flex min-w-0 flex-1 items-center gap-4 px-5 py-5 sm:px-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f2e8ec] text-[#68364b]">
                <Activity size={19} />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#929c99]">
                  Active Project
                </p>

                <h2 className="mt-1 truncate text-sm font-bold text-[#24302f] sm:text-base">
                  Metro Line 3
                </h2>

                <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[#8b9693]">
                  <span>Project ID · P-001</span>
                  <span className="h-1 w-1 rounded-full bg-[#c47a44]" />
                  <span>{projectStatus}</span>
                </div>
              </div>
            </div>

            {/* METRICS */}
            <div className="grid grid-cols-3 border-t border-[#e7ebe7] lg:border-l lg:border-t-0">
              <ProjectMetric
                label="Overall Progress"
                value={`${averageProgress}%`}
                icon={<Activity size={13} />}
                className="text-[#68364b]"
              />

              <ProjectMetric
                label="Active Alerts"
                value={String(totalAlerts)}
                icon={<TriangleAlert size={13} />}
                className="text-[#b84c4c]"
              />

              <ProjectMetric
                label="Project Status"
                value={projectStatus}
                icon={<ShieldAlert size={13} />}
                className="text-[#c47a44]"
              />
            </div>
          </div>
        </section>

        {/* =====================================================
            SUMMARY CARDS
        ===================================================== */}
        <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <SummaryCard
            icon={<TriangleAlert size={19} />}
            label="Delayed Activities"
            value={delayedCount}
            description="Immediate attention required"
            iconClass="bg-[#fff0f0] text-[#b84c4c]"
            valueClass="text-[#b84c4c]"
          />

          <SummaryCard
            icon={<ShieldAlert size={19} />}
            label="At Risk Activities"
            value={riskCount}
            description="Requires close monitoring"
            iconClass="bg-[#fff5eb] text-[#c47a44]"
            valueClass="text-[#c47a44]"
          />

          <SummaryCard
            icon={<Clock3 size={19} />}
            label="Average Progress"
            value={`${averageProgress}%`}
            description="Across alerted activities"
            iconClass="bg-[#f3e9ed] text-[#68364b]"
            valueClass="text-[#68364b]"
          />

          <SummaryCard
            icon={<AlertCircle size={19} />}
            label="Total Alerts"
            value={totalAlerts}
            description="Open project alerts"
            iconClass="bg-[#edf3f2] text-[#4c7565]"
          />
        </section>

        {/* =====================================================
            ATTENTION BANNER
        ===================================================== */}
        <section className="mb-5 flex flex-col gap-4 rounded-[20px] border border-[#eadfd5] bg-[#fffaf5] p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#c47a44] text-white shadow-sm">
            <TriangleAlert size={19} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-[#24302f]">
                Schedule Attention Required
              </h3>

              {delayedCount > 0 && (
                <span className="rounded-full bg-[#fff0f0] px-2 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#b84c4c]">
                  Priority
                </span>
              )}
            </div>

            <p className="mt-1.5 text-sm leading-5 text-[#71807d]">
              <strong className="text-[#b84c4c]">
                {delayedCount}
              </strong>{" "}
              activities are currently delayed and{" "}
              <strong className="text-[#c47a44]">
                {riskCount}
              </strong>{" "}
              activities are at risk of delay. Review the
              activities below and take corrective action.
            </p>
          </div>

          <div className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-[#eadfd5] bg-white px-3 py-2 text-[12px] font-semibold text-[#8a9693] lg:flex">
            <CalendarDays size={12} />
            Schedule review
          </div>
        </section>

        {/* =====================================================
            ERROR
        ===================================================== */}
        {error && (
          <section className="mb-5 flex items-center gap-3 rounded-xl border border-[#f0caca] bg-[#fff2f2] px-4 py-3 text-sm font-medium text-[#b84c4c]">
            <AlertCircle size={16} />
            {error}
          </section>
        )}

        {/* =====================================================
            FILTER / SEARCH
        ===================================================== */}
        <section className="mb-5 rounded-[20px] border border-[#dfe4df] bg-white p-3 shadow-[0_8px_30px_rgba(36,48,47,0.035)] sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa5a2]"
              />

              <input
                type="text"
                placeholder="Search activity, owner or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10.5 w-full rounded-xl border border-[#dfe4e0] bg-[#f8faf8] pl-10 pr-4 text-sm text-[#24302f] outline-none transition placeholder:text-[#9aa5a2] focus:border-[#68364b] focus:bg-white focus:ring-4 focus:ring-[#68364b]/[0.06]"
              />
            </div>

            <div className="grid w-full grid-cols-3 gap-2 lg:flex lg:w-auto">
              {(["All", "Delayed", "At Risk"] as const).map(
                (item) => {
                  const count =
                    item === "All"
                      ? totalAlerts
                      : activities.filter(
                          (activity) =>
                            activity.status === item
                        ).length;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setFilter(item)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[12px] font-extrabold transition sm:gap-2 sm:px-4 sm:text-sm ${
                        filter === item
                          ? "bg-[#68364b] text-white shadow-sm"
                          : "bg-[#f5f7f4] text-[#71807d] hover:bg-[#ecefeb]"
                      }`}
                    >
                      {item}

                      <span
                        className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] ${
                          filter === item
                            ? "bg-white/15 text-white"
                            : "bg-white text-[#71807d] shadow-sm"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* =====================================================
            ACTIVITY ALERTS
        ===================================================== */}
        <section className="overflow-hidden rounded-[22px] border border-[#dfe4df] bg-white shadow-[0_10px_35px_rgba(36,48,47,0.05)]">
          {/* SECTION HEADER */}
          <div className="flex flex-col gap-3 border-b border-[#e5e9e5] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b84c4c]" />

                <p className="text-[12px] font-extrabold uppercase tracking-[0.17em] text-[#929c99]">
                  Alert Registry
                </p>
              </div>

              <h2 className="mt-1 text-base font-bold text-[#24302f]">
                Activity Alerts
              </h2>

              <p className="mt-1 text-sm text-[#8a9693]">
                Showing{" "}
                <strong className="text-[#35413f]">
                  {filteredActivities.length}
                </strong>{" "}
                of {totalAlerts} active alerts
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-[#e3e7e3] bg-[#f7f9f7] px-3 py-2 text-[12px] font-semibold text-[#71807d]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#b84c4c] opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#b84c4c]" />
              </span>
              Live monitoring
            </div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3e9ed] text-[#68364b]">
                <RefreshCw
                  size={20}
                  className="animate-spin"
                />
              </div>

              <p className="mt-4 text-sm font-bold text-[#35413f]">
                Loading alerts...
              </p>

              <p className="mt-1 text-sm text-[#8a9693]">
                Checking the latest project schedule.
              </p>
            </div>
          ) : (
            <>
              {/* TABLE */}
              {filteredActivities.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1180px] border-collapse">
                    <thead>
                      <tr className="border-b border-[#e5e9e5] bg-[#f7f9f7]">
                        <Th>Activity</Th>
                        <Th>Progress</Th>
                        <Th>Phase</Th>
                        <Th>Owner</Th>
                        <Th>Variance</Th>
                        <Th>Status</Th>
                        <Th>Reason</Th>
                        <Th>Action</Th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredActivities.map((activity) => {
                        const isDelayed =
                          activity.status === "Delayed";

                        const progress = Math.min(
                          100,
                          Math.max(
                            0,
                            Number(activity.progress || 0)
                          )
                        );

                        return (
                          <tr
                            key={activity.activity_id}
                            className="group border-b border-[#edf0ed] transition-colors last:border-b-0 hover:bg-[#fbfcfa]"
                          >
                            {/* ACTIVITY */}
                            <td className="px-5 py-4 align-top">
                              <div className="flex max-w-[240px] items-start gap-3">
                                <div
                                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                    isDelayed
                                      ? "bg-[#fff0f0] text-[#b84c4c]"
                                      : "bg-[#fff5eb] text-[#c47a44]"
                                  }`}
                                >
                                  <Activity size={14} />
                                </div>

                                <div className="min-w-0">
                                  <span className="text-[12px] font-extrabold uppercase tracking-wide text-[#68364b]">
                                    {activity.wbs_code}
                                  </span>

                                  <p className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-[#24302f]">
                                    {activity.activity_name}
                                  </p>

                                  <p className="mt-1 text-[11px] text-[#929c99]">
                                    Activity ID:{" "}
                                    {activity.activity_id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* PROGRESS */}
                            <td className="px-5 py-4 align-top">
                              <div className="w-[125px]">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-extrabold text-[#24302f]">
                                    {progress}%
                                  </span>

                                  <span className="text-[11px] text-[#929c99]">
                                    {activity.actual_qty}/
                                    {activity.planned_qty}
                                  </span>
                                </div>

                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e8ece8]">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      isDelayed
                                        ? "bg-[#b84c4c]"
                                        : "bg-[#c47a44]"
                                    }`}
                                    style={{
                                      width: `${progress}%`,
                                    }}
                                  />
                                </div>

                                <p className="mt-1 text-[11px] text-[#a0aaa7]">
                                  Unit: {activity.unit || "—"}
                                </p>
                              </div>
                            </td>

                            {/* PHASE */}
                            <td className="px-5 py-4 align-top">
                              <span className="block max-w-[180px] text-sm leading-5 text-[#52605e]">
                                {activity.phase}
                              </span>
                            </td>

                            {/* OWNER */}
                            <td className="px-5 py-4 align-top">
                              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#f5f7f4] px-2.5 py-1.5 text-[12px] font-semibold text-[#52605e]">
                                <ShieldAlert
                                  size={11}
                                  className="text-[#8b9693]"
                                />
                                {activity.owner}
                              </span>
                            </td>

                            {/* VARIANCE */}
                            <td className="px-5 py-4 align-top">
                              <span className="inline-flex whitespace-nowrap rounded-lg border border-[#f1d7d7] bg-[#fff3f3] px-2.5 py-1.5 text-[12px] font-extrabold text-[#b84c4c]">
                                {Math.abs(
                                  activity.variance
                                )}{" "}
                                days
                              </span>
                            </td>

                            {/* STATUS */}
                            <td className="px-5 py-4 align-top">
                              <span
                                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wide ${
                                  isDelayed
                                    ? "border-[#f1d5d5] bg-[#fff0f0] text-[#b84c4c]"
                                    : "border-[#f0dcc8] bg-[#fff5eb] text-[#c47a44]"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    isDelayed
                                      ? "bg-[#b84c4c]"
                                      : "bg-[#c47a44]"
                                  }`}
                                />

                                {activity.status}
                              </span>
                            </td>

                            {/* REASON */}
                            <td className="px-5 py-4 align-top">
                              <span className="block max-w-[220px] text-sm leading-5 text-[#65716e]">
                                {activity.reason}
                              </span>
                            </td>

                            {/* ACTION */}
                            <td className="px-5 py-4 align-top">
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/wbs/activity/${activity.activity_id}`
                                  )
                                }
                                className="group/button inline-flex items-center gap-1.5 rounded-lg border border-[#dddeda] bg-white px-3 py-2 text-[12px] font-extrabold text-[#68364b] transition hover:border-[#68364b] hover:bg-[#f8f3f5]"
                              >
                                <Eye size={13} />

                                View

                                <ChevronRight
                                  size={11}
                                  className="transition-transform group-hover/button:translate-x-0.5"
                                />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* EMPTY */}
              {filteredActivities.length === 0 && (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2e8ec] text-[#68364b]">
                    <Search size={22} />
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-[#24302f]">
                    No alerts found
                  </h3>

                  <p className="mt-1 max-w-sm text-sm leading-5 text-[#8a9693]">
                    Try changing the search text or status
                    filter.
                  </p>
                </div>
              )}
            </>
          )}

          {/* TABLE FOOTER */}
          {!loading && filteredActivities.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-[#e5e9e5] bg-[#fafbf9] px-4 py-3.5 text-[12px] text-[#8a9693] sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-center gap-1.5">
                <MapPin
                  size={11}
                  className="text-[#9aa3a0]"
                />
                Monitoring project activity schedule
              </div>

              <div className="flex items-center gap-1.5">
                <Clock3 size={11} />
                {filteredActivities.length} visible alerts
              </div>
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="mt-6 flex flex-col gap-2 border-t border-[#dfe4df] pt-5 text-[12px] text-[#8a9693] sm:flex-row sm:items-center sm:justify-between sm:text-sm">
          <span>Live data from PostgreSQL</span>

          <span>
            Monitoring {totalAlerts} active alerts
          </span>
        </footer>
      </div>
    </main>
  );
}

/* =========================================================
   PROJECT METRIC
========================================================= */

function ProjectMetric({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  className: string;
}) {
  return (
    <div className="min-w-0 border-l border-[#e7ebe7] px-3 py-4 sm:px-5">
      <div className="flex items-center gap-1.5">
        <span className={className}>{icon}</span>

        <p className="truncate text-[7px] font-extrabold uppercase tracking-[0.1em] text-[#929c99] sm:text-[11px]">
          {label}
        </p>
      </div>

      <p
        className={`mt-1.5 truncate text-base font-extrabold sm:text-lg ${className}`}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon,
  label,
  value,
  description,
  iconClass,
  valueClass = "text-[#24302f]",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  description: string;
  iconClass: string;
  valueClass?: string;
}) {
  return (
    <div className="min-w-0 rounded-[19px] border border-[#dfe4df] bg-white p-4 shadow-[0_8px_28px_rgba(36,48,47,0.035)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#dfe4df]" />
      </div>

      <p className="mt-4 truncate text-[12px] font-semibold text-[#8b9693] sm:text-sm">
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl ${valueClass}`}
      >
        {value}
      </p>

      <p className="mt-1 text-[11px] leading-4 text-[#929c99] sm:text-[12px]">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   TABLE HEADER
========================================================= */

function Th({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-5 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#89938f]">
      {children}
    </th>
  );
}