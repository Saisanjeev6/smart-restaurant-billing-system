
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getFullRestaurantConfig, saveRestaurantSettings, type RestaurantConfig } from '@/lib/restaurantSettings';
import { Settings, Save, Percent, Building, MapPin } from 'lucide-react';

export function RestaurantSettingsTool() {
  const [settings, setSettings] = useState<RestaurantConfig>({
    tableCount: 20,
    taxRate: 0.08, // store as decimal
    restaurantName: '',
    restaurantAddress: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const currentConfig = getFullRestaurantConfig();
    setSettings(currentConfig);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    
    // Prepare settings for saving, taxRate needs conversion if entered as percentage
    const settingsToSave: Partial<RestaurantConfig> = {
      ...settings,
      taxRate: parseFloat(String(settings.taxRate)), // Ensure taxRate is treated as a number by saveRestaurantSettings
    };

    const result = saveRestaurantSettings(settingsToSave);
    setIsLoading(false);

    if (result.success) {
      toast({ title: 'Settings Saved', description: result.message });
      // Refresh settings in form to reflect stored values (e.g. tax rate converted to decimal)
      setSettings(getFullRestaurantConfig());
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };

  return (
    <Card className="shadow-lg max-w-lg mx-auto">
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
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="restaurantName" className="flex items-center gap-1"><Building className="w-4 h-4 text-muted-foreground" />Restaurant Name</Label>
            <Input
              id="restaurantName"
              name="restaurantName"
              value={settings.restaurantName}
              onChange={handleInputChange}
              placeholder="e.g., The Cozy Corner Cafe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurantAddress" className="flex items-center gap-1"><MapPin className="w-4 h-4 text-muted-foreground" />Restaurant Address</Label>
            <Textarea
              id="restaurantAddress"
              name="restaurantAddress"
              value={settings.restaurantAddress}
              onChange={handleInputChange}
              placeholder="e.g., 123 Main Street, Anytown, CA 90210"
              required
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tableCount">Number of Tables</Label>
              <Input
                id="tableCount"
                name="tableCount"
                type="number"
                value={settings.tableCount}
                onChange={handleInputChange}
                placeholder="e.g., 20"
                min="1"
                max="100"
                required
              />
              <p className="text-xs text-muted-foreground">
                Total tables available (1-100).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate" className="flex items-center gap-1"><Percent className="w-4 h-4 text-muted-foreground" />Tax Rate (%)</Label>
              <Input
                id="taxRate"
                name="taxRate"
                type="number"
                // Display as percentage, but internally it's handled by saveRestaurantSettings
                value={settings.taxRate * 100} 
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSettings(prev => ({ ...prev, taxRate: isNaN(val) ? 0 : val / 100 }));
                }}
                placeholder="e.g., 8 for 8%"
                min="0"
                max="100"
                step="0.01"
                required
              />
              <p className="text-xs text-muted-foreground">
                Sales tax as a percentage (e.g., 8 for 8%).
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Save className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save All Settings
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
