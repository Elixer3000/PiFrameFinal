// src/types.d.ts

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  filename?: string; // Added for backend reference
}

interface Playlist {
  id: string;
  name: string;
  items: MediaItem[];
}

// Additional API response types
interface APIResponse {
  error?: string;
  message?: string;
}

interface PlaylistResponse extends Playlist, APIResponse {}

interface MediaUploadResponse extends MediaItem, APIResponse {}