"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  getMonthWeek,
  getMonthWeekEnd,
  getMonthWeekStart,
  type MonthWeek,
} from "@/lib/expense.utils";

type ViewMode = "daily" | "weekly" | "monthly" | "yearly";

const MONTHS = Array.from({ length: 12 }, (_, index) =>
  new Date(2024, index, 1).toLocaleDateString("en-GB", { month: "short" }),
);

function shiftMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function AnalyticsPeriodPicker({
  view,
  currentDate,
  label,
  onChange,
}: {
  readonly view: ViewMode;
  readonly currentDate: Date;
  readonly label: string;
  readonly onChange: (date: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(currentDate);
  const pickerRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (open) {
      setPickerDate(new Date(currentDate));
      if (pickerRef.current) {
        setRect(pickerRef.current.getBoundingClientRect());
      }
    }
  }, [currentDate, open]);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !pickerRef.current?.contains(target) &&
        !portalRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    const updateRect = () => {
      if (pickerRef.current) {
        setRect(pickerRef.current.getBoundingClientRect());
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [open]);

  const selectDate = (date: Date) => {
    onChange(date);
    setOpen(false);
  };

  const renderDailyPicker = () => {
    const year = pickerDate.getFullYear();
    const month = pickerDate.getMonth();
    const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = Array.from(
      { length: firstDayOffset + daysInMonth },
      (_, index) => (index < firstDayOffset ? null : index - firstDayOffset + 1),
    );

    return (
      <>
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPickerDate(shiftMonth(pickerDate, -1))}
            className="min-h-11 min-w-11 rounded-xl text-lg text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="font-semibold">
            {pickerDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </span>
          <button
            type="button"
            onClick={() => setPickerDate(shiftMonth(pickerDate, 1))}
            className="min-h-11 min-w-11 rounded-xl text-lg text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-white/35">
          {(["M", "T", "W", "T", "F", "S", "S"] as const).map((day, index) => (
            <span key={`${day}-${index}`} className="py-1">
              {day}
            </span>
          ))}
          {cells.map((day, index) => {
            if (!day) return <span key={`empty-${index}`} className="min-h-10" />;
            const selected =
              currentDate.getFullYear() === year &&
              currentDate.getMonth() === month &&
              currentDate.getDate() === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => selectDate(new Date(year, month, day))}
                className={`min-h-10 rounded-xl text-sm transition-colors ${
                  selected
                    ? "bg-[var(--accent-1)] font-semibold text-[#0D0D0D]"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </>
    );
  };

  const renderWeeklyPicker = () => {
    const year = pickerDate.getFullYear();
    const month = pickerDate.getMonth();
    const selectedMonth = currentDate.getFullYear() === year && currentDate.getMonth() === month;
    const selectedWeek = getMonthWeek(currentDate);

    return (
      <>
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPickerDate(shiftMonth(pickerDate, -1))}
            className="min-h-11 min-w-11 rounded-xl text-lg text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="font-semibold">
            {pickerDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </span>
          <button
            type="button"
            onClick={() => setPickerDate(shiftMonth(pickerDate, 1))}
            className="min-h-11 min-w-11 rounded-xl text-lg text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
        <div className="grid gap-2">
          {([1, 2, 3, 4] as MonthWeek[]).map((week) => {
            const start = getMonthWeekStart(year, month, week);
            const end = getMonthWeekEnd(year, month, week);
            const selected = selectedMonth && selectedWeek === week;
            return (
              <button
                key={week}
                type="button"
                onClick={() => selectDate(start)}
                className={`flex min-h-11 items-center justify-between rounded-xl border px-3 text-left text-sm transition-colors ${
                  selected
                    ? "border-[var(--accent-1)] bg-[var(--accent-1)]/15 text-[var(--accent-1)]"
                    : "border-white/10 text-white/70 hover:border-white/25 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>Week {week}</span>
                <span className="text-xs text-white/45">
                  {formatShortDate(start)} – {formatShortDate(end)}
                </span>
              </button>
            );
          })}
        </div>
      </>
    );
  };

  const renderMonthlyPicker = () => {
    const year = pickerDate.getFullYear();
    return (
      <>
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPickerDate(new Date(year - 1, 0, 1))}
            className="min-h-11 min-w-11 rounded-xl text-lg text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Previous year"
          >
            ‹
          </button>
          <span className="font-semibold">{year}</span>
          <button
            type="button"
            onClick={() => setPickerDate(new Date(year + 1, 0, 1))}
            className="min-h-11 min-w-11 rounded-xl text-lg text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Next year"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MONTHS.map((month, index) => {
            const selected = currentDate.getFullYear() === year && currentDate.getMonth() === index;
            return (
              <button
                key={month}
                type="button"
                onClick={() => selectDate(new Date(year, index, 1))}
                className={`min-h-11 rounded-xl border text-sm transition-colors ${
                  selected
                    ? "border-[var(--accent-1)] bg-[var(--accent-1)] text-[#0D0D0D]"
                    : "border-white/10 text-white/70 hover:border-white/25 hover:bg-white/5 hover:text-white"
                }`}
              >
                {month}
              </button>
            );
          })}
        </div>
      </>
    );
  };

  const renderYearlyPicker = () => {
    const year = pickerDate.getFullYear();
    const years = Array.from({ length: 9 }, (_, index) => year - 4 + index);
    return (
      <>
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPickerDate(new Date(year - 9, 0, 1))}
            className="min-h-11 min-w-11 rounded-xl text-lg text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Previous years"
          >
            ‹
          </button>
          <span className="font-semibold">{years[0]} – {years[years.length - 1]}</span>
          <button
            type="button"
            onClick={() => setPickerDate(new Date(year + 9, 0, 1))}
            className="min-h-11 min-w-11 rounded-xl text-lg text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Next years"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {years.map((item) => {
            const selected = currentDate.getFullYear() === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => selectDate(new Date(item, 0, 1))}
                className={`min-h-11 rounded-xl border text-sm transition-colors ${
                  selected
                    ? "border-[var(--accent-1)] bg-[var(--accent-1)] text-[#0D0D0D]"
                    : "border-white/10 text-white/70 hover:border-white/25 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div ref={pickerRef} className="relative min-w-0 flex-1 text-center">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="min-h-11 max-w-full rounded-xl px-2 text-center transition-colors hover:bg-white/5"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <div className="truncate text-sm font-semibold sm:text-[15px]">{label || "-"}</div>
      </button>

      {open && typeof document !== "undefined" ? createPortal(
        <div
          ref={portalRef}
          className="fixed z-50 w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#171717] p-4 text-left shadow-2xl"
          style={{
            top: rect ? rect.bottom + 8 : 0,
            left: rect ? rect.left + rect.width / 2 : 0,
          }}
        >
          {view === "daily" && renderDailyPicker()}
          {view === "weekly" && renderWeeklyPicker()}
          {view === "monthly" && renderMonthlyPicker()}
          {view === "yearly" && renderYearlyPicker()}
        </div>,
        document.body
      ) : null}
    </div>
  );
}
