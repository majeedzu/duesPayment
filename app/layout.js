import "./globals.css";

export const metadata = {
  title: "HTU Departmental Dues Payment System",
  description: "Official Departmental Dues Payment and Verification Portal for Ho Technical University.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <script dangerouslySetInnerHTML={{__html: `
          (function() {
            try {
              var theme = localStorage.getItem('htu-dues-theme');
              if (theme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
                document.addEventListener('DOMContentLoaded', function() {
                  document.body.classList.add('dark-mode');
                });
              }
            } catch (e) {}
          })();
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
