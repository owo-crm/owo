import { create } from "zustand";
import type { AuthBusiness, BusinessAutomationSettings, BusinessNotificationSettings } from "../api/auth";

type Business = {
  id: string;
  name: string;
  businessMode: string;
  sheetId: string;
  sheetTabName: string;
  sheetVerified: boolean;
  sheetColumnMapping: Record<string, string>;
  enabledModules: string[];
  automationSettings: BusinessAutomationSettings;
  notificationSettings: BusinessNotificationSettings;
  sheetLastSyncedAt: string | null;
};

type BusinessState = {
  businesses: Business[];
  activeBusinessId: string | null;
  setActiveBusiness: (id: string) => void;
  updateBusinessMapping: (id: string, mapping: Record<string, string>) => void;
  updateBusinessSheetStatus: (
    id: string,
    sheetId: string,
    verified: boolean,
    sheetTabName?: string | null,
  ) => void;
  updateBusinessSyncStatus: (id: string, sheetLastSyncedAt?: string | null) => void;
  updateBusinessModules: (id: string, enabledModules: string[]) => void;
  updateBusinessAutomationSettings: (id: string, automationSettings: BusinessAutomationSettings) => void;
  updateBusinessNotificationSettings: (id: string, notificationSettings: BusinessNotificationSettings) => void;
  hydrateBusinesses: (businesses: AuthBusiness[], activeBusinessId?: string | null) => void;
  appendBusiness: (business: AuthBusiness) => void;
};

export const useBusinessStore = create<BusinessState>((set) => ({
  businesses: [],
  activeBusinessId: null,
  setActiveBusiness: (id) => set({ activeBusinessId: id }),
  updateBusinessMapping: (id, mapping) =>
    set((state) => ({
      businesses: state.businesses.map((business) =>
        business.id === id ? { ...business, sheetColumnMapping: mapping } : business,
      ),
    })),
  updateBusinessSheetStatus: (id, sheetId, verified, sheetTabName) =>
    set((state) => ({
      businesses: state.businesses.map((business) =>
        business.id === id
          ? {
              ...business,
              sheetId,
              sheetVerified: verified,
              sheetTabName: sheetTabName ?? business.sheetTabName,
              sheetLastSyncedAt: verified ? null : business.sheetLastSyncedAt,
            }
          : business,
      ),
    })),
  updateBusinessSyncStatus: (id, sheetLastSyncedAt) =>
    set((state) => ({
      businesses: state.businesses.map((business) =>
        business.id === id
          ? {
              ...business,
              sheetLastSyncedAt: sheetLastSyncedAt ?? null,
            }
          : business,
      ),
    })),
  updateBusinessModules: (id, enabledModules) =>
    set((state) => ({
      businesses: state.businesses.map((business) =>
        business.id === id
          ? {
              ...business,
              enabledModules,
            }
          : business,
      ),
    })),
  updateBusinessAutomationSettings: (id, automationSettings) =>
    set((state) => ({
      businesses: state.businesses.map((business) =>
        business.id === id
          ? {
              ...business,
              automationSettings,
            }
          : business,
      ),
    })),
  updateBusinessNotificationSettings: (id, notificationSettings) =>
    set((state) => ({
      businesses: state.businesses.map((business) =>
        business.id === id
          ? {
              ...business,
              notificationSettings,
            }
          : business,
      ),
    })),
  hydrateBusinesses: (businesses, activeBusinessId) =>
    set({
      businesses: businesses.map((business) => ({
        id: business.id,
        name: business.name,
        businessMode: business.business_mode,
        sheetId: business.sheet_id ?? "",
        sheetTabName: business.sheet_tab_name ?? "",
        sheetVerified: business.sheet_verified,
        sheetColumnMapping: business.sheet_column_mapping ?? {},
        enabledModules: business.enabled_modules ?? [],
        automationSettings: business.automation_settings,
        notificationSettings: business.notification_settings,
        sheetLastSyncedAt: business.sheet_last_synced_at ?? null,
      })),
      activeBusinessId: activeBusinessId ?? businesses[0]?.id ?? null,
    }),
  appendBusiness: (business) =>
    set((state) => {
      const mappedBusiness = {
        id: business.id,
        name: business.name,
        businessMode: business.business_mode,
        sheetId: business.sheet_id ?? "",
        sheetTabName: business.sheet_tab_name ?? "",
        sheetVerified: business.sheet_verified,
        sheetColumnMapping: business.sheet_column_mapping ?? {},
        enabledModules: business.enabled_modules ?? [],
        automationSettings: business.automation_settings,
        notificationSettings: business.notification_settings,
        sheetLastSyncedAt: business.sheet_last_synced_at ?? null,
      };

      return {
        businesses: [...state.businesses, mappedBusiness],
        activeBusinessId: state.activeBusinessId ?? mappedBusiness.id,
      };
    }),
}));
