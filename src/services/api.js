// src/services/api.js
export const API_URL = `${window.location.origin}/api`;

export const fetchPlaylists = async () => {
  try {
    const response = await fetch(`${API_URL}/playlists`);
    if (!response.ok) {
      throw new Error('Failed to fetch playlists');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching playlists:', error);
    throw error;
  }
};

export const createPlaylist = async (name) => {
  try {
    const response = await fetch(`${API_URL}/playlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create playlist');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
};

export const updatePlaylist = async (playlist) => {
  try {
    const response = await fetch(`${API_URL}/playlists/${playlist.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(playlist),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update playlist');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating playlist:', error);
    throw error;
  }
};

export const deletePlaylist = async (playlistId) => {
  try {
    const response = await fetch(`${API_URL}/playlists/${playlistId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete playlist');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting playlist:', error);
    throw error;
  }
};

export const uploadMediaFiles = async (files) => {
  try {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload files');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error;
  }
};

export const addMediaToPlaylist = async (playlistId, mediaItems) => {
  try {
    const response = await fetch(`${API_URL}/playlists/${playlistId}/media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mediaItems }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add media to playlist');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding media to playlist:', error);
    throw error;
  }
};
