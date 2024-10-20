"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectMessages, selectIsProcessing } from "./assistantSlice";
import { RootState } from "../../store";

export function MessagesArea() {
  const messages = useSelector((state: RootState) => selectMessages(state));
  const isProcessing = useSelector(selectIsProcessing);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  return (
    <ScrollArea className="flex-grow p-4 bg-white dark:bg-gray-800" ref={scrollAreaRef}>
      {messages.map((message, index) => (
        <div
          key={index}
          className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
        >
          <div
            className={`inline-block p-4 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-100 dark:bg-blue-800'
                : 'bg-green-100 dark:bg-green-800'
            }`}
          >
            <pre className="text-sm whitespace-pre-wrap">{message.content}</pre>
          </div>
        </div>
      ))}
      {isProcessing && (
        <div className="text-center text-gray-500">
          <em>AI is processing...</em>
        </div>
      )}
    </ScrollArea>
  );
}
