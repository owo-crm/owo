type BillingPageProps = {
  businessName: string;
  planName: string;
  status: string;
  nextBillingDate: string;
  onClose: () => void;
};

const plans = [
  {
    name: "Basic",
    price: "79 zl / month",
    perks: ["1 business", "5 team seats", "5 GB storage"],
  },
  {
    name: "Advanced",
    price: "199 zl / month",
    perks: ["3 businesses", "15 team seats", "20 GB storage", "Custom mode"],
  },
  {
    name: "Pro",
    price: "449 zl / month",
    perks: ["Unlimited businesses", "Unlimited team", "100 GB+ storage", "Agency workflow"],
  },
];

const invoices = [
  { date: "01 Mar 2026", amount: "199 zl", status: "Paid" },
  { date: "01 Feb 2026", amount: "199 zl", status: "Paid" },
  { date: "01 Jan 2026", amount: "0 zl", status: "Trial" },
];

function UsageBar({
  label,
  value,
  limit,
  suffix,
  percent,
}: {
  label: string;
  value: string;
  limit: string;
  suffix?: string;
  percent: number;
}) {
  return (
    <article className="panel panel--subtle billing-usage-card">
      <span className="section-heading__eyebrow">{label}</span>
      <div className="billing-usage-card__topline">
        <strong>
          {value} / {limit}
          {suffix ? ` ${suffix}` : ""}
        </strong>
        <span>{percent}%</span>
      </div>
      <div className="billing-usage-card__bar">
        <div className="billing-usage-card__fill" style={{ width: `${percent}%` }} />
      </div>
    </article>
  );
}

export function BillingPage({
  businessName,
  planName,
  status,
  nextBillingDate,
  onClose,
}: BillingPageProps) {
  return (
    <section className="page">
      <div className="section-heading section-heading--compact">
        <button type="button" className="ghost-button" onClick={onClose}>
          Back to settings
        </button>
      </div>

      <div className="stack-list stack-list--tight">
        <p className="section-heading__eyebrow">{businessName}</p>
      </div>

      <article className="panel billing-hero">
        <div>
          <span className="section-heading__eyebrow">Current plan</span>
          <h3>{planName}</h3>
          <div className="billing-hero__rows">
            <p>Next billing: {nextBillingDate}</p>
            <p>Price: 199 zl / month</p>
          </div>
        </div>
        <span className="billing-hero__badge">{status}</span>
      </article>

      <article className="panel">
        <div className="section-heading section-heading--compact">
          <div>
            <h3>Usage this period</h3>
          </div>
        </div>
        <div className="billing-usage-grid">
          <UsageBar label="Leads this month" value="842" limit="1000" percent={84} />
          <UsageBar label="Storage" value="2.2" limit="5" suffix="GB" percent={45} />
          <UsageBar label="Team seats" value="4" limit="5" percent={80} />
        </div>
      </article>

      <article className="panel">
        <div className="section-heading section-heading--compact">
          <div>
            <h3>Available plans</h3>
            <p>Preview of the pricing screen before live billing is wired in.</p>
          </div>
        </div>
        <div className="plan-carousel">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={plan.name === planName ? "panel panel--subtle plan-card plan-card--active" : "panel panel--subtle plan-card"}
            >
              <div className="plan-card__topline">
                <strong>{plan.name}</strong>
                <span>{plan.price}</span>
              </div>
              <div className="stack-list stack-list--tight">
                {plan.perks.map((perk) => (
                  <p key={perk} className="plan-card__perk">
                    - {perk}
                  </p>
                ))}
              </div>
              <button type="button" className="primary-button" disabled={plan.name === planName}>
                {plan.name === planName ? "Current plan" : "Select"}
              </button>
            </article>
          ))}
        </div>
      </article>

      <article className="panel">
        <div className="section-heading section-heading--compact">
          <div>
            <h3>Billing history</h3>
            <p>Minimal billing history preview.</p>
          </div>
        </div>
        <div className="stack-list stack-list--tight">
          {invoices.map((invoice) => (
            <div key={`${invoice.date}-${invoice.amount}`} className="task-row">
              <div>
                <strong>{invoice.amount}</strong>
                <p>{invoice.date}</p>
              </div>
              <span className="lead-card__tag">{invoice.status}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
