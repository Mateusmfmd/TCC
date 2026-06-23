const int BUTTON1 = 7;
const int BUTTON2 = 6;
const int BUTTON3 = 5;
const int BUTTON4 = 4;
const int BUTTON5 = 3;

int lastButtonState1;
int currentButtonState1;

int lastButtonState2;
int currentButtonState2;

int lastButtonState3;
int currentButtonState3;

int lastButtonState4;
int currentButtonState4;

int lastButtonState5;
int currentButtonState5;

void setup() {

  Serial.begin(9600);

  pinMode(BUTTON1, INPUT_PULLUP);
  pinMode(BUTTON2, INPUT_PULLUP);
  pinMode(BUTTON3, INPUT_PULLUP);
  pinMode(BUTTON4, INPUT_PULLUP);
  pinMode(BUTTON5, INPUT_PULLUP);

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

  delay(20);
}
