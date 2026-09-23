  #include <ArduinoBLE.h>
#include <Arduino_LSM9DS1.h> 
#include <Robinson.Bastidas-project-1_inferencing.h>

// BLE Service & Characteristic setup
BLEService exerciseService("19b10000-e8f2-537e-4f6c-d104768a1214");
BLECharCharacteristic exerciseChar("19b10001-e8f2-537e-4f6c-d104768a1214", BLERead | BLENotify);

// Circular feature buffer for Edge Impulse model
static float features[EI_CLASSIFIER_DSP_INPUT_FRAME_SIZE];
static size_t feature_index = 0;
int printDivider = 0;

// Convert label string to single character code (Flexible e inmune a mayúsculas/minúsculas)
char getExerciseCode(const char* label) {
  String l = String(label);
  l.toLowerCase();
  l.trim();

  if (l.indexOf("elevacioneslat") >= 0 || l.indexOf("lateral") >= 0) return 'L';
  if (l.indexOf("exttriceps") >= 0     || l.indexOf("triceps") >= 0) return 'T';
  if (l.indexOf("curlbiceps") >= 0     || l.indexOf("curl") >= 0)    return 'B';
  if (l.indexOf("presshombro") >= 0    || l.indexOf("press") >= 0)   return 'S';
  if (l.indexOf("remo") >= 0           || l.indexOf("row") >= 0)     return 'R';
  if (l.indexOf("reposo") >= 0        || l.indexOf("still") >= 0)   return '0';

  return '0'; // Default fallback
}

void setup() {
  Serial.begin(115200);

  // Wait up to 3 seconds for Serial Monitor connection
  unsigned long startWait = millis();
  while (!Serial && (millis() - startWait < 3000));

  if (!IMU.begin()) {
    Serial.println("ERROR: IMU initialization failed!");
    while (1);
  }

  if (!BLE.begin()) {
    Serial.println("ERROR: BLE initialization failed!");
    while (1);
  }

  BLE.setLocalName("FitnessGameController");
  BLE.setAdvertisedService(exerciseService);
  exerciseService.addCharacteristic(exerciseChar);
  BLE.addService(exerciseService);
  
  // Set default initial state to Reposo ('0')
  exerciseChar.writeValue((byte)'0');
  BLE.advertise();

  Serial.println("==================================================");
  Serial.println("Fitness Controller Ready & Advertising via BLE");
  Serial.println("==================================================");
}

void loop() {
  BLEDevice central = BLE.central();

  if (central) {
    Serial.print("Connected to Central PC: ");
    Serial.println(central.address());

    while (central.connected()) {
      
      // 1. Read IMU sensors and load feature buffer (50Hz = 20ms delay)
      if (IMU.accelerationAvailable() && IMU.gyroscopeAvailable()) {
        float ax, ay, az, gx, gy, gz;
        IMU.readAcceleration(ax, ay, az);
        IMU.readGyroscope(gx, gy, gz);

        // Print sensor values every 10 samples (~200ms) to avoid flooding the console
        if (++printDivider >= 10) {
          Serial.print("[IMU Read] ACC (g): ");
          Serial.print(ax, 2); Serial.print(", ");
          Serial.print(ay, 2); Serial.print(", ");
          Serial.print(az, 2);
          Serial.print(" | GYRO (dps): ");
          Serial.print(gx, 2); Serial.print(", ");
          Serial.print(gy, 2); Serial.print(", ");
          Serial.println(gz, 2);
          printDivider = 0;
        }

        // Fill feature array (must match your Edge Impulse model axis order)
        features[feature_index++] = ax;
        features[feature_index++] = ay;
        features[feature_index++] = az;
        features[feature_index++] = gx;
        features[feature_index++] = gy;
        features[feature_index++] = gz;

        delay(20); 
      }

      // 2. Run classification when feature buffer is full
      if (feature_index >= EI_CLASSIFIER_DSP_INPUT_FRAME_SIZE) {
        signal_t signal;
        numpy::signal_from_buffer(features, EI_CLASSIFIER_DSP_INPUT_FRAME_SIZE, &signal);

        ei_impulse_result_t result = { 0 };
        EI_IMPULSE_ERROR res = run_classifier(&signal, &result, false);

        if (res == EI_IMPULSE_OK) {
          float max_confidence = 0.0;
          int best_index = -1;

          Serial.println("\n--- Edge Impulse Predictions ---");
          for (size_t ix = 0; ix < EI_CLASSIFIER_LABEL_COUNT; ix++) {
            Serial.print("  Class [");
            Serial.print(result.classification[ix].label);
            Serial.print("]: ");
            Serial.print(result.classification[ix].value * 100, 1);
            Serial.println("%");

            if (result.classification[ix].value > max_confidence) {
              max_confidence = result.classification[ix].value;
              best_index = ix;
            }
          }

          char exerciseCode = '0';
          
          // Umbral de confianza ajustado a 45% (0.45) para evitar falso "Reposo"
          if (best_index >= 0 && max_confidence >= 0.45) {
            const char* detectedLabel = result.classification[best_index].label;
            exerciseCode = getExerciseCode(detectedLabel);

            Serial.print(">>> DETECTED EXERCISE: ");
            Serial.print(detectedLabel);
            Serial.print(" | TRANSMITTING CHAR: '");
            Serial.print(exerciseCode);
            Serial.println("' <<< \n");
          } else {
            Serial.println(">>> LOW CONFIDENCE -> TRANSMITTING CHAR: '0' (reposo) <<<\n");
          }

          // Envio explícito en formato byte por BLE
          exerciseChar.writeValue((byte)exerciseCode);
        }

        // Shift sliding window (50% overlay for continuous tracking)
        size_t shift_size = EI_CLASSIFIER_DSP_INPUT_FRAME_SIZE / 2;
        memmove(features, features + shift_size, (EI_CLASSIFIER_DSP_INPUT_FRAME_SIZE - shift_size) * sizeof(float));
        feature_index = EI_CLASSIFIER_DSP_INPUT_FRAME_SIZE - shift_size;
      }
    }
    
    Serial.println("Disconnected from Central PC.");
  }
}