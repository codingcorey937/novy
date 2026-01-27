import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MessageSquare, Send, User } from "lucide-react";
import type { Message } from "@shared/schema";

interface Conversation {
  id: string;
  participantName: string;
  participantId: string;
  listingTitle: string;
  listingId: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const { data: conversations, isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/messages/conversations"],
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedConversation],
    enabled: !!selectedConversation,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const conversation = conversations?.find((c) => c.id === selectedConversation);
      if (!conversation) throw new Error("No conversation selected");
      
      const response = await apiRequest("POST", "/api/messages", {
        listingId: conversation.listingId,
        recipientId: conversation.participantId,
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMutation.mutate(newMessage);
  };

  const formatTime = (date: Date | string | null | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return d.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const selectedConvo = conversations?.find((c) => c.id === selectedConversation);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold mb-2">Messages</h1>
            <p className="text-muted-foreground">
              Communicate securely with tenants and property owners
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
            <Card className="md:col-span-1 flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Conversations</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                {conversationsLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-3/4 mb-1" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : conversations && conversations.length > 0 ? (
                  <ScrollArea className="h-full">
                    <div className="divide-y">
                      {conversations.map((conversation) => (
                        <button
                          key={conversation.id}
                          onClick={() => setSelectedConversation(conversation.id)}
                          className={`w-full p-4 text-left hover-elevate transition-colors ${
                            selectedConversation === conversation.id ? "bg-muted" : ""
                          }`}
                          data-testid={`conversation-${conversation.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {conversation.participantName?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium truncate">
                                  {conversation.participantName || "User"}
                                </span>
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                  {formatTime(conversation.lastMessageTime)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {conversation.listingTitle}
                              </p>
                              {conversation.lastMessage && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {conversation.lastMessage}
                                </p>
                              )}
                            </div>
                            {conversation.unreadCount > 0 && (
                              <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No conversations yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2 flex flex-col">
              {selectedConvo ? (
                <>
                  <CardHeader className="border-b pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {selectedConvo.participantName?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{selectedConvo.participantName || "User"}</CardTitle>
                        <p className="text-sm text-muted-foreground">{selectedConvo.listingTitle}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1 p-4">
                      {messagesLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}>
                              <Skeleton className="h-16 w-2/3 rounded-lg" />
                            </div>
                          ))}
                        </div>
                      ) : messages && messages.length > 0 ? (
                        <div className="space-y-4">
                          {messages.map((message) => {
                            const isOwn = message.senderId === user?.id;
                            return (
                              <div
                                key={message.id}
                                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-[75%] rounded-lg px-4 py-2 ${
                                    isOwn
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted"
                                  }`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                  <p
                                    className={`text-xs mt-1 ${
                                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                                    }`}
                                  >
                                    {formatTime(message.createdAt)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                          <p className="text-muted-foreground">No messages yet</p>
                          <p className="text-sm text-muted-foreground">Start the conversation below</p>
                        </div>
                      )}
                    </ScrollArea>
                    <form onSubmit={handleSendMessage} className="p-4 border-t">
                      <div className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1"
                          data-testid="input-message"
                        />
                        <Button
                          type="submit"
                          size="icon"
                          disabled={!newMessage.trim() || sendMutation.isPending}
                          data-testid="button-send"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <MessageSquare className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
