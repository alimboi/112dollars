import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { StorageService } from '../../core/services/storage.service';
import * as THREE from 'three';
import { gsap } from 'gsap';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private particles!: THREE.Points;
  private animationId: number = 0;

  // Matrix animation state
  showMatrixIntro = false;
  showRejectionMessage = false;
  showWelcomeMessage = false;
  welcomeText = '';
  rejectionText = '';
  showMainContent = false;

  constructor(private storage: StorageService) {}

  ngOnInit(): void {
    this.checkAnimationCooldown();

    // Initialize Three.js after view is ready
    setTimeout(() => {
      this.initThreeJS();
      this.animate();
    }, 0);

    if (!this.showMatrixIntro) {
      this.showMainContent = true;
      setTimeout(() => this.animateText(), 100);
    }
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.renderer?.dispose();
  }

  private initThreeJS(): void {
    if (!this.canvasRef) {
      console.error('Canvas not found!');
      return;
    }
    const canvas = this.canvasRef.nativeElement;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 50;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Create Matrix-style particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 5000;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 100;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.3,
      color: 0xe94560,
      transparent: true,
      opacity: 0.8
    });

    this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(this.particles);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    // Rotate particles
    this.particles.rotation.x += 0.0005;
    this.particles.rotation.y += 0.0005;

    // Animate particle positions
    const positions = this.particles.geometry.attributes['position'].array as Float32Array;
    for (let i = 1; i < positions.length; i += 3) {
      positions[i] -= 0.05;
      if (positions[i] < -50) {
        positions[i] = 50;
      }
    }
    this.particles.geometry.attributes['position'].needsUpdate = true;

    this.renderer.render(this.scene, this.camera);
  }

  private animateText(): void {
    gsap.from('.hero-title', {
      y: -50,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    });

    gsap.from('.hero-subtitle', {
      y: 50,
      opacity: 0,
      duration: 1,
      delay: 0.3,
      ease: 'power3.out'
    });

    gsap.from('.cta-buttons button', {
      scale: 0,
      opacity: 0,
      duration: 0.5,
      delay: 0.6,
      stagger: 0.2,
      ease: 'back.out(1.7)'
    });
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Matrix Animation Methods
  private checkAnimationCooldown(): void {
    const lastViewed = this.storage.getItem<number>('matrixAnimationLastViewed');
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (!lastViewed || (now - lastViewed) > twentyFourHours) {
      this.showMatrixIntro = true;
    }
  }

  onBluePillClick(): void {
    this.rejectionText = 'Sorry, we serve only for people with big dreams';
    this.showRejectionMessage = true;

    // Hide rejection message after 3 seconds
    setTimeout(() => {
      this.showRejectionMessage = false;
    }, 3000);
  }

  onRedPillClick(): void {
    // Hide pills
    gsap.to('.matrix-man-container', {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        this.showMatrixIntro = false;
      }
    });

    // Show welcome message with typewriter effect
    setTimeout(() => {
      this.showWelcomeMessage = true;
      this.typewriterEffect('Welcome to the real world', 80);
    }, 600);

    // After welcome message, fly objects to navbar
    setTimeout(() => {
      this.flyObjectsToNavbar();
    }, 3000);
  }

  private typewriterEffect(text: string, speed: number): void {
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        this.welcomeText += text.charAt(i);
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);
  }

  private flyObjectsToNavbar(): void {
    // Create flying objects
    const flyingObjects = [
      { text: '237DOLLARS', className: 'flying-logo' },
      { text: 'References', className: 'flying-nav-1' },
      { text: 'Blog', className: 'flying-nav-2' },
      { text: 'About', className: 'flying-nav-3' }
    ];

    flyingObjects.forEach((obj, index) => {
      const element = document.createElement('div');
      element.className = `flying-object ${obj.className}`;
      element.textContent = obj.text;
      element.style.position = 'fixed';
      element.style.left = '50%';
      element.style.top = '50%';
      element.style.transform = 'translate(-50%, -50%)';
      element.style.color = 'var(--accent)';
      element.style.fontSize = '1.5rem';
      element.style.fontWeight = 'bold';
      element.style.zIndex = '9999';
      element.style.filter = 'blur(5px)';
      document.body.appendChild(element);

      // Calculate target position (navbar)
      const targetX = index === 0 ? '10%' : `${30 + (index * 15)}%`;
      const targetY = '5%';

      // Zigzag animation with intermediate points
      const timeline = gsap.timeline();

      // Remove blur first
      timeline.to(element, {
        filter: 'blur(0px)',
        duration: 0.3
      });

      // Zigzag path using keyframes
      timeline.to(element, {
        keyframes: [
          { left: '55%', top: '45%', duration: 0.3 },
          { left: '45%', top: '35%', duration: 0.3 },
          { left: '60%', top: '25%', duration: 0.35 },
          { left: targetX, top: targetY, duration: 0.75 }
        ],
        ease: 'power2.inOut',
        onComplete: () => {
          element.remove();
        }
      });
    });

    // Show main content after animation
    setTimeout(() => {
      this.showWelcomeMessage = false;
      this.showMainContent = true;
      this.animateText();

      // Store timestamp
      this.storage.setItem('matrixAnimationLastViewed', Date.now());
    }, 2000);
  }
}
