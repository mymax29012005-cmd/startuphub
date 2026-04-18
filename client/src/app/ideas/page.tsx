import { redirect } from "next/navigation";

export default function IdeasListPage() {
  redirect("/marketplace?tab=ideas");
}
