import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MediaUploaderProps {
  onUpload: (files: File[]) => void;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ onUpload }) => {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setIsUploading(true);
      
      // Pass the files to the parent component for upload
      onUpload(acceptedFiles);
      
      // For better UX, we'll wait a bit before resetting the uploading state
      setTimeout(() => {
        setIsUploading(false);
      }, 1000);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'video/*': [],
    },
    disabled: isUploading
  });

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/10" : isUploading ? "border-gray-300 bg-gray-50" : "border-gray-300 hover:border-primary"
          } ${isUploading ? "cursor-not-allowed" : "cursor-pointer"}`}
        >
          <input {...getInputProps()} disabled={isUploading} />
          {isUploading ? (
            <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
          ) : (
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          )}
          <p className="mt-4 text-lg font-medium">
            {isDragActive 
              ? "Drop the files here..." 
              : isUploading 
                ? "Uploading files..." 
                : "Drag & drop images or videos here"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {isUploading 
              ? "Please wait while we upload your files" 
              : "or click to select files"}
          </p>
          <Button 
            className="mt-4" 
            variant="outline" 
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Select Files"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MediaUploader;