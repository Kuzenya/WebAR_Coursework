import * as THREE from 'three';
import { ARScene } from './core/ARScene.js';
import { ModelLibrary } from './models/ModelLibrary.js';
import { ObjectController } from './objects/ObjectController.js';
import { UIController } from './ui/UIController.js';

let objects;
let ui;

const arScene = new ARScene(
    () => placeObject(),
    (isPresenting) => {
        if (!objects) return;
        if (isPresenting) {
            objects.removePreview();
            ui.setStatus('AR-сессия запущена. Найдите горизонтальную поверхность.');
        } else {
            objects.placePreview();
            ui.setStatus('AR-сессия завершена. Включён браузерный режим проверки.');
        }
    }
);

arScene.onFrame = (delta) => objects?.update(delta);

function placeObject() {
    if (!objects) return;

    if (arScene.renderer.xr.isPresenting) {
        if (!arScene.reticle.visible) {
            ui.setStatus('Поверхность не найдена. Медленно наведите камеру на пол или стол.');
            return;
        }
        const object = objects.placeAt(arScene.reticle.matrix);
        ui.setStatus(`Размещён ${objects.library.getLabel(object.userData.kind)}. Всего объектов: ${objects.count}.`);
        return;
    }

    const index = objects.count;
    const x = ((index % 3) - 1) * 0.2;
    const z = -Math.floor(index / 3) * 0.2;
    const matrix = new THREE.Matrix4().makeTranslation(x, 0, z);
    const object = objects.placeAt(matrix);
    ui.setStatus(`Добавлен ${objects.library.getLabel(object.userData.kind)}. Всего объектов: ${objects.count}.`);
}

async function initialize() {
    const status = document.getElementById('status');
    try {
        const library = new ModelLibrary();
        await Promise.all([
            library.load(),
            arScene.loadEnvironment('./assets/studio.hdr')
        ]);

        objects = new ObjectController(arScene.scene, library);
        ui = new UIController(objects, placeObject);
        objects.placePreview();
        ui.setReady();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        status.textContent = 'Не удалось загрузить модели или HDRI. Запустите страницу через локальный сервер и проверьте файлы проекта.';
    }
}

initialize();
