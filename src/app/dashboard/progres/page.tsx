import { ProgresClient } from "./progres-client";
import { createClient } from "@/utils/supabase/server";
import { fetchEnrichedComplaints } from "@/utils/fetch-complaints";
import { redirect } from "next/navigation";

export default async function ProgresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin_ga" && profile?.role !== "GA") {
    redirect("/dashboard");
  }

  const { progresComplaints } = await fetchEnrichedComplaints(supabase);

  return (
    <ProgresClient
      initialComplaints={progresComplaints}
      currentUserId={user.id}
    />
  );
}
