import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

class MemberSolarSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);

        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 15;

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );
        this.controls.enableDamping = true;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.fontLoader = new FontLoader();
        this.labels = [];
        this.hoveredPlanet = null; // Track the currently hovered planet

        this.clock = new THREE.Clock(); // Used to track time for smooth updates

        this.createScene();
        this.setupEventListeners();
        this.animate();
    }

    createScene() {
        const MEMBERS = [
            {
                name: 'President',
                color: 0xff0000,
                distance: 4,
                size: 0.7,
                link: '/president',
            },
            {
                name: 'Vice President',
                color: 0x00ff00,
                distance: 5,
                size: 0.6,
                link: '/vice-president',
            },
            {
                name: 'Secretary',
                color: 0x0000ff,
                distance: 6,
                size: 0.6,
                link: '/secretary',
            },
            {
                name: 'Treasurer',
                color: 0xffff00,
                distance: 7,
                size: 0.6,
                link: '/treasurer',
            },
        ];

        const homePlanetGeometry = new THREE.SphereGeometry(1, 32, 32);
        const homePlanetMaterial = new THREE.MeshStandardMaterial({
            color: 0x8888ff,
            metalness: 0.4,
            roughness: 0.6,
        });
        const homePlanet = new THREE.Mesh(
            homePlanetGeometry,
            homePlanetMaterial
        );
        this.scene.add(homePlanet);

        this.memberPlanets = MEMBERS.map((member) => {
            const geometry = new THREE.SphereGeometry(member.size, 32, 32);
            const material = new THREE.MeshStandardMaterial({
                color: member.color,
                metalness: 0.7,
                roughness: 0.3,
            });
            const planet = new THREE.Mesh(geometry, material);

            const angle = Math.random() * Math.PI * 2;
            planet.position.x = Math.cos(angle) * member.distance;
            planet.position.y = Math.sin(angle) * member.distance;
            planet.userData = {
                link: member.link,
                angle,
                distance: member.distance,
                speed: 0.1 / member.distance, // Adjust speed based on distance
            };

            this.scene.add(planet);

            // Add text labels
            this.addTextLabel(member.name, planet);

            return planet;
        });

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x808080, 2);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0xffffff, 1.5, 100);
        pointLight.position.set(0, 0, 10);
        this.scene.add(pointLight);
    }

    addTextLabel(text, planet) {
        this.fontLoader.load(
            'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
            (font) => {
                const textGeometry = new TextGeometry(text, {
                    font: font,
                    size: 0.2,
                    height: 0.05,
                });
                const textMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                });
                const textMesh = new THREE.Mesh(textGeometry, textMaterial);

                textMesh.position.set(
                    planet.position.x,
                    planet.position.y + 0.7,
                    planet.position.z
                );
                this.scene.add(textMesh);
                this.labels.push({ textMesh, planet });
            }
        );
    }

    setupEventListeners() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('click', this.onClick.bind(this));
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.memberPlanets);

        if (intersects.length > 0) {
            const planet = intersects[0].object;

            if (this.hoveredPlanet !== planet) {
                if (this.hoveredPlanet) {
                    this.hoveredPlanet.scale.set(1, 1, 1);
                    this.hoveredPlanet.material.emissive.setHex(0x000000);
                }

                this.hoveredPlanet = planet;
                planet.scale.set(1.2, 1.2, 1.2);
                planet.material.emissive = new THREE.Color(0x444444);
            }
        } else if (this.hoveredPlanet) {
            this.hoveredPlanet.scale.set(1, 1, 1);
            this.hoveredPlanet.material.emissive.setHex(0x000000);
            this.hoveredPlanet = null;
        }
    }

    onClick(event) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.memberPlanets);

        if (intersects.length > 0) {
            const selectedPlanet = intersects[0].object;
            if (selectedPlanet.userData && selectedPlanet.userData.link) {
                console.log(
                    'Clicked planet link:',
                    selectedPlanet.userData.link
                );
            }
        }
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const delta = this.clock.getDelta(); // Time elapsed since the last frame

        // Rotate and orbit planets slowly
        this.memberPlanets.forEach((planet) => {
            const { angle, distance, speed } = planet.userData;
            const newAngle = angle + speed * delta; // Increment angle by speed and delta
            planet.userData.angle = newAngle;

            planet.position.x = Math.cos(newAngle) * distance;
            planet.position.y = Math.sin(newAngle) * distance;

            // Update text label positions
            const label = this.labels.find((label) => label.planet === planet);
            if (label) {
                label.textMesh.position.set(
                    planet.position.x,
                    planet.position.y + 0.7,
                    planet.position.z
                );
            }

            // Slow rotation for the planets
            planet.rotation.y += 0.001; // Very slow rotation
        });

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the solar system when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('three-scene');
    const solarSystem = new MemberSolarSystem(canvas);
});
