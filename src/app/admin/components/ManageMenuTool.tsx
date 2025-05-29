
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { getMenuItems, addMenuItem, type NewMenuItem } from '@/lib/menuManager';
import type { MenuItem } from '@/types';
import { Utensils, PlusCircle, ListPlus } from 'lucide-react';

export function ManageMenuTool() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMenuItems(getMenuItems());
  }, []);

  const handleAddMenuItem = (event: FormEvent) => {
    event.preventDefault();
    if (!newItemName.trim() || !newItemPrice.trim() || !newItemCategory.trim()) {
      toast({ title: 'Error', description: 'Name, price, and category cannot be empty.', variant: 'destructive' });
      return;
    }
    const price = parseFloat(newItemPrice);
    if (isNaN(price) || price <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid positive price.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const newItemData: NewMenuItem = { name: newItemName, price, category: newItemCategory };
    const result = addMenuItem(newItemData);
    setIsLoading(false);

    if (result.success) {
      toast({ title: 'Success', description: result.message });
      setMenuItems(result.menuItems || getMenuItems());
      setNewItemName('');
      setNewItemPrice('');
      setNewItemCategory('');
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><ListPlus className="text-primary" /> Add New Menu Item</CardTitle>
          <CardDescription>Add new dishes, drinks, or other items to the restaurant's menu.</CardDescription>
        </CardHeader>
        <form onSubmit={handleAddMenuItem}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="newItemName">Item Name</Label>
              <Input
                id="newItemName"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g., Paneer Tikka Masala"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="newItemPrice">Price (₹)</Label>
              <Input
                id="newItemPrice"
                type="number"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                placeholder="e.g., 450"
                required
                min="0.01"
                step="0.01"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="newItemCategory">Category</Label>
              <Input
                id="newItemCategory"
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                placeholder="e.g., Main Course, Appetizer, Drink"
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <ListPlus className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Add Item to Menu
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><Utensils className="text-primary" /> Current Menu Items</CardTitle>
          <CardDescription>List of all items available on the menu.</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[400px] overflow-y-auto">
          {menuItems.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground">No menu items configured yet. Add items using the form.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menuItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
