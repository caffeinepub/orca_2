import { ChevronDown, FileText, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatDateTime } from "./teamTalkStorage";
import type { BookingMessage, MessageType, SendChannel } from "./types";

interface Props {
  messages: BookingMessage[];
  personId: string;
  onSend: (msg: {
    personId: string;
    type: MessageType;
    from: string;
    channel?: SendChannel;
    subject?: string;
    body: string;
  }) => void;
  onOpenCompose: () => void;
  onOpenTemplates: () => void;
  onOpenVarPicker: (onInsert: (key: string) => void) => void;
}

const MSG_COLORS: Record<MessageType, string> = {
  invite: "border-l-blue-400 bg-blue-50",
  response: "border-l-gray-300 bg-gray-50 ml-6",
  accepted: "border-l-green-400 bg-green-50",
  confirmed: "border-l-green-500 bg-green-50",
  declined: "border-l-red-400 bg-red-50",
  update: "border-l-amber-400 bg-amber-50",
  general: "border-l-gray-400 bg-white",
};

const MSG_LABELS: Record<MessageType, string> = {
  invite: "Invite sent",
  response: "Response",
  accepted: "Accepted",
  confirmed: "Confirmed",
  declined: "Declined",
  update: "Update",
  general: "Message",
};

export default function MessageTimeline({
  messages,
  personId,
  onSend,
  onOpenCompose,
  onOpenTemplates,
  onOpenVarPicker,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [replyBody, setReplyBody] = useState("");
  const [channel, setChannel] = useState<SendChannel>("email");

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleQuickSend = () => {
    if (!replyBody.trim()) return;
    onSend({
      personId,
      type: "general",
      from: "me",
      channel,
      body: replyBody.trim(),
    });
    setReplyBody("");
  };

  const handleInsertVar = (key: string) => {
    setReplyBody((prev) => prev + key);
  };

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      data-ocid="teamtalk.messages.panel"
    >
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 ? (
          <div
            className="text-center py-12 text-xs text-gray-400"
            data-ocid="teamtalk.messages.empty_state"
          >
            No messages yet. Send an invite to get started.
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg.id}
              data-ocid={`teamtalk.messages.item.${idx + 1}`}
              className={`border-l-4 rounded-r-lg p-3 ${MSG_COLORS[msg.type]}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                  {MSG_LABELS[msg.type]}
                </span>
                {msg.channel && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-white/70 rounded text-gray-500">
                    {msg.channel}
                  </span>
                )}
                <span className="text-[10px] text-gray-400 ml-auto">
                  {formatDateTime(msg.date)}
                </span>
              </div>
              {msg.subject && (
                <div className="text-xs font-medium text-gray-800 mb-1">
                  {msg.subject}
                </div>
              )}
              <div className="text-xs text-gray-700 whitespace-pre-wrap">
                {msg.body}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply bar */}
      <div className="border-t bg-white px-4 py-3">
        {/* Controls row */}
        <div className="flex items-center gap-2 mb-2">
          {/* Email/message toggle */}
          <div className="flex border rounded overflow-hidden text-xs">
            <button
              type="button"
              data-ocid="teamtalk.reply.email.toggle"
              onClick={() => setChannel("email")}
              className={`px-2 py-1 ${channel === "email" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Email
            </button>
            <button
              type="button"
              data-ocid="teamtalk.reply.message.toggle"
              onClick={() => setChannel("message")}
              className={`px-2 py-1 border-l ${channel === "message" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Message
            </button>
          </div>

          {/* Variable insert */}
          <button
            type="button"
            data-ocid="teamtalk.reply.var_picker.button"
            onClick={() => onOpenVarPicker(handleInsertVar)}
            className="flex items-center gap-1 px-2 py-1 text-xs border rounded text-gray-600 hover:bg-gray-50"
          >
            <ChevronDown className="w-3 h-3" /> Variables
          </button>

          {/* Templates */}
          <button
            type="button"
            data-ocid="teamtalk.reply.templates.button"
            onClick={onOpenTemplates}
            className="flex items-center gap-1 px-2 py-1 text-xs border rounded text-gray-600 hover:bg-gray-50"
          >
            <FileText className="w-3 h-3" /> Templates
          </button>

          {/* Full compose */}
          <button
            type="button"
            data-ocid="teamtalk.reply.compose.button"
            onClick={onOpenCompose}
            className="ml-auto text-xs text-blue-600 hover:underline"
          >
            Full compose
          </button>
        </div>

        {/* Textarea + send */}
        <div className="flex gap-2">
          <textarea
            data-ocid="teamtalk.reply.body.textarea"
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Quick reply..."
            rows={2}
            className="flex-1 px-3 py-2 text-xs border rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) handleQuickSend();
            }}
          />
          <button
            type="button"
            data-ocid="teamtalk.reply.send.button"
            onClick={handleQuickSend}
            disabled={!replyBody.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40 self-end"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
