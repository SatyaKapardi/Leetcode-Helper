import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { InsertProblem } from "@shared/schema";

interface AddSolutionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddSolutionModal({ onClose, onSuccess }: AddSolutionModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    problemNumber: "",
    title: "",
    difficulty: "",
    category: "",
    description: "",
    notes: "",
    solution: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertProblem) => {
      const response = await apiRequest("POST", "/api/problems", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Solution added successfully" });
      onSuccess();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ 
        title: "Error", 
        description: "Failed to add solution",
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.problemNumber || !formData.title || !formData.difficulty || !formData.solution) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    createMutation.mutate({
      problemNumber: parseInt(formData.problemNumber),
      title: formData.title,
      difficulty: formData.difficulty,
      category: formData.category || undefined,
      description: formData.description || undefined,
      notes: formData.notes || undefined,
      solution: formData.solution,
    });
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Solution</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="problemNumber">Problem Number *</Label>
              <Input
                id="problemNumber"
                type="number"
                placeholder="e.g., 1"
                value={formData.problemNumber}
                onChange={(e) => updateField("problemNumber", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Problem Name *</Label>
              <Input
                id="title"
                placeholder="e.g., Two Sum"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty *</Label>
              <Select value={formData.difficulty} onValueChange={(value) => updateField("difficulty", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Array, Hash Table"
                value={formData.category}
                onChange={(e) => updateField("category", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Problem Description</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Paste or describe the problem..."
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">My Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Your thoughts, approach, key insights..."
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="solution">My Solution *</Label>
            <Textarea
              id="solution"
              rows={12}
              placeholder="Paste your code solution here..."
              value={formData.solution}
              onChange={(e) => updateField("solution", e.target.value)}
              className="font-mono text-sm resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createMutation.isPending ? "Saving..." : "Save Solution"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
