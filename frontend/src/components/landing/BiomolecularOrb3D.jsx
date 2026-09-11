import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * 3D Living Biomolecular Orb with dynamic chromatic reflections and particle cloud.
 * Adds visual continuity, scientific luxury, and responsive mouse interaction.
 */
export const BiomolecularOrb3D = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Scene, Camera, Renderer
        const scene = new THREE.Scene();
        let width = container.clientWidth || 400;
        let height = container.clientHeight || 400;

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, 0, 7);

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;
        container.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xfff0f5, 2.5);
        scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
        keyLight.position.set(5, 6, 8);
        scene.add(keyLight);

        const roseLight = new THREE.PointLight(0xe13b68, 5.0, 20);
        roseLight.position.set(-4, -3, 3);
        scene.add(roseLight);

        const blushLight = new THREE.PointLight(0xf8c8d8, 3.0, 15);
        blushLight.position.set(3, -4, -2);
        scene.add(blushLight);

        // Main Core Group
        const coreGroup = new THREE.Group();
        scene.add(coreGroup);

        // Core Organic Sphere
        const orbGeom = new THREE.IcosahedronGeometry(1.6, 24);
        const orbMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#fff0f4'),
            emissive: new THREE.Color('#400a18'),
            roughness: 0.1,
            metalness: 0.15,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            transmission: 0.85,
            thickness: 1.2,
            ior: 1.52,
            specularIntensity: 1.0,
            specularColor: new THREE.Color('#ffffff'),
        });
        const orbMesh = new THREE.Mesh(orbGeom, orbMat);
        coreGroup.add(orbMesh);

        // Inner glowing nucleus
        const nucleusGeom = new THREE.SphereGeometry(0.8, 20, 20);
        const nucleusMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color('#e13b68'),
            wireframe: true,
            transparent: true,
            opacity: 0.35,
        });
        const nucleusMesh = new THREE.Mesh(nucleusGeom, nucleusMat);
        coreGroup.add(nucleusMesh);

        // Orbiting Electron/Protein Rings
        const ringGeom = new THREE.TorusGeometry(2.3, 0.02, 16, 100);
        const ringMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#f07a97'),
            roughness: 0.3,
            metalness: 0.5,
            transparent: true,
            opacity: 0.8,
        });

        const ring1 = new THREE.Mesh(ringGeom, ringMat);
        ring1.rotation.x = Math.PI * 0.35;
        ring1.rotation.y = Math.PI * 0.15;
        coreGroup.add(ring1);

        const ring2 = new THREE.Mesh(ringGeom, ringMat);
        ring2.rotation.x = -Math.PI * 0.3;
        ring2.rotation.y = Math.PI * 0.45;
        coreGroup.add(ring2);

        // Ambient Floating Particles
        const particleCount = 45;
        const particleGeo = new THREE.BufferGeometry();
        const posArray = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i += 3) {
            posArray[i] = (Math.random() - 0.5) * 8;
            posArray[i + 1] = (Math.random() - 0.5) * 8;
            posArray[i + 2] = (Math.random() - 0.5) * 6;
        }
        particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        const pMat = new THREE.PointsMaterial({
            size: 0.08,
            color: new THREE.Color('#e13b68'),
            transparent: true,
            opacity: 0.6,
        });
        const particleSystem = new THREE.Points(particleGeo, pMat);
        coreGroup.add(particleSystem);

        // Mouse Parallax
        const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
        const handleMouseMove = (e) => {
            const rect = container.getBoundingClientRect();
            mouse.targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            mouse.targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });

        // Animation Loop
        let animId;
        const clock = new THREE.Clock();
        let isVisible = true;

        const observer = new IntersectionObserver(([entry]) => {
            isVisible = entry.isIntersecting;
        }, { threshold: 0.1 });
        observer.observe(container);

        const animate = () => {
            animId = requestAnimationFrame(animate);
            if (!isVisible) return;

            const delta = clock.getDelta();
            const elapsed = clock.getElapsedTime();

            if (!prefersReducedMotion) {
                // Smooth dampening
                const lerp = 1.0 - Math.exp(-8.0 * Math.min(delta, 0.1));
                mouse.x += (mouse.targetX - mouse.x) * lerp;
                mouse.y += (mouse.targetY - mouse.y) * lerp;

                // Core movement
                coreGroup.rotation.y = elapsed * 0.35 + mouse.x * 0.4;
                coreGroup.rotation.x = Math.sin(elapsed * 0.5) * 0.1 + mouse.y * 0.3;
                coreGroup.position.y = Math.sin(elapsed * 1.2) * 0.1;

                // Rings spin
                ring1.rotation.z = elapsed * 0.4;
                ring2.rotation.z = -elapsed * 0.3;
                nucleusMesh.rotation.y = -elapsed * 0.5;
            }

            renderer.render(scene, camera);
        };

        animate();

        const handleResize = () => {
            if (!container) return;
            width = container.clientWidth;
            height = container.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        window.addEventListener('resize', handleResize, { passive: true });

        return () => {
            cancelAnimationFrame(animId);
            observer.disconnect();
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            orbGeom.dispose();
            orbMat.dispose();
            nucleusGeom.dispose();
            nucleusMat.dispose();
            ringGeom.dispose();
            ringMat.dispose();
            particleGeo.dispose();
            pMat.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="w-full h-full min-h-[360px] md:min-h-[460px] relative pointer-events-auto"
            aria-label="3D Biomolecular Core Visual"
        />
    );
};

export default BiomolecularOrb3D;
