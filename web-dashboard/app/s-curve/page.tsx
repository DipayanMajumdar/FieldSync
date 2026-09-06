"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getSubmissions } from "@/lib/api";

type SCurvePoint = {
  week: string;
  planned: number;
  actual: number;
};

export default function SCurvePage() {
  const [data, setData] = useState<SCurvePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSubmissions()
      .then(() => {
        const mock: SCurvePoint[] = [
          { week: "Week 1", planned: 10, actual: 5 },
          { week: "Week 2", planned: 25, actual: 15 },
          { week: "Week 3", planned: 45, actual: 30 },
          { week: "Week 4", planned: 70, actual: 50 },
          { week: "Week 5", planned: 100, actual: 75 },
        ];

        setData(mock);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const latest = data[data.length - 1];

  const currentVariance = useMemo(() => {
    if (!latest) return 0;
    return latest.actual - latest.planned;
  }, [latest]);

  const plannedAverage = useMemo(() => {
    if (!data.length) return 0;

    return Math.round(
      data.reduce((sum, item) => sum + item.planned, 0) /
        data.length
    );
  }, [data]);

  const actualAverage = useMemo(() => {
    if (!data.length) return 0;

    return Math.round(
      data.reduce((sum, item) => sum + item.actual, 0) /
        data.length
    );
  }, [data]);

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

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#68364b] text-white">
                  <TrendingUp size={14} />
                </div>

                <span className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#c47a44] sm:text-sm">
                  Project Analytics
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">
                Progress S-Curve
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aebbb7] sm:text-sm">
                Compare planned project progress against
                actual field performance across the reporting
                timeline.
              </p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.045] px-3 py-2 text-[12px] font-semibold text-[#b8c3c0]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6da98d] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#6da98d]" />
              </span>

              Progress tracking active
            </div>
          </div>
        </header>

        {/* =====================================================
            SUMMARY
        ===================================================== */}
        <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <MetricCard
            icon={<BarChart3 size={18} />}
            label="Latest Planned"
            value={latest ? `${latest.planned}%` : "—"}
            description="Current planned progress"
            iconClass="bg-[#f0f2f1] text-[#697572]"
            valueClass="text-[#4f5b58]"
          />

          <MetricCard
            icon={<Activity size={18} />}
            label="Latest Actual"
            value={latest ? `${latest.actual}%` : "—"}
            description="Current actual progress"
            iconClass="bg-[#f3e9ed] text-[#68364b]"
            valueClass="text-[#68364b]"
          />

          <MetricCard
            icon={<TrendingUp size={18} />}
            label="Progress Variance"
            value={
              latest
                ? `${currentVariance > 0 ? "+" : ""}${currentVariance}%`
                : "—"
            }
            description="Actual vs planned"
            iconClass="bg-[#fff5eb] text-[#c47a44]"
            valueClass={
              currentVariance < 0
                ? "text-[#b84c4c]"
                : "text-[#4c7565]"
            }
          />

          <MetricCard
            icon={<Clock3 size={18} />}
            label="Reporting Period"
            value={latest ? latest.week : "—"}
            description="Latest available period"
            iconClass="bg-[#edf3f2] text-[#4c7565]"
            valueClass="text-[#4c7565]"
          />
        </section>

        {/* =====================================================
            CHART CARD
        ===================================================== */}
        <section className="overflow-hidden rounded-[22px] border border-[#dfe4df] bg-white shadow-[0_10px_35px_rgba(36,48,47,0.055)]">
          {/* CHART HEADER */}
          <div className="flex flex-col gap-4 border-b border-[#e5e9e5] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-7">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#68364b]" />

                <p className="text-[12px] font-extrabold uppercase tracking-[0.17em] text-[#929c99]">
                  Schedule Performance
                </p>
              </div>

              <h2 className="mt-1 text-base font-bold text-[#24302f]">
                Planned vs Actual Progress
              </h2>

              <p className="mt-1 text-sm leading-5 text-[#8a9693]">
                Cumulative project progress over the reporting
                period.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <LegendBadge
                lineClass="bg-[#9aa19f]"
                label="Planned %"
              />

              <LegendBadge
                lineClass="bg-[#68364b]"
                label="Actual %"
              />
            </div>
          </div>

          {/* CHART */}
          <div className="px-3 py-5 sm:px-5 sm:py-6 lg:px-7">
            {loading ? (
              <div className="flex h-[390px] flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3e9ed] text-[#68364b]">
                  <RefreshCw
                    size={20}
                    className="animate-spin"
                  />
                </div>

                <p className="mt-4 text-sm font-bold text-[#35413f]">
                  Loading chart...
                </p>

                <p className="mt-1 text-sm text-[#8a9693]">
                  Preparing project progress data.
                </p>
              </div>
            ) : (
              <div className="h-[390px] w-full sm:h-[450px]">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart
                    data={data}
                    margin={{
                      top: 12,
                      right: 18,
                      left: 0,
                      bottom: 8,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 5"
                      vertical={false}
                      stroke="#e5e9e5"
                    />

                    <XAxis
                      dataKey="week"
                      stroke="#8b9693"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{
                        stroke: "#dfe4df",
                      }}
                      dy={10}
                    />

                    <YAxis
                      stroke="#8b9693"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                      tickFormatter={(value) =>
                        `${value}%`
                      }
                      width={42}
                    />

                    <Tooltip
                      cursor={{
                        stroke: "#b8c0bd",
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                      }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #dfe4df",
                        backgroundColor: "#ffffff",
                        boxShadow:
                          "0 12px 30px rgba(36,48,47,0.10)",
                        fontSize: "11px",
                      }}
                      labelStyle={{
                        color: "#24302f",
                        fontWeight: 700,
                        marginBottom: "4px",
                      }}
                      formatter={(value, name) => [
                        `${value}%`,
                        name,
                      ]}
                    />

                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: "10px",
                        paddingTop: "18px",
                        color: "#71807d",
                      }}
                    />

                    <Line
                      type="monotone"
                      name="Planned %"
                      dataKey="planned"
                      stroke="#9aa19f"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{
                        r: 5,
                        strokeWidth: 2,
                      }}
                    />

                    <Line
                      type="monotone"
                      name="Actual %"
                      dataKey="actual"
                      stroke="#68364b"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 6,
                        strokeWidth: 2,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* CHART FOOTER */}
          {!loading && data.length > 0 && (
            <div className="grid grid-cols-1 border-t border-[#e5e9e5] bg-[#fafbf9] sm:grid-cols-3">
              <ChartInsight
                label="Planned Average"
                value={`${plannedAverage}%`}
              />

              <ChartInsight
                label="Actual Average"
                value={`${actualAverage}%`}
              />

              <ChartInsight
                label="Current Gap"
                value={`${Math.abs(currentVariance)}%`}
                valueClass={
                  currentVariance < 0
                    ? "text-[#b84c4c]"
                    : "text-[#4c7565]"
                }
              />
            </div>
          )}
        </section>

        {/* =====================================================
            INTERPRETATION
        ===================================================== */}
        {!loading && latest && (
          <section className="mt-5 rounded-[20px] border border-[#dfe4df] bg-white p-5 shadow-[0_8px_28px_rgba(36,48,47,0.035)] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3e9ed] text-[#68364b]">
                <Activity size={17} />
              </div>

              <div className="min-w-0">
                <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#929c99]">
                  Curve Interpretation
                </p>

                <h3 className="mt-1 text-sm font-bold text-[#24302f]">
                  Current schedule position
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#71807d]">
                  Actual progress is currently{" "}
                  <strong
                    className={
                      currentVariance < 0
                        ? "text-[#b84c4c]"
                        : "text-[#4c7565]"
                    }
                  >
                    {Math.abs(currentVariance)} percentage
                    points{" "}
                    {currentVariance < 0
                      ? "behind"
                      : "ahead of"}
                  </strong>{" "}
                  the planned progress for the latest
                  reporting period.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* =====================================================
            FOOTER
        ===================================================== */}
        <footer className="mt-6 flex flex-col gap-2 border-t border-[#dfe4df] pt-5 text-[12px] text-[#8a9693] sm:flex-row sm:items-center sm:justify-between sm:text-sm">
          <div className="flex items-center gap-1.5">
            <CheckCircle2
              size={12}
              className="text-[#4c7565]"
            />
            Progress analytics available
          </div>

          <span>
            {data.length > 0
              ? `${data.length} reporting periods`
              : "No reporting periods"}
          </span>
        </footer>
      </div>
    </main>
  );
}

/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({
  icon,
  label,
  value,
  description,
  iconClass,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  iconClass: string;
  valueClass: string;
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
        className={`mt-1 truncate text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl ${valueClass}`}
      >
        {value}
      </p>

      <p className="mt-1 truncate text-[11px] leading-4 text-[#929c99] sm:text-[12px]">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   LEGEND BADGE
========================================================= */

function LegendBadge({
  lineClass,
  label,
}: {
  lineClass: string;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#e1e6e2] bg-[#f8faf8] px-3 py-2">
      <span
        className={`h-1.5 w-5 rounded-full ${lineClass}`}
      />

      <span className="text-[11px] font-bold text-[#71807d]">
        {label}
      </span>
    </div>
  );
}

/* =========================================================
   CHART INSIGHT
========================================================= */

function ChartInsight({
  label,
  value,
  valueClass = "text-[#24302f]",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="border-b border-[#e5e9e5] px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#929c99]">
        {label}
      </p>

      <p
        className={`mt-1 text-base font-extrabold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}