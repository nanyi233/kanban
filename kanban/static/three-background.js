/**
 * Three.js 3D Background Animation
 * Creates an immersive particle system with floating geometric shapes
 */

(function() {
    'use strict';

    // ========================================
    // Scene Setup
    // ========================================
    
    const canvas = document.getElementById('three-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true,
        antialias: true 
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.position.z = 50;

    // ========================================
    // Color Configuration
    // ========================================
    
    const colors = {
        light: {
            primary: 0x667eea,
            secondary: 0x764ba2,
            accent: 0x8b5cf6,
            particles: [0x667eea, 0x764ba2, 0x8b5cf6, 0xec4899, 0xf59e0b]
        },
        dark: {
            primary: 0x1e1b4b,
            secondary: 0x312e81,
            accent: 0x8b5cf6,
            particles: [0x4f46e5, 0x7c3aed, 0x8b5cf6, 0xec4899, 0x06b6d4]
        }
    };

    let currentTheme = document.documentElement.getAttribute('data-theme') || 'light';

    // ========================================
    // Particle System
    // ========================================
    
    const particleCount = 200;
    const particles = [];
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    const particleColors = new Float32Array(particleCount * 3);

    function initParticles() {
        const themeColors = colors[currentTheme].particles;
        
        for (let i = 0; i < particleCount; i++) {
            // Random positions
            positions[i * 3] = (Math.random() - 0.5) * 150;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 80;

            // Random velocities
            velocities.push({
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02,
                z: (Math.random() - 0.5) * 0.02
            });

            // Random colors from theme
            const color = new THREE.Color(themeColors[Math.floor(Math.random() * themeColors.length)]);
            particleColors[i * 3] = color.r;
            particleColors[i * 3 + 1] = color.g;
            particleColors[i * 3 + 2] = color.b;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    }

    initParticles();

    // Custom particle texture
    function createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        return new THREE.CanvasTexture(canvas);
    }

    const particleMaterial = new THREE.PointsMaterial({
        size: 1.5,
        map: createParticleTexture(),
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // ========================================
    // Floating Geometric Shapes
    // ========================================
    
    const shapes = [];
    const shapeTypes = ['octahedron', 'icosahedron', 'tetrahedron', 'dodecahedron'];

    function createShape(type, position, scale, color) {
        let geometry;
        switch (type) {
            case 'octahedron':
                geometry = new THREE.OctahedronGeometry(scale, 0);
                break;
            case 'icosahedron':
                geometry = new THREE.IcosahedronGeometry(scale, 0);
                break;
            case 'tetrahedron':
                geometry = new THREE.TetrahedronGeometry(scale, 0);
                break;
            case 'dodecahedron':
                geometry = new THREE.DodecahedronGeometry(scale, 0);
                break;
            default:
                geometry = new THREE.OctahedronGeometry(scale, 0);
        }

        const material = new THREE.MeshBasicMaterial({
            color: color,
            wireframe: true,
            transparent: true,
            opacity: 0.4
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.userData = {
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.01,
                y: (Math.random() - 0.5) * 0.01,
                z: (Math.random() - 0.5) * 0.01
            },
            floatSpeed: 0.001 + Math.random() * 0.002,
            floatAmplitude: 2 + Math.random() * 3,
            floatOffset: Math.random() * Math.PI * 2,
            originalY: position.y
        };

        return mesh;
    }

    function initShapes() {
        const themeColors = colors[currentTheme].particles;
        
        for (let i = 0; i < 15; i++) {
            const type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
            const position = {
                x: (Math.random() - 0.5) * 120,
                y: (Math.random() - 0.5) * 80,
                z: (Math.random() - 0.5) * 40 - 20
            };
            const scale = 2 + Math.random() * 4;
            const color = themeColors[Math.floor(Math.random() * themeColors.length)];
            
            const shape = createShape(type, position, scale, color);
            shapes.push(shape);
            scene.add(shape);
        }
    }

    initShapes();

    // ========================================
    // Connection Lines
    // ========================================
    
    const lineMaterial = new THREE.LineBasicMaterial({
        color: colors[currentTheme].accent,
        transparent: true,
        opacity: 0.15
    });

    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(particleCount * particleCount * 6);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    function updateLines() {
        const positions = particleGeometry.attributes.position.array;
        const linePositions = lines.geometry.attributes.position.array;
        let lineIndex = 0;
        const maxDistance = 15;

        for (let i = 0; i < particleCount; i++) {
            for (let j = i + 1; j < particleCount && lineIndex < particleCount * particleCount * 6 - 6; j++) {
                const dx = positions[i * 3] - positions[j * 3];
                const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
                const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < maxDistance) {
                    linePositions[lineIndex++] = positions[i * 3];
                    linePositions[lineIndex++] = positions[i * 3 + 1];
                    linePositions[lineIndex++] = positions[i * 3 + 2];
                    linePositions[lineIndex++] = positions[j * 3];
                    linePositions[lineIndex++] = positions[j * 3 + 1];
                    linePositions[lineIndex++] = positions[j * 3 + 2];
                }
            }
        }

        // Clear remaining positions
        for (let i = lineIndex; i < linePositions.length; i++) {
            linePositions[i] = 0;
        }

        lines.geometry.attributes.position.needsUpdate = true;
    }

    // ========================================
    // Mouse Interaction
    // ========================================
    
    const mouse = { x: 0, y: 0 };
    const targetMouse = { x: 0, y: 0 };

    document.addEventListener('mousemove', (e) => {
        targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // ========================================
    // Card Tilt Effect
    // ========================================
    
    function initCardTilt() {
        document.addEventListener('mousemove', handleCardTilt);
    }

    function handleCardTilt(e) {
        const cards = document.querySelectorAll('.project-card:not(.dragging)');
        
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const mouseX = e.clientX - centerX;
            const mouseY = e.clientY - centerY;
            
            // Check if mouse is near the card
            const distance = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
            const maxDistance = 300;
            
            if (distance < maxDistance) {
                const intensity = 1 - (distance / maxDistance);
                const rotateX = (mouseY / rect.height) * 15 * intensity;
                const rotateY = -(mouseX / rect.width) * 15 * intensity;
                const translateZ = 10 * intensity;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`;
                card.style.boxShadow = `
                    ${-rotateY * 2}px ${rotateX * 2}px 30px rgba(139, 92, 246, ${0.15 * intensity}),
                    0 8px 25px rgba(0, 0, 0, ${0.08 + 0.1 * intensity})
                `;
            } else {
                card.style.transform = '';
                card.style.boxShadow = '';
            }
        });
    }

    // Reset card transforms on mouse leave
    document.addEventListener('mouseleave', () => {
        document.querySelectorAll('.project-card').forEach(card => {
            card.style.transform = '';
            card.style.boxShadow = '';
        });
    });

    // ========================================
    // Animation Loop
    // ========================================
    
    let frameCount = 0;

    function animate() {
        requestAnimationFrame(animate);
        frameCount++;

        // Smooth mouse follow
        mouse.x += (targetMouse.x - mouse.x) * 0.05;
        mouse.y += (targetMouse.y - mouse.y) * 0.05;

        // Camera movement
        camera.position.x += (mouse.x * 5 - camera.position.x) * 0.02;
        camera.position.y += (mouse.y * 3 - camera.position.y) * 0.02;
        camera.lookAt(scene.position);

        // Update particles
        const positions = particleGeometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] += velocities[i].x;
            positions[i * 3 + 1] += velocities[i].y;
            positions[i * 3 + 2] += velocities[i].z;

            // Boundary wrapping
            if (positions[i * 3] > 75) positions[i * 3] = -75;
            if (positions[i * 3] < -75) positions[i * 3] = 75;
            if (positions[i * 3 + 1] > 50) positions[i * 3 + 1] = -50;
            if (positions[i * 3 + 1] < -50) positions[i * 3 + 1] = 50;
            if (positions[i * 3 + 2] > 40) positions[i * 3 + 2] = -40;
            if (positions[i * 3 + 2] < -40) positions[i * 3 + 2] = 40;
        }
        particleGeometry.attributes.position.needsUpdate = true;

        // Update connection lines every 3 frames for performance
        if (frameCount % 3 === 0) {
            updateLines();
        }

        // Rotate particle system
        particleSystem.rotation.y += 0.0003;
        particleSystem.rotation.x += 0.0001;

        // Update floating shapes
        const time = Date.now() * 0.001;
        shapes.forEach(shape => {
            shape.rotation.x += shape.userData.rotationSpeed.x;
            shape.rotation.y += shape.userData.rotationSpeed.y;
            shape.rotation.z += shape.userData.rotationSpeed.z;
            
            // Floating animation
            shape.position.y = shape.userData.originalY + 
                Math.sin(time * shape.userData.floatSpeed * 100 + shape.userData.floatOffset) * 
                shape.userData.floatAmplitude;
        });

        renderer.render(scene, camera);
    }

    // ========================================
    // Theme Change Handler
    // ========================================
    
    function updateTheme() {
        currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const themeColors = colors[currentTheme].particles;
        
        // Update particle colors
        const particleColorAttr = particleGeometry.attributes.color;
        for (let i = 0; i < particleCount; i++) {
            const color = new THREE.Color(themeColors[Math.floor(Math.random() * themeColors.length)]);
            particleColorAttr.array[i * 3] = color.r;
            particleColorAttr.array[i * 3 + 1] = color.g;
            particleColorAttr.array[i * 3 + 2] = color.b;
        }
        particleColorAttr.needsUpdate = true;

        // Update shape colors
        shapes.forEach(shape => {
            shape.material.color.setHex(themeColors[Math.floor(Math.random() * themeColors.length)]);
        });

        // Update line color
        lineMaterial.color.setHex(colors[currentTheme].accent);
    }

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-theme') {
                updateTheme();
            }
        });
    });

    observer.observe(document.documentElement, { attributes: true });

    // ========================================
    // Window Resize Handler
    // ========================================
    
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onWindowResize);

    // ========================================
    // Initialize
    // ========================================
    
    initCardTilt();
    animate();

    // Expose update function for external use
    window.updateThreeBackground = updateTheme;

})();
