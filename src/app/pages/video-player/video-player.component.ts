import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import Hls from 'hls.js';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrl: './video-player.component.scss'
})
export class VideoPlayerComponent implements AfterViewInit {
  @ViewChild('videoElement') videoElement!: ElementRef;
  @Input() src: string = '';
  @Input() width: string = '150';
  @Input() height: string = '150';
  @Input() controls: boolean = true;

  ngAfterViewInit() {
    const video = this.videoElement.nativeElement;
    const videoSrc = this.src;

    if (this.isHLS(videoSrc)) {
      this.loadHLS(video, videoSrc);
    } else {
      video.src = videoSrc;
      video.addEventListener('error', (e: Event) => console.error('Video error:', e));
    }
  }

  private isHLS(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.toLowerCase().endsWith('.m3u8');
    } catch (e) {
      console.error('Invalid URL:', e);
      return false;
    }
  }

  private loadHLS(video: HTMLVideoElement, src: string) {
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest loaded successfully');
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
        if (data.fatal) {
          console.error('Fatal HLS error, cannot recover');
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('error', (e) => console.error('Native HLS error:', e));
    } else {
      console.error('Browser does not support HLS.');
    }
  }
}