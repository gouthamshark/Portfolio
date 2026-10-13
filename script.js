/* =========================================================
   Calculator
   ========================================================= */
(function () {
  const display = document.getElementById("calcDisplay");
  const history = document.getElementById("calcHistory");
  const keys = document.getElementById("calcKeys");
  if (!display || !keys) return;

  const symbols = { "+": "+", "-": "−", "*": "×", "/": "÷" };

  let current = "0";      // what is shown / being typed
  let previous = null;    // stored first number
  let operator = null;    // pending operator
  let fresh = true;       // next digit starts a new number
  let error = false;

  function format(n) {
    // trim floating point noise like 0.1 + 0.2
    let text = String(parseFloat(Number(n).toPrecision(12)));
    if (text.includes("e")) return text;
    return text;
  }

  function render() {
    display.textContent = current;
    keys.querySelectorAll("[data-op]").forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.op === operator && fresh && previous !== null);
    });
  }

  function reset() {
    current = "0"; previous = null; operator = null; fresh = true; error = false;
    history.innerHTML = "&nbsp;";
    render();
  }

  function compute(a, b, op) {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return b === 0 ? null : a / b;
    }
    return b;
  }

  function showError() {
    current = "Can't divide by 0";
    previous = null; operator = null; fresh = true; error = true;
    history.innerHTML = "&nbsp;";
    render();
  }

  function inputNumber(d) {
    if (error) reset();
    if (fresh) { current = d; fresh = false; }
    else if (current.replace(/[-.]/g, "").length < 12) {
      current = current === "0" ? d : current + d;
    }
    render();
  }

  function inputDot() {
    if (error) reset();
    if (fresh) { current = "0."; fresh = false; }
    else if (!current.includes(".")) current += ".";
    render();
  }

  function chooseOperator(op) {
    if (error) return;
    if (operator && !fresh) {
      const result = compute(parseFloat(previous), parseFloat(current), operator);
      if (result === null) return showError();
      current = format(result);
    }
    previous = current;
    operator = op;
    fresh = true;
    history.textContent = previous + " " + symbols[op];
    render();
  }

  function equals() {
    if (error || operator === null) return;
    const a = parseFloat(previous);
    const b = parseFloat(current);
    const result = compute(a, b, operator);
    if (result === null) return showError();
    history.textContent = previous + " " + symbols[operator] + " " + current + " =";
    current = format(result);
    previous = null; operator = null; fresh = true;
    render();
  }

  function backspace() {
    if (error) return reset();
    if (fresh) return;
    current = current.length > 1 ? current.slice(0, -1) : "0";
    if (current === "-" ) current = "0";
    render();
  }

  function percent() {
    if (error) return;
    current = format(parseFloat(current) / 100);
    fresh = true;
    render();
  }

  keys.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (e.detail > 0) btn.blur(); // mouse click: let keyboard Enter mean "=" again
    if (btn.dataset.num !== undefined) inputNumber(btn.dataset.num);
    else if (btn.dataset.op) chooseOperator(btn.dataset.op);
    else {
      switch (btn.dataset.action) {
        case "clear": reset(); break;
        case "back": backspace(); break;
        case "percent": percent(); break;
        case "dot": inputDot(); break;
        case "equals": equals(); break;
      }
    }
  });

  // Keyboard support (only when you're not typing in the guessing game box)
  document.addEventListener("keydown", function (e) {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.activeElement && document.activeElement.closest && document.activeElement.closest("#calcKeys") && (e.key === "Enter" || e.key === " ")) return;

    if (e.key >= "0" && e.key <= "9") inputNumber(e.key);
    else if (e.key === ".") inputDot();
    else if ("+-*/".includes(e.key)) { e.preventDefault(); chooseOperator(e.key); }
    else if (e.key === "Enter" || e.key === "=") { e.preventDefault(); equals(); }
    else if (e.key === "Backspace") backspace();
    else if (e.key === "Escape" || e.key.toLowerCase() === "c") reset();
    else if (e.key === "%") percent();
  });

  render();
})();

/* =========================================================
   Number guessing game
   ========================================================= */
(function () {
  const form = document.getElementById("gameForm");
  if (!form) return;

  const input = document.getElementById("guessInput");
  const message = document.getElementById("gameMessage");
  const attemptsEl = document.getElementById("attempts");
  const bestEl = document.getElementById("bestScore");
  const historyEl = document.getElementById("gameHistory");
  const meter = document.getElementById("gameMeter");
  const guessBtn = document.getElementById("guessBtn");
  const resetBtn = document.getElementById("gameReset");

  const MIN = 1, MAX = 100;
  let secret, attempts, guesses, over, best = null;

  function newGame() {
    secret = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
    attempts = 0;
    guesses = [];
    over = false;
    input.value = "";
    input.disabled = false;
    guessBtn.disabled = false;
    message.textContent = "Make your first guess!";
    message.className = "game-message";
    attemptsEl.textContent = "0";
    historyEl.textContent = "";
    meter.style.width = "0%";
    input.focus({ preventScroll: true });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (over) return;

    const guess = Number(input.value);
    if (!Number.isInteger(guess) || guess < MIN || guess > MAX) {
      message.textContent = "Please enter a whole number from " + MIN + " to " + MAX + ".";
      message.className = "game-message";
      return;
    }

    attempts++;
    guesses.push(guess);
    attemptsEl.textContent = attempts;
    historyEl.textContent = "Your guesses: " + guesses.join(", ");

    const diff = Math.abs(guess - secret);
    // closeness meter: 100 away = 0%, exact = 100%
    meter.style.width = Math.max(0, 100 - diff) + "%";

    if (guess === secret) {
      over = true;
      message.textContent = "🎉 Correct! The number was " + secret + ". You got it in " + attempts + (attempts === 1 ? " try!" : " tries!");
      message.className = "game-message win";
      if (best === null || attempts < best) {
        best = attempts;
        bestEl.textContent = best;
      }
      input.disabled = true;
      guessBtn.disabled = true;
      meter.style.width = "100%";
    } else {
      const direction = guess < secret ? "Too low" : "Too high";
      const close = diff <= 5 ? "Very hot!" : diff <= 15 ? "Warm." : "Cold.";
      message.textContent = direction + ". " + close + " Try again!";
      message.className = "game-message " + (diff <= 15 ? "hot" : "cold");
    }

    input.value = "";
    if (!over) input.focus({ preventScroll: true });
  });

  resetBtn.addEventListener("click", newGame);

  newGame();
  // don't steal focus/scroll on page load
  input.blur();
})();
