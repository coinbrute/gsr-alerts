import "./globals.css";

export const metadata = {
  title: "GSR Alerts",
  description: "Gold-Silver Ratio alerts + portfolio tracker"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
