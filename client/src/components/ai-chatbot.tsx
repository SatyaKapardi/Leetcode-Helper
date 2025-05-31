import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Send } from "lucide-react";
import type { Problem, ChatMessage } from "@shared/schema";

interface AiChatbotProps {
  problemId: number;
  problem: Problem;
}

export function AiChatbot({ problemId, problem }: AiChatbotProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: [`/api/problems/${problemId}/chat`],
    refetchInterval: false,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const response = await apiRequest("POST", `/api/problems/${problemId}/chat`, {
        message: messageText,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/problems/${problemId}/chat`] });
      setMessage("");
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
        description: "Failed to send message",
        variant: "destructive" 
      });
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Send initial greeting if no messages
  useEffect(() => {
    if (messages.length === 0 && !isLoading) {
      sendMessageMutation.mutate("Hi! Can you help me understand this problem?");
    }
  }, [messages.length, isLoading]);

  return (
    <div className="w-80 border-l border-slate-200 flex flex-col bg-slate-50">
      <div className="px-4 py-3 border-b border-slate-200 bg-white">
        <h4 className="font-semibold text-slate-900 flex items-center">
          <Bot className="text-blue-600 h-5 w-5 mr-2" />
          AI Assistant
        </h4>
        <p className="text-xs text-slate-500 mt-1">Ask about your code or solution</p>
      </div>

      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center text-slate-500 text-sm">Loading chat...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-slate-500 text-sm">Starting conversation...</div>
          ) : (
            messages.map((msg: ChatMessage) => (
              <div 
                key={msg.id} 
                className={`flex items-start space-x-2 ${msg.isAi === "false" ? "justify-end" : ""}`}
              >
                {msg.isAi === "true" && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="text-white h-3 w-3" />
                  </div>
                )}
                
                <div 
                  className={`p-3 rounded-lg shadow-sm text-sm max-w-xs ${
                    msg.isAi === "true" 
                      ? "bg-white" 
                      : "bg-blue-600 text-white"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.message}</div>
                </div>

                {msg.isAi === "false" && (
                  <div className="w-6 h-6 bg-slate-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="text-white h-3 w-3" />
                  </div>
                )}
              </div>
            ))
          )}
          
          {sendMessageMutation.isPending && (
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="text-white h-3 w-3" />
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm text-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex space-x-2">
          <Input
            placeholder="Ask about your code..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sendMessageMutation.isPending}
            className="text-sm"
          />
          <Button 
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
