import { useMemo, useState } from "react";
import { useBusinessStore } from "../store/business";

function getBusinessModeLabel(mode?: string | null) {
  switch (mode) {
    case "general_sales":
      return "General sales";
    case "events_bookings":
      return "Events & bookings";
    case "services":
      return "Services";
    case "custom":
      return "Custom";
    default:
      return "Business";
  }
}

export function BusinessSwitcher() {
  const businesses = useBusinessStore((state) => state.businesses);
  const activeBusinessId = useBusinessStore((state) => state.activeBusinessId);
  const setActiveBusiness = useBusinessStore((state) => state.setActiveBusiness);
  const [isOpen, setIsOpen] = useState(false);

  const activeBusiness = useMemo(
    () => businesses.find((business) => business.id === activeBusinessId) ?? businesses[0] ?? null,
    [activeBusinessId, businesses],
  );

  return (
    <>
      <button
        type="button"
        className="topbar-switcher"
        onClick={() => setIsOpen(true)}
        aria-label="Switch business"
      >
        <span className="topbar-switcher__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img">
            <path
              d="M4 20V7.8c0-.4.2-.8.6-1l6.8-3.4c.4-.2.8-.2 1.2 0l6.8 3.4c.4.2.6.6.6 1V20M4 20h16M8 20v-4.5h8V20M8 10h.01M16 10h.01M8 13h.01M16 13h.01"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="topbar-switcher__text">
          <strong>{activeBusiness?.name ?? "Business"}</strong>
        </span>
        <span className="topbar-switcher__chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img">
            <path
              d="M6 9l6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {isOpen ? (
        <div className="modal-shell" role="dialog" aria-modal="true">
          <article className="modal-card modal-card--sheet">
            <div className="section-heading section-heading--compact">
              <div>
                <span className="section-heading__eyebrow">Workspace</span>
                <h3>Your businesses</h3>
              </div>
              <button type="button" className="ghost-button" onClick={() => setIsOpen(false)}>
                Close
              </button>
            </div>

            <div className="business-switcher-sheet">
              {businesses.map((business) => {
                const isActive = business.id === activeBusiness?.id;
                return (
                  <button
                    key={business.id}
                    type="button"
                    className={`business-switcher-sheet__item${isActive ? " business-switcher-sheet__item--active" : ""}`}
                    onClick={() => {
                      setActiveBusiness(business.id);
                      setIsOpen(false);
                    }}
                  >
                    <div className="business-switcher-sheet__copy">
                      <strong>{business.name}</strong>
                      <span>{getBusinessModeLabel(business.businessMode)}</span>
                    </div>
                    {isActive ? <span className="business-switcher-sheet__check">Active</span> : null}
                  </button>
                );
              })}
            </div>
          </article>
        </div>
      ) : null}
    </>
  );
}
