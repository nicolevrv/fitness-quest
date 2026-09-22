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
    'l': 'lateral_raise',
    't': 'triceps',
    'b': 'curl',
    's': 'press',
    'r': 'row',
    '0': 'still',

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

// --- FUNCIÓN DE PROCESAMIENTO DE COMANDOS ---
function procesarComando(valor) {
    const key = valor.trim().toLowerCase();
    currentExercise = exerciseMap[key] || key;
    console.log("Comando recibido vía BLE:", currentExercise);
}

// --- HELPER DE AUDIO CONTROLADO ---
function playMusic(scene, key) {
    const musicKeys = ['bg_menu', 'bg_game'];
    
    // Detiene la otra música que pudiera estar sonando
    musicKeys.forEach(mKey => {
        if (mKey !== key) {
            const otherMusic = scene.sound.get(mKey);
            if (otherMusic && otherMusic.isPlaying) {
                otherMusic.stop();
            }
        }
    });

    // Reproduce la música seleccionada si no está activa
    let currentMusic = scene.sound.get(key);
    if (!currentMusic) {
        currentMusic = scene.sound.add(key, { loop: true, volume: 0.5 });
    }
    if (!currentMusic.isPlaying) {
        currentMusic.play();
    }
}

// --- CONEXIÓN BLE CON ARDUINO ---
document.getElementById('btn-connect')?.addEventListener('click', async () => {
    if ('bluetooth' in navigator) {
        try {
            const statusElem = document.getElementById('status');
            if (statusElem) statusElem.innerText = 'Estado: Conectando...';

            const device = await navigator.bluetooth.requestDevice({
                filters: [{ name: 'FitnessQuest' }],
                optionalServices: ['19b10000-e8f2-537e-4f6c-d104768a1214']
            });

            const server = await device.gatt.connect();
            const service = await server.getPrimaryService('19b10000-e8f2-537e-4f6c-d104768a1214');
            const characteristic = await service.getCharacteristic('19b10001-e8f2-537e-4f6c-d104768a1214');

            await characteristic.startNotifications();
            characteristic.addEventListener('characteristicvaluechanged', (event) => {
                const decoder = new TextDecoder('utf-8');
                const valor = decoder.decode(event.target.value);
                procesarComando(valor);
            });

            if (statusElem) statusElem.innerText = 'Estado: Conectado (BLE)';
            console.log("¡Conectado exitosamente por BLE!");
        } catch (err) {
            console.error('Error al conectar por BLE:', err);
            const statusElem = document.getElementById('status');
            if (statusElem) statusElem.innerText = 'Error al conectar BLE';
        }
    } else {
        alert('Web Bluetooth API no es soportada en este navegador. Usa Chrome o Edge.');
    }
});


// ==========================================
// 1. ESCENA DE INICIO
// ==========================================
class HomeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HomeScene' });
    }

    preload() {
        // Carga de músicas de fondo y efectos
        this.load.audio('bg_menu', 'assets/arrrrrcade.mp3');
        this.load.audio('bg_game', 'assets/urgency.mp3');
        this.load.audio('sfx_countdown', 'assets/countdown.mp3');
        this.load.audio('sfx_ow', 'assets/ow.mp3');
        this.load.audio('sfx_you_lose', 'assets/you_lose.mp3');
    }

    create() {
        this.cameras.main.setBackgroundColor('#0d1117');

        playMusic(this, 'bg_menu');

        this.input.once('pointerdown', () => {
            playMusic(this, 'bg_menu');
        });

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
            playMusic(this, 'bg_menu');
            this.scene.start('DifficultyScene');
        });

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
            playMusic(this, 'bg_menu');
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
        playMusic(this, 'bg_menu');
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
        playMusic(this, 'bg_menu');
        this.cameras.main.setBackgroundColor('#0d1117');

        this.add.text(400, 50, 'SELECCIONA TU NIVEL', {
            fontSize: '36px',
            fill: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const diffName = { easy: 'Fácil', medium: 'Medio', hard: 'Difícil', custom: `Personalizado (${customTime}s)` }[selectedDifficulty];
        this.add.text(400, 90, `Dificultad seleccionada: ${diffName}`, { fontSize: '16px', fill: '#ffc107' }).setOrigin(0.5);

        const levels = [
            { name: 'Nivel 1: Press Militar (Sostener Auto)', key: 'press' },
            { name: 'Nivel 2: Remo Inclinado (Navegar Bote)', key: 'row' },
            { name: 'Nivel 3: Curl de Bíceps (Jalar Cuerda con Larry)', key: 'curl' },
            { name: 'Nivel 4: Elevación Lateral (Pilotar Avión)', key: 'lateral_raise' },
            { name: 'Nivel 5: Extensión Tríceps (Juego del Mazo)', key: 'triceps' }
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

        const recordsBtn = this.add.text(250, 520, '🏆 Ver Récords', {
            fontSize: '16px', fill: '#ffc107', backgroundColor: '#111827', padding: 8
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        recordsBtn.on('pointerdown', () => {
            this.scene.start('RecordScene');
        });

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
        // Silenciamos la música de menú durante el conteo
        const bgMusic = this.sound.get('bg_menu');
        if (bgMusic && bgMusic.isPlaying) {
            bgMusic.stop();
        }

        this.cameras.main.setBackgroundColor('#111827');

        this.add.text(400, 200, `PREPÁRATE PARA: ${selectedLevel.toUpperCase()}`, {
            fontSize: '24px',
            fill: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.counter = 3;

        this.countText = this.add.text(400, 320, this.counter.toString(), {
            fontSize: '96px',
            fill: '#ffc107',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.sound.play('sfx_countdown');

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
        this.load.image('river', 'assets/river.png');
        this.load.image('home_bg', 'assets/titleScreen.png');

        this.load.spritesheet('jhon_press', 'assets/JhonRabbitPress.png', {
            frameWidth: 128, frameHeight: 120
        });

        this.load.spritesheet('jhon_boat', 'assets/JhonRabbitBoat.png', {
            frameWidth: 128, frameHeight: 120
        });

        this.load.image('jhon_plane', 'assets/JhonRabbitPlane.png');

        this.load.spritesheet('jhon_pull', 'assets/JhonRabbitPull.png', {
            frameWidth: 80, frameHeight: 80
        });

        this.load.image('larry_pull', 'assets/LarryRabbitPull.png');

        this.load.spritesheet('jhon_triceps', 'assets/JhonRabbitTriceps.png', { 
            frameWidth: 128, frameHeight: 128 
        });
    }

    create() {
        // Inicia la música de acción del juego (urgency.mp3)
        playMusic(this, 'bg_game');

        this.levelCompleted = false;
        this.elapsedTime = 0;
        this.lives = 4;
        this.hasStartedMoving = false;
        this.canLoseLife = true;

        this.skyBg = this.add.image(400, 280, 'sky').setScale(1.5);
        this.ground = this.add.image(400, 1020, 'ground').setScale(1.6).setOrigin(0.5, 1);
        this.riverBg = this.add.tileSprite(400, 300, 800, 600, 'river');
        this.riverBg.setDisplaySize(800, 600);

        const isRowLevel = selectedLevel === 'row';
        this.riverBg.setVisible(isRowLevel);
        this.skyBg.setVisible(!isRowLevel);
        this.ground.setVisible(!isRowLevel);

        if (!this.anims.exists('anim_press')) {
            this.anims.create({
                key: 'anim_press',
                frames: this.anims.generateFrameNumbers('jhon_press', { start: 0, end: 5 }),
                frameRate: 8,
                repeat: -1
            });
        }

        if (!this.anims.exists('anim_boat')) {
            this.anims.create({
                key: 'anim_boat',
                frames: this.anims.generateFrameNumbers('jhon_boat', { start: 0, end: 5 }),
                frameRate: 8,
                repeat: -1
            });
        }

        if (!this.anims.exists('anim_jhon_pull')) {
            this.anims.create({
                key: 'anim_jhon_pull',
                frames: this.anims.generateFrameNumbers('jhon_pull', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }

        if (!this.anims.exists('anim_triceps')) {
            this.anims.create({
                key: 'anim_triceps',
                frames: this.anims.generateFrameNumbers('jhon_triceps', { start: 0, end: 10 }),
                frameRate: 8,
                repeat: -1
            });
        }

        this.playerPress = this.add.sprite(410, 233, 'jhon_press').setScale(5).setVisible(selectedLevel === 'press');
        this.playerBoat = this.add.sprite(400, 233, 'jhon_boat').setScale(5).setVisible(selectedLevel === 'row');

        this.planeStartY = 200;
        this.planeGroundY = 500;
        this.planeTime = 0;
        this.isCrashing = false;
        this.playerPlane = this.add.image(400, this.planeStartY, 'jhon_plane').setScale(2).setVisible(selectedLevel === 'lateral_raise');

        const isCurlLevel = selectedLevel === 'curl';
        this.playerCurl = this.add.sprite(150, 380, 'jhon_pull').setScale(4).setVisible(isCurlLevel);
        this.pulledLarry = this.add.image(680, 280, 'larry_pull').setScale(4).setVisible(isCurlLevel);
        
        this.ropeGraphics = this.add.graphics();
        this.ropeGraphics.setVisible(isCurlLevel);

        const isTricepsLevel = selectedLevel === 'triceps';
        this.playerTriceps = this.add.sprite(310, 210, 'jhon_triceps').setScale(5).setVisible(isTricepsLevel);

        if (selectedLevel === 'row') {
            this.tweens.add({
                targets: this.playerBoat,
                y: '+=8',
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        this.targetTime = selectedDifficulty === 'custom' ? customTime : (difficultySettings[selectedDifficulty][selectedLevel] || 10);
        this.holdTime = 0;

        this.exerciseText = this.add.text(20, 20, `Nivel: ${selectedLevel.toUpperCase()}`, { 
            fontSize: '22px', fill: '#ffffff', backgroundColor: '#000000', padding: { x: 10, y: 5 }
        });

        this.timerText = this.add.text(20, 60, `Aguante: 0s / ${this.targetTime}s`, { 
            fontSize: '20px', fill: '#00ffff', backgroundColor: '#000000', padding: { x: 10, y: 5 }
        });

        this.livesText = this.add.text(20, 100, `Vidas: ${'❤️'.repeat(this.lives)}`, {
            fontSize: '20px', fill: '#ff4444', backgroundColor: '#000000', padding: { x: 10, y: 5 }
        });

        const backBtn = this.add.text(780, 20, '[ MENÚ ]', {
            fontSize: '18px', fill: '#ff4444', backgroundColor: '#000000', padding: 5
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
            this.hasStartedMoving = true;
            this.holdTime += deltaSec;

            if (selectedLevel === 'press') {
                this.playerPress.play('anim_press', true);
            } else if (selectedLevel === 'row') {
                this.playerBoat.play('anim_boat', true);
                this.riverBg.tilePositionX += 6; 
            } else if (selectedLevel === 'curl') {
                this.playerCurl.play('anim_jhon_pull', true);
                if (this.pulledLarry) {
                    const resistance = Math.sin(this.time.now / 180) * 0.8;
                    this.pulledLarry.x = Math.max(
                        500,
                        this.pulledLarry.x - 0.8 + resistance
                    );
                }
            } else if (selectedLevel === 'lateral_raise') {
                if (!this.isCrashing && this.planeStartY > 200) {
                    this.planeStartY = Math.max(200, this.planeStartY - 120 * deltaSec);
                }

                this.planeTime += deltaSec * 3;
                let wave = Math.sin(this.planeTime) * 15;

                if (!this.isCrashing) {
                    this.playerPlane.y = this.planeStartY + wave;
                }
            } else if (selectedLevel === 'triceps') {
                this.playerTriceps.play('anim_triceps', true);
            }

        } else {
            if (selectedLevel === 'press' && this.playerPress.anims.isPlaying) {
                this.playerPress.anims.stop();
                this.playerPress.setFrame(0);
            } else if (selectedLevel === 'row' && this.playerBoat.anims.isPlaying) {
                this.playerBoat.anims.stop();
                this.playerBoat.setFrame(0);
            } else if (selectedLevel === 'curl' && this.playerCurl.anims.isPlaying) {
                this.playerCurl.anims.stop();
                this.playerCurl.setFrame(0);
            } else if (selectedLevel === 'triceps' && this.playerTriceps.anims.isPlaying) {
                this.playerTriceps.anims.stop();
                this.playerTriceps.setFrame(0);
            }

            this.holdTime = Math.max(0, this.holdTime - deltaSec * 1.5);

            if (selectedLevel === 'lateral_raise' && !this.isCrashing && this.hasStartedMoving) {
                this.planeStartY += 110 * deltaSec;
                this.planeTime += deltaSec * 3;
                let wave = Math.sin(this.planeTime) * 15;
                this.playerPlane.y = this.planeStartY + wave;

                if (this.planeStartY >= this.planeGroundY) {
                    this.crashPlane();
                }
            }

            if (selectedLevel === 'curl' && this.pulledLarry && this.pulledLarry.x < 700) {
                const resistance = Math.sin(this.time.now / 400) * 2;
                this.pulledLarry.x = Math.max(
                    500,
                    this.pulledLarry.x - 0.6 + resistance
                );
            }

            if (selectedLevel !== 'lateral_raise' && this.holdTime === 0 && this.hasStartedMoving && this.canLoseLife && !this.levelCompleted) {
                this.loseLife();
            }
        }

        if (selectedLevel === 'curl' && this.ropeGraphics) {
            this.drawRope();
        }

        this.timerText.setText(`Aguante: ${this.holdTime.toFixed(1)}s / ${target}s`);
        this.drawBar(this.holdTime, target);

        if (this.holdTime >= target) {
            if (!this.levelCompleted) {
                this.levelCompleted = true;
                this.saveRecord();
                this.time.delayedCall(500, () => {
                    this.scene.start('WinScene', { elapsedTime: this.elapsedTime });
                });
            }
        } else {
            this.exerciseText.setText(`Nivel: ${selectedLevel.toUpperCase()}`);
        }
    }

    crashPlane() {
        this.isCrashing = true;
        this.playerPlane.y = this.planeGroundY;
        this.cameras.main.shake(200, 0.01);
        
        this.loseLife();

        this.time.delayedCall(800, () => {
            if (this.lives > 0) {
                this.planeStartY = 200;
                this.playerPlane.y = this.planeStartY;
                this.isCrashing = false;
            }
        });
    }

    loseLife() {
        this.lives--;
        this.canLoseLife = false;
        this.hasStartedMoving = false;

        this.sound.play('sfx_ow');

        this.cameras.main.flash(300, 255, 0, 0);

        const hearts = '❤️'.repeat(Math.max(0, this.lives)) + '🖤'.repeat(Math.max(0, 4 - this.lives));
        this.livesText.setText(`Vidas: ${hearts}`);

        if (this.lives <= 0) {
            this.scene.start('GameOverScene');
        } else {
            this.time.delayedCall(1500, () => {
                this.canLoseLife = true;
            });
        }
    }

    saveRecord() {
        let records = JSON.parse(localStorage.getItem('fitness_quest_records')) || {};
        let key = `${selectedDifficulty}_${selectedLevel}`;
        
        if (!records[key] || this.elapsedTime < records[key]) {
            records[key] = parseFloat(this.elapsedTime.toFixed(1));
            localStorage.setItem('fitness_quest_records', JSON.stringify(records));
        }
    }

    drawRope() {
        if (!this.ropeGraphics || !this.playerCurl || !this.pulledLarry) return;
        
        this.ropeGraphics.clear();

        const time = this.time.now;
        const tension = Math.sin(time / 100) * 4;

        this.ropeGraphics.lineStyle(5, 0x8b5a2b, 1);

        this.ropeGraphics.beginPath();

        this.ropeGraphics.moveTo(
            this.playerCurl.x + 40,
            this.playerCurl.y + 35
        );

        this.ropeGraphics.lineTo(
            (this.playerCurl.x + this.pulledLarry.x) / 2,
            this.playerCurl.y + 20 + tension
        );

        this.ropeGraphics.lineTo(
            this.pulledLarry.x - 30,
            this.pulledLarry.y + 128
        );

        this.ropeGraphics.strokePath();
    }

    drawBar(current, total) {
        if (!this.progressBar) return;
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
// 6. ESCENA DE GAME OVER
// ==========================================
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        // Detiene cualquier música de fondo sonando
        const musicKeys = ['bg_menu', 'bg_game'];
        musicKeys.forEach(mKey => {
            const m = this.sound.get(mKey);
            if (m && m.isPlaying) {
                m.stop();
            }
        });

        // Reproduce el sonido de Game Over
        this.sound.play('sfx_you_lose');

        this.cameras.main.setBackgroundColor('#1a0000');

        this.add.text(400, 200, '💀 ¡GAME OVER! 💀', {
            fontSize: '48px', fill: '#ff0000', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 280, 'Te has quedado sin vidas.', {
            fontSize: '22px', fill: '#ffffff'
        }).setOrigin(0.5);

        const retryBtn = this.add.text(400, 380, ' 🔄 REINTENTAR NIVEL ', {
            fontSize: '22px', fill: '#ffffff', backgroundColor: '#28a745', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        retryBtn.on('pointerdown', () => {
            this.scene.start('CountdownScene');
        });

        const menuBtn = this.add.text(400, 450, ' 🏠 MENÚ DE NIVELES ', {
            fontSize: '20px', fill: '#ffc107', backgroundColor: '#1f2937', padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
}


// ==========================================
// 7. ESCENA DE GANAR
// ==========================================
class WinScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WinScene' });
    }

    init(data) {
        this.elapsedTime = data.elapsedTime || 0;
    }

    create() {
        playMusic(this, 'bg_menu');
        this.cameras.main.setBackgroundColor('#0d1117');

        this.add.text(400, 130, '🎉 ¡NIVEL COMPLETADO! 🎉', {
            fontSize: '40px', fill: '#00ff00', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 200, `Completaste: ${selectedLevel.toUpperCase()}`, {
            fontSize: '22px', fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(400, 250, `Tiempo total en completar: ${this.elapsedTime.toFixed(1)}s`, {
            fontSize: '20px', fill: '#ffc107'
        }).setOrigin(0.5);

        const currentIndex = levelList.indexOf(selectedLevel);
        const hasNextLevel = currentIndex !== -1 && currentIndex < levelList.length - 1;

        let startY = 330;

        if (hasNextLevel) {
            const nextBtn = this.add.text(400, startY, ' ➔ SIGUIENTE NIVEL ', {
                fontSize: '24px', fill: '#ffffff', backgroundColor: '#28a745', padding: { x: 20, y: 10 }
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
            fontSize: '20px', fill: '#ffffff', backgroundColor: '#1f2937', padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        retryBtn.on('pointerover', () => retryBtn.setStyle({ backgroundColor: '#374151' }));
        retryBtn.on('pointerout', () => retryBtn.setStyle({ backgroundColor: '#1f2937' }));

        retryBtn.on('pointerdown', () => {
            this.scene.start('CountdownScene');
        });

        const menuBtn = this.add.text(400, startY + 60, ' 🏠 MENÚ DE NIVELES ', {
            fontSize: '20px', fill: '#ffc107', backgroundColor: '#1f2937', padding: { x: 15, y: 8 }
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
        playMusic(this, 'bg_menu');
        this.cameras.main.setBackgroundColor('#0d1117');

        this.add.text(400, 50, '🏆 TABLA DE RÉCORDS 🏆', {
            fontSize: '32px', fill: '#ffc107', fontStyle: 'bold'
        }).setOrigin(0.5);

        const diffName = { easy: 'Fácil', medium: 'Medio', hard: 'Difícil', custom: 'Personalizado' }[selectedDifficulty];
        this.add.text(400, 90, `Mejores Tiempos de Completado (${diffName})`, {
            fontSize: '18px', fill: '#00ffff'
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

        const resetBtn = this.add.text(280, 520, '🗑️ Borrar Récords', {
            fontSize: '16px', fill: '#ff4444', backgroundColor: '#1f2937', padding: 8
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        resetBtn.on('pointerdown', () => {
            localStorage.removeItem('fitness_quest_records');
            this.scene.restart();
        });

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
    scene: [HomeScene, DifficultyScene, MenuScene, CountdownScene, GameScene, GameOverScene, WinScene, RecordScene],
    antialias: false,
    roundPixels: true,
};

const game = new Phaser.Game(config);