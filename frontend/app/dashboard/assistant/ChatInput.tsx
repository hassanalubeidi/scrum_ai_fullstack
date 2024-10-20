"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sendMessage, selectIsProcessing } from "./assistantSlice";
import { AppDispatch, RootState } from "../../store";
import { selectSelectedResources } from "../resources/resourceSlice";

export function ChatInput() {
    const [input, setInput] = useState('');
    const dispatch = useDispatch<AppDispatch>();
    const isProcessing = useSelector(selectIsProcessing);

    const handleAskAI = () => {
        if (input.trim()) {
            dispatch(
                sendMessage({
                    message: input.trim()
                })
            );
            setInput('');
        } else {
            alert('Please enter your message.');
        }
    };

    return (
        <div className="p-4 border-t bg-white dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center space-x-2 mt-2">
                <Input
                    placeholder="How can the AI assistant assist you today?"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAskAI()}
                    disabled={isProcessing}
                />
                <Button onClick={handleAskAI} disabled={isProcessing}>
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
