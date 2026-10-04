import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "./(auth)/actions";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "RestoHouse — home cooking, near you",
  description: "Order home-cooked food for pickup or delivery, or share a meal at a local host's table.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-screen antialiased">
        <header className="border-b border-line bg-cream/90 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-4 text-sm">
            <Link href="/" className="mr-auto font-serif text-2xl font-semibold text-terracotta">
              RestoHouse
            </Link>
            <Link href="/listings" className="hover:text-terracotta">Explore</Link>
            {user ? (
              <>
                <Link href="/bookings" className="hover:text-terracotta">My bookings</Link>
                <Link href="/host" className="hover:text-terracotta">
                  {user.hostProfile?.status === "APPROVED" ? "Host dashboard" : "Become a host"}
                </Link>
                {user.role === "ADMIN" && <Link href="/admin" className="hover:text-terracotta">Admin</Link>}
                <form action={logout}>
                  <button className="btn-ghost">Log out</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/host" className="hover:text-terracotta">Become a host</Link>
                <Link href="/login" className="btn-ghost">Log in</Link>
                <Link href="/signup" className="btn">Sign up</Link>
              </>
            )}
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap gap-4 px-4 py-6 text-xs text-muted">
            <span>© {new Date().getFullYear()} RestoHouse · v0 prototype</span>
            <Link href="/legal" className="underline">Rules, ranking & legal information</Link>
            <span>All hosts are registered professionals (SIRET). No alcohol is sold on RestoHouse.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
