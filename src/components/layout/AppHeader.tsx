
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Utensils, LogOut, UserCircle, ShieldAlert } from 'lucide-react';
import { getCurrentUser, logout } from '@/lib/auth';
import type { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setCurrentUser(getCurrentUser());
  }, [pathname]); // Re-check user on pathname change, e.g., after login/logout

  const handleLogout = () => {
    logout();
    setCurrentUser(null); // Update state immediately
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/'); // Redirect to the main home page after logout
  };

  // The Utensils icon (Home button) always links to the main home page '/'
  const homeIconHref = '/';
  // The icon is an active link unless the user is already on the home page '/'
  const isUtensilsIconLinkActive = pathname !== '/';

  // Header during initial mount / loading state
  if (!isMounted) {
    return (
      <header className="sticky top-0 z-30 flex items-center justify-between p-4 border-b shadow-sm bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Static icon during load to prevent incorrect links */}
          <Utensils className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl text-foreground">{title}</h1>
        </div>
        {/* No user info or logout button during loading state */}
      </header>
    );
  }

  // Render the header
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between p-4 border-b shadow-sm bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {isUtensilsIconLinkActive ? (
          <Link href={homeIconHref} aria-label="Home" className="transition-colors group">
            <Utensils className="w-8 h-8 text-primary group-hover:text-primary/80" />
          </Link>
        ) : (
          // Static icon if already on the home page
          <Utensils className="w-8 h-8 text-primary" />
        )}
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl text-foreground">{title}</h1>
      </div>
      {currentUser && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {currentUser.role === 'admin' ? <ShieldAlert className="w-4 h-4 text-destructive" /> : <UserCircle className="w-4 h-4 text-primary" />}
            <span>{currentUser.username} ({currentUser.role})</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      )}
    </header>
  );
}
