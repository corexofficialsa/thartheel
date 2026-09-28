"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { UnreadBadge } from "@/components/app-shell/unread-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { authorizeRealtime, createClient } from "@/lib/supabase/client";
import { getMessages, openClassroomConversation, sendMessage, startConversation, type ChatMessage } from "@/lib/chat/actions";
import { markConversationRead } from "@/lib/notifications/actions";

export type ChatContact = {
  id: string;
  name: string;
  subtitle?: string;
  kind?: "user" | "classroom";
};

export function ChatInterface({
  currentUserId,
  contacts,
  unreadByContact = {},
}: {
  currentUserId: string;
  contacts: ChatContact[];
  unreadByContact?: Record<string, number>;
}) {
  const router = useRouter();
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const contactsRef = useRef(contacts);
  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  function openContact(contact: ChatContact) {
    setSelectedContact(contact);
    setConversationId(null);
    setMessages([]);
    setError(null);
    startTransition(async () => {
      const result =
        contact.kind === "classroom" ? await openClassroomConversation(contact.id) : await startConversation(contact.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setConversationId(result.conversationId);
      setMessages(await getMessages(result.conversationId));
      if (unreadByContact[contact.id]) {
        await markConversationRead(result.conversationId);
        router.refresh();
      }
    });
  }

  useEffect(() => {
    if (!conversationId) return;
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    authorizeRealtime(supabase).then(() => {
      if (cancelled) return;
      channel = supabase
        .channel(`messages-${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const row = payload.new as Omit<ChatMessage, "sender_name">;
            setMessages((prev) => {
              if (prev.some((m) => m.id === row.id)) return prev;
              // Realtime rows carry no sender name; reuse one we already know.
              const knownName =
                prev.find((m) => m.sender_id === row.sender_id)?.sender_name ??
                contactsRef.current.find((c) => c.id === row.sender_id)?.name ??
                "";
              return [...prev, { ...row, sender_name: knownName }];
            });
            if (row.sender_id !== currentUserId) {
              // Already on screen — don't let it count as unread.
              markConversationRead(conversationId).then(() => router.refresh());
            }
          }
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!conversationId || !draft.trim()) return;
    const content = draft;
    setDraft("");
    startTransition(async () => {
      const result = await sendMessage(conversationId, content);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      setMessages((prev) => (prev.some((m) => m.id === result.message.id) ? prev : [...prev, result.message]));
    });
  }

  return (
    <div className="flex h-[calc(100svh-12rem)] min-h-96 overflow-hidden rounded-lg border">
      <div className="w-48 shrink-0 overflow-y-auto border-r sm:w-56">
        {contacts.length === 0 && <p className="p-3 text-sm text-muted-foreground">No contacts yet.</p>}
        {contacts.map((contact) => (
          <button
            key={contact.id}
            type="button"
            onClick={() => openContact(contact)}
            className={cn(
              "block w-full border-b px-3 py-2 text-left text-sm hover:bg-accent",
              selectedContact?.id === contact.id && "bg-accent"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={cn("truncate font-medium", (unreadByContact[contact.id] ?? 0) > 0 && "font-semibold")}>
                {contact.name}
              </span>
              <UnreadBadge count={unreadByContact[contact.id] ?? 0} />
            </div>
            {contact.subtitle && <div className="text-xs text-muted-foreground">{contact.subtitle}</div>}
          </button>
        ))}
      </div>
      <div className="flex flex-1 flex-col">
        {!selectedContact ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Select someone to start chatting.
          </div>
        ) : (
          <>
            <div className="border-b px-4 py-2 font-medium">{selectedContact.name}</div>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {messages.map((message) => {
                const isMine = message.sender_id === currentUserId;
                return (
                  <div key={message.id} className={cn("max-w-xs", isMine && "ml-auto")}>
                    {selectedContact.kind === "classroom" && !isMine && (
                      <p className="mb-0.5 px-1 text-xs font-medium text-muted-foreground">{message.sender_name}</p>
                    )}
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm",
                        isMine ? "bg-primary text-primary-foreground" : "bg-secondary"
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            {error && <p className="px-4 text-xs text-destructive">{error}</p>}
            <div className="flex gap-2 border-t p-3">
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message..."
              />
              <Button onClick={handleSend} disabled={isPending || !draft.trim()}>
                <Send className="size-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
