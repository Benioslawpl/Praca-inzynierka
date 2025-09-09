import { GeistSans } from "geist/font/sans";
import "./globals.css";


export default function RootLayout({ children }) {
  return (


<html lang="en" className={GeistSans.className}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
