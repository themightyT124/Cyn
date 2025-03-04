import { cn } from "@/lib/utils";
import { Message } from "@shared/schema";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn(
      "flex",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "px-4 py-2 rounded-2xl max-w-[80%]",
        isUser ? "bg-white text-[#1a1a1a]" : "bg-[#daa520] text-[#1a1a1a]"
      )}>
        <p className="text-sm">{message.content}</p>
      </div>
    </div>
  );
}