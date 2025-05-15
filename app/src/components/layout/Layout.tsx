import React from "react";
import { Link, Outlet } from "react-router-dom";

interface LayoutProps {
  isAdmin?: boolean;
}

const Layout: React.FC<LayoutProps> = () => {
  return (
    <div className="min-h-screen bg-paper">
      <header className="px-4 pb-6 pt-8 bg-yellowedPaper border-b-3 border-old-ink">
        <div className="container mx-auto">
          <h1 className="newspaper-headline">The Better Bench</h1>
          <div className="flex justify-between items-center mt-4">
            <p className="font-mono text-xs text-old-ink">EST. 2025</p>
            <p className="font-mono text-xs text-old-ink">LAMBERT & FRIENDS</p>
          </div>

          <nav className="mt-6 pt-6 border-t border-old-ink flex justify-center space-x-8 text-sm font-serif">
            <Link
              to="/"
              className="uppercase tracking-wider text-accent1 hover:translate-x-px hover:translate-y-px"
            >
              Front Page
            </Link>
            <Link
              to="/gallery"
              className="uppercase tracking-wider text-accent1 hover:translate-x-px hover:translate-y-px"
            >
              Gallery
            </Link>
            <Link
              to="/map"
              className="uppercase tracking-wider text-accent1 hover:translate-x-px hover:translate-y-px"
            >
              Map
            </Link>
            <Link
              to="/admin"
              className="uppercase tracking-wider text-accent1 hover:translate-x-px hover:translate-y-px"
            >
              Editor's Desk
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="mt-8 py-6 bg-newsprint border-t border-old-ink text-center">
        <div className="container mx-auto">
          <p className="font-serif text-sm text-old-ink">
            ©2025 The Better Bench • All Rights Reserved
          </p>
          <p className="font-mono text-xs text-old-ink mt-2">
            Printed on recycled digital paper
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
