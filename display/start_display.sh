#!/bin//bash
ifconfig wlan0 | grep -i mask | awk '{print $2}' | cut -f2 -d: > /home/pi/PiFrameFinal/ip.txt
sudo lsof -t -i:3000 | xargs -r kill -9
sudo python /home/pi/PiFrameFinal/display/display.py &
sudo nodemon /home/pi/PiFrameFinal/backend/server.js &
