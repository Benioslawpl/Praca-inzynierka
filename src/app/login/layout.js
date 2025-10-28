import "../globals.css"; 

export const metadata = {
  title: "Logowanie | Aplikacja Maszyny",
};

export default function LoginLayout({ children }) {
  return (
    <html lang="pl">
      <body className="login-body">
        <main className="login-container">
          {children}
        </main>
      </body>
    </html>
  );
}