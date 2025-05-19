
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface MediaViewerProps {
  media: MediaItem | null;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

const MediaViewer: React.FC<MediaViewerProps> = ({
  media,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious
}) => {
  if (!media) {
    return (
      <Card className="w-full aspect-video flex items-center justify-center">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No media selected</p>
          <p className="text-sm text-muted-foreground mt-2">Upload media to your playlist to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full relative">
      <CardContent className="p-0 overflow-hidden">
        <div className="relative aspect-video flex items-center justify-center bg-black/5">
          {media.type === 'image' ? (
            <img 
              src={media.url} 
              alt={media.name}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <video 
              src={media.url} 
              controls 
              className="max-h-full max-w-full"
            />
          )}
        </div>
        
        <div className="absolute top-1/2 left-0 right-0 flex justify-between px-4 transform -translate-y-1/2 pointer-events-none">
          <Button 
            onClick={onPrevious}
            disabled={!hasPrevious}
            variant="outline"
            size="icon"
            className="rounded-full bg-background/80 backdrop-blur-sm pointer-events-auto"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <Button 
            onClick={onNext}
            disabled={!hasNext}
            variant="outline"
            size="icon"
            className="rounded-full bg-background/80 backdrop-blur-sm pointer-events-auto"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
      <div className="p-4">
        <p className="font-medium truncate">{media.name}</p>
      </div>
    </Card>
  );
};

export default MediaViewer;
