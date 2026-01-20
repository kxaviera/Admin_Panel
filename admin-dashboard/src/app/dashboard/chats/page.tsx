"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { MessageSquare, Search, Send, Loader2 } from "lucide-react";

export default function ChatsPage() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { data: chatsData, isLoading: chatsLoading } = useQuery({
    queryKey: ["chats", search],
    queryFn: async () => {
      const res = await apiClient.chats.getAll({ page: 1, limit: 50, q: search.trim() || undefined });
      return res.data.data;
    },
  });

  const chats = useMemo(() => chatsData?.chats ?? [], [chatsData]);

  const { data: selectedData, isLoading: chatLoading } = useQuery({
    queryKey: ["chat", selectedChat],
    enabled: Boolean(selectedChat),
    queryFn: async () => {
      const res = await apiClient.chats.getById(selectedChat as string, { limit: 200 });
      return res.data.data;
    },
  });

  const activeChat = selectedData?.chat;
  const messages = useMemo(() => activeChat?.messages ?? [], [activeChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedChat, messages.length]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedChat) throw new Error("No chat selected");
      const text = message.trim();
      if (!text) throw new Error("Message is empty");
      return apiClient.chats.sendMessage(selectedChat, text);
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["chat", selectedChat] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || e?.message || "Failed to send message");
    },
  });

  const renderChatTitle = (c: any) => {
    const userName = c.participants?.user
      ? `${c.participants.user.firstName || ""} ${c.participants.user.lastName || ""}`.trim() || "User"
      : "User";
    const driverName =
      c.participants?.driver?.userId
        ? `${c.participants.driver.userId.firstName || ""} ${c.participants.driver.userId.lastName || ""}`.trim() || "Driver"
        : "Driver";
    return { userName, driverName };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chats</h1>
        <p className="text-muted-foreground">View and manage all conversations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <CardDescription>Active and recent chats</CardDescription>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {chatsLoading ? (
                <div className="text-muted-foreground">Loading...</div>
              ) : chats.length === 0 ? (
                <div className="text-muted-foreground">No chats found.</div>
              ) : chats.map((chat: any) => {
                const id = chat._id || chat.id;
                const title = renderChatTitle(chat);
                const unread = (chat.unreadCount?.user || 0) + (chat.unreadCount?.driver || 0);
                return (
                <div
                  key={id}
                  onClick={() => setSelectedChat(id)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedChat === id
                      ? "bg-primary/10 border border-primary"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{title.userName}</p>
                        {unread > 0 && (
                          <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">
                            {unread}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">with {title.driverName}</p>
                      <p className="text-sm text-muted-foreground mt-1">{chat.lastMessage || "-"}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {chat.lastMessageTime ? new Date(chat.lastMessageTime).toLocaleString() : "-"}
                    </span>
                  </div>
                </div>
              )})}
            </div>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedChat && activeChat
                    ? (() => {
                        const c: any = activeChat;
                        const userName = c.participants?.user
                          ? `${c.participants.user.firstName || ""} ${c.participants.user.lastName || ""}`.trim() || "User"
                          : "User";
                        const driverName =
                          c.participants?.driver?.userId
                            ? `${c.participants.driver.userId.firstName || ""} ${c.participants.driver.userId.lastName || ""}`.trim() || "Driver"
                            : "Driver";
                        return `${userName} ↔️ ${driverName}`;
                      })()
                    : "Select a conversation"}
                </CardTitle>
                <CardDescription>
                  {selectedChat ? "Conversation" : "Choose a chat from the list"}
                </CardDescription>
              </div>
              {selectedChat && (
                <Badge>{activeChat?.isActive ? "active" : "inactive"}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedChat ? (
              <div className="space-y-4">
                <div className="h-[400px] border rounded-lg p-4 overflow-y-auto space-y-4">
                  {chatLoading ? (
                    <div className="text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-muted-foreground">No messages yet.</div>
                  ) : (
                    messages.map((m: any, idx: number) => {
                      const isDriver = m.senderModel === "Driver";
                      const align = isDriver ? "justify-end" : "justify-start";
                      const bubble = isDriver ? "bg-primary text-white" : "bg-gray-100";
                      const name = isDriver ? "Driver" : "User/Admin";
                      return (
                        <div key={idx} className={`flex ${align}`}>
                          <div className={`${bubble} rounded-lg p-3 max-w-[70%]`}>
                            <p className={`text-sm font-semibold ${isDriver ? "" : "text-primary"}`}>{name}</p>
                            <p>{m.message}</p>
                            <span className={`text-xs ${isDriver ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : ""}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendMutation.mutate();
                    }}
                  />
                  <Button onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}>
                    {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

