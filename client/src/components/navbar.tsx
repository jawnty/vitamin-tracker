import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { Pill } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col">
        {/* Top row with centered logo and title */}
        <div className="flex justify-center items-center h-14 border-b">
          <Link href="/" className="flex items-center space-x-2">
            <Pill className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Vitamin Tracker</span>
          </Link>
        </div>

        {/* Bottom row with navigation and sign out */}
        <div className="flex h-12 items-center justify-between">
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/" className="transition-colors hover:text-foreground/80">
              Track
            </Link>
            <Link href="/vitamins" className="transition-colors hover:text-foreground/80">
              Manage Vitamins
            </Link>
          </nav>
          <Button
            variant="ghost"
            onClick={() => auth.signOut()}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}