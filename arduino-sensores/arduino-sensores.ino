/*
 * arduino-sensores
 * Três sensores ultrassônicos (vermelho, amarelo, preto): aproximar a mão
 * dispara o nome da cor pela serial (9600 baud), uma por linha.
 * Usa mediana de 3 leituras e histerese para evitar disparos falsos/repetidos.
 * Parte do projeto M.O.T.I.O.N. (TCC) - Mateus Florido Pena
 */

// Sensor VERMELHO
const int TRIG_VERMELHO = 9;
const int ECHO_VERMELHO = 10;

// Sensor AMARELO
const int TRIG_AMARELO = 2;
const int ECHO_AMARELO = 3;

// Sensor PRETO
const int TRIG_PRETO = 4;
const int ECHO_PRETO = 5;

const int LIMITE_ATIVA = 8;   // cm - dispara assim que a mão chega nessa distância
const int LIMITE_RESETA = 13; // cm - só libera de novo depois de afastar bem

bool armadoVermelho = true;
bool armadoAmarelo = true;
bool armadoPreto = true;

long pulsoUnico(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duracao = pulseIn(echoPin, HIGH, 30000); // timeout de 30ms
  return duracao * 0.034 / 2;
}

// Faz 3 leituras rápidas e devolve a mediana, filtrando picos causados por interferência
long lerDistanciaFiltrada(int trigPin, int echoPin) {
  long a = pulsoUnico(trigPin, echoPin);
  delay(10);
  long b = pulsoUnico(trigPin, echoPin);
  delay(10);
  long c = pulsoUnico(trigPin, echoPin);

  if (a > b) { long t = a; a = b; b = t; }
  if (b > c) { long t = b; b = c; c = t; }
  if (a > b) { long t = a; a = b; b = t; }

  return b;
}

void checarSensor(int trigPin, int echoPin, bool &armado, const char* cor) {
  long distancia = lerDistanciaFiltrada(trigPin, echoPin);

  if (armado && distancia > 0 && distancia < LIMITE_ATIVA) {
    Serial.println(cor);
    armado = false; // trava até afastar de verdade - evita disparo repetido
  }

  if (!armado && distancia > LIMITE_RESETA) {
    armado = true; // libera pra disparar de novo
  }
}

void setup() {

  Serial.begin(9600);

  pinMode(TRIG_VERMELHO, OUTPUT);
  pinMode(ECHO_VERMELHO, INPUT);

  pinMode(TRIG_AMARELO, OUTPUT);
  pinMode(ECHO_AMARELO, INPUT);

  pinMode(TRIG_PRETO, OUTPUT);
  pinMode(ECHO_PRETO, INPUT);
}

void loop() {

  checarSensor(TRIG_VERMELHO, ECHO_VERMELHO, armadoVermelho, "vermelho");
  delay(20);

  checarSensor(TRIG_AMARELO, ECHO_AMARELO, armadoAmarelo, "amarelo");
  delay(20);

  checarSensor(TRIG_PRETO, ECHO_PRETO, armadoPreto, "preto");
  delay(20);
}
