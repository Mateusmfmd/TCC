/*
 * arduino-botoes
 * Cinco botões coloridos + um sensor ultrassônico (equivalente ao "vermelho").
 * Cada acionamento envia o nome da cor pela serial (9600 baud), uma por linha.
 * Parte do projeto M.O.T.I.O.N. (TCC) - Mateus Florido Pena
 */

const int BUTTON1 = 7; // amarelo
const int BUTTON2 = 6; // preto
const int BUTTON3 = 5; // azul
const int BUTTON4 = 4; // vermelho
const int BUTTON5 = 3; // verde

const int TRIG = 9;
const int ECHO = 10;

const int LIMITE_ATIVA = 10;  // cm - abaixo disso, dispara "vermelho"
const int LIMITE_RESETA = 15; // cm - só volta a poder disparar depois de passar disso

int lastButtonState1, currentButtonState1;
int lastButtonState2, currentButtonState2;
int lastButtonState3, currentButtonState3;
int lastButtonState4, currentButtonState4;
int lastButtonState5, currentButtonState5;

bool sensorArmado = true; // true = pode disparar, false = já disparou, esperando afastar

long lerDistancia() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  long duracao = pulseIn(ECHO, HIGH, 30000); // timeout de 30ms evita travar sem eco
  return duracao * 0.034 / 2;
}

void setup() {

  Serial.begin(9600);

  pinMode(BUTTON1, INPUT_PULLUP);
  pinMode(BUTTON2, INPUT_PULLUP);
  pinMode(BUTTON3, INPUT_PULLUP);
  pinMode(BUTTON4, INPUT_PULLUP);
  pinMode(BUTTON5, INPUT_PULLUP);

  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);

  currentButtonState1 = digitalRead(BUTTON1);
  currentButtonState2 = digitalRead(BUTTON2);
  currentButtonState3 = digitalRead(BUTTON3);
  currentButtonState4 = digitalRead(BUTTON4);
  currentButtonState5 = digitalRead(BUTTON5);
}

void loop() {

  // =========================
  // BOTÃO AMARELO
  // =========================
  lastButtonState1 = currentButtonState1;
  currentButtonState1 = digitalRead(BUTTON1);

  if (lastButtonState1 == HIGH && currentButtonState1 == LOW) {
    Serial.println("amarelo");
  }

  // =========================
  // BOTÃO PRETO
  // =========================
  lastButtonState2 = currentButtonState2;
  currentButtonState2 = digitalRead(BUTTON2);

  if (lastButtonState2 == HIGH && currentButtonState2 == LOW) {
    Serial.println("preto");
  }

  // =========================
  // BOTÃO AZUL
  // =========================
  lastButtonState3 = currentButtonState3;
  currentButtonState3 = digitalRead(BUTTON3);

  if (lastButtonState3 == HIGH && currentButtonState3 == LOW) {
    Serial.println("azul");
  }

  // =========================
  // BOTÃO VERMELHO
  // =========================
  lastButtonState4 = currentButtonState4;
  currentButtonState4 = digitalRead(BUTTON4);

  if (lastButtonState4 == HIGH && currentButtonState4 == LOW) {
    Serial.println("vermelho");
  }

  // =========================
  // BOTÃO VERDE
  // =========================
  lastButtonState5 = currentButtonState5;
  currentButtonState5 = digitalRead(BUTTON5);

  if (lastButtonState5 == HIGH && currentButtonState5 == LOW) {
    Serial.println("verde");
  }

  // =========================
  // SENSOR DE DISTÂNCIA (VERMELHO) - com histerese
  // =========================
  long distancia = lerDistancia();

  if (sensorArmado && distancia > 0 && distancia < LIMITE_ATIVA) {
    Serial.println("vermelho");
    sensorArmado = false; // trava até a mão se afastar de verdade
  }

  if (!sensorArmado && distancia > LIMITE_RESETA) {
    sensorArmado = true; // libera pra disparar de novo
  }

  delay(20);
}
