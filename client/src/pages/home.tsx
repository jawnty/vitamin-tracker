import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Vitamin, VitaminIntake } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, Pill } from "lucide-react";
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

  // Calculate completion percentage
  const completionPercentage = vitamins && intake ? 
    Math.round((vitamins.filter(vitamin => 
      intake.some(i => 
        i.vitaminId === vitamin.id && 
        i.taken && 
        new Date(i.date).toISOString().split('T')[0] === date.toISOString().split('T')[0]
      )
    ).length / vitamins.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 dark:from-green-950 dark:to-slate-950">
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Vitamins</CardTitle>
            <CardDescription>Track your daily vitamin intake</CardDescription>
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

            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Today's Progress</span>
                <span className="text-sm font-medium">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>

            <div className="space-y-4">
              {isLoadingVitamins || isLoadingIntake ? (
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
                    <Card
                      key={vitamin.id}
                      className={`bg-white dark:bg-slate-900 shadow-sm transition-all ${taken ? "border-green-200 dark:border-green-800" : ""}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${taken ? "bg-green-100 dark:bg-green-900" : "bg-slate-100 dark:bg-slate-800"}`}
                            >
                              <Pill
                                className={`h-5 w-5 ${taken ? "text-green-600 dark:text-green-400" : "text-slate-400 dark:text-slate-500"}`}
                              />
                            </div>
                            <div>
                              <h3 className="font-medium">{vitamin.name}</h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{vitamin.dosage}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {taken ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 dark:bg-green-900 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-800"
                                onClick={() => updateIntake({
                                  vitaminId: vitamin.id,
                                  taken: false
                                })}
                              >
                                Taken
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="gap-1 bg-green-600 hover:bg-green-700"
                                onClick={() => updateIntake({
                                  vitaminId: vitamin.id,
                                  taken: true
                                })}
                              >
                                Take Now
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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