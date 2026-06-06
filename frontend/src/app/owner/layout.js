import OwnerLayout from "@/views/owner/OwnerLayout";

export const metadata = {
  title: "Owner Console | Occupra",
  description: "List properties, manage active rental bookings, configure dynamic spatial availability.",
};

export default function LandlordLayout({ children }) {
  return <OwnerLayout>{children}</OwnerLayout>;
}
