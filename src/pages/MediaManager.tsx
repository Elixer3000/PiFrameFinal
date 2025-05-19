import React, { useState, useEffect } from 'react';
import MediaUploader from '@/components/MediaUploader';
import MediaViewer from '@/components/MediaViewer';
import SortablePlaylist from '@/components/SortablePlaylist';
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  fetchPlaylists, 
  createPlaylist, 
  updatePlaylist, 
  deletePlaylist as apiDeletePlaylist, 
  uploadMediaFiles, 
  addMediaToPlaylist 
} from '@/services/api';

const MediaManager: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState<number>(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState<number>(0);
  const [newPlaylistName, setNewPlaylistName] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load playlists from the backend API
    const loadPlaylists = async () => {
      try {
        setIsLoading(true);
        const data = await fetchPlaylists();
        
        if (data.length === 0) {
          // Create a default playlist if none exist
          const defaultPlaylist = await createPlaylist('Default Playlist');
          setPlaylists([defaultPlaylist]);
        } else {
          setPlaylists(data);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load playlists. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPlaylists();
  }, []);

  const handleCreatePlaylist = async () => {
    if (newPlaylistName.trim()) {
      try {
        const newPlaylist = await createPlaylist(newPlaylistName);
        setPlaylists(prev => [...prev, newPlaylist]);
        setNewPlaylistName('');
        setIsCreateDialogOpen(false);
        
        toast({
          title: "Playlist created",
          description: `New playlist "${newPlaylistName}" has been created.`
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create playlist. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Error",
        description: "Please enter a playlist name.",
        variant: "destructive"
      });
    }
  };

  const deletePlaylist = async (index: number) => {
    try {
      const playlistToDelete = playlists[index];
      await apiDeletePlaylist(playlistToDelete.id);
      
      setPlaylists(prev => {
        const newPlaylists = [...prev];
        newPlaylists.splice(index, 1);
        return newPlaylists;
      });

      // If current playlist is deleted, adjust the index
      if (index === currentPlaylistIndex) {
        setCurrentPlaylistIndex(Math.max(0, index - 1));
        setCurrentMediaIndex(0);
      } else if (index < currentPlaylistIndex) {
        setCurrentPlaylistIndex(currentPlaylistIndex - 1);
      }

      toast({
        title: "Playlist deleted",
        description: "The playlist has been removed."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete playlist. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpload = async (files: File[]) => {
    if (playlists.length === 0) {
      toast({
        title: "No playlist available",
        description: "Please create a playlist first.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Upload files to the server
      const mediaItems = await uploadMediaFiles(files);
      
      // Add media items to the current playlist
      const updatedPlaylist = await addMediaToPlaylist(
        playlists[currentPlaylistIndex].id, 
        mediaItems
      );
      
      // Update local state
      setPlaylists(prev => {
        const updatedPlaylists = [...prev];
        updatedPlaylists[currentPlaylistIndex] = updatedPlaylist;
        return updatedPlaylists;
      });

      toast({
        title: "Files uploaded successfully",
        description: `${files.length} file(s) have been added to your playlist.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload files. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSortEnd = async (newItems: MediaItem[]) => {
    try {
      // Find the ID of the currently selected item
      const currentItemId = currentPlaylist?.items[currentMediaIndex]?.id;
      
      // Create updated playlist
      const updatedPlaylist = {
        ...currentPlaylist,
        items: newItems
      };
      
      // Send the updated playlist to the server
      const response = await updatePlaylist(updatedPlaylist);
      
      // Update local state
      setPlaylists(prev => {
        const updatedPlaylists = [...prev];
        updatedPlaylists[currentPlaylistIndex] = response;
        return updatedPlaylists;
      });
      
      // Update the current index based on the new position of the previously selected item
      if (currentItemId && newItems.length > 0) {
        const newIndex = newItems.findIndex(item => item.id === currentItemId);
        setCurrentMediaIndex(newIndex >= 0 ? newIndex : 0);
      }
      
      toast({
        title: "Playlist order updated",
        description: "The order of your media has been successfully updated."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update playlist order. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePrevious = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentPlaylist && currentMediaIndex < currentPlaylist.items.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    }
  };

  const currentPlaylist = playlists[currentPlaylistIndex];
  const currentMedia = currentPlaylist?.items[currentMediaIndex] || null;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center">
        <div className="text-center">
          <p className="text-lg">Loading playlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-2">PiFrame Uploader</h1>
        <p className="text-muted-foreground">Upload, view and organize your media collections</p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-semibold">Playlists</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> New Playlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Playlist</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Input 
                    placeholder="Playlist name" 
                    value={newPlaylistName} 
                    onChange={(e) => setNewPlaylistName(e.target.value)} 
                  />
                </div>
                <Button onClick={handleCreatePlaylist}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {playlists.length > 0 ? (
          <Carousel className="w-full">
            <CarouselContent>
              {playlists.map((playlist, index) => (
                <CarouselItem key={playlist.id} className="md:basis-1/2 lg:basis-1/3">
                  <Card className={`${index === currentPlaylistIndex ? 'border-primary' : ''}`}>
                    <CardContent className="p-4 flex justify-between items-center">
                      <Button 
                        variant={index === currentPlaylistIndex ? "default" : "outline"} 
                        className="w-full text-left justify-start mr-2"
                        onClick={() => {
                          setCurrentPlaylistIndex(index);
                          setCurrentMediaIndex(0);
                        }}
                      >
                        {playlist.name} ({playlist.items.length})
                      </Button>
                      {playlists.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePlaylist(index)}
                          className="flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0" />
            <CarouselNext className="right-0" />
          </Carousel>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No playlists available. Create your first playlist.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-8">
        <MediaUploader onUpload={handleUpload} />

        <div className="space-y-4">
          <MediaViewer 
            media={currentMedia} 
            onNext={handleNext} 
            onPrevious={handlePrevious}
            hasNext={currentPlaylist && currentMediaIndex < currentPlaylist.items.length - 1}
            hasPrevious={currentMediaIndex > 0}
          />

          {currentPlaylist && (
            <SortablePlaylist 
              items={currentPlaylist.items}
              onSortEnd={handleSortEnd}
              currentIndex={currentMediaIndex}
              onSelect={setCurrentMediaIndex}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaManager;