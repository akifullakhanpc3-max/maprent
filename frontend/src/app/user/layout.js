import UserLayout from "@/views/user/UserLayout";

export const metadata = {
  title: "Tenant Dashboard | Occupra",
  description: "Manage your rental applications, bookings, saved listings, and direct landlords communications.",
};

export default function TenantLayout({ children }) {
  return <UserLayout>{children}</UserLayout>;
}
