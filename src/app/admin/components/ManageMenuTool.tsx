
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, type NewMenuItem } from '@/lib/menuManager';
import type { MenuItem } from '@/types';
import { Utensils, PlusCircle, ListPlus, Pencil, Trash2, XCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ManageMenuTool() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    setMenuItems(getMenuItems());
  }, []);

  const resetForm = () => {
    setItemName('');
    setItemPrice('');
    setItemCategory('');
    setIsEditing(false);
    setEditingItemId(null);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!itemName.trim() || !itemPrice.trim() || !itemCategory.trim()) {
      toast({ title: 'Error', description: 'Name, price, and category cannot be empty.', variant: 'destructive' });
      return;
    }
    const price = parseFloat(itemPrice);
    if (isNaN(price) || price <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid positive price.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    let result;
    if (isEditing && editingItemId) {
      result = updateMenuItem(editingItemId, { name: itemName, price, category: itemCategory });
    } else {
      const newItemData: NewMenuItem = { name: itemName, price, category: itemCategory };
      result = addMenuItem(newItemData);
    }
    setIsLoading(false);

    if (result.success) {
      toast({ title: 'Success', description: result.message });
      setMenuItems(result.menuItems || getMenuItems());
      resetForm();
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setIsEditing(true);
    setEditingItemId(item.id);
    setItemName(item.name);
    setItemPrice(String(item.price));
    setItemCategory(item.category);
  };

  const handleDeleteItem = (item: MenuItem) => {
    setDeletingItem(item);
    setShowDeleteDialog(true);
  };

  const confirmDeleteItem = () => {
    if (!deletingItem) return;
    setIsLoading(true);
    const result = deleteMenuItem(deletingItem.id);
    setIsLoading(false);
    setShowDeleteDialog(false);

    if (result.success) {
      toast({ title: 'Success', description: result.message });
      setMenuItems(result.menuItems || getMenuItems());
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
    setDeletingItem(null);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            {isEditing ? <Pencil className="text-primary" /> : <ListPlus className="text-primary" />}
            {isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}
          </CardTitle>
          <CardDescription>
            {isEditing ? `Update the details for "${menuItems.find(item => item.id === editingItemId)?.name ?? 'item'}".` : "Add new dishes, drinks, or other items to the restaurant's menu."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="itemName">Item Name</Label>
              <Input
                id="itemName"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g., Paneer Tikka Masala"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="itemPrice">Price (₹)</Label>
              <Input
                id="itemPrice"
                type="number"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                placeholder="e.g., 450"
                required
                min="0.01"
                step="0.01"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="itemCategory">Category</Label>
              <Input
                id="itemCategory"
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value)}
                placeholder="e.g., Main Course, Appetizer, Drink"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" className="w-full sm:flex-1" disabled={isLoading}>
              {isLoading ? (
                <ListPlus className="mr-2 h-4 w-4 animate-spin" />
              ) : isEditing ? (
                <Pencil className="mr-2 h-4 w-4" />
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              {isEditing ? 'Save Changes' : 'Add Item to Menu'}
            </Button>
            {isEditing && (
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={resetForm} disabled={isLoading}>
                <XCircle className="mr-2 h-4 w-4" /> Cancel Edit
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><Utensils className="text-primary" /> Current Menu Items</CardTitle>
          <CardDescription>List of all items available on the menu. Click actions to manage.</CardDescription>
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
                  <TableHead>Price (₹)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menuItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>₹{item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleEditItem(item)} disabled={isLoading || (isEditing && editingItemId === item.id)} className="mr-2">
                        <Pencil className="mr-1 h-3 w-3" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(item)} disabled={isLoading || (isEditing && editingItemId === item.id)}>
                        <Trash2 className="mr-1 h-3 w-3" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete "{deletingItem?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The menu item will be permanently removed.
              It will still appear on past orders but cannot be added to new orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingItem(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
              {isLoading ? <Trash2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
