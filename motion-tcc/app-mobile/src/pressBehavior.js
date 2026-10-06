// Um toque comum seleciona imediatamente. Se a criança mantiver o dedo
// pressionado até o tempo de resposta, a seleção ocorre uma vez no limiar e
// o evento onPress ao soltar não repete a ação.
export function createPressBehavior({ confirm, delayMs = 0, setTimer = setTimeout, clearTimer = clearTimeout }) {
  let timer = null;
  let confirmedDuringHold = false;
  let currentDelay = Number(delayMs) || 0;

  const cancelTimer = () => {
    if (timer !== null) {
      clearTimer(timer);
      timer = null;
    }
  };

  return {
    setDelayMs(value) { currentDelay = Number(value) || 0; },
    pressIn() {
      cancelTimer();
      confirmedDuringHold = false;
      if (currentDelay > 0) {
        timer = setTimer(() => {
          timer = null;
          confirmedDuringHold = true;
          confirm();
        }, currentDelay);
      }
    },
    pressOut() { cancelTimer(); },
    press() {
      if (confirmedDuringHold) {
        confirmedDuringHold = false;
        cancelTimer();
        return false;
      }
      cancelTimer();
      confirm();
      return true;
    },
    dispose() { cancelTimer(); confirmedDuringHold = false; },
  };
}
