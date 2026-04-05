import { redirect } from "next/navigation";

export default function AppTasksRedirectPage() {
  redirect("/app?tab=tasks");
}
