import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { HitTestManager } from './HitTestManager.js';
import { EnvironmentLoader } from '../lighting/EnvironmentLoader.js';

/** Создаёт Three.js-сцену, XR-сессию и основной цикл рендеринга. */
export class ARScene {
    constructor(onSelect, onSessionChange) {
        this.onSelect = onSelect;
        this.onSessionChange = onSessionChange;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.01, 30);
        this.camera.position.set(0.35, 0.28, 0.7);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        this.renderer.setSize(innerWidth, innerHeight);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.renderer.xr.enabled = true;
        this.renderer.xr.setReferenceSpaceType('local-floor');
        document.body.prepend(this.renderer.domElement);

        this.orbit = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbit.target.set(0, -0.08, 0);
        this.orbit.enableDamping = true;
        this.orbit.minDistance = 0.35;
        this.orbit.maxDistance = 1.8;
        this.orbit.maxPolarAngle = Math.PI * 0.48;
        this.orbit.update();

        this.addLights();
        this.addDesktopGround();
        this.hitTest = new HitTestManager(this.renderer, this.scene);
        this.environment = new EnvironmentLoader(this.renderer);
        this.createARButton();

        const controller = this.renderer.xr.getController(0);
        controller.addEventListener('select', () => this.onSelect());
        this.scene.add(controller);

        this.renderer.xr.addEventListener('sessionstart', async () => {
            this.desktopGround.visible = false;
            this.orbit.enabled = false;
            this.onSessionChange(true);
            try {
                await this.hitTest.start(this.renderer.xr.getSession());
            } catch (error) {
                console.error('Ошибка Hit Test:', error);
            }
        });
        this.renderer.xr.addEventListener('sessionend', () => {
            this.hitTest.reset();
            this.desktopGround.visible = true;
            this.orbit.enabled = true;
            this.onSessionChange(false);
        });

        this.clock = new THREE.Clock();
        this.renderer.setAnimationLoop((timestamp, frame) => this.render(timestamp, frame));
        addEventListener('resize', () => this.resize());
    }

    addLights() {
        this.scene.add(new THREE.HemisphereLight(0xffffff, 0x777788, 1.4));
        const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
        keyLight.position.set(1.5, 3, 2);
        this.scene.add(keyLight);
    }

    addDesktopGround() {
        this.desktopGround = new THREE.Group();
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(2.4, 2.4),
            new THREE.MeshStandardMaterial({ color: 0x282831, roughness: 0.86, metalness: 0.05 })
        );
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -0.002;
        this.desktopGround.add(plane);

        const grid = new THREE.GridHelper(2.4, 24, 0x00aaff, 0x4a4a5a);
        grid.position.y = 0.001;
        this.desktopGround.add(grid);
        this.scene.add(this.desktopGround);
    }

    createARButton() {
        const button = ARButton.createButton(this.renderer, {
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['dom-overlay', 'local-floor'],
            domOverlay: { root: document.body }
        });
        document.getElementById('ar-button').appendChild(button);
    }

    async loadEnvironment(url) {
        this.scene.environment = await this.environment.load(url);
    }

    get reticle() {
        return this.hitTest.reticle;
    }

    render(timestamp, frame) {
        if (frame) this.hitTest.update(frame);
        const delta = Math.min(this.clock.getDelta(), 0.05);
        this.onFrame?.(delta);
        if (!this.renderer.xr.isPresenting) this.orbit.update();
        this.renderer.render(this.scene, this.camera);
    }

    resize() {
        this.camera.aspect = innerWidth / innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(innerWidth, innerHeight);
    }
}
