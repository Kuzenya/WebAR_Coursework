import * as THREE from 'three';

/** Хранит размещённые объекты и применяет действия к активному экземпляру. */
export class ObjectController {
    constructor(scene, library) {
        this.scene = scene;
        this.library = library;
        this.objects = [];
        this.active = null;
        this.preview = null;
        this.nextKind = 'cross';
        this.nextColor = '#00aaff';
    }

    placeAt(matrix, kind = this.nextKind, color = this.nextColor) {
        const object = this.library.create(kind, color);
        matrix.decompose(object.position, object.quaternion, object.scale);
        object.scale.setScalar(1);
        this.scene.add(object);
        this.objects.push(object);
        this.active = object;
        return object;
    }

    placePreview() {
        if (this.preview) return;
        const matrix = new THREE.Matrix4().makeTranslation(0, 0, 0);
        this.preview = this.placeAt(matrix, this.nextKind, this.nextColor);
    }

    removePreview() {
        if (!this.preview) return;
        this.scene.remove(this.preview);
        this.objects = this.objects.filter((item) => item !== this.preview);
        if (this.active === this.preview) this.active = null;
        this.preview = null;
    }

    setModel(kind) {
        this.nextKind = kind;
        if (!this.active) return null;

        const previous = this.active;
        const replacement = this.library.create(kind, previous.userData.color);
        replacement.position.copy(previous.position);
        replacement.quaternion.copy(previous.quaternion);
        replacement.scale.copy(previous.scale);
        replacement.userData.autoRotate = previous.userData.autoRotate;
        replacement.userData.kind = kind;

        this.scene.remove(previous);
        this.scene.add(replacement);
        const index = this.objects.indexOf(previous);
        if (index >= 0) this.objects[index] = replacement;
        if (this.preview === previous) this.preview = replacement;
        this.active = replacement;
        return replacement;
    }

    setColor(color) {
        this.nextColor = color;
        this.library.setColor(this.active, color);
    }

    rotate(radians) {
        if (this.active) this.active.rotateY(radians);
    }

    toggleAutoRotate() {
        if (!this.active) return false;
        this.active.userData.autoRotate = !this.active.userData.autoRotate;
        return this.active.userData.autoRotate;
    }

    update(deltaSeconds) {
        for (const object of this.objects) {
            if (object.userData.autoRotate) object.rotateY(deltaSeconds * Math.PI * 0.35);
        }
    }

    get count() {
        return this.objects.length;
    }
}
