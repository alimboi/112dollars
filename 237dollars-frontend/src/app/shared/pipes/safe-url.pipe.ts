import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safeUrl',
  standalone: true
})
export class SafeUrlPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  /**
   * SECURITY: Only bypass security for validated trusted URLs
   * Prevents XSS attacks via malicious URLs
   */
  transform(url: string): SafeResourceUrl | string {
    if (!url) {
      return '';
    }

    // SECURITY: Only allow specific trusted domains
    const trustedDomains = [
      'https://www.youtube.com/embed/',
      'https://www.youtube-nocookie.com/embed/',
      'https://player.vimeo.com/video/'
    ];

    // Check if URL starts with a trusted domain
    const isTrusted = trustedDomains.some(domain => url.startsWith(domain));

    if (!isTrusted) {
      console.error('SECURITY: Blocked untrusted URL:', url);
      return '';
    }

    // SECURITY: Additional validation for YouTube URLs
    if (url.includes('youtube.com/embed/') || url.includes('youtube-nocookie.com/embed/')) {
      // Extract video ID and validate format (alphanumeric, underscore, hyphen only)
      const videoIdMatch = url.match(/\/embed\/([a-zA-Z0-9_-]+)(\?|$)/);
      if (!videoIdMatch) {
        console.error('SECURITY: Invalid YouTube video ID format:', url);
        return '';
      }
    }

    // SECURITY: Additional validation for Vimeo URLs
    if (url.includes('vimeo.com/video/')) {
      // Extract video ID and validate format (numeric only)
      const videoIdMatch = url.match(/\/video\/(\d+)(\?|$)/);
      if (!videoIdMatch) {
        console.error('SECURITY: Invalid Vimeo video ID format:', url);
        return '';
      }
    }

    // Only bypass security for validated URLs
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

}
