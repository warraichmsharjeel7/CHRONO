 class CyberAudio {
            constructor() {
                this.ctx = null;
                this.enabled = false;
            }

            init() {
                if (!this.ctx) {
                    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                }
            }

            playClick() {
                if (!this.enabled || !this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.05);
                gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.05);
            }

            playWhoosh() {
                if (!this.enabled || !this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(150, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.2);
            }
        }

        const audio = new CyberAudio();
        const audioBtn = document.getElementById('audio-toggle');
        const audioIcon = document.getElementById('audio-icon');

        audioBtn.addEventListener('click', () => {
            audio.init();
            audio.enabled = !audio.enabled;
            if (audio.enabled) {
                audioIcon.className = 'fa-solid fa-volume-high text-cyber-cyan';
                audio.playClick();
            } else {
                audioIcon.className = 'fa-solid fa-volume-xmark text-slate-400';
            }
        });

        let scene, camera, renderer, controls;
        let watchGroup;
        let coreMaterial, emissiveMaterials = [];
        let particlesMesh;
        let isExploded = false;

        let bezelMesh, glassMesh, coreMesh, gearMesh1, gearMesh2, strapTop, strapBottom;

        function init3D() {
            const container = document.getElementById('canvas-container');

            scene = new THREE.Scene();
            scene.fog = new THREE.FogExp2(0x030508, 0.03);

            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
            camera.position.set(0, 0, 8);

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.3;
            container.appendChild(renderer.domElement);

            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.enableZoom = true;
            controls.maxDistance = 14;
            controls.minDistance = 3;
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.8;

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
            scene.add(ambientLight);

            const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.5);
            dirLight1.position.set(5, 10, 7);
            scene.add(dirLight1);

            const dirLight2 = new THREE.DirectionalLight(0x00f3ff, 2.0);
            dirLight2.position.set(-5, -5, -5);
            scene.add(dirLight2);

            const pointLight = new THREE.PointLight(0x00f3ff, 4, 12);
            pointLight.position.set(0, 0, 2);
            scene.add(pointLight);

            // Particles Background
            const particleCount = 500;
            const particleGeo = new THREE.BufferGeometry();
            const particlePos = new Float32Array(particleCount * 3);

            for (let i = 0; i < particleCount * 3; i += 3) {
                particlePos[i] = (Math.random() - 0.5) * 20;
                particlePos[i + 1] = (Math.random() - 0.5) * 20;
                particlePos[i + 2] = (Math.random() - 0.5) * 20;
            }

            particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
            const particleMat = new THREE.PointsMaterial({
                color: 0x00f3ff,
                size: 0.035,
                transparent: true,
                opacity: 0.7,
                blending: THREE.AdditiveBlending
            });
            particlesMesh = new THREE.Points(particleGeo, particleMat);
            scene.add(particlesMesh);

            buildCyberWatch();

            window.addEventListener('resize', onWindowResize);

            setTimeout(() => {
                const loader = document.getElementById('loader');
                loader.classList.add('opacity-0');
                setTimeout(() => loader.style.display = 'none', 700);
            }, 1000);

            setupScrollAnimations();
        }

        function buildCyberWatch() {
            watchGroup = new THREE.Group();
            scene.add(watchGroup);

            const titaniumMaterial = new THREE.MeshStandardMaterial({
                color: 0x1e293b,
                metalness: 0.95,
                roughness: 0.15,
            });

            coreMaterial = new THREE.MeshStandardMaterial({
                color: 0x00f3ff,
                emissive: 0x00f3ff,
                emissiveIntensity: 2.0,
                metalness: 0.5,
                roughness: 0.1
            });
            emissiveMaterials.push(coreMaterial);

            const glassMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.35,
                roughness: 0.05,
                transmission: 0.95,
                thickness: 0.5
            });

            const bodyGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.4, 64);
            const mainBody = new THREE.Mesh(bodyGeo, titaniumMaterial);
            watchGroup.add(mainBody);

            const bezelGeo = new THREE.TorusGeometry(1.65, 0.12, 16, 64);
            bezelMesh = new THREE.Mesh(bezelGeo, titaniumMaterial);
            bezelMesh.rotation.x = Math.PI / 2;
            watchGroup.add(bezelMesh);

            const innerRingGeo = new THREE.TorusGeometry(1.4, 0.04, 16, 64);
            const innerRing = new THREE.Mesh(innerRingGeo, coreMaterial);
            innerRing.rotation.x = Math.PI / 2;
            watchGroup.add(innerRing);

            const glassGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.05, 64);
            glassMesh = new THREE.Mesh(glassGeo, glassMaterial);
            glassMesh.position.y = 0.22;
            watchGroup.add(glassMesh);

            const coreGeo = new THREE.IcosahedronGeometry(0.55, 2);
            coreMesh = new THREE.Mesh(coreGeo, coreMaterial);
            coreMesh.position.y = 0.05;
            watchGroup.add(coreMesh);

            const gearGeo1 = new THREE.TorusGeometry(0.9, 0.05, 8, 32);
            gearMesh1 = new THREE.Mesh(gearGeo1, titaniumMaterial);
            gearMesh1.rotation.x = Math.PI / 2;
            gearMesh1.position.y = -0.05;
            watchGroup.add(gearMesh1);

            const gearGeo2 = new THREE.TorusGeometry(1.15, 0.03, 12, 48);
            gearMesh2 = new THREE.Mesh(gearGeo2, coreMaterial);
            gearMesh2.rotation.x = Math.PI / 2;
            gearMesh2.position.y = -0.12;
            watchGroup.add(gearMesh2);

            const createStrap = (direction) => {
                const strapGroup = new THREE.Group();
                for (let i = 0; i < 5; i++) {
                    const segmentGeo = new THREE.BoxGeometry(1.4, 0.12, 0.45);
                    const segment = new THREE.Mesh(segmentGeo, titaniumMaterial);
                    segment.position.z = direction * (1.9 + i * 0.48);
                    segment.position.y = -Math.pow(i, 1.2) * 0.08;
                    segment.rotation.x = direction * i * 0.08;
                    strapGroup.add(segment);

                    if (i % 2 === 0) {
                        const stripeGeo = new THREE.BoxGeometry(0.8, 0.14, 0.08);
                        const stripe = new THREE.Mesh(stripeGeo, coreMaterial);
                        stripe.position.copy(segment.position);
                        stripe.position.y += 0.01;
                        strapGroup.add(stripe);
                    }
                }
                return strapGroup;
            };

            strapTop = createStrap(1);
            strapBottom = createStrap(-1);
            watchGroup.add(strapTop);
            watchGroup.add(strapBottom);

            watchGroup.rotation.x = 0.6;
            watchGroup.rotation.y = -0.4;
        }

        function setupScrollAnimations() {
            gsap.registerPlugin(ScrollTrigger);

            let dummy = { p: 0 };
            gsap.to(dummy, {
                p: 100,
                duration: 0.8,
                onUpdate: () => {
                    document.getElementById('progress-bar').style.width = dummy.p + '%';
                    document.getElementById('progress-text').innerText = Math.round(dummy.p) + '%';
                }
            });

            gsap.from(watchGroup.scale, {
                x: 0, y: 0, z: 0,
                duration: 1.5,
                ease: 'back.out(1.4)',
                delay: 0.5
            });

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: "#features",
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1,
                    onEnter: () => audio.playWhoosh(),
                }
            });

            tl.to(watchGroup.rotation, { x: 1.2, y: 3.14, z: 0.5 }, 0)
              .to(bezelMesh.position, { y: 1.2 }, 0)
              .to(glassMesh.position, { y: 1.8 }, 0)
              .to(coreMesh.position, { y: 0.6 }, 0)
              .to(gearMesh1.position, { y: -0.6 }, 0)
              .to(gearMesh2.position, { y: -1.2 }, 0)
              .to(strapTop.position, { z: 0.8 }, 0)
              .to(strapBottom.position, { z: -0.8 }, 0);

            gsap.timeline({
                scrollTrigger: {
                    trigger: "#specs",
                    start: "top bottom",
                    end: "center center",
                    scrub: 1.2,
                }
            })
            .to(watchGroup.rotation, { x: 0.2, y: 6.28, z: 0 }, 0)
            .to(camera.position, { x: -2, y: 1, z: 6 }, 0);

            gsap.timeline({
                scrollTrigger: {
                    trigger: "#configurator",
                    start: "top bottom",
                    end: "center center",
                    scrub: 1,
                }
            })
            .to(watchGroup.rotation, { x: 0.5, y: 0, z: 0 }, 0)
            .to(camera.position, { x: 0, y: 0, z: 6.5 }, 0);
        }

        function focusHotspot(target) {
            audio.playClick();
            if (target === 'core') {
                gsap.to(camera.position, { x: 0, y: 0.5, z: 4.5, duration: 1.2, ease: 'power2.inOut' });
                gsap.to(watchGroup.rotation, { x: 0.8, y: 0.2, z: 0, duration: 1.2 });
            } else if (target === 'bezel') {
                gsap.to(camera.position, { x: 2, y: 1, z: 5, duration: 1.2, ease: 'power2.inOut' });
                gsap.to(watchGroup.rotation, { x: 0.4, y: 1.2, z: 0.2, duration: 1.2 });
            } else if (target === 'hologram') {
                gsap.to(camera.position, { x: 0, y: 2, z: 4, duration: 1.2, ease: 'power2.inOut' });
                gsap.to(watchGroup.rotation, { x: 1.4, y: 0, z: 0, duration: 1.2 });
            }
        }

        function resetCameraView() {
            audio.playClick();
            gsap.to(camera.position, { x: 0, y: 0, z: 8, duration: 1 });
            gsap.to(watchGroup.rotation, { x: 0.6, y: -0.4, z: 0, duration: 1 });
        }

        function toggleWireframe() {
            audio.playClick();
            scene.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.wireframe = !child.material.wireframe;
                }
            });
        }

        function toggleExplodedViewManual() {
            audio.playWhoosh();
            isExploded = !isExploded;
            gsap.to(bezelMesh.position, { y: isExploded ? 1.2 : 0, duration: 0.8 });
            gsap.to(glassMesh.position, { y: isExploded ? 1.8 : 0.22, duration: 0.8 });
            gsap.to(coreMesh.position, { y: isExploded ? 0.6 : 0.05, duration: 0.8 });
            gsap.to(gearMesh1.position, { y: isExploded ? -0.6 : -0.05, duration: 0.8 });
            gsap.to(gearMesh2.position, { y: isExploded ? -1.2 : -0.12, duration: 0.8 });
        }

        function setAccentColor(hexColor, colorName) {
            audio.playClick();
            const newColor = new THREE.Color(hexColor);
            
            emissiveMaterials.forEach(mat => {
                gsap.to(mat.color, { r: newColor.r, g: newColor.g, b: newColor.b, duration: 0.6 });
                gsap.to(mat.emissive, { r: newColor.r, g: newColor.g, b: newColor.b, duration: 0.6 });
            });

            const nameEl = document.getElementById('active-color-name');
            nameEl.innerText = `${colorName.toUpperCase()} EDITION`;
            nameEl.style.color = hexColor;
        }

        function scrollToSection(id) {
            audio.playClick();
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }

        function triggerPreorderModal() {
            audio.playClick();
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md';
            modal.innerHTML = `
                <div class="glass-panel p-8 rounded-3xl max-w-md w-full text-center space-y-4 border border-cyber-cyan shadow-[0_0_50px_rgba(0,243,255,0.3)]">
                    <div class="w-16 h-16 bg-cyber-cyan/20 rounded-full border border-cyber-cyan flex items-center justify-center text-cyber-cyan text-2xl mx-auto">
                        <i class="fa-solid fa-check"></i>
                    </div>
                    <h3 class="font-orbitron font-bold text-2xl text-white">RESERVATION LOGGED</h3>
                    <p class="text-sm text-slate-300">Your custom prototype configuration has been queued for quantum synthesis.</p>
                    <button onclick="this.closest('.fixed').remove()" class="cyber-button bg-cyber-cyan text-black font-orbitron font-bold px-6 py-3 rounded-xl text-xs w-full">
                        CLOSE TRANSMISSION
                    </button>
                </div>
            `;
            document.body.appendChild(modal);
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function animate() {
            requestAnimationFrame(animate);

            if (gearMesh1) gearMesh1.rotation.z += 0.01;
            if (gearMesh2) gearMesh2.rotation.z -= 0.015;
            if (coreMesh) coreMesh.rotation.y += 0.005;

            if (particlesMesh) particlesMesh.rotation.y += 0.0005;

            controls.update();
            renderer.render(scene, camera);
        }

        window.onload = function() {
            init3D();
            animate();
        };