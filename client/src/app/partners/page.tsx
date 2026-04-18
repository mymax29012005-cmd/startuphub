import { redirect } from "next/navigation";

export default function PartnersListPage() {
  redirect("/marketplace?tab=partners");
}
