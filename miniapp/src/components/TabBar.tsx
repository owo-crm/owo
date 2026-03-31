import { BarChart3, Boxes, CheckSquare, Plus, Settings } from "lucide-react";

const labels = {
  leads: "Leads",
  tasks: "Tasks",
  stats: "Dashboard",
  inventory: "Inventory",
  settings: "Settings",
} as const;

export type AppTab = keyof typeof labels;

type TabBarProps = {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
  tabs: AppTab[];
};

function TabIcon({ tab }: { tab: AppTab }) {
  if (tab === "leads") {
    return <Plus size={18} strokeWidth={1.9} aria-hidden="true" />;
  }

  if (tab === "tasks") {
    return <CheckSquare size={18} strokeWidth={1.9} aria-hidden="true" />;
  }

  if (tab === "stats") {
    return <BarChart3 size={18} strokeWidth={1.9} aria-hidden="true" />;
  }

  if (tab === "inventory") {
    return <Boxes size={18} strokeWidth={1.9} aria-hidden="true" />;
  }

  return <Settings size={18} strokeWidth={1.9} aria-hidden="true" />;
}

export function TabBar({ activeTab, onChange, tabs }: TabBarProps) {
  return (
    <nav className="tabbar" aria-label="Main navigation">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          className={tab === activeTab ? "tabbar__item tabbar__item--active" : "tabbar__item"}
          onClick={() => onChange(tab)}
        >
          <span className="tabbar__glyph">
            <TabIcon tab={tab} />
          </span>
          <span className="tabbar__label">{labels[tab]}</span>
          {tab === activeTab ? <span className="tabbar__active-dot" aria-hidden="true" /> : null}
        </button>
      ))}
    </nav>
  );
}
