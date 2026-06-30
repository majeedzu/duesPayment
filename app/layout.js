import "./globals.css";

export const metadata = {
  title: "HTU Departmental Dues Payment System",
  description: "Official Departmental Dues Payment and Verification Portal for Ho Technical University.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
