'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Utensils, LogOut, UserCircle, ShieldAlert } from 'lucide-react';
import { getCurrentUser, logout } from '@/lib/auth';
import type { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AppHeaderProps {
  title: string;
  showBackButton?: boolean; // This prop can be overridden by route logic
}

export function AppHeader({ title, showBackButton: propShowBackButton = true }: AppHeaderProps) {
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

  // Determine header visibility and features based on route
  const isLoginPage = pathname === '/login';
  const isHomePage = pathname === '/';

  let effectiveShowBackButton = propShowBackButton;
  if (isLoginPage || isHomePage) {
    effectiveShowBackButton = false;
  }
  
  if (isLoginPage && !currentUser) { // Don't show full app header on login page if not logged in yet
     return (
        <header className="sticky top-0 z-30 flex items-center justify-between p-4 border-b shadow-sm bg-background/80 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <Utensils className="w-8 h-8 text-primary" />
                <h1 className="text-xl font-semibold tracking-tight md:text-2xl text-foreground">{title}</h1>
            </div>
        </header>
     );
  }


  if (!isMounted) { // Avoid hydration mismatch by not rendering user-specific things until mounted
    return (
      <header className="sticky top-0 z-30 flex items-center justify-between p-4 border-b shadow-sm bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
           {effectiveShowBackButton && (
             <Button variant="outline" size="icon" asChild className="rounded-full">
                <Link href="/">
                  <ArrowLeft className="w-5 h-5" />
                  <span className="sr-only">Back to Home</span>
                </Link>
              </Button>
           )}
          {!effectiveShowBackButton && <Utensils className="w-8 h-8 text-primary" />}
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl text-foreground">{title}</h1>
        </div>
      </header>
    );
  }


  return (
    <header className="sticky top-0 z-30 flex items-center justify-between p-4 border-b shadow-sm bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {effectiveShowBackButton && (
          <Button variant="outline" size="icon" asChild className="rounded-full">
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
              <span className="sr-only">Back to Home</span>
            </Link>
          </Button>
        )}
        {!effectiveShowBackButton && <Utensils className="w-8 h-8 text-primary" />}
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
