import AdminLayout from "@/views/admin/AdminLayout";

export const metadata = {
  title: "Platform Console | Occupra Admin",
  description: "Internal operations dashboard for system operators, resource logs auditing, and users/listings moderation.",
};

export default function PlatformLayout({ children }) {
  return <AdminLayout>{children}</AdminLayout>;
}
