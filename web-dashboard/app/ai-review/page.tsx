"use client";

import { useEffect, useMemo, useState } from "react";
import {
  approveAISuggestion,
  getAIQueue,
  rejectAISuggestion,
} from "@/lib/api";
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  RefreshCw,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

type AIQueueItem = {
  id: number;
  suggestion_type?: string | null;
  model_name?: string | null;
  confidence?: number | null;
  suggested_pct_complete?: number | null;
  suggested_notes?: string | null;
  created_at?: string | null;
  status?: string | null;
};

export default function AIReviewPage() {
  const router = useRouter();

  const [queue, setQueue] = useState<AIQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(
    null
  );
  const [filter, setFilter] = useState<
    "all" | "high" | "medium" | "low"
  >("all");

  const load = async (manual = false) => {
    if (manual) setRefreshing(true);

    try {
      const data = await getAIQueue();
      setQueue(Array.isArray(data) ? data : []);
    } catch {
      setQueue([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();

    const interval = setInterval(() => {
      load();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (id: number) => {
    try {
      setProcessingId(id);
      await approveAISuggestion(id);
      await load();
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt("Reason for rejection?");

    if (!reason?.trim()) return;

    try {
      setProcessingId(id);
      await rejectAISuggestion(id, reason.trim());
      await load();
    } finally {
      setProcessingId(null);
    }
  };

  const getConfidence = (confidence?: number | null) => {
    const value = Number(confidence ?? 0);

    if (value <= 1) return value * 100;

    return value;
  };

  const stats = useMemo(() => {
    const confidences = queue.map((item) =>
      getConfidence(item.confidence)
    );

    const high = confidences.filter((value) => value >= 80).length;
    const medium = confidences.filter(
      (value) => value >= 60 && value < 80
    ).length;
    const low = confidences.filter((value) => value < 60).length;

    const average =
      confidences.length > 0
        ? Math.round(
            confidences.reduce((sum, value) => sum + value, 0) /
              confidences.length
          )
        : 0;

    return {
      total: queue.length,
      high,
      medium,
      low,
      average,
    };
  }, [queue]);

  const filteredQueue = useMemo(() => {
    if (filter === "all") return queue;

    return queue.filter((item) => {
      const confidence = getConfidence(item.confidence);

      if (filter === "high") return confidence >= 80;
      if (filter === "medium")
        return confidence >= 60 && confidence < 80;

      return confidence < 60;
    });
  }, [queue, filter]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f6f3]">
      <div className="h-1 bg-[#68364b]" />

      <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <header className="relative mb-6 overflow-hidden rounded-[26px] bg-[#102a2a] px-5 py-6 shadow-[0_18px_50px_rgba(16,42,42,0.13)] sm:px-7 sm:py-7 lg:px-9 lg:py-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/[0.06]" />

          <div className="pointer-events-none absolute -bottom-32 right-[20%] h-64 w-64 rounded-full border border-[#c47a44]/10" />

          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#68364b] text-white">
                  <Bot size={14} />
                </div>

                <span className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#c47a44] sm:text-sm">
                  Intelligent Review
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">
                  AI Review Queue
                </h1>

                {!loading && (
                  <span className="rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-[12px] font-bold text-[#c7d1ce]">
                    {queue.length} pending
                  </span>
                )}
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aebbb7] sm:text-sm">
                Review AI-generated progress suggestions before they
                are applied to project records.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              <button
                onClick={() => load(true)}
                disabled={refreshing}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={14}
                  className={
                    refreshing ? "animate-spin" : ""
                  }
                />
                Refresh Queue
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
            STATS
        ===================================================== */}
        <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <StatCard
            icon={Clock3}
            label="Pending Review"
            value={loading ? "—" : stats.total}
            accent="burgundy"
          />

          <StatCard
            icon={CheckCircle2}
            label="High Confidence"
            value={loading ? "—" : stats.high}
            accent="green"
          />

          <StatCard
            icon={AlertCircle}
            label="Medium Confidence"
            value={loading ? "—" : stats.medium}
            accent="orange"
          />

          <StatCard
            icon={Sparkles}
            label="Average Confidence"
            value={loading ? "—" : `${stats.average}%`}
            accent="teal"
          />
        </section>

        {/* =====================================================
            REVIEW AREA
        ===================================================== */}
        <section className="overflow-hidden rounded-[22px] border border-[#dfe4df] bg-white shadow-[0_10px_35px_rgba(36,48,47,0.045)]">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-[#e5e9e5] px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3e9ed] text-[#68364b]">
                <FileCheck2 size={18} />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#c47a44]">
                  Human Validation
                </p>

                <h2 className="mt-0.5 text-base font-bold text-[#24302f]">
                  Suggestions Awaiting Review
                </h2>
              </div>
            </div>

            <div className="flex w-full overflow-x-auto rounded-xl border border-[#dfe4df] bg-[#f7f8f6] p-1 lg:w-fit">
              <FilterButton
                active={filter === "all"}
                onClick={() => setFilter("all")}
                label={`All ${stats.total}`}
              />

              <FilterButton
                active={filter === "high"}
                onClick={() => setFilter("high")}
                label={`High ${stats.high}`}
              />

              <FilterButton
                active={filter === "medium"}
                onClick={() => setFilter("medium")}
                label={`Medium ${stats.medium}`}
              />

              <FilterButton
                active={filter === "low"}
                onClick={() => setFilter("low")}
                label={`Low ${stats.low}`}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {loading ? (
              <LoadingState />
            ) : filteredQueue.length === 0 ? (
              <EmptyState
                filtered={filter !== "all"}
                onReset={() => setFilter("all")}
              />
            ) : (
              <div className="grid gap-4">
                {filteredQueue.map((item) => (
                  <SuggestionCard
                    key={item.id}
                    item={item}
                    confidence={getConfidence(item.confidence)}
                    processing={processingId === item.id}
                    onApprove={() => handleApprove(item.id)}
                    onReject={() => handleReject(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

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
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent: "burgundy" | "green" | "orange" | "teal";
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
    teal: {
      icon: "bg-[#e9f1ef] text-[#315f5a]",
      value: "text-[#315f5a]",
    },
  };

  return (
    <div className="rounded-[18px] border border-[#dfe4df] bg-white p-4 shadow-[0_7px_25px_rgba(36,48,47,0.035)] sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles[accent].icon}`}
        >
          <Icon size={16} />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9aa29f]">
          AI
        </span>
      </div>

      <div className="mt-4">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[#78837f] sm:text-sm">
          {label}
        </p>

        <p
          className={`mt-1 text-2xl font-extrabold tracking-tight ${styles[accent].value}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   FILTER BUTTON
========================================================= */

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold transition ${
        active
          ? "bg-[#102a2a] text-white shadow-sm"
          : "text-[#697572] hover:bg-white hover:text-[#24302f]"
      }`}
    >
      {label}
    </button>
  );
}

/* =========================================================
   SUGGESTION CARD
========================================================= */

function SuggestionCard({
  item,
  confidence,
  processing,
  onApprove,
  onReject,
}: {
  item: AIQueueItem;
  confidence: number;
  processing: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const confidenceTone =
    confidence >= 80
      ? {
          label: "High confidence",
          bg: "bg-[#edf7f0]",
          text: "text-[#2f7d4a]",
          bar: "bg-[#4c8b62]",
        }
      : confidence >= 60
        ? {
            label: "Medium confidence",
            bg: "bg-[#fbf1e8]",
            text: "text-[#b56832]",
            bar: "bg-[#c47a44]",
          }
        : {
            label: "Low confidence",
            bg: "bg-[#f8ecec]",
            text: "text-[#b84e4e]",
            bar: "bg-[#b84e4e]",
          };

  return (
    <article className="group overflow-hidden rounded-[18px] border border-[#e1e6e2] bg-[#fcfdfb] transition hover:border-[#cfc5c9] hover:shadow-[0_10px_30px_rgba(36,48,47,0.06)]">
      <div className="h-1 bg-[#68364b]" />

      <div className="p-4 sm:p-5 lg:p-6">
        {/* Top */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-[#f3e9ed] px-2.5 py-1.5 text-[12px] font-extrabold uppercase tracking-wide text-[#68364b]">
                {item.suggestion_type || "AI Suggestion"}
              </span>

              <span
                className={`rounded-full px-2.5 py-1.5 text-[12px] font-bold ${confidenceTone.bg} ${confidenceTone.text}`}
              >
                {confidenceTone.label}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#7b8582]">
              <span className="font-semibold text-[#52605d]">
                {item.model_name || "AI Model"}
              </span>

              <span className="text-[#c0c6c3]">•</span>

              <span>
                Confidence {Math.round(confidence)}%
              </span>

              {item.created_at && (
                <>
                  <span className="text-[#c0c6c3]">•</span>

                  <span>
                    {formatDate(item.created_at)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Desktop actions */}
          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <button
              onClick={onReject}
              disabled={processing}
              className="flex items-center gap-2 rounded-xl border border-[#ead4d4] bg-white px-4 py-2.5 text-sm font-bold text-[#b84e4e] transition hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <XCircle size={14} />
              Reject
            </button>

            <button
              onClick={onApprove}
              disabled={processing}
              className="flex items-center gap-2 rounded-xl bg-[#68364b] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-[#68364b]/15 transition hover:bg-[#592d40] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing ? (
                <RefreshCw
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <CheckCircle2 size={14} />
              )}
              Approve
            </button>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-[12px] font-semibold text-[#7b8582]">
            <span>Model confidence</span>
            <span>{Math.round(confidence)}%</span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-[#e9ece9]">
            <div
              className={`h-full rounded-full transition-all ${confidenceTone.bar}`}
              style={{
                width: `${Math.min(Math.max(confidence, 0), 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Suggested progress */}
        {item.suggested_pct_complete !== null &&
          item.suggested_pct_complete !== undefined && (
            <div className="mt-5 rounded-xl border border-[#e3e8e4] bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#929b98]">
                    Suggested Progress
                  </p>

                  <p className="mt-1 text-2xl font-extrabold tracking-tight text-[#24302f]">
                    {item.suggested_pct_complete}%
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9f1ef] text-[#315f5a]">
                  <Sparkles size={18} />
                </div>
              </div>
            </div>
          )}

        {/* Notes */}
        {item.suggested_notes && (
          <div className="mt-4 rounded-xl border-l-2 border-[#c47a44] bg-[#fbf7f3] px-4 py-3.5">
            <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#b56832]">
              AI Observation
            </p>

            <p className="text-sm leading-5 text-[#596461]">
              “{item.suggested_notes}”
            </p>
          </div>
        )}

        {/* Mobile actions */}
        <div className="mt-5 grid grid-cols-2 gap-2 lg:hidden">
          <button
            onClick={onReject}
            disabled={processing}
            className="flex items-center justify-center gap-2 rounded-xl border border-[#ead4d4] bg-white px-3 py-2.5 text-sm font-bold text-[#b84e4e] transition hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <XCircle size={14} />
            Reject
          </button>

          <button
            onClick={onApprove}
            disabled={processing}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#68364b] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[#592d40] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing ? (
              <RefreshCw
                size={14}
                className="animate-spin"
              />
            ) : (
              <CheckCircle2 size={14} />
            )}
            Approve
          </button>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingState() {
  return (
    <div className="grid gap-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-[18px] border border-[#e1e6e2] bg-[#fcfdfb] p-5"
        >
          <div className="flex gap-3">
            <div className="h-8 w-24 rounded-lg bg-[#e8ece9]" />
            <div className="h-8 w-32 rounded-lg bg-[#eef1ee]" />
          </div>

          <div className="mt-5 h-3 w-2/5 rounded bg-[#e8ece9]" />

          <div className="mt-4 h-2 rounded-full bg-[#edf0ed]" />

          <div className="mt-5 h-20 rounded-xl bg-[#f0f2f0]" />
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  filtered,
  onReset,
}: {
  filtered: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#d8dfdb] bg-[#fafbf9] px-5 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e9f1ef] text-[#315f5a]">
        <Check size={27} />
      </div>

      <h3 className="mt-5 text-base font-bold text-[#24302f]">
        {filtered
          ? "No suggestions in this confidence range"
          : "No pending suggestions"}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-5 text-[#71807d]">
        {filtered
          ? "There are currently no AI suggestions matching the selected confidence filter."
          : "The AI review queue is clear. New suggestions will appear here when they require human validation."}
      </p>

      {filtered && (
        <button
          onClick={onReset}
          className="mt-5 rounded-xl border border-[#dcd5d1] bg-white px-4 py-2.5 text-sm font-bold text-[#24302f] transition hover:border-[#68364b] hover:text-[#68364b]"
        >
          Show all suggestions
        </button>
      )}
    </div>
  );
}

/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}