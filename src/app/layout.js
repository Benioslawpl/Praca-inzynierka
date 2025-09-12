import "./globals.css";

export const metadata = {
  title: "Test DB App",
  description: "Next.js + Supabase test",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}