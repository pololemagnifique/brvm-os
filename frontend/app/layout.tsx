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
  { href: "/", label: "Dashboard" },
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
              href="/"
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

        {/* Legal Disclaimer */}
        <footer style={{ background: "#0a0f0a", borderTop: "1px solid #1f2d1f", padding: "12px 24px", textAlign: "center" }}>
          <p style={{ color: "#4b5563", fontSize: "0.75rem", maxWidth: 800, margin: "0 auto", lineHeight: 1.6 }}>
            ⚠️ Les informations publiées sur BRVM-OS sont fournies à <strong>titre informatif et pédagogique uniquement</strong>. Elles ne constituent ni une recommandation personnalisée ni un conseil en investissement. Les données financières sont présentées à des fins éducatives et ne sauraient fonder une décision d'investissement. Avant d'investir, consultez un conseiller financier agréé. BRVM-OS n'est pas affilié à la BRVM ni soumis à son contrôle réglementaire.
          </p>
        </footer>

        <style>{`
          .nav-link:hover { color: #ffffff !important; }
        `}</style>
      </body>
    </html>
  );
}
