import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Premium Medical-Tech Clinical Doctor Digital Sculpture.
 * Designed according to 05_sanjeevani_doctor_refinement.md:
 * - Minimalist, refined 3D clinical avatar sculpture with anatomical elegance.
 * - Soft matte ivory/porcelain body with realistic dimensional shading.
 * - Muted blush/rose studio edge lighting and deep burgundy micro-accents.
 * - Subtle stethoscope drape and tailored medical coat silhouette.
 * - Imperceptible breathing motion, smooth 3-degree parallax tilt, zero toy spinning.
 */
export const ClinicalDoctorVisual = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Scene, Camera, Renderer
        const scene = new THREE.Scene();
        let width = container.clientWidth || 480;
        let height = container.clientHeight || 580;

        const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
        camera.position.set(0, 0.5, 7.2);

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        container.appendChild(renderer.domElement);

        // Studio Lighting
        const ambientLight = new THREE.AmbientLight(0xfff7fa, 2.2);
        scene.add(ambientLight);

        // Key Studio Light (top-right warm key)
        const keyLight = new THREE.DirectionalLight(0xffffff, 3.0);
        keyLight.position.set(4.5, 6.0, 7.0);
        scene.add(keyLight);

        // Soft Blush Fill Light (left-side fill)
        const blushFill = new THREE.DirectionalLight(0xfce4ec, 2.0);
        blushFill.position.set(-5.0, 2.5, 5.0);
        scene.add(blushFill);

        // Rim Contour Light (soft rose/burgundy specular rim)
        const rimLight = new THREE.DirectionalLight(0xf08ca4, 2.8);
        rimLight.position.set(-4.0, 5.0, -4.5);
        scene.add(rimLight);

        // Subtle Bottom Bounce Light
        const bounceLight = new THREE.PointLight(0xffe8ee, 2.0, 10);
        bounceLight.position.set(0, -3.5, 2.0);
        scene.add(bounceLight);

        // Hierarchy Groups
        const rootGroup = new THREE.Group();
        scene.add(rootGroup);

        const sculptureGroup = new THREE.Group();
        rootGroup.add(sculptureGroup);

        // Premium Dimensional Materials
        const porcelainMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#faf7f8'),
            emissive: new THREE.Color('#1f0810'),
            roughness: 0.18,
            metalness: 0.04,
            clearcoat: 0.65,
            clearcoatRoughness: 0.12,
            transmission: 0.12,
            ior: 1.48,
        });

        const coatMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#ffffff'),
            emissive: new THREE.Color('#15060b'),
            roughness: 0.26,
            metalness: 0.02,
            clearcoat: 0.45,
            clearcoatRoughness: 0.18,
        });

        const scrubMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#2d1822'),
            roughness: 0.45,
            metalness: 0.05,
        });

        const stethoscopeMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#381c27'),
            roughness: 0.35,
            metalness: 0.2,
        });

        const metallicMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#d93864'),
            roughness: 0.15,
            metalness: 0.85,
        });

        // 1. Stylized Head / Cranium
        const headGeom = new THREE.SphereGeometry(0.78, 36, 36);
        headGeom.scale(0.95, 1.22, 1.0);
        const headMesh = new THREE.Mesh(headGeom, porcelainMat);
        headMesh.position.set(0, 1.85, 0);
        sculptureGroup.add(headMesh);

        // Subtle Chin / Jaw Taper
        const jawGeom = new THREE.CylinderGeometry(0.55, 0.38, 0.4, 32);
        jawGeom.scale(0.95, 1.0, 0.85);
        const jawMesh = new THREE.Mesh(jawGeom, porcelainMat);
        jawMesh.position.set(0, 1.25, 0.05);
        sculptureGroup.add(jawMesh);

        // 2. Neck
        const neckGeom = new THREE.CylinderGeometry(0.34, 0.42, 0.65, 32);
        const neckMesh = new THREE.Mesh(neckGeom, porcelainMat);
        neckMesh.position.set(0, 0.95, 0);
        sculptureGroup.add(neckMesh);

        // 3. Clinical Coat Torso & Anatomical Shoulders
        const shoulderSlopeGeom = new THREE.CylinderGeometry(0.65, 1.55, 2.2, 36);
        shoulderSlopeGeom.scale(1.4, 1.0, 0.8);
        const torsoMesh = new THREE.Mesh(shoulderSlopeGeom, coatMat);
        torsoMesh.position.set(0, -0.45, 0);
        sculptureGroup.add(torsoMesh);

        // 4. Inner Clinical Scrub V-Neck
        const scrubGeom = new THREE.BufferGeometry();
        const scrubVertices = new Float32Array([
            -0.35, 0.65, 0.32,
             0.35, 0.65, 0.32,
             0.0, -0.25, 0.42,
        ]);
        scrubGeom.setAttribute('position', new THREE.BufferAttribute(scrubVertices, 3));
        scrubGeom.computeVertexNormals();
        const scrubMesh = new THREE.Mesh(scrubGeom, scrubMat);
        sculptureGroup.add(scrubMesh);

        // 5. Tailored Lab Coat Lapels (Left & Right)
        const leftLapelGeom = new THREE.BoxGeometry(0.24, 1.45, 0.08);
        const leftLapel = new THREE.Mesh(leftLapelGeom, coatMat);
        leftLapel.position.set(-0.48, -0.15, 0.42);
        leftLapel.rotation.z = -0.28;
        leftLapel.rotation.y = -0.15;
        sculptureGroup.add(leftLapel);

        const rightLapelGeom = new THREE.BoxGeometry(0.24, 1.45, 0.08);
        const rightLapel = new THREE.Mesh(rightLapelGeom, coatMat);
        rightLapel.position.set(0.48, -0.15, 0.42);
        rightLapel.rotation.z = 0.28;
        rightLapel.rotation.y = 0.15;
        sculptureGroup.add(rightLapel);

        // 6. Refined Stethoscope Drape
        const curvePoints = [
            new THREE.Vector3(-0.46, 0.72, 0.22),
            new THREE.Vector3(-0.62, 0.25, 0.38),
            new THREE.Vector3(-0.46, -0.4, 0.52),
            new THREE.Vector3(0.0, -0.75, 0.58),
            new THREE.Vector3(0.46, -0.4, 0.52),
            new THREE.Vector3(0.62, 0.25, 0.38),
            new THREE.Vector3(0.46, 0.72, 0.22),
        ];
        const stethCurve = new THREE.CatmullRomCurve3(curvePoints);
        const stethTubeGeom = new THREE.TubeGeometry(stethCurve, 48, 0.032, 12, false);
        const stethMesh = new THREE.Mesh(stethTubeGeom, stethoscopeMat);
        sculptureGroup.add(stethMesh);

        // Stethoscope Metallic Bell Piece
        const bellGeom = new THREE.CylinderGeometry(0.14, 0.16, 0.06, 24);
        const bellMesh = new THREE.Mesh(bellGeom, metallicMat);
        bellMesh.position.set(0.0, -0.82, 0.6);
        bellMesh.rotation.x = Math.PI * 0.48;
        sculptureGroup.add(bellMesh);

        // 7. Minimal Ambient Molecular Aura Ring (Subtle & Restrained)
        const auraGeom = new THREE.TorusGeometry(2.1, 0.012, 16, 80);
        const auraMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color('#f8c8d8'),
            transparent: true,
            opacity: 0.35,
        });
        const auraMesh = new THREE.Mesh(auraGeom, auraMat);
        auraMesh.position.set(0, 0.3, -0.2);
        auraMesh.rotation.x = Math.PI * 0.36;
        rootGroup.add(auraMesh);

        // Mouse Parallax (Restrained 3-degree max tilt)
        const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
        const handleMouseMove = (e) => {
            const rect = container.getBoundingClientRect();
            mouse.targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // [-1, 1]
            mouse.targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // [-1, 1]
        };

        const handleMouseLeave = () => {
            mouse.targetX = 0;
            mouse.targetY = 0;
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        container.addEventListener('mouseleave', handleMouseLeave);

        // Animation Loop
        let animId;
        const clock = new THREE.Clock();
        let isVisible = true;

        const observer = new IntersectionObserver(([entry]) => {
            isVisible = entry.isIntersecting;
        }, { threshold: 0.05 });
        observer.observe(container);

        const animate = () => {
            animId = requestAnimationFrame(animate);
            if (!isVisible) return;

            const delta = clock.getDelta();
            const elapsed = clock.getElapsedTime();

            if (!prefersReducedMotion) {
                // Smooth exponential dampening to rest
                const lerpFactor = 1.0 - Math.exp(-7.0 * Math.min(delta, 0.1));
                mouse.x += (mouse.targetX - mouse.x) * lerpFactor;
                mouse.y += (mouse.targetY - mouse.y) * lerpFactor;

                // Imperceptible, peaceful breathing idle oscillation
                sculptureGroup.position.y = Math.sin(elapsed * 0.8) * 0.02;

                // Restrained max 3-degree parallax tilt
                sculptureGroup.rotation.y = mouse.x * 0.15 + Math.sin(elapsed * 0.4) * 0.01;
                sculptureGroup.rotation.x = -mouse.y * 0.08;

                // Subtle light shift
                rimLight.position.x = -4.0 + mouse.x * 1.5;
                rimLight.position.y = 5.0 - mouse.y * 1.0;
            }

            renderer.render(scene, camera);
        };

        animate();

        // Responsive Resize
        const handleResize = () => {
            if (!container) return;
            width = container.clientWidth;
            height = container.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            if (width < 640) {
                camera.position.z = 8.5;
            } else {
                camera.position.z = 7.2;
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize, { passive: true });

        return () => {
            cancelAnimationFrame(animId);
            observer.disconnect();
            window.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('resize', handleResize);
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            headGeom.dispose();
            jawGeom.dispose();
            neckGeom.dispose();
            shoulderSlopeGeom.dispose();
            scrubGeom.dispose();
            leftLapelGeom.dispose();
            rightLapelGeom.dispose();
            stethTubeGeom.dispose();
            bellGeom.dispose();
            auraGeom.dispose();
            porcelainMat.dispose();
            coatMat.dispose();
            scrubMat.dispose();
            stethoscopeMat.dispose();
            metallicMat.dispose();
            auraMat.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative select-none py-4">
            {/* Soft Ambient Warm-White/Blush Studio Halo */}
            <div className="absolute w-[460px] h-[520px] bg-[#ffe4ec]/35 rounded-full blur-3xl pointer-events-none -z-10" />

            {/* Three.js Clinical Sculpture Canvas */}
            <div
                ref={containerRef}
                className="w-full h-full min-h-[480px] md:min-h-[560px] lg:min-h-[620px] relative pointer-events-auto flex items-center justify-center"
                aria-label="Sanjeevani Clinical Specialist Digital Sculpture"
            />
        </div>
    );
};

export default ClinicalDoctorVisual;
