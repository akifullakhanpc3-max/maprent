import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import ClientInitializer from "@/components/ClientInitializer";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-main",
  weight: ["400", "500", "700"],
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-luxury",
  weight: ["700", "800"],
});

export const metadata = {
  title: "Occupra | Premium Map-First Property Discovery",
  description: "Find your next rental home on the map. Directly connect with verified property owners, no intermediaries.",
  metadataBase: new URL("https://maprent-2.onrender.com"), // Fallback base URL for sitemaps and images
  openGraph: {
    title: "Occupra | Premium Map-First Property Discovery",
    description: "Simplifying the rental journey. Map-based discovery connecting landlords and tenants directly.",
    url: "https://maprent-2.onrender.com",
    siteName: "Occupra",
    images: [
      {
        url: "/logo/Occupra logo.png",
        width: 800,
        height: 600,
        alt: "Occupra Premium Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Occupra | Premium Map-First Property Discovery",
    description: "Simplifying the rental journey. Map-based discovery connecting landlords and tenants directly.",
    images: ["/logo/Occupra logo.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClientInitializer>
          {children}
        </ClientInitializer>
      </body>
    </html>
  );
}
