
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Utensils, LogOut, UserCircle, ShieldAlert } from 'lucide-react'; // Removed ArrowLeft, HomeIcon
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
    router.push('/login'); // Redirect to login page
  };

  const isLoginPage = pathname === '/login';

  // Determine the href for the "Home" Utensils icon
  let homeIconHref = '/';
  if (currentUser) {
    if (currentUser.role === 'admin') {
      homeIconHref = '/admin';
    } else if (currentUser.role === 'waiter') {
      homeIconHref = '/waiter';
    }
  }

  // Determine if the Utensils icon should be a link or static
  // It's static if:
  // 1. On the main home page ('/') AND not logged in.
  // 2. On the login page ('/login') AND not logged in.
  const isUtensilsIconLinkActive = !((pathname === '/' && !currentUser) || (isLoginPage && !currentUser));


  // Minimal header for login page when not logged in
  if (isLoginPage && !currentUser && isMounted) { // Added isMounted to ensure this renders after initial check
     return (
        <header className="sticky top-0 z-30 flex items-center justify-between p-4 border-b shadow-sm bg-background/80 backdrop-blur-md">
            <div className="flex items-center gap-3"> {/* Consistent gap */}
                <Utensils className="w-8 h-8 text-primary" /> {/* Static icon */}
                <h1 className="text-xl font-semibold tracking-tight md:text-2xl text-foreground">{title}</h1>
            </div>
        </header>
     );
  }

  // Header during initial mount / loading state
  if (!isMounted) {
    // When !isMounted, currentUser is effectively null for this render pass.
    // isUtensilsIconLinkActive will be calculated based on pathname assuming no user.
    const showLinkWhileLoading = !((pathname === '/' ) || (pathname === '/login'));
    return (
      <header className="sticky top-0 z-30 flex items-center justify-between p-4 border-b shadow-sm bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {showLinkWhileLoading ? (
            <Link href="/" aria-label="Home" className="text-primary hover:text-primary/80 transition-colors">
              <Utensils className="w-8 h-8" />
            </Link>
          ) : (
            <Utensils className="w-8 h-8 text-primary" />
          )}
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl text-foreground">{title}</h1>
        </div>
      </header>
    );
  }

  // Default full header for logged-in users or other pages
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between p-4 border-b shadow-sm bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {isUtensilsIconLinkActive ? (
          <Link href={homeIconHref} aria-label="Home" className="text-primary hover:text-primary/80 transition-colors">
            <Utensils className="w-8 h-8" />
          </Link>
        ) : (
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
