import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API='http://localhost:3000'; //dev
// const API = window.location.origin; //prod

export interface UploadResponse{uploaded:string[];}
@Injectable({providedIn:'root'})
export class MediaService{
  constructor(private http:HttpClient){}
  upload(files:File[]):Observable<UploadResponse>{
    const fd=new FormData();files.forEach(f=>fd.append('media',f));return this.http.post<UploadResponse>(`${API}/upload`,fd);
  }
  getPlaylist():Observable<string[]>{return this.http.get<string[]>(`${API}/playlist`);}
  reorder(order:string[]):Observable<any>{return this.http.post(`${API}/reorder`,{order});}
  deleteMedia(filename:string):Observable<any>{return this.http.delete(`${API}/media/${filename}`);}
}