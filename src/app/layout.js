import "./globals.css";

export const metadata = {
  title: "Moja aplikacja",
  description: "Test DB",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}