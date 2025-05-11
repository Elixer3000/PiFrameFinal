// backend/server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploadedMedia')));

// Create directories if they don't exist
const uploadDir = path.join(__dirname, 'uploadedMedia');
const playlistsDir = path.join(__dirname, 'playlists');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(playlistsDir)) {
  fs.mkdirSync(playlistsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Keep the original filename
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// API Routes

// Get all playlists
app.get('/api/playlists', (req, res) => {
  try {
    if (!fs.existsSync(playlistsDir)) {
      return res.json([]);
    }

    const files = fs.readdirSync(playlistsDir);
    const playlists = files
      .filter(file => file.endsWith('.txt'))
      .map(file => {
        // Get the base name without extension as the ID
        const baseFileName = path.basename(file, '.txt');
        
        // Read the file content and split by lines to get filenames
        const content = fs.readFileSync(path.join(playlistsDir, file), 'utf8');
        const filenames = content.trim().split('\n').filter(line => line.trim() !== '');
        
        // Create media items from filenames
        const items = filenames.map(filename => {
          // Skip empty lines
          if (!filename) return null;
          
          const fileExists = fs.existsSync(path.join(uploadDir, filename));
          if (!fileExists) return null;
          
          // Determine file type based on extension
          const ext = path.extname(filename).toLowerCase();
          const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
          const isVideo = ['.mp4', '.webm', '.ogg', '.mov', '.avi'].includes(ext);
          const type = isImage ? 'image' : isVideo ? 'video' : 'unknown';
          
          return {
            id: filename,
            name: filename,
            url: `/uploads/${filename}`,
            type,
            filename
          };
        }).filter(item => item !== null);
        
        return {
          id: baseFileName,
          name: baseFileName.replace(/_/g, ' '),
          items
        };
      });

    res.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

// Create a new playlist
app.post('/api/playlists', (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Playlist name is required' });
    }

    // Create a filename-safe version of the name
    const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    const playlist = {
      id: safeName,
      name,
      items: []
    };

    const filename = `${safeName}.txt`;
    // Create an empty playlist file
    fs.writeFileSync(path.join(playlistsDir, filename), '');

    res.status(201).json(playlist);
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

// Update a playlist
app.put('/api/playlists/:id', (req, res) => {
  try {
    const { id } = req.params;
    const playlistData = req.body;
    
    const filename = `${id}.txt`;
    const filePath = path.join(playlistsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    
    // Extract just the filenames from the items and join with newlines
    const fileList = playlistData.items.map(item => item.filename).join('\n');
    
    // Write only the filenames to the playlist text file
    fs.writeFileSync(filePath, fileList);
    
    res.json(playlistData);
  } catch (error) {
    console.error('Error updating playlist:', error);
    res.status(500).json({ error: 'Failed to update playlist' });
  }
});

// Delete a playlist
app.delete('/api/playlists/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filename = `${id}.txt`;
    const filePath = path.join(playlistsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    
    fs.unlinkSync(filePath);
    
    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
});

// Upload media files
app.post('/api/upload', upload.array('files'), (req, res) => {
  try {
    const files = req.files;
    const mediaItems = files.map(file => {
      const fileUrl = `/uploads/${file.filename}`;
      const type = file.mimetype.startsWith('image/') ? 'image' : 'video';
      
      return {
        id: file.filename,
        name: file.originalname,
        url: fileUrl,
        type,
        filename: file.filename
      };
    });
    
    res.json(mediaItems);
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Add media to a playlist
app.post('/api/playlists/:id/media', (req, res) => {
  try {
    const { id } = req.params;
    const { mediaItems } = req.body;
    
    const filename = `${id}.txt`;
    const filePath = path.join(playlistsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    
    // Read existing filenames
    const existingContent = fs.readFileSync(filePath, 'utf8');
    const existingFilenames = existingContent.trim().split('\n').filter(line => line.trim() !== '');
    
    // Add new filenames
    const newFilenames = mediaItems.map(item => item.filename);
    const allFilenames = [...existingFilenames, ...newFilenames];
    
    // Write the updated filenames to the playlist file
    fs.writeFileSync(filePath, allFilenames.join('\n'));
    
    // Build the complete playlist object for the response
    const allMediaItems = allFilenames.map(filename => {
      const ext = path.extname(filename).toLowerCase();
      const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
      const isVideo = ['.mp4', '.webm', '.ogg', '.mov', '.avi'].includes(ext);
      const type = isImage ? 'image' : isVideo ? 'video' : 'unknown';
      
      return {
        id: filename,
        name: filename,
        url: `/uploads/${filename}`,
        type,
        filename
      };
    });
    
    const playlist = {
      id,
      name: id.replace(/_/g, ' '),
      items: allMediaItems
    };
    
    res.json(playlist);
  } catch (error) {
    console.error('Error adding media to playlist:', error);
    res.status(500).json({ error: 'Failed to add media to playlist' });
  }
});

// serve anything in /public as static
app.use(express.static(path.join(__dirname, 'public')));

// for all other routes, send back public/index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});