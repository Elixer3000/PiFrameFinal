import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaService } from './media.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    DragDropModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  files: File[] = [];
  playlist: string[] = [];
  currentIdx = 0;
  uploadSuccess = false;
  saveOrderSuccess = false;

  @ViewChild('playlistSlider', { read: ElementRef }) playlistSlider!: ElementRef;

  constructor(private ms: MediaService) {}

  ngOnInit() {
    this.loadPlaylist();
  }

  onDropFiles(event: any) {
    const items = event.dataTransfer ? event.dataTransfer.files : event.target.files;
    Array.from(items).forEach((f: File) => this.files.push(f));
  }

  upload() {
    if (!this.files.length) return;
    this.ms.upload(this.files).subscribe(() => {
      this.files = [];
      this.loadPlaylist();
    });
    this.uploadSuccess = true;
    setTimeout(() => {
      this.uploadSuccess = false;
    }, 3000); // Hide message after 3 seconds
  }

  loadPlaylist() {
    this.ms.getPlaylist().subscribe(arr => {
      this.playlist = arr;
      this.currentIdx = 0;
    });
  }

  prev() {
    this.currentIdx = (this.currentIdx + this.playlist.length - 1) % this.playlist.length;
  }

  next() {
    this.currentIdx = (this.currentIdx + 1) % this.playlist.length;
  }

  currentUrl(): string {
    return `http://localhost:3000/uploadedMedia/${this.playlist[this.currentIdx]}`; //dev
    // return `${window.location.origin}/uploadedMedia/${this.playlist[this.currentIdx]}`; //prod
  }

  dropList(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.playlist, event.previousIndex, event.currentIndex);
  }

  saveOrder() {
    this.ms.reorder(this.playlist).subscribe();
    this.saveOrderSuccess = true;
    setTimeout(() => {
      this.saveOrderSuccess = false;
    }, 3000); // Hide message after 3 seconds
  }

  delete(i: number) {
    const name = this.playlist[i];
    this.ms.deleteMedia(name).subscribe(() => {
      this.playlist.splice(i, 1);
      if (this.currentIdx >= this.playlist.length) {
        this.currentIdx = this.playlist.length - 1;
      }
    });
  }

  isImage(fn: string) {
    return /\.(jpe?g|png|gif)$/i.test(fn);
  }

  isVideo(fn: string) {
    return /\.(mp4|webm|ogg)$/i.test(fn);
  }

  slidePrev(): void {
    this.playlistSlider.nativeElement.scrollBy({ left: -200, behavior: 'smooth' });
  }

  slideNext(): void {
    this.playlistSlider.nativeElement.scrollBy({ left: 200, behavior: 'smooth' });
  }
}
