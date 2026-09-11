import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Live 3D DNA Double Helix rendered with Three.js WebGL.
 * Features:
 * - Dual hierarchical groups: pivotGroup (mouse parallax/tilt) + spinGroup (constant rotation)
 * - 120 base pairs spanning 50.0 units of continuous vertical height with 7.2 turns
 * - Ultra-smooth frame-rate independent exponential lerping (zero lag, buttery responsiveness)
 * - High-refinement molecular materials with soft blush-rose specular highlights
 * - Ambient floating micro bio-particles
 */
export const DnaHelix3D = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Scene, Camera, Renderer
        const scene = new THREE.Scene();
        let width = container.clientWidth || window.innerWidth * 0.5;
        let height = container.clientHeight || 700;

        const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        camera.position.set(0, 0, 15);

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        container.appendChild(renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xfff5f8, 2.0);
        scene.add(ambientLight);

        // Soft key light
        const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
        keyLight.position.set(6, 8, 10);
        scene.add(keyLight);

        // Warm blush fill
        const fillLight = new THREE.DirectionalLight(0xffc2d1, 2.2);
        fillLight.position.set(-8, -4, 6);
        scene.add(fillLight);

        // Specular rim light
        const rimLight = new THREE.PointLight(0xe13b68, 4.0, 35);
        rimLight.position.set(0, -6, -5);
        scene.add(rimLight);

        // Pivot group handles mouse tilt, position parallax & breathing float
        const pivotGroup = new THREE.Group();
        scene.add(pivotGroup);

        // Spin group handles continuous slow axial rotation
        const spinGroup = new THREE.Group();
        pivotGroup.add(spinGroup);

        // Helix Parameters (Extends endlessly across the screen)
        const numPairs = 120;
        const radius = 2.35;
        const heightTotal = 50.0;
        const turns = 7.2;

        // Materials
        const strandAMaterial = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#d93864'),
            emissive: new THREE.Color('#380816'),
            roughness: 0.18,
            metalness: 0.12,
            clearcoat: 0.9,
            clearcoatRoughness: 0.12,
            transmission: 0.25,
            ior: 1.48,
        });

        const strandBMaterial = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#f07a97'),
            emissive: new THREE.Color('#2e0914'),
            roughness: 0.22,
            metalness: 0.08,
            clearcoat: 0.85,
            clearcoatRoughness: 0.15,
            transmission: 0.22,
            ior: 1.42,
        });

        const rungMaterial = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#fae3eb'),
            emissive: new THREE.Color('#20050e'),
            roughness: 0.28,
            metalness: 0.05,
            clearcoat: 0.6,
            transparent: true,
            opacity: 0.92,
        });

        const sphereGeom = new THREE.SphereGeometry(0.24, 20, 20);
        const nodeGeom = new THREE.SphereGeometry(0.12, 14, 14);

        // Construct Seamless Extended Helix Strands and Base Pair Rungs
        for (let i = 0; i < numPairs; i++) {
            const t = i / (numPairs - 1);
            const angle = t * Math.PI * 2 * turns;
            const y = (t - 0.5) * heightTotal;

            // Strand A Node
            const x1 = Math.cos(angle) * radius;
            const z1 = Math.sin(angle) * radius;

            // Strand B Node
            const x2 = Math.cos(angle + Math.PI) * radius;
            const z2 = Math.sin(angle + Math.PI) * radius;

            // Backbone Sphere A
            const sphereA = new THREE.Mesh(sphereGeom, strandAMaterial);
            sphereA.position.set(x1, y, z1);
            spinGroup.add(sphereA);

            // Backbone Sphere B
            const sphereB = new THREE.Mesh(sphereGeom, strandBMaterial);
            sphereB.position.set(x2, y, z2);
            spinGroup.add(sphereB);

            // Connecting Rung
            const p1 = new THREE.Vector3(x1, y, z1);
            const p2 = new THREE.Vector3(x2, y, z2);
            const distance = p1.distanceTo(p2);

            const cylinderGeom = new THREE.CylinderGeometry(0.045, 0.045, distance, 10);
            const rung = new THREE.Mesh(cylinderGeom, rungMaterial);

            const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
            rung.position.copy(mid);
            rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
            spinGroup.add(rung);

            // Central molecular base node
            if (i % 2 === 0) {
                const centerNode = new THREE.Mesh(nodeGeom, i % 4 === 0 ? strandAMaterial : strandBMaterial);
                centerNode.position.copy(mid);
                spinGroup.add(centerNode);
            }
        }

        // Floating Micro Bio-Particles
        const particleCount = 60;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 14;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 15);
        grad.addColorStop(0, 'rgba(235, 75, 115, 0.9)');
        grad.addColorStop(0.4, 'rgba(245, 150, 175, 0.4)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);

        const particleTexture = new THREE.CanvasTexture(canvas);
        const particleMat = new THREE.PointsMaterial({
            size: 0.32,
            map: particleTexture,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        const particles = new THREE.Points(particleGeo, particleMat);
        pivotGroup.add(particles);

        // Base transform
        const basePos = { x: 0.4, y: 0 };
        const baseRot = { x: 0.2, z: -0.12 };

        pivotGroup.position.set(basePos.x, basePos.y, 0);
        pivotGroup.rotation.set(baseRot.x, 0, baseRot.z);

        // Mouse Parallax State (Normalized to window space for smooth continuity)
        const targetMouse = { x: 0, y: 0 };
        const currentMouse = { x: 0, y: 0 };

        const handleMouseMove = (e) => {
            const nx = (e.clientX / window.innerWidth) - 0.5; // [-0.5, 0.5]
            const ny = (e.clientY / window.innerHeight) - 0.5; // [-0.5, 0.5]

            targetMouse.x = nx;
            targetMouse.y = ny;
        };

        const handleMouseLeave = () => {
            targetMouse.x = 0;
            targetMouse.y = 0;
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        document.body.addEventListener('mouseleave', handleMouseLeave);

        // Animation Loop
        let animationFrameId;
        let clock = new THREE.Clock();
        let isVisible = true;

        const observer = new IntersectionObserver(([entry]) => {
            isVisible = entry.isIntersecting;
        }, { threshold: 0.05 });
        observer.observe(container);

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            if (!isVisible) return;

            const delta = clock.getDelta();
            const elapsed = clock.getElapsedTime();

            if (!prefersReducedMotion) {
                // Continuous, smooth axial spin on inner group
                spinGroup.rotation.y += delta * 0.45;

                // Responsive, smooth frame-rate independent dampening (instant, buttery follow)
                const lerpFactor = 1.0 - Math.exp(-9.0 * Math.min(delta, 0.1));
                currentMouse.x += (targetMouse.x - currentMouse.x) * lerpFactor;
                currentMouse.y += (targetMouse.y - currentMouse.y) * lerpFactor;

                // Parallax tilt & position shift with natural organic follow
                pivotGroup.rotation.x = baseRot.x + currentMouse.y * 0.4 + Math.sin(elapsed * 0.7) * 0.02;
                pivotGroup.rotation.z = baseRot.z - currentMouse.x * 0.3;
                pivotGroup.position.x = basePos.x + currentMouse.x * 0.85;
                pivotGroup.position.y = basePos.y - currentMouse.y * 0.6 + Math.sin(elapsed * 0.9) * 0.12;

                // Subtle particle drift
                particles.rotation.y = elapsed * 0.06;
            }

            renderer.render(scene, camera);
        };

        animate();

        // Responsive Resize Handler
        const handleResize = () => {
            if (!container) return;
            width = container.clientWidth;
            height = container.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            if (width < 768) {
                camera.position.z = 18;
                basePos.x = 0;
            } else {
                camera.position.z = 15;
                basePos.x = 0.4;
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize, { passive: true });

        // Clean up
        return () => {
            cancelAnimationFrame(animationFrameId);
            observer.disconnect();
            window.removeEventListener('mousemove', handleMouseMove);
            document.body.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('resize', handleResize);

            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }

            sphereGeom.dispose();
            nodeGeom.dispose();
            strandAMaterial.dispose();
            strandBMaterial.dispose();
            rungMaterial.dispose();
            particleGeo.dispose();
            particleMat.dispose();
            particleTexture.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="w-full h-full min-h-[580px] md:min-h-[700px] lg:min-h-[820px] relative pointer-events-auto"
            aria-label="3D Interactive DNA Double Helix visualization"
        />
    );
};

export default DnaHelix3D;
