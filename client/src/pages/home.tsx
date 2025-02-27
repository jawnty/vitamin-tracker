import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Vitamin, VitaminIntake } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export default function Home() {
  const [date, setDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { toast } = useToast();

  const { data: vitamins, isLoading: isLoadingVitamins } = useQuery<Vitamin[]>({
    queryKey: ["/api/vitamins"],
    enabled: !!auth.currentUser,
  });

  const { data: intake, isLoading: isLoadingIntake } = useQuery<VitaminIntake[]>({
    queryKey: ["/api/vitamin-intake", { date: date.toISOString().split('T')[0] }],
    queryFn: async ({ queryKey }) => {
      const [url, params] = queryKey;
      const searchParams = new URLSearchParams({ date: (params as any).date });
      const response = await fetch(`${url}?${searchParams}`, {
        headers: {
          "X-User-ID": auth.currentUser?.uid || "",
        },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    enabled: !!auth.currentUser,
  });

  // Force refetch when auth state changes
  useEffect(() => {
    if (auth.currentUser) {
      queryClient.invalidateQueries({ queryKey: ["/api/vitamins"] });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/vitamin-intake", { date: date.toISOString().split('T')[0] }]
      });
    }
  }, [auth.currentUser, date]);

  const { mutate: updateIntake } = useMutation({
    mutationFn: async (data: { vitaminId: number; taken: boolean }) => {
      const response = await apiRequest("POST", "/api/vitamin-intake", {
        vitaminId: data.vitaminId,
        date: date.toISOString().split('T')[0],
        taken: data.taken,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/vitamin-intake", { date: date.toISOString().split('T')[0] }]
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update vitamin intake",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container py-6">
      <Card>
        <CardHeader>
          <CardTitle>Daily Vitamins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, 'PPP')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select Date</DialogTitle>
              </DialogHeader>
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  if (newDate) {
                    setDate(newDate);
                    setCalendarOpen(false);
                  }
                }}
                className="rounded-md border"
              />
            </DialogContent>
          </Dialog>

          <div className="space-y-4">
            {isLoadingVitamins || isLoadingIntake ? (
              // Show loading skeletons
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-3 w-[70px]" />
                  </div>
                </div>
              ))
            ) : vitamins?.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No vitamins added yet. Add some vitamins in the Manage Vitamins page.
              </p>
            ) : (
              vitamins?.map((vitamin) => {
                const taken = intake?.some(
                  (i) => i.vitaminId === vitamin.id && i.taken
                );

                return (
                  <div
                    key={vitamin.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      checked={taken}
                      onCheckedChange={(checked) =>
                        updateIntake({
                          vitaminId: vitamin.id,
                          taken: checked as boolean,
                        })
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {vitamin.name}
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {vitamin.dosage}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}