"use client";

import {
  Activity,
  Camera,
  CheckCircle2,
  Clock3,
  FileCheck2,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { getSubmissions } from "@/lib/api";

export default function FieldEvidencePage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getSubmissions()
      .then((data) => {
        setSubs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setSubs([]);
        setLoading(false);
      });
  }, []);

  const filteredSubs = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return subs;

    return subs.filter((s) => {
      return (
        String(s.wbs_node_name || "")
          .toLowerCase()
          .includes(query) ||
        String(s.notes || "")
          .toLowerCase()
          .includes(query) ||
        String(s.sync_status || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [subs, search]);

  const syncedCount = subs.filter(
    (s) =>
      String(s.sync_status || "SYNCED").toUpperCase() ===
      "SYNCED"
  ).length;

  const pendingCount = subs.filter(
    (s) =>
      String(s.sync_status || "").toUpperCase() !==
      "SYNCED"
  ).length;

  const averageProgress =
    subs.length > 0
      ? subs.reduce(
          (sum, s) =>
            sum + Number(s.pct_complete || 0),
          0
        ) / subs.length
      : 0;

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

          <div className="absolute -bottom-24 right-[28%] h-52 w-52 rounded-full border border-[#c47a44]/10" />

          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#68364b] text-white">
                  <Camera size={14} />
                </div>

                <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#c47a44] sm:text-[10px]">
                  Field Operations
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">
                Field Evidence
              </h1>

              <p className="mt-2 max-w-xl text-xs leading-6 text-[#aab7b4] sm:text-sm">
                Review field submissions, progress updates,
                captured locations and synchronization status.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.05] px-3 py-2 text-[9px] font-semibold text-[#c4cecb]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6da98d] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#6da98d]" />
              </span>

              Field data connected
            </div>
          </div>
        </header>

        {/* =====================================================
            SUMMARY
        ===================================================== */}
        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-[18px] border border-[#dfe2de] bg-white p-4 shadow-[0_8px_30px_rgba(36,48,47,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8b9693]">
                Submissions
              </span>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f2e8ec] text-[#68364b]">
                <FileCheck2 size={15} />
              </div>
            </div>

            <p className="mt-2 text-2xl font-extrabold text-[#24302f]">
              {loading ? "—" : subs.length}
            </p>

            <p className="mt-1 text-[9px] text-[#8b9693]">
              Field records received
            </p>
          </div>

          <div className="rounded-[18px] border border-[#dfe2de] bg-white p-4 shadow-[0_8px_30px_rgba(36,48,47,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8b9693]">
                Synced
              </span>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef5f1] text-[#4c7565]">
                <ShieldCheck size={15} />
              </div>
            </div>

            <p className="mt-2 text-2xl font-extrabold text-[#24302f]">
              {loading ? "—" : syncedCount}
            </p>

            <p className="mt-1 text-[9px] text-[#8b9693]">
              Successfully synchronized
            </p>
          </div>

          <div className="rounded-[18px] border border-[#dfe2de] bg-white p-4 shadow-[0_8px_30px_rgba(36,48,47,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8b9693]">
                Avg. Progress
              </span>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf3f7] text-[#496c7d]">
                <Activity size={15} />
              </div>
            </div>

            <p className="mt-2 text-2xl font-extrabold text-[#24302f]">
              {loading
                ? "—"
                : `${averageProgress.toFixed(0)}%`}
            </p>

            <p className="mt-1 text-[9px] text-[#8b9693]">
              Across submitted evidence
            </p>
          </div>

          <div className="rounded-[18px] border border-[#eadede] bg-white p-4 shadow-[0_8px_30px_rgba(36,48,47,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8b9693]">
                Pending
              </span>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff4e8] text-[#a85f2e]">
                <Clock3 size={15} />
              </div>
            </div>

            <p className="mt-2 text-2xl font-extrabold text-[#a85f2e]">
              {loading ? "—" : pendingCount}
            </p>

            <p className="mt-1 text-[9px] text-[#8b9693]">
              Awaiting synchronization
            </p>
          </div>
        </section>

        {/* =====================================================
            TOOLBAR
        ===================================================== */}
        <section className="mb-5 rounded-[20px] border border-[#dfe2de] bg-white p-3 shadow-[0_8px_30px_rgba(36,48,47,0.035)] sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c47a44]" />

                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#8b9693]">
                  Evidence Registry
                </p>
              </div>

              <p className="mt-1 text-xs font-bold text-[#35413f]">
                Captured field submissions
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa3a0]"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search evidence..."
                className="h-10 w-full rounded-xl border border-[#e2e5e2] bg-[#f8f9f7] pl-10 pr-4 text-[10px] text-[#35413f] outline-none transition placeholder:text-[#9aa3a0] focus:border-[#68364b] focus:bg-white focus:ring-4 focus:ring-[#68364b]/[0.06]"
              />
            </div>
          </div>
        </section>

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
              Loading field evidence...
            </p>

            <p className="mt-1 text-[10px] text-[#8b9693]">
              Fetching the latest field submissions.
            </p>
          </section>
        )}

        {/* =====================================================
            EMPTY
        ===================================================== */}
        {!loading && filteredSubs.length === 0 && (
          <section className="rounded-[22px] border border-dashed border-[#d4d9d5] bg-white p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2e8ec] text-[#68364b]">
              <Camera size={24} />
            </div>

            <p className="mt-4 text-sm font-bold text-[#35413f]">
              No field evidence found
            </p>

            <p className="mt-1 text-[10px] text-[#8b9693]">
              No submissions match the current search.
            </p>
          </section>
        )}

        {/* =====================================================
            EVIDENCE TABLE
        ===================================================== */}
        {!loading && filteredSubs.length > 0 && (
          <section className="overflow-hidden rounded-[22px] border border-[#dfe2de] bg-white shadow-[0_10px_35px_rgba(36,48,47,0.055)]">
            {/* TABLE HEADER */}
            <div className="flex flex-col gap-2 border-b border-[#e6e9e6] bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#8b9693]">
                  Submission Activity
                </p>

                <p className="mt-1 text-xs font-bold text-[#35413f]">
                  {filteredSubs.length} evidence record
                  {filteredSubs.length !== 1
                    ? "s"
                    : ""}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[9px] text-[#8b9693]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4c7565]" />
                Live field records
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead>
                  <tr className="border-b border-[#e4e7e4] bg-[#f7f8f6]">
                    <th className="px-4 py-3 text-[8px] font-extrabold uppercase tracking-[0.13em] text-[#89938f]">
                      Activity
                    </th>

                    <th className="px-4 py-3 text-[8px] font-extrabold uppercase tracking-[0.13em] text-[#89938f]">
                      Progress
                    </th>

                    <th className="px-4 py-3 text-[8px] font-extrabold uppercase tracking-[0.13em] text-[#89938f]">
                      Notes
                    </th>

                    <th className="px-4 py-3 text-[8px] font-extrabold uppercase tracking-[0.13em] text-[#89938f]">
                      Location
                    </th>

                    <th className="px-4 py-3 text-[8px] font-extrabold uppercase tracking-[0.13em] text-[#89938f]">
                      Sync Status
                    </th>

                    <th className="px-4 py-3 text-[8px] font-extrabold uppercase tracking-[0.13em] text-[#89938f]">
                      Captured At
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSubs.map((s) => {
                    const progress = Math.min(
                      100,
                      Math.max(
                        0,
                        Number(s.pct_complete || 0)
                      )
                    );

                    const syncStatus =
                      s.sync_status || "SYNCED";

                    const isSynced =
                      String(syncStatus).toUpperCase() ===
                      "SYNCED";

                    return (
                      <tr
                        key={s.id}
                        className="group border-b border-[#ecefed] transition-colors last:border-b-0 hover:bg-[#fafbf9]"
                      >
                        {/* ACTIVITY */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f2e8ec] text-[#68364b] transition group-hover:bg-[#68364b] group-hover:text-white">
                              <Activity size={15} />
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[220px] truncate text-[10px] font-bold text-[#35413f]">
                                {s.wbs_node_name ||
                                  "Unknown Node"}
                              </p>

                              <p className="mt-0.5 text-[8px] text-[#9aa3a0]">
                                Field submission
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* PROGRESS */}
                        <td className="px-4 py-4">
                          <div className="flex min-w-[130px] items-center gap-2.5">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e5e8e5]">
                              <div
                                className="h-full rounded-full bg-[#68364b]"
                                style={{
                                  width: `${progress}%`,
                                }}
                              />
                            </div>

                            <span className="w-9 text-right text-[10px] font-extrabold text-[#35413f]">
                              {progress}%
                            </span>
                          </div>
                        </td>

                        {/* NOTES */}
                        <td className="max-w-[260px] px-4 py-4">
                          <p
                            className="truncate text-[10px] text-[#697572]"
                            title={s.notes || ""}
                          >
                            {s.notes || "—"}
                          </p>
                        </td>

                        {/* LOCATION */}
                        <td className="px-4 py-4">
                          {s.gps_lat && s.gps_lng ? (
                            <a
                              href={`https://maps.google.com/?q=${s.gps_lat},${s.gps_lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfe4e1] bg-[#f7f9f7] px-2.5 py-1.5 text-[9px] font-bold text-[#496c64] transition hover:border-[#b9cbc3] hover:bg-[#eef5f1]"
                            >
                              <MapPin size={11} />
                              View Map
                            </a>
                          ) : (
                            <span className="text-[9px] text-[#9aa3a0]">
                              —
                            </span>
                          )}
                        </td>

                        {/* SYNC */}
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[8px] font-extrabold tracking-wide ${
                              isSynced
                                ? "border-[#d5e8dc] bg-[#eef7f1] text-[#47745e]"
                                : "border-[#f0dcc7] bg-[#fff5e9] text-[#a85f2e]"
                            }`}
                          >
                            {isSynced ? (
                              <CheckCircle2 size={10} />
                            ) : (
                              <Clock3 size={10} />
                            )}

                            {String(syncStatus).toUpperCase()}
                          </span>
                        </td>

                        {/* CAPTURED */}
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex items-center gap-1.5 text-[9px] font-medium text-[#788380]">
                            <Clock3
                              size={11}
                              className="text-[#9aa3a0]"
                            />

                            {s.captured_at
                              ? new Date(
                                  s.captured_at
                                ).toLocaleString()
                              : "—"}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* TABLE FOOTER */}
            <div className="flex flex-col gap-3 border-t border-[#e6e9e6] bg-[#fafbf9] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-center gap-2 text-[9px] text-[#8b9693]">
                <ShieldCheck
                  size={12}
                  className="text-[#4c7565]"
                />
                Field submissions synchronized with project
                records
              </div>

              <div className="flex items-center gap-1.5 text-[9px] font-medium text-[#8b9693]">
                <RefreshCw size={11} />
                {filteredSubs.length} visible records
              </div>
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer className="mt-7 flex flex-col items-center justify-between gap-2 border-t border-[#dfe2de] py-5 text-[9px] text-[#8a9491] sm:flex-row sm:text-[10px]">
          <p className="font-medium">
            FieldSync Project Management
          </p>

          <div className="flex items-center gap-1.5">
            <CheckCircle2
              size={12}
              className="text-[#4c7565]"
            />
            Field evidence synchronized
          </div>
        </footer>
      </div>
    </div>
  );
}