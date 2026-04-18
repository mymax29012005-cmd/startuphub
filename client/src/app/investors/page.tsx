import { redirect } from "next/navigation";

export default function InvestorsListPage() {
  redirect("/marketplace?tab=investors");
}
