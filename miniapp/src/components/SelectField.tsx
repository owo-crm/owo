import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

type SelectOption = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  presentation?: "auto" | "sheet" | "menu";
};

type MenuPosition = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
};

const VIEWPORT_PADDING = 8;
const MENU_GAP = 6;
const MIN_MENU_WIDTH = 180;
const MAX_MENU_WIDTH = 340;
const MAX_MENU_HEIGHT = 320;

export function SelectField({
  label,
  value,
  options,
  onChange,
  searchable = false,
  searchPlaceholder = "Search...",
  disabled = false,
  presentation = "auto",
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [renderAsSheet, setRenderAsSheet] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 640 : false,
  );
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];
  const shouldRenderAsSheet = presentation === "sheet" || (presentation === "auto" && renderAsSheet);

  const filteredOptions = useMemo(() => {
    if (!searchable || !query.trim()) {
      return options;
    }

    const normalizedQuery = query.trim().toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery));
  }, [options, query, searchable]);

  useEffect(() => {
    function handleResize() {
      setRenderAsSheet(window.innerWidth <= 640);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    function handlePointer(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (open && searchable && !disabled) {
      window.setTimeout(() => {
        searchRef.current?.focus();
      }, 0);
    }

    if (!open) {
      setQuery("");
      setMenuPosition(null);
    }
  }, [disabled, open, searchable]);

  useEffect(() => {
    if (!open || disabled || shouldRenderAsSheet) {
      return;
    }

    function updateMenuPosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) {
        setOpen(false);
        return;
      }

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const width = Math.min(
        Math.max(rect.width, MIN_MENU_WIDTH),
        Math.min(MAX_MENU_WIDTH, viewportWidth - VIEWPORT_PADDING * 2),
      );
      const left = Math.min(
        Math.max(rect.left, VIEWPORT_PADDING),
        viewportWidth - width - VIEWPORT_PADDING,
      );
      const spaceBelow = viewportHeight - rect.bottom - VIEWPORT_PADDING;
      const spaceAbove = rect.top - VIEWPORT_PADDING;
      const placeAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
      const availableHeight = placeAbove ? spaceAbove : spaceBelow;
      const maxHeight = Math.max(96, Math.min(MAX_MENU_HEIGHT, availableHeight - MENU_GAP));

      if (placeAbove) {
        setMenuPosition({
          left,
          width,
          maxHeight,
          bottom: viewportHeight - rect.top + MENU_GAP,
        });
        return;
      }

      setMenuPosition({
        left,
        width,
        maxHeight,
        top: rect.bottom + MENU_GAP,
      });
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [disabled, open, shouldRenderAsSheet]);

  const menu = shouldRenderAsSheet
    ? createPortal(
        <AnimatePresence>
          {open ? (
            <motion.div
              className="modal-shell select-field__sheet-shell"
              role="dialog"
              aria-modal="true"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <motion.article
                className="modal-card select-field__sheet"
                ref={menuRef}
                onClick={(event) => event.stopPropagation()}
                initial={{ opacity: 0, y: 24, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.99 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <div className="select-field__sheet-heading">
                  <div>
                    {label ? <span className="section-heading__eyebrow">{label}</span> : null}
                    <h3>{label ?? "Select option"}</h3>
                  </div>
                  <button type="button" className="ghost-button" onClick={() => setOpen(false)}>
                    Close
                  </button>
                </div>
                {searchable ? (
                  <div className="select-field__search-wrap">
                    <input
                      ref={searchRef}
                      className="select-field__search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={searchPlaceholder}
                    />
                  </div>
                ) : null}
                <div className="select-field__sheet-options">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={
                          option.value === value
                            ? "select-field__option select-field__option--active"
                            : "select-field__option"
                        }
                        onClick={() => {
                          onChange?.(option.value);
                          setOpen(false);
                        }}
                        title={option.label}
                      >
                        {option.label}
                      </button>
                    ))
                  ) : (
                    <div className="select-field__empty">No matching options.</div>
                  )}
                </div>
              </motion.article>
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.body,
      )
    : createPortal(
        <AnimatePresence>
          {open && menuPosition ? (
            <motion.div
              className="select-field__menu"
              role="listbox"
              ref={menuRef}
              style={menuPosition as CSSProperties}
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.985 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              {searchable ? (
                <div className="select-field__search-wrap">
                  <input
                    ref={searchRef}
                    className="select-field__search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={searchPlaceholder}
                  />
                </div>
              ) : null}

              <div className="select-field__options" style={{ maxHeight: menuPosition.maxHeight - (searchable ? 56 : 0) }}>
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={
                        option.value === value
                          ? "select-field__option select-field__option--active"
                          : "select-field__option"
                      }
                      onClick={() => {
                        onChange?.(option.value);
                        setOpen(false);
                      }}
                      title={option.label}
                    >
                      {option.label}
                    </button>
                  ))
                ) : (
                  <div className="select-field__empty">No matching options.</div>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.body,
      );

  return (
    <>
      <div className={open ? "select-field select-field--open" : "select-field"} ref={rootRef}>
        {label ? <span className="select-field__label">{label}</span> : null}
        <button
          ref={triggerRef}
          type="button"
          className={
            disabled
              ? "select-field__trigger select-field__trigger--disabled"
              : open
                ? "select-field__trigger select-field__trigger--open"
                : "select-field__trigger"
          }
          onClick={() => {
            if (!disabled) {
              setOpen((current) => !current);
            }
          }}
          aria-expanded={open}
          disabled={disabled}
          title={selected?.label ?? value}
        >
          <span className="select-field__value">{selected?.label ?? (value || "Select option")}</span>
          <span className="select-field__chevron">v</span>
        </button>
      </div>
      {menu}
    </>
  );
}
