import { useEffect } from "react";
import WebApp from "@twa-dev/sdk";

import { validateInitData } from "../api/auth";
import { useAuthStore } from "./auth";
import { useBusinessStore } from "./business";

export function useTelegramBoot() {
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setError = useAuthStore((state) => state.setError);
  const hydrateBusinesses = useBusinessStore((state) => state.hydrateBusinesses);

  useEffect(() => {
    try {
      WebApp.ready();
      WebApp.expand();
    } catch {
      // Browser preview is a first-class local dev mode.
    }

    const initData =
      WebApp.initData ||
      import.meta.env.VITE_DEBUG_INITDATA ||
      "debug:777002";

    setLoading(true);
    void validateInitData(initData)
      .then((response) => {
        hydrateAuth({
          token: response.token,
          telegramId: String(response.user.telegram_id),
          isPlatformAdmin: response.user.is_platform_admin,
          user: {
            id: response.user.id,
            telegramId: String(response.user.telegram_id),
            firstName: response.user.first_name ?? null,
            lastName: response.user.last_name ?? null,
            username: response.user.username ?? null,
            language: response.user.language,
          },
        });
        hydrateBusinesses(response.businesses, response.active_business_id);
      })
      .catch(() => {
        setError("Unable to initialize Mini App auth against the local backend.");
        hydrateBusinesses([], null);
      });
  }, [hydrateAuth, hydrateBusinesses, setError, setLoading]);
}
