import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import * as THREE from 'three';
import { gsap } from 'gsap';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private particles!: THREE.Points;
  private animationId: number = 0;

  ngOnInit(): void {
    this.initThreeJS();
    this.animate();
    this.animateText();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.renderer?.dispose();
  }

  private initThreeJS(): void {
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
}
