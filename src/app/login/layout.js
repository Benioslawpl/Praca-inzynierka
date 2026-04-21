import "../globals.css";

export const metadata = {
  title: "Logowanie | Aplikacja Maszyny",
};

export default function LoginLayout({ children }) {
  return (
    <html lang="pl">
      <body className="loginBody">
        <main className="loginMain">{children}</main>
      </body>
    </html>
  );
}
