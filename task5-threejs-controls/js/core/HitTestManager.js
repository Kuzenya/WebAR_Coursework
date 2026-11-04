import * as THREE from 'three';

/** Управляет XRHitTestSource и визуальным маркером найденной поверхности. */
export class HitTestManager {
    constructor(renderer, scene) {
        this.renderer = renderer;
        this.source = null;
        this.requested = false;

        const geometry = new THREE.RingGeometry(0.075, 0.105, 40);
        geometry.rotateX(-Math.PI / 2);
        const material = new THREE.MeshBasicMaterial({
            color: 0x75e6a4,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });

        this.reticle = new THREE.Mesh(geometry, material);
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        scene.add(this.reticle);
    }

    async start(session) {
        if (this.requested) return;
        this.requested = true;

        try {
            const viewerSpace = await session.requestReferenceSpace('viewer');
            this.source = await session.requestHitTestSource({ space: viewerSpace });
        } catch (error) {
            this.requested = false;
            throw error;
        }
    }

    update(frame) {
        if (!frame || !this.source) return false;

        const referenceSpace = this.renderer.xr.getReferenceSpace();
        const results = frame.getHitTestResults(this.source);

        if (results.length === 0) {
            this.reticle.visible = false;
            return false;
        }

        const pose = results[0].getPose(referenceSpace);
        if (!pose) {
            this.reticle.visible = false;
            return false;
        }

        this.reticle.visible = true;
        this.reticle.matrix.fromArray(pose.transform.matrix);
        return true;
    }

    reset() {
        this.source?.cancel();
        this.source = null;
        this.requested = false;
        this.reticle.visible = false;
    }
}
