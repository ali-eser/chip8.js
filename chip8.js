// define memory
let mem = new Uint8Array(4096);

let I;
let PC = 0x200;
let V;

// define 32 bytes of stack
let stack = new Uint16Array(16);

// implement timer logic
let delayTimer = 0;
let soundTimer = 0;

setInterval(function() {
  if (delayTimer > 0) {
    delayTimer--;
  }
  if (soundTimer > 0) {
    soundTimer--;
  }
}, 1000/60);

// create a 64x32 display and append to the viewport element
const viewport = document.querySelector("#viewport");
for (let i = 0; i < 2048; i++) {
  let pixel = document.createElement("div");
  pixel.className = "pixel";
  pixel.id = "px-" + i;
  viewport.append(pixel);
}

// define font to be used by apps
const FONT = new Uint8Array([
  0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
  0x20, 0x60, 0x20, 0x20, 0x70, // 1
  0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
  0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
  0x90, 0x90, 0xF0, 0x10, 0x10, // 4
  0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
  0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
  0xF0, 0x10, 0x20, 0x40, 0x40, // 7
  0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
  0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
  0xF0, 0x90, 0xF0, 0x90, 0x90, // A
  0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
  0xF0, 0x80, 0x80, 0x80, 0xF0, // C
  0xE0, 0x90, 0x90, 0x90, 0xE0, // D
  0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
  0xF0, 0x80, 0xF0, 0x80, 0x80  // F
]);

// write font to memory on boot
let memAddr = 0x50;
for (let i = 0; i < FONT.length; i++) {
  mem[memAddr] = FONT[i];
  memAddr++;
}

document.querySelector("#run-file").addEventListener("click", function() {
  const reader = new FileReader();
  let file = document.querySelector("#rom").files[0];

  if (!file) {
    console.log("No ROM loaded!");
    alert("Load a CHIP-8 ROM first!");
    return;
  }

  reader.onload = function(event) {
    console.log(event.target.result);
  }

  reader.onerror = function(error) {
    console.log("error: ", error.type);
  }

  reader.readAsArrayBuffer(file);
});
