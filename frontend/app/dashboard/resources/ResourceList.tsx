"use client";

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectResources, toggleResourceSelection, clearSelectedResources, selectSelectedResources, selectAllResources } from './resourceSlice';
import { updateContextImages } from '../assistant/assistantSlice';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Maximize2, MessageSquarePlus, CheckSquare } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from 'next/image';

export function ResourceList() {
  const dispatch = useDispatch();
  const resources = useSelector(selectResources);
  const selectedResources = useSelector(selectSelectedResources);
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (resources.length === 0) {
    return null;
  }

  const handleResourceSelection = (resource: { id: string }) => {
    dispatch(toggleResourceSelection(resource.id));
  };

  const handleAddToContext = () => {
    const imagesToAdd = selectedResources.map(resource => ({
      id: resource.id,
      base64: resource.base64 || ''
    }));
    dispatch(updateContextImages(imagesToAdd));
    toast({
      title: "Context Updated",
      description: `${selectedResources.length} resource(s) in AI Assistant context.`,
      duration: 3000,
    });
  };

  const handleSelectAll = () => {
    dispatch(selectAllResources());
  };

  return (
    <Card className="p-0">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold">
            Search Results ({selectedResources.length} selected)
          </CardTitle>
          <Button
            variant="outline"
            onClick={handleSelectAll}
            disabled={resources.length === 0}
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            Select All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((resource, index) => (
              <Card key={resource.id} className="p-4">
                <div className="flex items-center justify-between">
                  
                  <label
                    htmlFor={`resource-${resource.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Result {index + 1}
                  </label>
                  <Checkbox
                    checked={resource.isSelected || false}
                    onCheckedChange={() => handleResourceSelection(resource)}
                    id={`resource-${resource.id}`}
                  />
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <p>Document ID: {resource.doc_id}</p>
                  <p>Page Number: {resource.page_num}</p>
                  <p>Score: {resource.score?.toFixed(2) ?? 'N/A'}</p>
                </div>
                {resource.base64 && (
                  <div className="relative group">
                    <Image
                      src={`data:image/png;base64,${resource.base64}`}
                      alt={`Result ${index + 1}`}
                      width={200}
                      height={200}
                      className="mt-2 max-w-full h-auto rounded cursor-pointer"
                      style={{ maxHeight: '200px', objectFit: 'contain' }}
                      onClick={() => setSelectedImage(resource.base64 || null)}
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedImage(resource.base64 || null)}
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => dispatch(clearSelectedResources())}
          disabled={selectedResources.length === 0}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Selection
        </Button>
        <Button
          onClick={handleAddToContext}
          disabled={selectedResources.length === 0}
        >
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          Update context
        </Button>
      </CardFooter>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <img
              src={`data:image/png;base64,${selectedImage}`}
              alt="Full size image"
              className="w-full h-auto"
              style={{ maxHeight: '1920px' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
