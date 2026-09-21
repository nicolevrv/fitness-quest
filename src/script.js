// Variable global para almacenar el ejercicio actual
let currentExercise = 'still';

// --- FUNCIÓN DE SIMULACIÓN ---
function simular(ejercicio) {
    currentExercise = ejercicio;
    console.log("Simulando ejercicio:", ejercicio);
}

// --- CONEXIÓN SERIAL CON ARDUINO ---
document.getElementById('btn-connect').addEventListener('click', async () => {
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


// --- CONFIGURACIÓN DE PHASER ---
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let player;
let exerciseText;

function preload() {
    this.load.image('placeholder1', 'assets/placeholder1.png');
    this.load.spritesheet('placeholder2', 'assets/placeholder2.png', { 
        frameWidth: 600, 
        frameHeight: 600 
    });
}

function create() {
    this.add.image(400, 300, 'placeholder1');
    player = this.add.sprite(90, 100, 'placeholder2').setScale(0.3);

    // Animación única del spritesheet
    this.anims.create({
        key: 'mover_placeholder',
        frames: this.anims.generateFrameNumbers('placeholder2', { start: 0, end: 5 }), // Ajusta "end" según la cantidad de fotogramas
        frameRate: 8,
        repeat: -1
    });

    // Texto de información en pantalla
    exerciseText = this.add.text(20, 20, 'Ejercicio: Quieto', { 
        fontSize: '24px', 
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
    });
}

function update() {
    if (currentExercise !== 'still') {
        // Reproduce la animación si hay cualquier movimiento
        player.play('mover_placeholder', true);

        // Actualiza el texto en función del ejercicio activo
        switch (currentExercise) {
            case 'curl':
                exerciseText.setText('Ejercicio: Curl de Bíceps');
                break;
            case 'lateral_raise':
                exerciseText.setText('Ejercicio: Elevación Lateral');
                break;
            case 'press':
                exerciseText.setText('Ejercicio: Press Militar');
                break;
            case 'row':
                exerciseText.setText('Ejercicio: Remo con Mancuerna');
                break;
            case 'triceps':
                exerciseText.setText('Ejercicio: Extensión de Tríceps');
                break;
            default:
                exerciseText.setText('Ejercicio: En movimiento');
                break;
        }
    } else {
        // Detiene la animación y regresa al fotograma 0 si está 'still'
        player.anims.stop();
        player.setFrame(0);
        exerciseText.setText('Ejercicio: En reposo');
    }
}