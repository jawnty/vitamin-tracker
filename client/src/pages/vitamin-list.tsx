import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Pencil, Trash } from "lucide-react";
import type { Vitamin } from "@shared/schema";

function VitaminForm({ 
  onSubmit,
  defaultValues,
}: { 
  onSubmit: (data: { name: string; dosage: string }) => void;
  defaultValues?: Vitamin;
}) {
  const [name, setName] = useState(defaultValues?.name || "");
  const [dosage, setDosage] = useState(defaultValues?.dosage || "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, dosage });
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dosage">Dosage</Label>
        <Input
          id="dosage"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full">
        {defaultValues ? "Update" : "Add"} Vitamin
      </Button>
    </form>
  );
}

export default function VitaminList() {
  const { toast } = useToast();
  const [editingVitamin, setEditingVitamin] = useState<Vitamin | null>(null);

  const { data: vitamins } = useQuery<Vitamin[]>({
    queryKey: ["/api/vitamins"],
  });

  const { mutate: createVitamin } = useMutation({
    mutationFn: async (data: { name: string; dosage: string }) => {
      return apiRequest("POST", "/api/vitamins", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vitamins"] });
      toast({ title: "Success", description: "Vitamin added successfully" });
    },
  });

  const { mutate: updateVitamin } = useMutation({
    mutationFn: async (data: { id: number; name: string; dosage: string }) => {
      return apiRequest("PATCH", `/api/vitamins/${data.id}`, {
        name: data.name,
        dosage: data.dosage,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vitamins"] });
      toast({ title: "Success", description: "Vitamin updated successfully" });
      setEditingVitamin(null);
    },
  });

  const { mutate: deleteVitamin } = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/vitamins/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vitamins"] });
      toast({ title: "Success", description: "Vitamin deleted successfully" });
    },
  });

  return (
    <div className="container py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Manage Vitamins</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Vitamin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Vitamin</DialogTitle>
              </DialogHeader>
              <VitaminForm onSubmit={createVitamin} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vitamins?.map((vitamin) => (
              <div
                key={vitamin.id}
                className="flex items-center justify-between border p-4 rounded-lg"
              >
                <div>
                  <h3 className="font-medium">{vitamin.name}</h3>
                  <p className="text-sm text-muted-foreground">{vitamin.dosage}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setEditingVitamin(vitamin)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => deleteVitamin(vitamin.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingVitamin} onOpenChange={() => setEditingVitamin(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Vitamin</DialogTitle>
          </DialogHeader>
          {editingVitamin && (
            <VitaminForm
              defaultValues={editingVitamin}
              onSubmit={(data) =>
                updateVitamin({ id: editingVitamin.id, ...data })
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
