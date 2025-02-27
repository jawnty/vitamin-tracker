import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { Pill } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Pill className="h-6 w-6 text-primary" />
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/" className="transition-colors hover:text-foreground/80">
              Track
            </Link>
            <Link href="/vitamins" className="transition-colors hover:text-foreground/80">
              Manage Vitamins
            </Link>
          </nav>
        </div>
        <div className="flex-1" />
        <Button
          variant="ghost"
          onClick={() => auth.signOut()}
        >
          Sign Out
        </Button>
      </div>
    </nav>
  );
}