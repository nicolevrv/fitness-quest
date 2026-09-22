// Variable global para almacenar el ejercicio actual detectado
let currentExercise = 'still';
let selectedLevel = 'press'; // Nivel seleccionado por defecto

// CONFIGURACIÓN DE DIFICULTAD (Tiempos objetivo)
let selectedDifficulty = 'medium'; // 'easy', 'medium', 'hard', 'custom'
let customTime = 10; // Tiempo para modo personalizado

const difficultySettings = {
    easy: { press: 5, row: 6, curl: 5, lateral_raise: 4, triceps: 5 },
    medium: { press: 10, row: 12, curl: 10, lateral_raise: 8, triceps: 10 },
    hard: { press: 20, row: 24, curl: 20, lateral_raise: 16, triceps: 20 }
};

// LISTA ORDENADA DE NIVELES PARA NAVEGACIÓN
const levelList = ['press', 'row', 'curl', 'lateral_raise', 'triceps'];

// MAPEO DICCIONARIO: Traduce lo que manda el Arduino o la Simulación
const exerciseMap = {
    // Teclas directas de Arduino:
    'l': 'lateral_raise', // 'L' -> lateral raises
    't': 'triceps',       // 'T' -> Ext triceps
    'b': 'curl',          // 'B' -> curl biceps
    's': 'press',         // 'S' -> shoulder press
    'r': 'row',           // 'R' -> remo mancuerna
    '0': 'still',         // '0' -> reposo

    // Textos completos por simulación:
    'lateral raises': 'lateral_raise',
    'lateral_raise': 'lateral_raise',
    'ext triceps': 'triceps',
    'triceps': 'triceps',
    'curl biceps': 'curl',
    'curl': 'curl',
    'shoulder press': 'press',
    'press': 'press',
    'remo mancuerna': 'row',
    'row': 'row',
    'reposo': 'still',
    'still': 'still'
};

// --- FUNCIÓN DE SIMULACIÓN ---
function simular(ejercicio) {
    const key = ejercicio.trim().toLowerCase();
    currentExercise = exerciseMap[key] || key;
    console.log("Simulando ejercicio:", currentExercise);
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
                            currentExercise = exerciseMap[trimmed] || trimmed;
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
// 1. ESCENA DE INICIO
// ==========================================
class HomeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HomeScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#0d1117');

        this.add.text(400, 180, 'FITNESS QUEST', {
            fontSize: '48px',
            fill: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 240, 'Entrenamiento con Arduino y Machine Learning', {
            fontSize: '18px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const startBtn = this.add.text(400, 340, ' [ INICIAR JUEGO ] ', {
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
            this.scene.start('DifficultyScene');
        });

        // BOTÓN VER RÉCORDS DESDE INICIO
        const recordsBtn = this.add.text(400, 430, ' 🏆 TABLA DE RÉCORDS 🏆 ', {
            fontSize: '22px',
            fill: '#ffc107',
            backgroundColor: '#1f2937',
            padding: { x: 15, y: 8 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        recordsBtn.on('pointerover', () => recordsBtn.setStyle({ fill: '#00ffff', backgroundColor: '#374151' }));
        recordsBtn.on('pointerout', () => recordsBtn.setStyle({ fill: '#ffc107', backgroundColor: '#1f2937' }));

        recordsBtn.on('pointerdown', () => {
            this.scene.start('RecordScene');
        });
    }
}


// ==========================================
// 2. ESCENA DE DIFICULTAD
// ==========================================
class DifficultyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DifficultyScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#0d1117');

        this.add.text(400, 60, 'SELECCIONA LA DIFICULTAD', {
            fontSize: '32px',
            fill: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const difficulties = [
            { key: 'easy', label: '🟢 FÁCIL (Tiempos reducidos ~5s)' },
            { key: 'medium', label: '🟡 MEDIO (Tiempos estándar ~10s)' },
            { key: 'hard', label: '🔴 DIFÍCIL (Mayor exigencia ~20s)' },
            { key: 'custom', label: '⚙️ PERSONALIZADO (Ajustar segundos)' }
        ];

        this.diffButtons = [];

        difficulties.forEach((diff, index) => {
            let btn = this.add.text(400, 150 + (index * 60), diff.label, {
                fontSize: '18px',
                fill: selectedDifficulty === diff.key ? '#00ff00' : '#ffffff',
                backgroundColor: selectedDifficulty === diff.key ? '#374151' : '#1f2937',
                padding: { x: 15, y: 8 }
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

            btn.on('pointerdown', () => {
                selectedDifficulty = diff.key;
                this.updateSelection();
            });

            this.diffButtons.push({ btn: btn, key: diff.key });
        });

        // Controles Tiempo Personalizado
        this.customContainer = this.add.container(400, 420);
        
        const customText = this.add.text(0, -20, `Tiempo Personalizado: ${customTime} seg`, {
            fontSize: '18px', fill: '#ffc107'
        }).setOrigin(0.5);

        const minusBtn = this.add.text(-120, 15, ' [ - 5s ] ', {
            fontSize: '20px', fill: '#ff4444', backgroundColor: '#111827', padding: 5
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const plusBtn = this.add.text(120, 15, ' [ + 5s ] ', {
            fontSize: '20px', fill: '#28a745', backgroundColor: '#111827', padding: 5
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        minusBtn.on('pointerdown', () => {
            customTime = Math.max(3, customTime - 5);
            customText.setText(`Tiempo Personalizado: ${customTime} seg`);
        });

        plusBtn.on('pointerdown', () => {
            customTime = Math.min(120, customTime + 5);
            customText.setText(`Tiempo Personalizado: ${customTime} seg`);
        });

        this.customContainer.add([customText, minusBtn, plusBtn]);

        const nextBtn = this.add.text(400, 520, ' CONTINUAR ➔ ', {
            fontSize: '24px', fill: '#ffffff', backgroundColor: '#28a745', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        nextBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        this.updateSelection();
    }

    updateSelection() {
        this.diffButtons.forEach(b => {
            if (b.key === selectedDifficulty) {
                b.btn.setStyle({ fill: '#00ff00', backgroundColor: '#374151' });
            } else {
                b.btn.setStyle({ fill: '#ffffff', backgroundColor: '#1f2937' });
            }
        });
        this.customContainer.setVisible(selectedDifficulty === 'custom');
    }
}


// ==========================================
// 3. ESCENA DE SELECCIÓN DE NIVELES
// ==========================================
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#0d1117');

        this.add.text(400, 50, 'SELECCIONA TU NIVEL', {
            fontSize: '36px',
            fill: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const diffName = { easy: 'Fácil', medium: 'Medio', hard: 'Difícil', custom: `Personalizado (${customTime}s)` }[selectedDifficulty];
        this.add.text(400, 90, `Dificultad seleccionada: ${diffName}`, { fontSize: '16px', fill: '#ffc107' }).setOrigin(0.5);

        const levels = [
            { name: 'Nivel 1: Press Militar (Sostener Peso)', key: 'press' },
            { name: 'Nivel 2: Remo Inclinado (Navegar Canoa)', key: 'row' },
            { name: 'Nivel 3: Curl de Bíceps (Jalar Cuerda)', key: 'curl' },
            { name: 'Nivel 4: Elevación Lateral (Abrir Alas)', key: 'lateral_raise' },
            { name: 'Nivel 5: Extensión Tríceps (Cargar Catapulta)', key: 'triceps' }
        ];

        levels.forEach((lvl, index) => {
            let btn = this.add.text(400, 150 + (index * 55), lvl.name, {
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

        // BOTÓN RÉCORDS
        const recordsBtn = this.add.text(250, 520, '🏆 Ver Récords', {
            fontSize: '16px', fill: '#ffc107', backgroundColor: '#111827', padding: 8
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        recordsBtn.on('pointerdown', () => {
            this.scene.start('RecordScene');
        });

        // BOTÓN DIFICULTAD
        const backBtn = this.add.text(550, 520, '⚙️ Cambiar Dificultad', {
            fontSize: '16px', fill: '#ff4444', backgroundColor: '#111827', padding: 8
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerdown', () => {
            this.scene.start('DifficultyScene');
        });
    }
}


// ==========================================
// 4. ESCENA DE CUENTA REGRESIVA
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
// 5. ESCENA PRINCIPAL DEL JUEGO
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

        this.load.image('river', 'assets/river.jpeg');
        this.load.image('canoe', 'assets/canoe.png');
    }

    create() {
        this.levelCompleted = false; // Control de guardado de récord
        this.elapsedTime = 0; // Tiempo total empleado para ganar

        // --- SISTEMA DE VIDAS ---
        this.lives = 4;
        this.hasStartedMoving = false; // Para evitar perder vida antes de empezar a ejercitar
        this.canLoseLife = true;       // Cooldown tras perder vida

        // --- ESCENARIO BASE (POSICIONES ORIGINALES) ---
        this.skyBg = this.add.image(400, 280, 'sky').setScale(1.5);
        this.ground = this.add.image(400, 1020, 'ground').setScale(1.6).setOrigin(0.5, 1);

        // --- ESCENARIO DE REMO (POSICIONES ORIGINALES) ---
        this.riverBg = this.add.tileSprite(400, 300, 800, 600, 'river');
        this.riverBg.setDisplaySize(800, 600);
        this.canoe = this.add.image(400, 360, 'canoe').setScale(0.5);

        // Visibilidad de escenarios
        const isRowLevel = selectedLevel === 'row';
        this.riverBg.setVisible(isRowLevel);
        this.canoe.setVisible(isRowLevel);
        this.skyBg.setVisible(!isRowLevel);
        this.ground.setVisible(!isRowLevel);

        // --- PERSONAJE (POSICIONADO A LA IZQUIERDA Y A LA MITAD DE LA PANTALLA) ---
        this.player = this.add.sprite(100, 300, 'placeholder2').setScale(0.3);

        // --- NIVEL 1: PRESS (POSICIONES ORIGINALES) ---
        this.heavyObject = this.add.rectangle(400, 350, 280, 120, 0x888888);
        this.heavyObject.setVisible(selectedLevel === 'press');

        // --- NIVEL 3: CURL (POSICIONES ORIGINALES) ---
        const isCurlLevel = selectedLevel === 'curl';
        this.ropeGraphics = this.add.graphics();
        this.ropeGraphics.setVisible(isCurlLevel);
        this.pulledObject = this.add.rectangle(750, 380, 80, 60, 0x8b4513);
        this.pulledObject.setVisible(isCurlLevel);

        // --- NIVEL 4: ELEVACIÓN LATERAL (POSICIONES ORIGINALES) ---
        const isLateralLevel = selectedLevel === 'lateral_raise';
        this.planeBody = this.add.rectangle(400, 300, 30, 120, 0x00ffff).setVisible(isLateralLevel);
        this.wingLeft = this.add.rectangle(385, 300, 20, 24, 0x0088ff).setOrigin(1, 0.5).setVisible(isLateralLevel);
        this.wingRight = this.add.rectangle(415, 300, 20, 24, 0x0088ff).setOrigin(0, 0.5).setVisible(isLateralLevel);

        // --- NIVEL 5: TRÍCEPS (POSICIONES ORIGINALES) ---
        const isTricepsLevel = selectedLevel === 'triceps';
        this.catapultBase = this.add.rectangle(400, 420, 80, 20, 0x555555).setVisible(isTricepsLevel);
        this.catapultArm = this.add.rectangle(400, 420, 140, 10, 0x8b4513).setOrigin(0, 0.5).setVisible(isTricepsLevel);
        this.catapultArm.angle = 0;

        // Registrar animación solo una vez
        if (!this.anims.exists('mover_placeholder')) {
            this.anims.create({
                key: 'mover_placeholder',
                frames: this.anims.generateFrameNumbers('placeholder2', { start: 0, end: 5 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // --- TIEMPO SEGÚN DIFICULTAD SELECCIONADA ---
        if (selectedDifficulty === 'custom') {
            this.targetTime = customTime;
        } else {
            this.targetTime = difficultySettings[selectedDifficulty][selectedLevel] || 10;
        }

        this.holdTime = 0;

        // UI
        this.exerciseText = this.add.text(20, 20, `Nivel: ${selectedLevel.toUpperCase()}`, { 
            fontSize: '22px', 
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });

        this.timerText = this.add.text(20, 60, `Aguante: 0s / ${this.targetTime}s`, { 
            fontSize: '20px', 
            fill: '#00ffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });

        // UI - VISUALIZACIÓN DE VIDAS
        this.livesText = this.add.text(20, 100, `Vidas: ${'❤️'.repeat(this.lives)}`, {
            fontSize: '20px',
            fill: '#ff4444',
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
        let target = this.targetTime;

        if (!this.levelCompleted) {
            this.elapsedTime += deltaSec;
        }

        if (currentExercise === selectedLevel) {
            this.hasStartedMoving = true; // El jugador ha comenzado a responder
            this.player.play('mover_placeholder', true);
            this.holdTime += deltaSec;

            if (selectedLevel === 'press') {
                this.heavyObject.y = Math.max(180, this.heavyObject.y - 2);
            } else if (selectedLevel === 'row') {
                this.riverBg.tilePositionX += 6; 
            } else if (selectedLevel === 'curl') {
                this.pulledObject.x = Math.max(350, this.pulledObject.x - 3);
            } else if (selectedLevel === 'lateral_raise') {
                this.wingLeft.width = Math.min(130, this.wingLeft.width + 1.8);
                this.wingRight.width = Math.min(130, this.wingRight.width + 1.8);
            } else if (selectedLevel === 'triceps') {
                this.catapultArm.angle = Math.max(-90, this.catapultArm.angle - 1.8);
            }

        } else {
            this.player.anims.stop();
            this.player.setFrame(0);
            
            this.holdTime = Math.max(0, this.holdTime - deltaSec * 1.5);

            if (selectedLevel === 'press' && this.heavyObject.y < 350) {
                this.heavyObject.y += 3;
            } else if (selectedLevel === 'curl' && this.pulledObject.x < 750) {
                this.pulledObject.x += 2;
            } else if (selectedLevel === 'lateral_raise') {
                this.wingLeft.width = Math.max(20, this.wingLeft.width - 2);
                this.wingRight.width = Math.max(20, this.wingRight.width - 2);
            } else if (selectedLevel === 'triceps') {
                this.catapultArm.angle = Math.min(0, this.catapultArm.angle + 2);
            }

            // --- DETECCIÓN DE PÉRDIDA DE VIDA ---
            // Si la barra se vacía por completo habiendo empezado a jugar
            if (this.holdTime === 0 && this.hasStartedMoving && this.canLoseLife && !this.levelCompleted) {
                this.loseLife();
            }
        }

        if (selectedLevel === 'curl') {
            this.drawRope();
        }

        // Actualización de interfaz
        this.timerText.setText(`Aguante: ${this.holdTime.toFixed(1)}s / ${target}s`);
        this.drawBar(this.holdTime, target);

        if (this.holdTime >= target) {
            if (!this.levelCompleted) {
                this.levelCompleted = true;
                this.saveRecord();
                // Transición a la pantalla de ganar
                this.time.delayedCall(500, () => {
                    this.scene.start('WinScene', { elapsedTime: this.elapsedTime });
                });
            }
        } else {
            this.exerciseText.setText(`Nivel: ${selectedLevel.toUpperCase()}`);
        }
    }

    loseLife() {
        this.lives--;
        this.canLoseLife = false;
        this.hasStartedMoving = false; // Reset para exigir acción nuevamente antes de la próxima penalización

        // Efecto visual de flash en la pantalla
        this.cameras.main.flash(300, 255, 0, 0);

        // Actualizar UI de vidas
        const hearts = '❤️'.repeat(Math.max(0, this.lives)) + '🖤'.repeat(Math.max(0, 4 - this.lives));
        this.livesText.setText(`Vidas: ${hearts}`);

        if (this.lives <= 0) {
            this.scene.start('GameOverScene');
        } else {
            // Cooldown de 1.5 segundos de inmunidad para dar tiempo al usuario de reactivar el ejercicio
            this.time.delayedCall(1500, () => {
                this.canLoseLife = true;
            });
        }
    }

    saveRecord() {
        let records = JSON.parse(localStorage.getItem('fitness_quest_records')) || {};
        let key = `${selectedDifficulty}_${selectedLevel}`;
        
        // Se guarda si es el mejor (menor) tiempo en completar el reto
        if (!records[key] || this.elapsedTime < records[key]) {
            records[key] = parseFloat(this.elapsedTime.toFixed(1));
            localStorage.setItem('fitness_quest_records', JSON.stringify(records));
        }
    }

    // CUERDA CON COORDENADAS ORIGINALES (250, 380)
    drawRope() {
        this.ropeGraphics.clear();
        this.ropeGraphics.lineStyle(5, 0xd2b48c, 1);
        this.ropeGraphics.beginPath();
        this.ropeGraphics.moveTo(250, 380);
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
// 6. ESCENA DE GAME OVER (DERROTA POR SIN VIDAS)
// ==========================================
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a0000');

        this.add.text(400, 200, '💀 ¡GAME OVER! 💀', {
            fontSize: '48px',
            fill: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 280, 'Te has quedado sin vidas.', {
            fontSize: '22px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const retryBtn = this.add.text(400, 380, ' 🔄 REINTENTAR NIVEL ', {
            fontSize: '22px',
            fill: '#ffffff',
            backgroundColor: '#28a745',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        retryBtn.on('pointerdown', () => {
            this.scene.start('CountdownScene');
        });

        const menuBtn = this.add.text(400, 450, ' 🏠 MENÚ DE NIVELES ', {
            fontSize: '20px',
            fill: '#ffc107',
            backgroundColor: '#1f2937',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
}


// ==========================================
// 7. ESCENA DE GANAR (PANTALLA DE VICTORIA)
// ==========================================
class WinScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WinScene' });
    }

    init(data) {
        this.elapsedTime = data.elapsedTime || 0;
    }

    create() {
        this.cameras.main.setBackgroundColor('#0d1117');

        this.add.text(400, 130, '🎉 ¡NIVEL COMPLETADO! 🎉', {
            fontSize: '40px',
            fill: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 200, `Completaste: ${selectedLevel.toUpperCase()}`, {
            fontSize: '22px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(400, 250, `Tiempo total en completar: ${this.elapsedTime.toFixed(1)}s`, {
            fontSize: '20px',
            fill: '#ffc107'
        }).setOrigin(0.5);

        // Determinar siguiente nivel
        const currentIndex = levelList.indexOf(selectedLevel);
        const hasNextLevel = currentIndex !== -1 && currentIndex < levelList.length - 1;

        let startY = 330;

        if (hasNextLevel) {
            const nextBtn = this.add.text(400, startY, ' ➔ SIGUIENTE NIVEL ', {
                fontSize: '24px',
                fill: '#ffffff',
                backgroundColor: '#28a745',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            nextBtn.on('pointerover', () => nextBtn.setStyle({ backgroundColor: '#218838' }));
            nextBtn.on('pointerout', () => nextBtn.setStyle({ backgroundColor: '#28a745' }));

            nextBtn.on('pointerdown', () => {
                selectedLevel = levelList[currentIndex + 1];
                this.scene.start('CountdownScene');
            });

            startY += 70;
        }

        const retryBtn = this.add.text(400, startY, ' 🔄 REINTENTAR NIVEL ', {
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: '#1f2937',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        retryBtn.on('pointerover', () => retryBtn.setStyle({ backgroundColor: '#374151' }));
        retryBtn.on('pointerout', () => retryBtn.setStyle({ backgroundColor: '#1f2937' }));

        retryBtn.on('pointerdown', () => {
            this.scene.start('CountdownScene');
        });

        const menuBtn = this.add.text(400, startY + 60, ' 🏠 MENÚ DE NIVELES ', {
            fontSize: '20px',
            fill: '#ffc107',
            backgroundColor: '#1f2937',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerover', () => menuBtn.setStyle({ backgroundColor: '#374151' }));
        menuBtn.on('pointerout', () => menuBtn.setStyle({ backgroundColor: '#1f2937' }));

        menuBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
}


// ==========================================
// 8. ESCENA DEL TABLERO DE RÉCORDS
// ==========================================
class RecordScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RecordScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#0d1117');

        this.add.text(400, 50, '🏆 TABLA DE RÉCORDS 🏆', {
            fontSize: '32px',
            fill: '#ffc107',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const diffName = { easy: 'Fácil', medium: 'Medio', hard: 'Difícil', custom: 'Personalizado' }[selectedDifficulty];
        this.add.text(400, 90, `Mejores Tiempos de Completado (${diffName})`, {
            fontSize: '18px',
            fill: '#00ffff'
        }).setOrigin(0.5);

        let records = JSON.parse(localStorage.getItem('fitness_quest_records')) || {};

        const levels = [
            { name: 'Press Militar', key: 'press' },
            { name: 'Remo Inclinado', key: 'row' },
            { name: 'Curl de Bíceps', key: 'curl' },
            { name: 'Elevación Lateral', key: 'lateral_raise' },
            { name: 'Extensión Tríceps', key: 'triceps' }
        ];

        let startY = 150;
        levels.forEach((lvl, index) => {
            let recordKey = `${selectedDifficulty}_${lvl.key}`;
            let scoreText = records[recordKey] ? `${records[recordKey]} Segundos` : 'Sin Récord';

            this.add.text(200, startY + (index * 55), lvl.name, {
                fontSize: '20px', fill: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0, 0.5);

            this.add.text(600, startY + (index * 55), scoreText, {
                fontSize: '20px', fill: records[recordKey] ? '#00ff00' : '#888888'
            }).setOrigin(1, 0.5);

            this.add.rectangle(400, startY + (index * 55) + 25, 420, 1, 0x374151);
        });

        // Botón Borrar Récords
        const resetBtn = this.add.text(280, 520, '🗑️ Borrar Récords', {
            fontSize: '16px', fill: '#ff4444', backgroundColor: '#1f2937', padding: 8
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        resetBtn.on('pointerdown', () => {
            localStorage.removeItem('fitness_quest_records');
            this.scene.restart();
        });

        // Botón Volver al Menú
        const backBtn = this.add.text(520, 520, '🏠 Volver al Menú', {
            fontSize: '16px', fill: '#ffffff', backgroundColor: '#28a745', padding: 8
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
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
    scene: [HomeScene, DifficultyScene, MenuScene, CountdownScene, GameScene, GameOverScene, WinScene, RecordScene]
};

const game = new Phaser.Game(config);