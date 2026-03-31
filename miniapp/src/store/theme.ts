import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppTheme = "purple-night" | "sky-light";

export type ThemeOption = {
  id: AppTheme;
  name: string;
};

export const themeOptions: ThemeOption[] = [
  {
    id: "purple-night",
    name: "Purple Night",
  },
  {
    id: "sky-light",
    name: "Sky Light",
  },
];

type ThemeState = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "purple-night",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "barowo-theme",
    },
  ),
);
