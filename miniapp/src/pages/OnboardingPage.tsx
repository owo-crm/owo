import { useState } from "react";

type OnboardingPageProps = {
  onCreateBusiness: (name: string, businessMode: string, enabledModules: string[]) => Promise<void>;
  isCreating: boolean;
};

const businessModes = [
  {
    value: "general_sales",
    label: "General sales",
    description: "Classic sales CRM with leads, follow-ups, and deal flow.",
  },
  {
    value: "events_bookings",
    label: "Events & bookings",
    description: "For weddings, rentals, artists, agencies, and date-driven bookings.",
  },
  {
    value: "services",
    label: "Services",
    description: "For appointment-based services, consultations, and client work.",
  },
  {
    value: "custom",
    label: "Custom",
    description: "Start flexible and shape fields, modules, and workflows later.",
  },
] as const;

export function OnboardingPage({ onCreateBusiness, isCreating }: OnboardingPageProps) {
  const [name, setName] = useState("");
  const [businessMode, setBusinessMode] = useState<string>("general_sales");
  const [inventoryEnabled, setInventoryEnabled] = useState(false);

  return (
    <section className="page">
      <article className="hero-card">
        <div className="hero-card__eyebrow">First business setup</div>
        <div className="stack-list">
          <div>
            <h2>Create your first workspace</h2>
            <p>
              Once the business is created, we can connect the Facebook leads buffer, save column
              mapping, and start pulling leads into the CRM.
            </p>
          </div>

          <label className="input-field">
            <span className="select-field__label">Business name</span>
            <input
              className="input-field__control"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Barowo Weddings"
            />
          </label>

          <div className="stack-list stack-list--tight">
            <div>
              <span className="select-field__label">What kind of business is this CRM for?</span>
              <p className="muted">You can change this later. It helps us shape defaults and fields.</p>
            </div>

            <div className="mode-grid">
              {businessModes.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  className={businessMode === mode.value ? "mode-card mode-card--active" : "mode-card"}
                  onClick={() => setBusinessMode(mode.value)}
                >
                  <strong>{mode.label}</strong>
                  <span>{mode.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="stack-list stack-list--tight">
            <div>
              <span className="select-field__label">Optional modules</span>
              <p className="muted">Turn on only the tools this business really needs from day one.</p>
            </div>

            <button
              type="button"
              className={inventoryEnabled ? "mode-card mode-card--active" : "mode-card"}
              onClick={() => setInventoryEnabled((current) => !current)}
            >
              <strong>Inventory</strong>
              <span>Track stock items, quantities, low-stock alerts, and stock movements.</span>
            </button>
          </div>

          <button
            type="button"
            className="primary-button"
            disabled={isCreating || name.trim().length < 2}
            onClick={() => onCreateBusiness(name.trim(), businessMode, inventoryEnabled ? ["inventory"] : [])}
          >
            {isCreating ? "Creating..." : "Create business"}
          </button>
        </div>
      </article>
    </section>
  );
}
