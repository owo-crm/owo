"use client";

import { useSyncExternalStore } from "react";
import { getSupportServerSnapshot, getSupportState, subscribeSupportState } from "./support-store";

export function useSupportState() {
  return useSyncExternalStore(subscribeSupportState, getSupportState, getSupportServerSnapshot);
}
