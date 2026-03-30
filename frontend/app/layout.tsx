import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BRVM-OS — Bourse Régionale des Valeurs Mobilières",
  description: "Tableau de bord boursier pour la BRVM (Afrique de l'Ouest)",
};

const NAV_LINKS = [
  { href: "/stocks", label: "Cours" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/portefeuille", label: "Portefeuille" },
  { href: "/alertes", label: "Alertes" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={inter.className}>
      <body>
        {/* Navbar */}
        <nav
          style={{ background: "#0f1a14", borderBottom: "1px solid #2d3d32" }}
          className="sticky top-0 z-50"
        >
          <div
            className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between"
          >
            {/* Logo */}
            <Link
              href="/stocks"
              style={{ color: "var(--green)", fontWeight: 700, fontSize: "1.2rem", letterSpacing: "-0.02em" }}
            >
              BRVM-OS
            </Link>

            {/* Nav links */}
            <div className="flex items-center gap-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    color: "var(--muted)",
                    fontSize: "0.9rem",
                    transition: "color 0.2s",
                  }}
                  className="hover:text-white nav-link"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>

        <style>{`
          .nav-link:hover { color: #ffffff !important; }
        `}</style>
      </body>
    </html>
  );
}
