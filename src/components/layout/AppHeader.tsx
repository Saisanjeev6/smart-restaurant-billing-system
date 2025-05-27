
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Utensils, LogOut, UserCircle, ShieldAlert, Soup } from 'lucide-react'; // Added Soup
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
  }, [pathname]); // Re-check user on pathname change

  const handleLogout = () => {
    logout();
    setCurrentUser(null); 
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/'); 
  };

  const homeIconHref = '/';
  const isUtensilsIconLinkActive = pathname !== '/';


  if (!isMounted) {
    return (
      <header className="sticky top-0 z-30 flex items-center justify-between p-4 border-b shadow-sm bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Utensils className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl text-foreground">{title}</h1>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between p-4 border-b shadow-sm bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {isUtensilsIconLinkActive ? (
          <Link href={homeIconHref} aria-label="Home" className="transition-colors group">
            <Utensils className="w-8 h-8 text-primary group-hover:text-primary/80" />
          </Link>
        ) : (
          <Utensils className="w-8 h-8 text-primary" />
        )}
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl text-foreground">{title}</h1>
      </div>
      {currentUser && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {currentUser.role === 'admin' && <ShieldAlert className="w-4 h-4 text-destructive" />}
            {currentUser.role === 'waiter' && <UserCircle className="w-4 h-4 text-primary" />}
            {currentUser.role === 'kitchen' && <Soup className="w-4 h-4 text-green-600" />}
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
