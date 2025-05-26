'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { suggestTip, type SuggestTipInput, type SuggestTipOutput } from '@/ai/flows/tip-suggestion';
import { Loader2, Sparkles, Percent, DollarSign } from 'lucide-react';

const tipSuggestionSchema = z.object({
  customerFeedback: z.string().min(10, 'Feedback should be at least 10 characters.'),
  orderDetails: z.string().min(5, 'Order details are required.'),
  paymentInfo: z.string().min(3, 'Payment info is required.'),
});

type TipSuggestionFormValues = z.infer<typeof tipSuggestionSchema>;

interface TipSuggestionToolProps {
  initialOrderDetails?: string;
}

export function TipSuggestionTool({ initialOrderDetails = "" }: TipSuggestionToolProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestTipOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<TipSuggestionFormValues>({
    resolver: zodResolver(tipSuggestionSchema),
    defaultValues: {
      customerFeedback: '',
      orderDetails: initialOrderDetails,
      paymentInfo: '',
    },
  });
  
  // useEffect to update orderDetails if initialOrderDetails changes
  // This might be useful if the component is part of a larger form that dynamically loads order info
  useState(() => {
    if (initialOrderDetails) {
      form.reset({ ...form.getValues(), orderDetails: initialOrderDetails });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  });


  const onSubmit: SubmitHandler<TipSuggestionFormValues> = async (data) => {
    setIsLoading(true);
    setSuggestion(null);
    try {
      const result = await suggestTip(data as SuggestTipInput);
      setSuggestion(result);
      toast({ title: 'Tip Suggestion Ready', description: 'AI has provided a tip recommendation.' });
    } catch (error) {
      console.error('Error suggesting tip:', error);
      toast({ title: 'Error', description: 'Failed to get tip suggestion.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl"><Sparkles className="text-primary" /> AI Tip Suggester</CardTitle>
        <CardDescription>Get AI-powered tip recommendations based on customer experience.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="customerFeedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Feedback</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., The food was amazing and service was excellent!" {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="orderDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Details</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., 2x Pizza, 1x Salad. Total: $45.50" {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Information</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Paid with Visa ending 1234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Suggest Tip
            </Button>
            {suggestion && (
              <Card className="p-4 bg-secondary/50">
                <CardTitle className="mb-2 text-lg">Suggestion:</CardTitle>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center"><Percent className="w-4 h-4 mr-2 text-primary" /><strong>Suggested Tip Percentage:</strong> {suggestion.suggestedTipPercentage.toFixed(1)}%</p>
                  <p className="flex items-center"><DollarSign className="w-4 h-4 mr-2 text-primary" /><strong>Suggested Tip Amount:</strong> ${suggestion.suggestedTipAmount.toFixed(2)}</p>
                  <p><strong>Reasoning:</strong> {suggestion.reasoning}</p>
                </div>
              </Card>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
