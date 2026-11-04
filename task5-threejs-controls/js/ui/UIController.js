/** Связывает HTML-интерфейс с командами контроллера объектов. */
export class UIController {
    constructor(objects, onPlace) {
        this.objects = objects;
        this.onPlace = onPlace;
        this.status = document.getElementById('status');
        this.controls = document.getElementById('controls');
        this.modelSelect = document.getElementById('model-select');
        this.autoRotateButton = document.getElementById('auto-rotate');
        this.swatches = [...document.querySelectorAll('.swatch')];
        this.bind();
    }

    bind() {
        document.getElementById('ui-root').addEventListener('pointerdown', (event) => {
            event.stopPropagation();
        });

        this.modelSelect.addEventListener('change', () => {
            const kind = this.modelSelect.value;
            this.objects.setModel(kind);
            this.setStatus(`Выбрана модель: ${this.objects.library.getLabel(kind)}.`);
        });

        for (const swatch of this.swatches) {
            swatch.addEventListener('click', () => {
                const color = swatch.dataset.color;
                this.objects.setColor(color);
                this.swatches.forEach((item) => {
                    const selected = item === swatch;
                    item.classList.toggle('selected', selected);
                    item.setAttribute('aria-pressed', String(selected));
                });
                this.setStatus('Цвет активного объекта изменён.');
            });
        }

        document.getElementById('rotate-left').addEventListener('click', () => {
            this.objects.rotate(Math.PI / 12);
        });
        document.getElementById('rotate-right').addEventListener('click', () => {
            this.objects.rotate(-Math.PI / 12);
        });
        this.autoRotateButton.addEventListener('click', () => {
            const enabled = this.objects.toggleAutoRotate();
            this.autoRotateButton.setAttribute('aria-pressed', String(enabled));
        });
        document.getElementById('place-object').addEventListener('click', this.onPlace);
    }

    setReady() {
        this.controls.disabled = false;
        this.setStatus('Готово. В браузере доступна тестовая модель; для AR нажмите «Start AR».');
    }

    setStatus(message) {
        this.status.textContent = message;
    }
}
