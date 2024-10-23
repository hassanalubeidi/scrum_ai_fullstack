"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Search, Command } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CommandPalette } from "./CommandPalette";
import { AppDispatch } from "../../store";
import {
  sendMessage,
  addMessage,
  selectIsProcessing,
  selectContextImages,
  clearContextImages,
  updateContextImages,
  setInput,
  selectInput,
  setSelectedImage,
  selectSelectedImage,
  setIsSearching,
  selectIsSearching
} from "./assistantSlice";
import {
  setCommandPaletteOpen,
  setCommandPosition,
  registerCommandHandler,
  selectCommandPaletteState,
  setSearchTerm,
  CommandOption
} from "./commandSlice";
import { searchResources } from "../resources/resourceSlice";
import { CommandInput } from "./CommandInput";

// Add this interface near the top of the file
interface SearchResource {
    id: string;
    base64?: string;
}

export function ChatInput() {
    const dispatch = useDispatch<AppDispatch>();
    const inputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Selectors
    const input = useSelector(selectInput);
    const isProcessing = useSelector(selectIsProcessing);
    const contextImages = useSelector(selectContextImages);
    const selectedImage = useSelector(selectSelectedImage);
    const isSearching = useSelector(selectIsSearching);
    const commandPaletteState = useSelector(selectCommandPaletteState);

    // Command handlers
    const handleDocumentSearch = async (query: string) => {
        dispatch(setIsSearching(true));
        try {
            const searchResponse = await dispatch(searchResources({ 
                query, 
                pages: 3
            })).unwrap();
            if (searchResponse?.length > 0) {
                const imagesToAdd = searchResponse.map((resource: SearchResource) => ({
                    id: resource.id,
                    base64: resource.base64 || ''
                }));
                dispatch(updateContextImages(imagesToAdd));
                toast({
                    title: "Documents Found",
                    description: `Added ${searchResponse.length} relevant documents to the context.`,
                    duration: 3000,
                });
                // Return the images to use immediately
                return imagesToAdd;
            } else {
                toast({
                    title: "No Documents Found",
                    description: "No relevant documents were found for your query.",
                    duration: 3000,
                });
                return [];
            }
        } catch (error) {
            toast({
                title: "Search Failed",
                description: "Failed to search documents. Please try again.",
                variant: "destructive",
                duration: 3000,
            });
            return [];
        } finally {
            dispatch(setIsSearching(false));
        }
    };

    // Register command handlers
    useEffect(() => {
        dispatch(registerCommandHandler({ 
            id: 'document', 
            handler: handleDocumentSearch 
        }));
    }, [dispatch]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        dispatch(setInput(value));

        // Only show command palette when @ is typed and not in the middle of a command
        const isInCommand = /^@\w+\s*".*"?\s*$/.test(value);
        if (value.includes('@') && !isInCommand) {
            const rect = inputRef.current?.getBoundingClientRect();
            if (rect) {
                dispatch(setCommandPosition({
                    top: rect.bottom + window.scrollY + 5,
                    left: rect.left + window.scrollX
                }));
                dispatch(setCommandPaletteOpen(true));
                
                // Extract search term after @
                const searchTerm = value.slice(value.lastIndexOf('@') + 1);
                dispatch(setSearchTerm(searchTerm));
            }
        } else {
            dispatch(setCommandPaletteOpen(false));
            dispatch(setSearchTerm(''));
        }
    };

    const handleAskAI = async () => {
        if (!input.trim()) return;

        const trimmedInput = input.trim();
        let finalMessage = trimmedInput;
        
        const documentMatch = trimmedInput.match(/@documents?\s*"([^"]+)"/);
        if (documentMatch) {
            const searchQuery = documentMatch[1];
            // Get imagesToAdd directly from handleDocumentSearch
            const imagesToAdd = await handleDocumentSearch(searchQuery);

            console.log("imagesToAdd", imagesToAdd);  // This should now log the images

            const cleanedInput = trimmedInput.replace(/@documents?\s*"([^"]+)"/, '').trim();
            if (!cleanedInput) {
                dispatch(setInput(''));
                return;
            }
            
            finalMessage = `[Context: Searched documents for "${searchQuery}"] ${cleanedInput}`;
            dispatch(setInput(cleanedInput));

            // Use imagesToAdd instead of contextImages
            dispatch(addMessage({
                role: 'user',
                content: [
                    { type: "text", text: finalMessage },
                    ...imagesToAdd.map((img: { base64: any; }) => ({
                        type: "image_url",
                        image_url: { url: `data:image/jpeg;base64,${img.base64}` }
                    }))
                ],
                hasImages: imagesToAdd.length > 0
            }));

            dispatch(sendMessage({
                message: finalMessage,
                images: imagesToAdd.map((img: { base64: any; }) => img.base64)
            }));

            dispatch(clearContextImages());  // Add this line
            dispatch(setInput(''));
        } else {
            // Handle the case where there's no document match
            dispatch(addMessage({
                role: 'user',
                content: [{ type: "text", text: finalMessage }],
                hasImages: false
            }));

            dispatch(sendMessage({
                message: finalMessage,
                images: []
            }));

            dispatch(clearContextImages());
            dispatch(setInput(''));
        }
    };

    const handleCommandSelect = (command: CommandOption) => {
        dispatch(setCommandPaletteOpen(false));
        // Add a space after the command name to allow parameter input
        dispatch(setInput(`${command.name} ""`));
        // Place cursor between quotes
        setTimeout(() => {
            if (inputRef.current) {
                const length = inputRef.current.value.length;
                inputRef.current.focus();
                inputRef.current.setSelectionRange(length - 1, length - 1);
            }
        }, 0);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAskAI();
        }
    };

    return (
        <div className="p-4 border-t bg-white dark:bg-gray-800 dark:border-gray-700 relative">
            {contextImages.length > 0 && (
                <div className="mb-2 flex gap-2 overflow-x-auto pb-2">
                    {contextImages.map((img, index) => (
                        <div 
                            key={img.id} 
                            className="relative flex-shrink-0 cursor-pointer" 
                            onClick={() => dispatch(setSelectedImage(img.base64))}
                        >
                            <img
                                src={`data:image/jpeg;base64,${img.base64}`}
                                alt={`Context image ${index + 1}`}
                                className="h-16 w-16 object-cover rounded-md hover:opacity-100 transition-opacity"
                            />
                        </div>
                    ))}
                </div>
            )}
            
            <div className="flex items-center space-x-2 relative">
                <div className="relative flex-1">
                    <Input
                        ref={inputRef}
                        placeholder='Try "@document" to search through documents'
                        value={input}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        disabled={isProcessing || isSearching}
                        className="pr-32"
                    />
                    <div className="absolute inset-0 pointer-events-none opacity-0">
                        <CommandInput value={input} className="px-3 py-2" />
                    </div>
                </div>
                {input.match(/@\w+\s*"[^"]*$/) && (
                    <div className="absolute right-12 text-sm text-muted-foreground">
                        Press " or Enter to complete
                    </div>
                )}
                <Button 
                    onClick={handleAskAI} 
                    disabled={isProcessing || isSearching}
                >
                    {isSearching ? (
                        <Search className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </div>

            <CommandPalette {...commandPaletteState} onSelect={handleCommandSelect} />

            <Dialog 
                open={!!selectedImage} 
                onOpenChange={() => dispatch(setSelectedImage(null))}
            >
                <DialogContent className="max-w-4xl">
                    {selectedImage && (
                        <img
                            src={`data:image/jpeg;base64,${selectedImage}`}
                            alt="Full size image"
                            className="w-full h-auto"
                            style={{ maxHeight: '80vh' }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
