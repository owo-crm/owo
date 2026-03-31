import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";

import { getBusinessMembers } from "./api/businesses";
import { BusinessSwitcher } from "./components/BusinessSwitcher";
import { Spinner } from "./components/Spinner";
import { TabBar, type AppTab } from "./components/TabBar";
import { canViewBilling, canViewDashboard, canViewInventory, canViewLeads, canViewTasks } from "./lib/permissions";
import { AdminPage } from "./pages/AdminPage";
import { BillingPage } from "./pages/BillingPage";
import { InventoryTab } from "./pages/InventoryTab";
import { LeadsTab } from "./pages/LeadsTab";
import { LeadDetailsPage } from "./pages/LeadDetailsPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { SettingsTab } from "./pages/SettingsTab";
import { SheetMappingPage } from "./pages/SheetMappingPage";
import { StatsTab } from "./pages/StatsTab";
import { TasksTab } from "./pages/TasksTab";
import { createBusiness } from "./api/businesses";
import { useAuthStore } from "./store/auth";
import { useBusinessStore } from "./store/business";
import { useThemeStore } from "./store/theme";
import { useTelegramBoot } from "./store/useTelegramBoot";

const tabs: AppTab[] = ["leads", "tasks", "stats", "inventory", "settings"];

function getInitials(firstName?: string | null, lastName?: string | null, username?: string | null) {
  const parts = [firstName, lastName].filter(Boolean) as string[];
  if (parts.length > 0) {
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }
  return (username?.slice(0, 2) ?? "U").toUpperCase();
}

export default function App() {
  useTelegramBoot();
  const businesses = useBusinessStore((state) => state.businesses);
  const activeBusinessId = useBusinessStore((state) => state.activeBusinessId);
  const appendBusiness = useBusinessStore((state) => state.appendBusiness);
  const isPlatformAdmin = useAuthStore((state) => state.isPlatformAdmin);
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const authError = useAuthStore((state) => state.error);
  const theme = useThemeStore((state) => state.theme);
  const [activeTab, setActiveTab] = useState<AppTab>("leads");
  const [adminOpen, setAdminOpen] = useState(false);
  const [mappingOpen, setMappingOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [activeLeadUid, setActiveLeadUid] = useState<string | null>(null);
  const [isCreatingBusiness, setIsCreatingBusiness] = useState(false);

  const activeBusiness = useMemo(
    () => businesses.find((item) => item.id === activeBusinessId) ?? businesses[0],
    [activeBusinessId, businesses],
  );

  const membersQuery = useQuery({
    queryKey: ["business-members", activeBusiness?.id],
    queryFn: async () => (await getBusinessMembers(activeBusiness?.id ?? "", token)).items,
    enabled: Boolean(activeBusiness?.id && token && currentUser?.id),
  });

  const currentMember = useMemo(
    () => (membersQuery.data ?? []).find((member) => member.user_id === currentUser?.id) ?? null,
    [currentUser?.id, membersQuery.data],
  );
  const currentRole = currentMember?.role ?? "member";
  const currentPermissions = currentMember?.custom_permissions ?? [];
  const showWorkspaceChrome =
    !isLoading &&
    !authError &&
    businesses.length > 0 &&
    !adminOpen &&
    !billingOpen &&
    !mappingOpen &&
    !activeLeadUid;
  const profileInitials = getInitials(currentUser?.firstName, currentUser?.lastName, currentUser?.username);

  const availableTabs = useMemo(() => {
    return tabs.filter((tab) => {
      if (tab === "leads") {
        return canViewLeads(currentRole, currentPermissions);
      }
      if (tab === "stats") {
        return canViewDashboard(currentRole, currentPermissions);
      }
      if (tab === "inventory") {
        return activeBusiness?.enabledModules.includes("inventory") && canViewInventory(currentRole, currentPermissions);
      }
      if (tab === "tasks") {
        return canViewTasks(currentRole, currentPermissions);
      }
      return true;
    });
  }, [activeBusiness?.enabledModules, currentPermissions, currentRole]);

  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0] ?? "settings");
    }
  }, [activeTab, availableTabs]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  async function handleCreateBusiness(name: string, businessMode: string, enabledModules: string[]) {
    try {
      setIsCreatingBusiness(true);
      const business = await createBusiness(name, businessMode, enabledModules, token);
      appendBusiness(business);
    } finally {
      setIsCreatingBusiness(false);
    }
  }

  return (
    <div className="shell">
      <div className="shell__backdrop shell__backdrop--top" />
      <div className="shell__backdrop shell__backdrop--bottom" />

      {showWorkspaceChrome ? (
        <header className="topbar">
          <BusinessSwitcher />
          <div className="topbar__actions">
            <button
              type="button"
              className="topbar__icon-button"
              aria-label="Open tasks"
              onClick={() => setActiveTab(availableTabs.includes("tasks") ? "tasks" : "settings")}
            >
              <Bell size={18} strokeWidth={1.9} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="topbar__profile"
              aria-label="Open settings"
              onClick={() => setActiveTab("settings")}
            >
              {profileInitials}
            </button>
          </div>
        </header>
      ) : null}

      <main className={showWorkspaceChrome ? "app-frame app-frame--with-chrome" : "app-frame app-frame--standalone"}>
        <section className="content-stack">
          {isLoading ? (
            <article className="panel">
              <h3>Loading workspace</h3>
              <p>Connecting Mini App to the local backend and restoring your business context.</p>
              <Spinner label="Restoring your workspace..." />
            </article>
          ) : authError ? (
            <article className="panel">
              <h3>Backend connection failed</h3>
              <p>{authError}</p>
            </article>
          ) : businesses.length === 0 ? (
            <OnboardingPage onCreateBusiness={handleCreateBusiness} isCreating={isCreatingBusiness} />
          ) : adminOpen ? (
            <AdminPage onClose={() => setAdminOpen(false)} />
          ) : billingOpen ? (
            <BillingPage
              businessName={activeBusiness?.name ?? "Business"}
              planName="Advanced"
              status="Active"
              nextBillingDate="31 Mar 2026"
              onClose={() => setBillingOpen(false)}
            />
          ) : mappingOpen ? (
            <SheetMappingPage
              businessName={activeBusiness?.name ?? "Business"}
              businessId={activeBusiness?.id ?? ""}
              sheetId={activeBusiness?.sheetId ?? ""}
              sheetTabName={activeBusiness?.sheetTabName ?? ""}
              currentMapping={activeBusiness?.sheetColumnMapping ?? {}}
              onClose={() => setMappingOpen(false)}
            />
          ) : activeLeadUid ? (
            <LeadDetailsPage
              businessId={activeBusiness?.id ?? ""}
              businessName={activeBusiness?.name ?? "Business"}
              leadUid={activeLeadUid}
              currentRole={currentRole}
              currentPermissions={currentPermissions}
              onOpenInventory={() => {
                setActiveLeadUid(null);
                setActiveTab("inventory");
              }}
              onClose={() => setActiveLeadUid(null)}
            />
          ) : (
            <>
              {activeTab === "leads" && (
                <LeadsTab
                  businessId={activeBusiness?.id ?? ""}
                  businessName={activeBusiness?.name ?? "Business"}
                  currentRole={currentRole}
                  currentPermissions={currentPermissions}
                  onOpenLead={setActiveLeadUid}
                />
              )}
              {activeTab === "stats" && (
                <StatsTab
                  businessId={activeBusiness?.id ?? ""}
                  businessName={activeBusiness?.name ?? "Business"}
                  currentRole={currentRole}
                  currentPermissions={currentPermissions}
                  onOpenLead={(uid) => {
                    setActiveLeadUid(uid);
                  }}
                  onOpenTasks={() => {
                    setActiveTab("tasks");
                  }}
                />
              )}
              {activeTab === "tasks" && (
                <TasksTab
                  businessId={activeBusiness?.id ?? ""}
                  businessName={activeBusiness?.name ?? "Business"}
                  currentRole={currentRole}
                  currentPermissions={currentPermissions}
                  onOpenLead={setActiveLeadUid}
                />
              )}
              {activeTab === "inventory" && (
                <InventoryTab
                  businessId={activeBusiness?.id ?? ""}
                  businessName={activeBusiness?.name ?? "Business"}
                  currentRole={currentRole}
                  currentPermissions={currentPermissions}
                />
              )}
              {activeTab === "settings" && (
                  <SettingsTab
                    businessId={activeBusiness?.id ?? ""}
                    businessName={activeBusiness?.name ?? "Business"}
                    currentSheetId={activeBusiness?.sheetId ?? ""}
                    currentSheetTabName={activeBusiness?.sheetTabName ?? ""}
                    currentSheetLastSyncedAt={activeBusiness?.sheetLastSyncedAt ?? null}
                    currentEnabledModules={activeBusiness?.enabledModules ?? []}
                    currentAutomationSettings={activeBusiness?.automationSettings}
                    currentNotificationSettings={activeBusiness?.notificationSettings}
                    hasConnectedBuffer={Boolean(activeBusiness?.sheetId && activeBusiness?.sheetVerified)}
                    canOpenAdmin={isPlatformAdmin}
                    canOpenBilling={canViewBilling(currentRole, currentPermissions)}
                    currentRole={currentRole}
                    currentPermissions={currentPermissions}
                    onOpenAdmin={() => setAdminOpen(true)}
                    onOpenBilling={() => setBillingOpen(true)}
                    onOpenMapping={() => setMappingOpen(true)}
                  />
              )}
            </>
          )}
        </section>

        {showWorkspaceChrome && (
          <TabBar activeTab={activeTab} onChange={setActiveTab} tabs={availableTabs} />
        )}
      </main>
    </div>
  );
}
