import React from "react";
import { Link, Outlet } from "react-router-dom";

interface LayoutProps {
  isAdmin?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ isAdmin = false }) => {
  return (
    <div className="min-h-screen bg-paper">
      <header className="px-4 py-6 bg-yellowedPaper border-b-3 border-oldInk">
        <div className="container mx-auto">
          <h1 className="newspaper-headline">The Better Bench</h1>
          <div className="flex justify-between items-center mt-4">
            <p className="font-mono text-xs text-oldInk">EST. 2025</p>
            <p className="font-mono text-xs text-oldInk">LAMBERT & FRIENDS</p>
          </div>

          <nav className="mt-6 pt-2 border-t border-oldInk flex justify-center space-x-6 text-sm font-serif">
            <Link
              to="/"
              className="uppercase tracking-wider text-accent1 hover:underline"
            >
              Front Page
            </Link>
            <Link
              to="/gallery"
              className="uppercase tracking-wider text-accent1 hover:underline"
            >
              Gallery
            </Link>
            <Link
              to="/map"
              className="uppercase tracking-wider text-accent1 hover:underline"
            >
              Map
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="uppercase tracking-wider text-accent1 hover:underline"
              >
                Editor's Desk
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="mt-8 py-6 bg-newsprint border-t border-oldInk text-center">
        <div className="container mx-auto">
          <p className="font-serif text-sm text-oldInk">
            ©2025 The Better Bench • All Rights Reserved
          </p>
          <p className="font-mono text-xs text-oldInk mt-2">
            Printed on recycled digital paper
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
