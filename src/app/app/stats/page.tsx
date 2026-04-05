import { redirect } from "next/navigation";

export default function AppStatsRedirectPage() {
  redirect("/app?tab=stats");
}
