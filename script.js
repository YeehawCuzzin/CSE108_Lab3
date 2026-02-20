const display = document.getElementById("display");
const numberBtns = document.querySelectorAll(".number");
const opBtns = document.querySelectorAll(".op");
const equalsBtn = document.getElementById("equals");
const clearBtn = document.getElementById("clear");

let current = "0";          // number being typed (string)
let first = null;           // first operand (number)
let operator = null;        // "+", "-", "*", "/"
let waitingForSecond = false;

// For repeated equals:
let lastOperator = null;
let lastSecond = null;

// Track operator highlighting:
let activeOpBtn = null;

function setDisplay(text) {
    display.value = text;
}

function clearActiveOp() {
    if (activeOpBtn) activeOpBtn.classList.remove("active");
    activeOpBtn = null;
}

function setActiveOp(btn) {
    clearActiveOp();
    activeOpBtn = btn;
    activeOpBtn.classList.add("active");
}

function resetAll() {
    current = "0";
    first = null;
    operator = null;
    waitingForSecond = false;

    lastOperator = null;
    lastSecond = null;

    clearActiveOp();
    setDisplay("0");
}

function toNumber(str) {
    // Handles "0", "3.", ".5" (we prevent ".5" via input rules but still safe)
    return parseFloat(str);
}

function formatResult(n) {
    // Keep it simple; avoid huge floating errors visually
    if (!Number.isFinite(n)) return "Error";
    const s = n.toString();
    return s;
}

function compute(a, op, b) {
    switch (op) {
        case "+": return a + b;
        case "-": return a - b;
        case "*": return a * b;
        case "/": return b === 0 ? NaN : a / b;
        default: return b;
    }
}

function startNewNumberIfNeeded() {
    if (waitingForSecond) {
        current = "0";
        waitingForSecond = false;
    }
}

function appendDigit(d) {
    startNewNumberIfNeeded();

    if (current === "0") {
        current = d; // replace leading 0
    } else {
        current += d;
    }

    // Any number input removes operator highlight per spec
    clearActiveOp();
    setDisplay(current);
}

function appendDecimal() {
    startNewNumberIfNeeded();

    if (!current.includes(".")) {
        current += ".";
        // Any number input removes operator highlight per spec
        clearActiveOp();
        setDisplay(current);
    }
}

function handleOperatorClick(op, btn) {
    const currNum = toNumber(current);

    // If we have not stored first yet, store it now
    if (first === null) {
        first = currNum;
        operator = op;
        waitingForSecond = true;

        // Operator highlight stays until number/op/equals/clear
        setActiveOp(btn);
        return;
    }

    // If an operator is clicked again while waiting for second (no new number typed),
    // just switch the operator and keep highlighting the new one.
    if (waitingForSecond) {
        operator = op;
        setActiveOp(btn);
        return;
    }

    // If we have first, operator, and a second number typed,
    // clicking another operator acts like equals, then sets new operator active (spec #4)
    if (operator !== null) {
        const result = compute(first, operator, currNum);
        const formatted = formatResult(result);

        setDisplay(formatted);

        // update state so result becomes new first
        first = Number.isFinite(result) ? result : null;
        current = Number.isFinite(result) ? formatted : "0";

        // update repeated equals memory
        lastOperator = operator;
        lastSecond = currNum;

        // set new operator
        operator = op;
        waitingForSecond = true;

        setActiveOp(btn);
        return;
    }

    // Fallback: if somehow operator null but first exists, set operator
    operator = op;
    waitingForSecond = true;
    setActiveOp(btn);
}

function handleEquals() {
    // Equals should remove highlight per spec
    clearActiveOp();

    // If we have no operator, nothing to do
    if (operator === null && lastOperator === null) return;

    // Case 1: Normal equals (first op current)
    if (operator !== null) {
        const currNum = toNumber(current);

        // If user pressed equals without entering a second number:
        // we can treat it like using the same number again (common calc behavior),
        // but spec doesn't require this. We'll do a safe approach:
        if (first === null) return;

        // If waitingForSecond is true, it means they hit operator then equals without typing.
        // Use current as second (which is still showing first). Better: use first as second.
        const second = waitingForSecond ? first : currNum;

        const result = compute(first, operator, second);
        const formatted = formatResult(result);

        setDisplay(formatted);

        // Save repeated-equals memory exactly as spec: "last action" and "second number"
        lastOperator = operator;
        lastSecond = second;

        // After equals, result becomes the new first; current shows result
        first = Number.isFinite(result) ? result : null;
        current = Number.isFinite(result) ? formatted : "0";

        // After equals, operator becomes null, but we keep lastOperator/lastSecond for repeated "="
        operator = null;
        waitingForSecond = true;
        return;
    }

    // Case 2: Repeated equals
    // Use displayed value as first, repeat lastOperator with lastSecond
    if (lastOperator !== null && lastSecond !== null) {
        const a = toNumber(display.value);
        const result = compute(a, lastOperator, lastSecond);
        const formatted = formatResult(result);

        setDisplay(formatted);

        first = Number.isFinite(result) ? result : null;
        current = Number.isFinite(result) ? formatted : "0";
        waitingForSecond = true;
    }
}

numberBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        if (btn.dataset.digit) appendDigit(btn.dataset.digit);
        else if (btn.dataset.decimal) appendDecimal();
    });
});

opBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        handleOperatorClick(btn.dataset.op, btn);
    });
});

equalsBtn.addEventListener("click", handleEquals);
clearBtn.addEventListener("click", resetAll);

// initialize
resetAll();