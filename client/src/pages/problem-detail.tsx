import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/sidebar";
import { AiChatbot } from "@/components/ai-chatbot";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Edit, Play, Save } from "lucide-react";
import { useLocation } from "wouter";
import type { Problem } from "@shared/schema";

interface ProblemDetailProps {
  params: { id: string };
}

export default function ProblemDetail({ params }: ProblemDetailProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");
  const [editedSolution, setEditedSolution] = useState("");

  const problemId = parseInt(params.id);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: problem, isLoading: problemLoading } = useQuery({
    queryKey: [`/api/problems/${problemId}`],
    enabled: isAuthenticated && !isNaN(problemId),
  });

  const { data: analysis } = useQuery({
    queryKey: [`/api/problems/${problemId}/analyze`],
    enabled: isAuthenticated && !!problem,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Problem>) => {
      const response = await apiRequest("PUT", `/api/problems/${problemId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Problem updated successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/problems/${problemId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/problems"] });
      setIsEditing(false);
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
        description: "Failed to update problem",
        variant: "destructive" 
      });
    },
  });

  useEffect(() => {
    if (problem && !isEditing) {
      setEditedNotes(problem.notes || "");
      setEditedSolution(problem.solution || "");
    }
  }, [problem, isEditing]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy": return "bg-emerald-100 text-emerald-800";
      case "medium": return "bg-amber-100 text-amber-800";
      case "hard": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const handleSave = () => {
    updateMutation.mutate({
      notes: editedNotes,
      solution: editedSolution,
    });
  };

  const handleCancel = () => {
    setEditedNotes(problem?.notes || "");
    setEditedSolution(problem?.solution || "");
    setIsEditing(false);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (problemLoading) {
    return (
      <div className="min-h-screen flex bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          Loading problem...
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen flex bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Problem Not Found</h2>
            <p className="text-slate-600 mb-4">The problem you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation("/")}>Back to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 flex">
        {/* Problem Content */}
        <div className="flex-1 flex flex-col">
          <header className="bg-white border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  #{problem.problemNumber}. {problem.title}
                </h2>
                <div className="flex items-center space-x-3 mt-1">
                  <Badge className={getDifficultyColor(problem.difficulty)}>
                    {problem.difficulty}
                  </Badge>
                  {problem.category && (
                    <span className="text-sm text-slate-500">{problem.category}</span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-6 space-y-6">
            {/* Problem Description */}
            {problem.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Problem Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {problem.description}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analysis */}
            {analysis && (
              <Card>
                <CardHeader>
                  <CardTitle>Complexity Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-sm font-medium text-slate-600">Time Complexity:</span>
                      <p className="font-mono text-sm">{analysis.timeComplexity}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-600">Space Complexity:</span>
                      <p className="font-mono text-sm">{analysis.spaceComplexity}</p>
                    </div>
                  </div>
                  {analysis.suggestions.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-slate-600">Suggestions:</span>
                      <ul className="list-disc list-inside text-sm text-slate-700 mt-1">
                        {analysis.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* My Notes */}
            <Card>
              <CardHeader>
                <CardTitle>My Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Add your notes about this problem..."
                    rows={4}
                    className="resize-none"
                  />
                ) : (
                  <div className="bg-slate-50 p-4 rounded-lg min-h-[100px]">
                    {problem.notes ? (
                      <div className="whitespace-pre-wrap text-sm">{problem.notes}</div>
                    ) : (
                      <div className="text-slate-500 text-sm">No notes added yet.</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* My Solution */}
            <Card>
              <CardHeader>
                <CardTitle>My Solution</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editedSolution}
                    onChange={(e) => setEditedSolution(e.target.value)}
                    placeholder="Paste your code solution here..."
                    rows={12}
                    className="font-mono text-sm resize-none"
                  />
                ) : (
                  <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm font-mono text-slate-100 whitespace-pre-wrap">
                      {problem.solution}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {isEditing ? (
                <>
                  <Button 
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateMutation.isPending}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Solution
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* AI Chatbot Sidebar */}
        <AiChatbot problemId={problemId} problem={problem} />
      </div>
    </div>
  );
}
