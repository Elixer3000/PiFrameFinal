import pygame, pigame
from pygame.locals import *
import os
import time
import sys
import RPi.GPIO as GPIO
from moviepy import VideoFileClip
import piexif
from threading import Thread
import subprocess

GPIO.setmode(GPIO.BCM)
menu = True
run = True
select = False
pause = False
displayTime = 3
imgTime = 0
vidTime = 0
idx = 0

#display to the PiTFT
os.putenv('SDL_VIDEODRIVER','fbcon')
os.putenv('SDL_FBDEV','/dev/fb0')
os.putenv('SDL_MOUSEDRV','dummy')
os.putenv('SDL_MOUSEDEV','/dev/null')
#os.putenv('DISPLAY','')

pygame.init()
pitft = pigame.PiTft()
pygame.mouse.set_visible(False)
font_big = pygame.font.Font(None, 30)

size = width, height = 320, 240

WHITE = 255, 255, 255
black = 0, 0, 0

path = "/home/pi/PiFrameFinal/backend/"
activePlaylistDir = path+"playlists/active/"
inactivePlaylistDir = path+"playlists/inactive/"
selected = 0
offset = 0

screen = pygame.display.set_mode(size)
playlist = []

def fetchImages():
	global playlist
	playlist = []
	files = []
	try:
	#look for a playlist and read the filenames in the playlist file
		playlistName = os.listdir(activePlaylistDir)[0]
		print("loading playlist " + playlistName[:-4] + "...")
		with open(activePlaylistDir+playlistName) as plist:
			files = plist.read().splitlines()
	except (OSError, IndexError):
	#default to all images if no playlist is active
		print("no playlist selected, displaying all images...")
		files = os.listdir(path+"uploadedMedia/")

	for filename in files:
		try:
			#process image files
			fname = filename.lower()
			if fname.endswith(".png") or fname.endswith(".jpg") or fname.endswith(".jpeg") or fname.endswith(".bmp") or fname.endswith(".webp") or fname.endswith(".tiff"):
				img = pygame.image.load(path+"uploadedMedia/"+filename)
				#handle exif orientation metadata
				exif = piexif.load(path+"uploadedMedia/"+filename)
				if piexif.ImageIFD.Orientation in exif["0th"]:
					orientation = exif["0th"].get(piexif.ImageIFD.Orientation)
					if orientation == 2:
						img = pygame.transform.flip(img, True, False)
					elif orientation == 3:
						img = pygame.transform.rotate(img, -180)
					elif orientation == 4:
						img = pygame.transform.flip(img, True, False)
						img = pygame.transform.rotate(img, -180)
					elif orientation == 5:
						img = pygame.transform.flip(img, True, False)
						img = pygame.transform.rotate(img, -90)
					elif orientation == 6:
						img = pygame.transform.rotate(img, -90)
					elif orientation == 7:
						img = pygame.transform.flip(img, True, False)
						img = pygame.transform.rotate(img, 90)
					elif orientation == 8:
						img = pygame.transform.rotate(img, 90)
							
				img = pygame.transform.scale(img, (int(img.get_width()*240/img.get_height()), 240)) 
				rect = img.get_rect()
				#images are added as a tuple of a pygame surface and rect
				playlist.append((img, rect))
			#process video files
			elif fname.endswith(".mp4") or fname.endswith(".webm") or fname.endswith(".mpg") or fname.endswith(".mpeg") or fname.endswith(".gif") or fname.endswith(".avi") or fname.endswith(".wmv") or fname.endswith(".ogg") or fname.endswith(".mov"):
				#Video loading code adapted from https://stackoverflow.com/a/76853293
				video = VideoFileClip(path+"uploadedMedia/"+filename).resized(height=240)
				#videos are added as a VideoFileClip
				playlist.append(video)
			else:
				print("File " + filename + " has an unsupported format, skipping...")
		except:
			print("Failed to process file " + filename + ", skipping...")
#fetchImages is slow, so put it on another thread while the
#media displays
t1 = Thread(target=fetchImages)
			
#GPIO setup
GPIO.setup(27, GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.setup(17, GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.setup(22, GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.setup(23, GPIO.IN, pull_up_down=GPIO.PUD_UP)
def cb_27(channel):
	#set bottom button on PiTFT to quit button
	global run
	global playlist
	run = False
	for media in playlist:
		if isinstance(media, VideoFileClip):
			media.close()
	GPIO.cleanup()
	pygame.quit()
	del(pitft)
	sys.exit(0)
def cb_22(channel):
	#set second button from the top on PiTFT to return to menu
	global menu
	global t1
	menu = True
	t1.join()
def cb_23(channel):
	#set second button from the bottom on PiTFT to adjust image display time
	global displayTime
	if displayTime > 1:
		displayTime = displayTime - 1
	else:
		displayTime = 5
def cb_17(channel):
	#set top button on PiTFT to pause (stop looping if on a photo,
	#stop playback if on a video)
	global pause
	pause = not pause	
GPIO.add_event_detect(27, GPIO.FALLING, callback=cb_27, bouncetime=200)
GPIO.add_event_detect(17, GPIO.FALLING, callback=cb_17, bouncetime=200)
GPIO.add_event_detect(22, GPIO.FALLING, callback=cb_22, bouncetime=200)
GPIO.add_event_detect(23, GPIO.FALLING, callback=cb_23, bouncetime=200)

try:
	while run:
		if select:
			
			#in the playlist selection menu
			pitft.update()
			
			inactive = os.listdir(inactivePlaylistDir)
			inactive.sort()
			playlists = os.listdir(activePlaylistDir) + inactive
			for i in range(len(playlists)):
				if len(playlists[i]) < 4 or not playlists[i].endswith(".txt"):
					playlists.pop(i)
			#handle touchscreen events
			for event in pygame.event.get():
				if(event.type is MOUSEBUTTONUP):
					x,y = pygame.mouse.get_pos()
					#Find which part of the screen we're in
					if y > 200 and x < 80:
						#start playback of selected playlist
						menu = False
						select = False
						if len(os.listdir(activePlaylistDir)) > 0:
							os.system("mv " + activePlaylistDir + playlists[0]\
										+ " " + inactivePlaylistDir)
						os.system("mv " + inactivePlaylistDir + playlists[selected]\
									+ " " + activePlaylistDir)
						selected, offset, idx = 0, 0, 0
						fetchImages()
					elif y > 210 and x > 240:
						select = False
						if len(os.listdir(activePlaylistDir)) > 0:
							os.system("mv " + activePlaylistDir + playlists[0]\
										+ " " + inactivePlaylistDir)
						os.system("mv " + inactivePlaylistDir + playlists[selected]\
									+ " " + activePlaylistDir)
						selected, offset = 0, 0
					elif x > 280:
						if y < 40 and offset > 0:
							offset = offset - 1
						elif y >= 160 and y < 200 and offset < len(playlists) - 5:
							offset = offset + 1
					else:
						for i in range(min(len(playlists), 5)):
							if y >= 40*i and y < 40*(i+1):
								selected = i + offset
							
			screen.fill(black)
			#display buttons and text
			for i in range(min(len(playlists), 5)):
				if selected == i + offset:
					bg = pygame.Surface((260,40))
					bg.fill(WHITE)
					screen.blit(bg, bg.get_rect(y=40*i))
					text_surface = font_big.render(playlists[i+offset][:-4], True, black)
				else:
					text_surface = font_big.render(playlists[i+offset][:-4], True, WHITE)
				rect = text_surface.get_rect(y=40*i)
				screen.blit(text_surface, rect)
			
			text_surface = font_big.render('Start', True, WHITE)
			rect = text_surface.get_rect(center=(40,220))
			screen.blit(text_surface, rect)
			
			text_surface = font_big.render('Back', True, WHITE)
			rect = text_surface.get_rect(center=(280,220))
			screen.blit(text_surface, rect)
			
			#display scroll arrows
			pygame.draw.lines(screen, WHITE, False, [(290, 30), (300, 10), (310, 30)], 3)
			pygame.draw.lines(screen, WHITE, False, [(290, 170), (300, 190), (310, 170)], 3)
			
			pygame.display.update()
		elif menu:
			#in the main menu
			pitft.update()
        
			#handle touchscreen events
			for event in pygame.event.get():
				if(event.type is MOUSEBUTTONUP):
					x,y = pygame.mouse.get_pos()
					#Find which part of the screen we're in
					if y > 200 and x < 120:
						#start playback of EVERYTHING
						menu = False
						playlists = os.listdir(activePlaylistDir)
						if len(playlists) > 0:
							os.system("mv " + activePlaylistDir + playlists[0]\
										+ " " + inactivePlaylistDir)
						idx = 0
						fetchImages()
					elif y > 200 and x > 260:
						#quit
						run = False
						pygame.quit()
						sys.exit(0)
						continue
					elif y > 140 and y < 280 and x > 80 and x < 240:
						select = True
						
			screen.fill(black)
			#display buttons and text
			text_surface = font_big.render('Welcome to PiFrame', True, WHITE)
			rect = text_surface.get_rect(center=(160,60))
			screen.blit(text_surface, rect)
			
			ip = ''
			with open("/home/pi/PiFrameFinal/ip.txt") as ipfile:
				ip = ipfile.readline().strip()
			text_surface = font_big.render(ip+":3000", True, WHITE)
			rect = text_surface.get_rect(center=(160,100))
			screen.blit(text_surface, rect)
			
			text_surface = font_big.render('Select playlist', True, WHITE)
			rect = text_surface.get_rect(center=(160,160))
			screen.blit(text_surface, rect)
			
			text_surface = font_big.render('Play all', True, WHITE)
			rect = text_surface.get_rect(y=220)
			screen.blit(text_surface, rect)
			
			text_surface = font_big.render('Quit', True, WHITE)
			rect = text_surface.get_rect(x=260,y=220)
			screen.blit(text_surface, rect)
			
			pygame.display.update()
		else:
			#displaying media
			if len(playlist) == 0:
				print("no images in playlist, returning to menu...")
				menu = True
				continue
			
			media = playlist[idx]
			img, rect = None, None
			#re-initialize the thread on each loop so it can be reused
			t1 = Thread(target=fetchImages)
			t1.start()
			if isinstance(media, VideoFileClip):
			#current file is a video, handle video playback
				frame = media.get_frame(t=vidTime)
				#Video playback code adapted from https://stackoverflow.com/a/76853293
				img = pygame.surfarray.make_surface(frame.swapaxes(0, 1))
				while vidTime <= media.duration and run and not menu:
					frame = media.get_frame(t=vidTime)
					pygame.surfarray.blit_array(img, frame.swapaxes(0, 1))
					rect = img.get_rect()
					screen.fill(black)
					screen.blit(img, rect.move(160-int(0.5*img.get_width()), 0))
					pygame.display.flip()
					if not pause:
						vidTime = vidTime + 1/media.fps
						
				media.close()
			else:
			#current file is an image, display image
				img, rect = media
				screen.fill(black)
				screen.blit(img, rect.move(160-int(0.5*img.get_width()), 0))
				pygame.display.flip()
				#delay loop
				#use this instead of time.sleep(displayTime) so we can
				#dynamically respond to updates to displayTime instead of having
				#to wait until t=displayTime has passed
				while imgTime < displayTime and run and not menu:
					t = time.time()
					time.sleep(0.01)
					if not pause:
						imgTime = imgTime + time.time()-t
					
			imgTime = 0
			vidTime = 0
			t1.join()
			idx = (idx+1)%len(playlist)
		
except KeyboardInterrupt:
	run = False
	for media in playlist:
		if isinstance(media, VideoFileClip):
			media.close()
	GPIO.cleanup()
	pygame.quit()
	del(pitft)
	sys.exit(0)
finally:
	for media in playlist:
		if isinstance(media, VideoFileClip):
			media.close()
	GPIO.cleanup()
	pygame.quit()
	del(pitft)
