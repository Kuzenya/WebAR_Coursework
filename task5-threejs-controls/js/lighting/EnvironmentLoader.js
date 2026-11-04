import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

/** Загружает HDRI и преобразует её в карту окружения для PBR-материалов. */
export class EnvironmentLoader {
    constructor(renderer) {
        this.renderer = renderer;
        this.texture = null;
    }

    async load(url) {
        const hdr = await new RGBELoader().loadAsync(url);
        hdr.mapping = THREE.EquirectangularReflectionMapping;

        const pmrem = new THREE.PMREMGenerator(this.renderer);
        pmrem.compileEquirectangularShader();
        this.texture = pmrem.fromEquirectangular(hdr).texture;

        hdr.dispose();
        pmrem.dispose();
        return this.texture;
    }
}
