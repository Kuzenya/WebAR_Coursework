import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/** Загрузка, нормализация и создание экземпляров доступных моделей. */
export class ModelLibrary {
    constructor() {
        this.templates = new Map();
        this.labels = { cross: 'крестик', circle: 'нолик', cube: 'куб' };
    }

    async load() {
        const loader = new GLTFLoader();
        const [cross, circle] = await Promise.all([
            loader.loadAsync('./models/cross.glb'),
            loader.loadAsync('./models/circle.glb')
        ]);

        this.templates.set('cross', this.prepare(cross.scene));
        this.templates.set('circle', this.prepare(circle.scene));
        this.templates.set('cube', this.prepare(this.createCube()));
    }

    createCube() {
        const group = new THREE.Group();
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ roughness: 0.28, metalness: 0.55 })
        );
        group.add(mesh);
        return group;
    }

    prepare(source) {
        const wrapper = new THREE.Group();
        const content = source.clone(true);
        wrapper.add(content);

        const initialBox = new THREE.Box3().setFromObject(content);
        const initialSize = initialBox.getSize(new THREE.Vector3());
        const maxDimension = Math.max(initialSize.x, initialSize.y, initialSize.z);
        if (maxDimension > 0) content.scale.multiplyScalar(0.16 / maxDimension);

        content.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(content);
        const center = box.getCenter(new THREE.Vector3());
        content.position.x -= center.x;
        content.position.z -= center.z;
        content.position.y -= box.min.y;
        return wrapper;
    }

    create(kind, color = '#00aaff') {
        const template = this.templates.get(kind);
        if (!template) throw new Error(`Неизвестная модель: ${kind}`);

        const instance = template.clone(true);
        instance.userData.kind = kind;
        instance.userData.color = color;
        instance.userData.autoRotate = false;

        instance.traverse((child) => {
            if (!child.isMesh) return;
            const previous = child.material;
            child.material = new THREE.MeshStandardMaterial({
                color,
                map: previous.map ?? null,
                roughness: 0.28,
                metalness: 0.55,
                envMapIntensity: 1.15
            });
            child.castShadow = true;
            child.receiveShadow = true;
        });

        return instance;
    }

    setColor(object, color) {
        if (!object) return;
        object.userData.color = color;
        object.traverse((child) => {
            if (child.isMesh) child.material.color.set(color);
        });
    }

    getLabel(kind) {
        return this.labels[kind] ?? kind;
    }
}
