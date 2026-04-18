import { redirect } from "next/navigation";

export default function StartupsListPage() {
  redirect("/marketplace?tab=startups");
}
