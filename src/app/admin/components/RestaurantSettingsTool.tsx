
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getTableCount, saveTableCount } from '@/lib/restaurantSettings';
import { Settings, Save } from 'lucide-react';

export function RestaurantSettingsTool() {
  const [tableCount, setTableCount] = useState<number>(20);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setTableCount(getTableCount());
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    const result = saveTableCount(Number(tableCount)); // Ensure tableCount is a number
    setIsLoading(false);

    if (result.success) {
      toast({ title: 'Settings Saved', description: result.message });
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };

  return (
    <Card className="shadow-lg max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Settings className="text-primary" />
          Restaurant Settings
        </CardTitle>
        <CardDescription>
          Configure general settings for the restaurant application.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="tableCount">Number of Tables</Label>
            <Input
              id="tableCount"
              type="number"
              value={tableCount}
              onChange={(e) => setTableCount(parseInt(e.target.value, 10) || 0)}
              placeholder="e.g., 20"
              min="1"
              max="100" // Setting a practical upper limit
              required
            />
            <p className="text-xs text-muted-foreground">
              Set the total number of tables available in the restaurant (1-100).
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Save className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Settings
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
