"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectMessages } from "./assistantSlice";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from 'next/image';

export function MessagesArea() {
  const messages = useSelector(selectMessages);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Get the last message for streaming checks
  const lastMessage = messages[messages.length - 1];
  const isStreaming = lastMessage?.isStreaming;

  // Scroll to bottom on new content or streaming updates
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages, isStreaming, lastMessage?.content]);

  return (
    <>
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
              <div className="flex flex-col gap-2">
                <pre className="text-sm whitespace-pre-wrap">
                  {typeof message.content === 'string' 
                    ? message.content 
                    : message.content.find(c => c.type === 'text')?.text || ''
                  }
                  {message.isStreaming && (
                    <span className="animate-pulse inline-block ml-1">▊</span>
                  )}
                </pre>
                {Array.isArray(message.content) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {message.content
                      .filter(c => c.type === 'image_url')
                      .map((img, idx) => (
                        <Image
                          key={idx}
                          src={img.image_url?.url || ''}
                          alt={`Attached image ${idx + 1}`}
                          width={80}
                          height={80}
                          className="h-20 w-20 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedImage(img.image_url?.url || null)}
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Full size image"
              className="w-full h-auto"
              style={{ maxHeight: '80vh' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
