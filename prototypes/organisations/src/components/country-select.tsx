import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, X } from "lucide-react";

const fieldCls = (error?: boolean) =>
  `w-full bg-neutral-50 border rounded-lg px-3 py-2 text-[14px] leading-[20px] outline-none focus:bg-white focus:ring-2 focus:ring-neutral-200 ${
    error ? "border-brand" : "border-neutral-200"
  }`;

type Rect = { top: number; right: number; width: number };

/**
 * Searchable single-select for countries / jurisdictions.
 *
 * - The full list is shown as soon as the field is opened, so the user can just pick one.
 * - Typing filters the list with a prefix, case-insensitive match against the country name
 *   (no fuzzy / contains / ISO-code matching). "No countries found" when nothing matches.
 * - Keyboard: ↑/↓ to move, Enter to select, Esc to close. Mouse selects too.
 * - No custom values can be created.
 * - The panel is rendered in a portal with fixed positioning so it is never clipped by the
 *   surrounding modal's scroll container.
 */
export function CountrySelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  error,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  error?: boolean;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();
  const results = q ? options.filter((c) => c.toLowerCase().startsWith(q)) : options;

  const reposition = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = Math.max(r.width, 220);
    // Right-align the panel to the trigger's right edge so it opens leftward (staying inside
    // the modal) instead of overflowing to the right.
    const right = Math.max(8, window.innerWidth - r.right);
    setRect({ top: r.bottom + 4, right, width });
  }, []);

  useLayoutEffect(() => {
    if (open) reposition();
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      close();
    }
    function onReflow() {
      reposition();
    }
    document.addEventListener("mousedown", onDocMouseDown);
    window.addEventListener("resize", onReflow);
    // capture=true so we also react to scrolling inside the modal body, not just the window.
    window.addEventListener("scroll", onReflow, true);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [open, reposition]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function openMenu() {
    setQuery("");
    setHighlight(0);
    setOpen(true);
  }
  function close() {
    setOpen(false);
    setQuery("");
    setHighlight(0);
  }
  function choose(country: string) {
    onChange(country);
    close();
  }
  function clear(e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation();
    onChange("");
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length) setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length) setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results.length) choose(results[Math.min(highlight, results.length - 1)]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      {open ? (
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search country…"
          aria-label={ariaLabel}
          className={fieldCls(error)}
        />
      ) : (
        <button
          type="button"
          onClick={openMenu}
          aria-label={ariaLabel}
          className={`${fieldCls(error)} flex items-center justify-between gap-2 text-left`}
        >
          <span className={`truncate ${value ? "text-neutral-800" : "text-neutral-400"}`}>
            {value || placeholder}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            {value && (
              <span
                role="button"
                tabIndex={-1}
                aria-label="Clear"
                onClick={clear}
                className="items-center flex text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </span>
            )}
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </span>
        </button>
      )}

      {open && rect &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: rect.top, right: rect.right, width: rect.width }}
            className="z-[200] bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-auto p-1"
          >
            {results.length === 0 ? (
              <p className="text-neutral-400 text-[13px] leading-[18px] px-2.5 py-2">No countries found</p>
            ) : (
              results.map((c, i) => {
                const active = i === highlight;
                const selected = c === value;
                return (
                  <button
                    key={c}
                    type="button"
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => choose(c)}
                    className={`items-center flex w-full justify-between gap-2 text-left text-[14px] leading-[20px] px-2.5 py-2 rounded-md ${
                      active ? "bg-neutral-100" : "hover:bg-neutral-50"
                    }`}
                  >
                    <span className="text-neutral-800">{c}</span>
                    {selected && <Check className="w-3.5 h-3.5 text-brand shrink-0" />}
                  </button>
                );
              })
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
