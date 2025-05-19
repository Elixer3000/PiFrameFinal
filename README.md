# PiFrameFinal
PiFrame is a digital picture frame that runs on a Raspberry Pi 4 using the standard Raspbian Linux OS. It
displays photos and videos to the PiTFT and allows users to select from any playlists that they have
created or cycle through all uploaded media. There is also a web app hosted on the RPi4 that allows users
to upload photos and videos, and make and edit playlists. The photo display program is developed in
Python using pygame and moviepy. The menu can be navigated by tapping on the PiTFT screen and some
playback controls are available through the physical buttons. The web app is developed in JavaScript and
can be accessed by connecting to the same internet network as the RPi4 (which must be plugged into a
router via an ethernet cable), and then typing the IP address and port number that appear on the main
menu screen of the display app into a web browser. Both the display app and web app are automatically
run on startup of the RPi4, and the display app can be used without an internet connection.

#Running The Web APP

1. npm install (on source direcory).
2. npm run dev
3. cd backend
4. npm install
5. nodemon server.js

