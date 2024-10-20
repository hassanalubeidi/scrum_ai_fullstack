"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Image } from "lucide-react";
import { MessagesArea } from "./MessagesArea";
import { ChatInput } from "./ChatInput";
import { useSelector } from "react-redux";
import { selectContextImages } from "./assistantSlice";
import { Badge } from "@/components/ui/badge";

export function AIAssistantCard() {
  const contextImages = useSelector(selectContextImages);

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-lg flex flex-col">
      <CardHeader className="border-b">
        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            AI Assistant
          </div>
          {contextImages.length > 0 && (
            <Badge variant="secondary" className="flex items-center">
              <Image className="mr-1 h-3 w-3" />
              {contextImages.length} image{contextImages.length !== 1 ? 's' : ''} in context
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-0">
        <MessagesArea />
        <ChatInput />
      </CardContent>
    </Card>
  );
}
