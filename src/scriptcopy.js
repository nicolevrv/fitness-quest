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

function preload() {
 // aqui cargamos los recursos del juego, ahora hay un place holder pero ajá
   this.load.image('placeholder1', 'assets/placeholder1.png');
 // esto es un spritesheet pq es una animacion (es de prueba, vale?) 
   this.load.spritesheet('placeholder2', 'assets/placeholder2.png', { frameWidth: 600, frameHeight: 600 });
}

function create() {
    this.add.image(400, 300, 'placeholder1');
    this.add.sprite(200, 300, 'placeholder2').setScale(0.4);
}

function update() {

}