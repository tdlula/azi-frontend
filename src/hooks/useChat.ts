import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Conversation, Message } from "@shared/schema";

export function useChat(conversationId: number) {
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    staleTime: 300000, // Cache conversations for 5 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false, // Don't auto-refresh conversations
  });

  // Fetch messages for current conversation
  const { data: messages = [], refetch: refetchMessages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/conversations", conversationId, "messages"],
    enabled: !!conversationId,
    refetchInterval: 3000, // Refetch every 3 seconds to see messages
    staleTime: 0, // Always fetch fresh message data
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/conversations/${conversationId}/messages`, {
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      // Force refetch messages immediately
      refetchMessages();
    },
  });

  const sendMessage = (content: string) => {
    sendMessageMutation.mutate(content);
  };

  return {
    conversations,
    messages,
    sendMessage,
    isLoading: sendMessageMutation.isPending,
  };
}
