const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

const MEDIA_DIR = path.join(__dirname, 'uploadedMedia');
const PLAYLIST = path.join(__dirname, 'playlists/inactive/playlist.txt');

// Ensure media directory and playlist file exist
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR);
if (!fs.existsSync(PLAYLIST)) fs.writeFileSync(PLAYLIST, '');

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, MEDIA_DIR),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// Helper functions to read and write playlist
function readPlaylist() {
    const data = fs.readFileSync(PLAYLIST, 'utf-8').trim();
    return data ? data.split('\n') : [];
}

function writePlaylist(arr) {
    fs.writeFileSync(PLAYLIST, arr.join('\n'), 'utf-8');
}

// Upload route
app.post('/upload', upload.array('media'), (req, res) => {
    const existing = readPlaylist();
    const newFiles = req.files.map(f => f.filename);
    writePlaylist(existing.concat(newFiles));
    res.json({ uploaded: newFiles });
});

// Get playlist route
app.get('/playlist', (req, res) => {
    let playlist = readPlaylist();
    const allFiles = fs.readdirSync(MEDIA_DIR);

    allFiles.forEach(file => {
        if (!playlist.includes(file)) {
            playlist.push(file);
        }
    });

    writePlaylist(playlist);
    res.json(playlist);
});

// Delete media route
app.delete('/media/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(MEDIA_DIR, filename);

    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
    } else {
        return res.status(404).json({ error: 'Not found' });
    }

    const updatedPlaylist = readPlaylist().filter(f => f !== filename);
    writePlaylist(updatedPlaylist);
    res.json({ ok: true, removed: filename });
});

// Reorder playlist route
app.post('/reorder', (req, res) => {
    const { order } = req.body;
    if (!Array.isArray(order)) {
        return res.status(400).json({ error: 'Invalid order format' });
    }

    writePlaylist(order);
    res.json({ ok: true });
});

// Serve uploaded media files statically
app.use('/uploadedMedia', express.static(MEDIA_DIR));


// Then serve Angular’s static files
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// For any other route, serve index.html (enables Angular router)
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

//prod
// Start server
// app.listen(3000, '0.0.0.0', () => 
//     console.log('Server listening on 0.0.0.0:3000')
//   );

//dev
// Start server
app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
