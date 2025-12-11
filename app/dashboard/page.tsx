import { Metadata } from "next";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard - VendiMax",
  description: "Panel de control de VendiMax",
};

export default function DashboardPage() {
  return <DashboardContent />;
}
