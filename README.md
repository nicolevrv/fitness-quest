# 🏋️ Fitness Quest

**Fitness Quest** es un videojuego que se controla haciendo ejercicio. Una placa **Arduino Nano 33 BLE Sense** detecta, con su sensor de movimiento y un modelo de *machine learning* entrenado en **Edge Impulse**, qué ejercicio está haciendo el jugador (press militar, remo, curl de bíceps, elevación lateral o extensión de tríceps) y se lo avisa por **Bluetooth Low Energy (BLE)** a un juego web hecho con **Phaser.js**. Mientras el jugador sostiene el ejercicio correcto, su personaje avanza en el nivel correspondiente.

## 🎮 ¿Cómo funciona?

1. La placa Arduino lee el acelerómetro y el giroscopio (IMU LSM9DS1) ~50 veces por segundo.
2. Un modelo entrenado en Edge Impulse, corriendo directo en la placa, clasifica esos datos en uno de los cinco ejercicios o en "reposo".
3. La placa manda el resultado como un solo carácter (`S`, `R`, `B`, `L`, `T` o `0`) por una característica BLE.
4. El navegador se conecta a la placa vía **Web Bluetooth API** y traduce ese carácter en la acción del personaje dentro del juego.
5. Cada ejercicio tiene su propio nivel temático: sostener un auto en alto (press), remar un bote (remo), ganar un pulso (curl), pilotar un avión (elevación lateral) y golpear con un mazo (tríceps).

## 📂 Estructura del proyecto

```
fitness-quest/
├── index.html              # Página principal: botones de conexión/simulación + carga el juego
├── IA_NANO_FINAL.ino        # Código del Arduino (IMU + modelo Edge Impulse + BLE)
├── src/
│   ├── phaser.min.js         # Motor de videojuegos Phaser (librería)
│   └── script.js             # Lógica del juego + conexión BLE
└── assets/                   # Imágenes, spritesheets y audio del juego
    ├── JhonRabbitPress.png
    ├── JhonRabbitBoat.png
    ├── JhonRabbitPull.png
    ├── JhonRabbitPlane.png
    ├── JhonRabbitTriceps.png
    ├── LarryRabbitPull.png
    ├── sky.jpg, ground.png, river.png, titleScreen.png, jhonmain.png
    └── arrrrrcade.mp3, urgency.mp3, countdown.mp3, ow.mp3, you_lose.mp3
```

`index.html` ya trae, además del juego, una barra de botones para:
- **Conectar Arduino** (`btn-connect`), que dispara el emparejamiento BLE y muestra el estado de la conexión (`Desconectado` / `Conectando...` / `Conectado (BLE)`).
- **Simular** cada ejercicio (Curl, Elev. Lateral, Press Militar, Remo, Tríceps) y **Detener (Quieto)**, sin necesitar el Arduino conectado — útil para probar el juego solo.

## 🛠️ Requisitos

**Hardware**
- Arduino Nano 33 BLE Sense (con IMU LSM9DS1 integrado)

**Software**
- Arduino IDE, con las librerías `ArduinoBLE` y `Arduino_LSM9DS1`
- Una cuenta en [Edge Impulse](https://edgeimpulse.com/) y el modelo exportado como librería de Arduino
- Un navegador compatible con **Web Bluetooth** (Chrome o Edge; no funciona en Firefox ni Safari)

## 🚀 Cómo ejecutarlo

### 1. Programar el Arduino
1. Abre `IA_NANO_FINAL.ino` en el Arduino IDE.
2. Instala la librería del modelo exportado desde Edge Impulse (aparece como `Robinson.Bastidas-project-1_inferencing` en el código; cámbiala por el nombre de tu propia librería si entrenas tu propio modelo).
3. Sube el sketch a la placa. El Arduino empezará a anunciarse por BLE con el nombre `FitnessGameController`.

### 2. Abrir el juego
1. Sirve la carpeta del proyecto con un servidor local (Web Bluetooth no funciona abriendo el HTML directo con `file://`). Por ejemplo:
   ```bash
   npx serve .
   # o
   python3 -m http.server 8000
   ```
2. Abre `index.html` en Chrome o Edge desde esa dirección local.
3. Dale clic a **Conectar Arduino** y elige `FitnessGameController` en la ventana de emparejamiento BLE.
4. Elige nivel y dificultad, y a jugar.

También puedes abrir el código en VScode, descargar el plugin LiveServer y dirigirte a index.html.
Una vez ahí, un click derecho a la línea 72 del código (<script src="src/script.js"></script>) y luego elige "Open with Live Server".
Se debe abrir una página en tu navegador donde esté corriendo el juego.


> ¿No tienes el Arduino a la mano? Usa los botones **Simular** de `index.html` (o llama a `simular('curl')`, `simular('press')`, etc. desde la consola del navegador) para forzar cada ejercicio y probar el juego sin la placa conectada.

## 🕹️ Niveles y dificultad

| Ejercicio | Nivel del juego |
|---|---|
| Press militar | Sostener un auto en alto |
| Remo con mancuerna | Remar un bote |
| Curl de bíceps | Ganar un pulso |
| Elevación lateral | Pilotar un avión |
| Extensión de tríceps | Golpear con un mazo |

Dificultades disponibles: `easy`, `medium`, `hard` y `custom` (tiempo personalizado). Cada una define cuánto tiempo hay que sostener el ejercicio para pasar el nivel.

## 🏆 Récords

El juego guarda el mejor tiempo por nivel y dificultad en el `localStorage` del navegador (clave `fitness_quest_records`), así que los récords quedan guardados entre partidas mientras no se borre el caché del navegador.

## 👥 Autores

- Nicole Valeria Ruiz Valencia
- Alessandro Yusty Ceballos
- Robinson Bastidas

Universidad Autónoma de Occidente.

## 📄 Referencias / Créditos

- Edge Impulse Inc., "Edge Impulse Documentation". Disponible: https://docs.edgeimpulse.com/
- SINERGIA, "Creando un juego con HTML, CSS y JavaScript", lista de reproducción de YouTube. Disponible: https://www.youtube.com/playlist?list=PL7tUbHOY3O6iyIYctCI9wJ4aOnXWcswIo
- J. C. Giraldo Londoño, notas de clase, Universidad Autónoma de Occidente.

## 📌 Limitaciones conocidas

- El umbral de confianza (45 %) y el tamaño de la ventana de clasificación se ajustaron de forma preliminar; conviene recalibrarlos con datos de más usuarios.
- Pausas breves durante el ejercicio pueden interpretarse como que el jugador se detuvo del todo.
- Por ahora solo se reconocen los cinco ejercicios listados arriba y el estado de reposo.
