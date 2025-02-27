import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Vitamin, VitaminIntake } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [date, setDate] = useState<Date>(new Date());
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
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => date && setDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Vitamins</CardTitle>
          </CardHeader>
          <CardContent>
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
    </div>
  );
}