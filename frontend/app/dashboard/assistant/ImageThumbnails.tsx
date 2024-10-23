import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';

interface ImageThumbnailsProps {
  content: Array<{ type: string; image_url?: { url: string } }>;
}

export function ImageThumbnails({ content }: ImageThumbnailsProps) {
  const images = content.filter(item => item.type === "image_url").map(item => item.image_url?.url);
  
  if (images.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge 
          variant="secondary" 
          className="cursor-pointer hover:bg-secondary/80 transition-colors"
        >
          <ImageIcon className="h-3 w-3 mr-1" />
          {images.length} image{images.length !== 1 ? 's' : ''}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2">
        <div className="grid grid-cols-2 gap-2">
          {images.map((imageUrl, index) => (
            <Image
              key={index}
              src={imageUrl || ''}
              alt={`Attached image ${index + 1}`}
              width={320}
              height={128}
              className="w-full h-32 object-cover rounded-md"
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
