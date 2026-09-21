// Variable global para almacenar el ejercicio actual detectado
let currentExercise = 'still';
let selectedLevel = 'press'; // Nivel seleccionado por defecto

// --- FUNCIÓN DE SIMULACIÓN ---
function simular(ejercicio) {
    currentExercise = ejercicio;
    console.log("Simulando ejercicio:", ejercicio);
}

// --- CONEXIÓN SERIAL CON ARDUINO ---
document.getElementById('btn-connect')?.addEventListener('click', async () => {
    if ('serial' in navigator) {
        try {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 115200 });
            document.getElementById('status').innerText = 'Estado: Conectado';
            
            const textDecoder = new TextDecoderStream();
            const listenToStream = port.readable.pipeTo(textDecoder.writable);
            const reader = textDecoder.readable.getReader();

            let buffer = '';
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                if (value) {
                    buffer += value;
                    const lines = buffer.split('\n');
                    buffer = lines.pop();
                    
                    for (const line of lines) {
                        const trimmed = line.trim().toLowerCase();
                        if (trimmed) {
                            currentExercise = trimmed;
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error al conectar:', err);
            document.getElementById('status').innerText = 'Error al conectar';
        }
    } else {
        alert('Web Serial API no es soportada en este navegador. Usa Chrome o Edge.');
    }
});


// ==========================================
// 1. ESCENA DE INICIO / PANTALLA PRINCIPAL
// ==========================================
class HomeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HomeScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#0d1117');

        this.add.text(400, 200, 'FITNESS QUEST', {
            fontSize: '48px',
            fill: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 260, 'Entrenamiento con Arduino y Machine Learning', {
            fontSize: '18px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const startBtn = this.add.text(400, 380, ' [ INICIAR JUEGO ] ', {
            fontSize: '28px',
            fill: '#28a745',
            backgroundColor: '#1f2937',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        startBtn.on('pointerover', () => startBtn.setStyle({ fill: '#ffc107', backgroundColor: '#374151' }));
        startBtn.on('pointerout', () => startBtn.setStyle({ fill: '#28a745', backgroundColor: '#1f2937' }));

        startBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
}


// ==========================================
// 2. ESCENA DE SELECCIÓN DE NIVELES
// ==========================================
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#0d1117');

        this.add.text(400, 80, 'SELECCIONA TU NIVEL', {
            fontSize: '36px',
            fill: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const levels = [
            { name: 'Nivel 1: Press Militar (Sostener Peso)', key: 'press' },
            { name: 'Nivel 2: Remo Inclinado (Navegar Canoa)', key: 'row' },
            { name: 'Nivel 3: Curl de Bíceps (Jalar Cuerda)', key: 'curl' },
            { name: 'Nivel 4: Elevación Lateral (Vuelo)', key: 'lateral_raise' },
            { name: 'Nivel 5: Extensión Tríceps (Catapulta)', key: 'triceps' }
        ];

        levels.forEach((lvl, index) => {
            let btn = this.add.text(400, 180 + (index * 60), lvl.name, {
                fontSize: '20px',
                fill: '#ffffff',
                backgroundColor: '#1f2937',
                padding: { x: 15, y: 10 }
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

            btn.on('pointerover', () => btn.setStyle({ fill: '#ffc107', backgroundColor: '#374151' }));
            btn.on('pointerout', () => btn.setStyle({ fill: '#ffffff', backgroundColor: '#1f2937' }));

            btn.on('pointerdown', () => {
                selectedLevel = lvl.key;
                this.scene.start('CountdownScene');
            });
        });
    }
}


// ==========================================
// 3. ESCENA DE CUENTA REGRESIVA
// ==========================================
class CountdownScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CountdownScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#111827');

        this.add.text(400, 200, `PREPÁRATE PARA: ${selectedLevel.toUpperCase()}`, {
            fontSize: '24px',
            fill: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.countText = this.add.text(400, 320, '3', {
            fontSize: '96px',
            fill: '#ffc107',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.counter = 3;

        this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.counter--;
                if (this.counter > 0) {
                    this.countText.setText(this.counter.toString());
                } else if (this.counter === 0) {
                    this.countText.setText('¡YA!');
                    this.countText.setStyle({ fill: '#28a745' });
                } else {
                    this.scene.start('GameScene');
                }
            },
            repeat: 3
        });
    }
}


// ==========================================
// 4. ESCENA PRINCIPAL DEL JUEGO
// ==========================================
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.image('sky', 'assets/sky.jpg');
        this.load.image('ground', 'assets/ground.png');
        this.load.spritesheet('placeholder2', 'assets/placeholder2.png', { 
            frameWidth: 600, 
            frameHeight: 600 
        });

        this.load.image('river', 'assets/river.jpg');
        this.load.image('canoe', 'assets/canoe.png');
    }

    create() {
        // --- ESCENARIO BASE ---
        this.skyBg = this.add.image(400, 280, 'sky').setScale(1.5);
        this.ground = this.add.image(400, 1020, 'ground').setScale(1.6).setOrigin(0.5, 1);

        // --- ESCENARIO DE REMO (RÍO + CANOA CENTRADA) ---
        this.riverBg = this.add.tileSprite(400, 300, 800, 600, 'river');
        this.riverBg.setDisplaySize(800, 600);
        this.canoe = this.add.image(400, 360, 'canoe').setScale(0.5);

        // Mostrar / Ocultar escenarios
        const isRowLevel = selectedLevel === 'row';
        this.riverBg.setVisible(isRowLevel);
        this.canoe.setVisible(isRowLevel);
        this.skyBg.setVisible(!isRowLevel);
        this.ground.setVisible(!isRowLevel);

        // --- ANIMACIÓN DEL BÍCEPS EN SU POSICIÓN ORIGINAL (100, 100) ---
        this.player = this.add.sprite(100, 100, 'placeholder2').setScale(0.3);

        // --- OBJETO DEL PRESS (GRANDE EN X=400) ---
        this.heavyObject = this.add.rectangle(400, 350, 280, 120, 0x888888);
        this.heavyObject.setVisible(selectedLevel === 'press');

        // --- ELEMENTOS DE LA CUERDA INDEPENDIENTES (CENTRADA EN X=400, Y=380) ---
        const isCurlLevel = selectedLevel === 'curl';
        this.ropeGraphics = this.add.graphics();
        this.ropeGraphics.setVisible(isCurlLevel);

        // Objeto pesado que viene desde la derecha (X=750)
        this.pulledObject = this.add.rectangle(750, 380, 80, 60, 0x8b4513);
        this.pulledObject.setVisible(isCurlLevel);

        // Registrar la animación
        this.anims.create({
            key: 'mover_placeholder',
            frames: this.anims.generateFrameNumbers('placeholder2', { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1
        });

        // Tiempos objetivo en segundos por nivel
        this.targets = { press: 10, row: 12, curl: 10, lateral_raise: 8, triceps: 10 };
        this.holdTime = 0;

        // UI
        this.exerciseText = this.add.text(20, 20, `Nivel: ${selectedLevel.toUpperCase()}`, { 
            fontSize: '22px', 
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });

        this.timerText = this.add.text(20, 60, 'Aguante: 0s', { 
            fontSize: '20px', 
            fill: '#00ffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });

        const backBtn = this.add.text(780, 20, '[ MENÚ ]', {
            fontSize: '18px',
            fill: '#ff4444',
            backgroundColor: '#000000',
            padding: 5
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

        backBtn.on('pointerdown', () => this.scene.start('MenuScene'));

        this.progressBar = this.add.graphics();
    }

    update(time, delta) {
        let deltaSec = delta / 1000;
        let target = this.targets[selectedLevel] || 10;

        if (currentExercise === selectedLevel) {
            this.player.play('mover_placeholder', true);
            this.holdTime += deltaSec;

            // --- MOVIMIENTO SEGÚN EL EJERCICIO ---
            if (selectedLevel === 'press') {
                this.heavyObject.y = Math.max(180, this.heavyObject.y - 2);
            } else if (selectedLevel === 'row') {
                this.riverBg.tilePositionX += 6; 
            } else if (selectedLevel === 'curl') {
                // Jala el objeto desde X=750 hacia el centro X=350
                this.pulledObject.x = Math.max(350, this.pulledObject.x - 3);
            }

        } else {
            this.player.anims.stop();
            this.player.setFrame(0);
            
            this.holdTime = Math.max(0, this.holdTime - deltaSec * 1.5);

            // --- REPOSO ---
            if (selectedLevel === 'press' && this.heavyObject.y < 350) {
                this.heavyObject.y += 3;
            } else if (selectedLevel === 'curl' && this.pulledObject.x < 750) {
                // El objeto se aleja hacia la derecha si no hace ejercicio
                this.pulledObject.x += 2;
            }
        }

        if (selectedLevel === 'curl') {
            this.drawRope();
        }

        // Actualizar interfaz
        this.timerText.setText(`Aguante: ${this.holdTime.toFixed(1)}s / ${target}s`);
        this.drawBar(this.holdTime, target);

        if (this.holdTime >= target) {
            this.exerciseText.setText('¡NIVEL COMPLETADO! 🎉');
        } else {
            this.exerciseText.setText(`Nivel: ${selectedLevel.toUpperCase()}`);
        }
    }

    // Dibuja la cuerda centrada abajo (desde X=250 hasta la caja)
    drawRope() {
        this.ropeGraphics.clear();
        this.ropeGraphics.lineStyle(5, 0xd2b48c, 1);
        this.ropeGraphics.beginPath();
        this.ropeGraphics.moveTo(250, 380); // Anclaje de la cuerda en la mitad/izquierda
        this.ropeGraphics.lineTo(this.pulledObject.x, this.pulledObject.y);
        this.ropeGraphics.strokePath();
    }

    drawBar(current, total) {
        this.progressBar.clear();
        this.progressBar.fillStyle(0x222222, 0.8);
        this.progressBar.fillRect(150, 550, 500, 20);

        let pct = Math.min(1, Math.max(0, current / total));
        let color = pct >= 1 ? 0x00ff00 : 0xff9900;

        this.progressBar.fillStyle(color, 1);
        this.progressBar.fillRect(150, 550, 500 * pct, 20);
    }
}


// ==========================================
// CONFIGURACIÓN DE PHASER
// ==========================================
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-game',
    scene: [HomeScene, MenuScene, CountdownScene, GameScene]
};

const game = new Phaser.Game(config);