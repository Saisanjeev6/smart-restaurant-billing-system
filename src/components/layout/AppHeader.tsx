import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Utensils } from 'lucide-react';

interface AppHeaderProps {
  title: string;
  showBackButton?: boolean;
}

export function AppHeader({ title, showBackButton = true }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between p-4 border-b shadow-sm bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button variant="outline" size="icon" asChild className="rounded-full">
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
              <span className="sr-only">Back to Home</span>
            </Link>
          </Button>
        )}
        {!showBackButton && <Utensils className="w-8 h-8 text-primary" />}
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl text-foreground">{title}</h1>
      </div>
    </header>
  );
}
