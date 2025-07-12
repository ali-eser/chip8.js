// define memory
let mem = new Uint8Array(4096);

// function for writing to memory
const writeToMemory = (data, address) => {
  for (let i = 0; i < data.length; i++) {
    mem[address] = data[i];
    address++;
  }
};

const cleanMemory = () => {
  for (let i = 0x200; i < 4096; i++) {
    mem[i] = 0x0;
  }
}

let I;
let PC = 0x200;
let vReg = new Uint8Array(16);

// define 32 bytes of stack
let stack = new Array;

// implement timer logic
let delayTimer = 0;
let soundTimer = 0;

setInterval(() => {
  if (delayTimer > 0) {
    delayTimer--;
  }
  if (soundTimer > 0) {
    soundTimer--;
  }
}, 1000/60);

let keyLog = {
  "KeyX": false, 
  "Digit1": false, 
  "Digit2": false, 
  "Digit3": false,
  "KeyQ": false, 
  "KeyW": false, 
  "KeyE": false, 
  "KeyA": false,
  "KeyS": false,
  "KeyD": false,
  "KeyZ": false,
  "KeyC": false, 
  "Digit4": false,
  "KeyR": false,
  "KeyF": false,
  "KeyV": false
};

// create a 64x32 display and append to the viewport element
const viewport = document.querySelector("#viewport");
for (let i = 0; i < 32; i++) {
  for (let j = 0; j < 64; j++) {
    const px = document.createElement("div");
    px.className = "px";
    px.id = "x" + j + "-y" + i;
    viewport.append(px);
  }
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

// write font to memory
writeToMemory(FONT, 0x50);

document.querySelector("#run-file").addEventListener("click", () => {
  const reader = new FileReader();
  let file = document.querySelector("#rom").files[0];

  if (!file) {
    console.log("No ROM loaded!");
    alert("Load a CHIP-8 ROM first!");
    return;
  }

  reader.onload = (e) => {
    cleanMemory();
    writeToMemory(new Uint8Array(e.target.result), 0x200);
    setInterval(() => {
      watchKeyEvents();
      fetch();
    }, 1000/660);
  };

  reader.onerror = (error) => {
    console.log("error: ", error.type);
  };

  reader.readAsArrayBuffer(file);
});

const fetch = () => {
  const opcode = (mem[PC] << 8) | mem[PC + 1];
  PC = PC + 2;
  decode(opcode);
}

const decode = (opcode) => {
  switch ((opcode & 0xF000) >> 12) {
    case 0x0000:
      switch (opcode & 0x00FF) {
        case 0x00E0:
          const px = document.querySelectorAll(".px");
          px.forEach((p) => {
            p.style.backgroundColor = "rgb(0, 0, 0)";
          });
          break;
        case 0x00EE:
          PC = stack.pop();
          break;
      }
      break;
    case 0x0001:
      PC = opcode & 0x0FFF;
      break;
    case 0x0002:
      stack.push(PC);
      PC = opcode & 0x0FFF;
      break;
    case 0x0003:
      if (vReg[(opcode & 0x0F00) >> 8] === (opcode & 0x00FF)) {
        PC += 2;
      }
      break;
    case 0x0004:
      if (vReg[(opcode & 0x0F00) >> 8] != (opcode & 0x00FF)) {
        PC += 2;
      }
      break;
    case 0x0005:
      if (vReg[(opcode & 0x0F00) >> 8] === vReg[(opcode & 0x00F0) >> 4]) {
        PC += 2;
      }
      break;
    case 0x0006:
      vReg[(opcode & 0x0F00) >> 8] = opcode & 0x00FF;
      break;
    case 0x0007:
      vReg[(opcode & 0x0F00) >> 8] = vReg[(opcode & 0x0F00) >> 8] + opcode & 0x00FF;
      break;
    case 0x0008:
      switch (opcode & 0x000F) {
        case 0x0000:
          vReg[(opcode & 0x0F00) >> 8] = vReg[(opcode & 0x00F0) >> 4];
          break;
        case 0x0001:
          vReg[(opcode & 0x0F00) >> 8] = vReg[(opcode & 0x0F00) >> 8] | vReg[(opcode & 0x00F0) >> 4];
          break;
        case 0x0002:
          vReg[(opcode & 0x0F00) >> 8] = vReg[(opcode & 0x0F00) >> 8] & vReg[(opcode & 0x00F0) >> 4];
          break;
        case 0x0003:
          vReg[(opcode & 0x0F00) >> 8] = vReg[(opcode & 0x0F00) >> 8] ^= vReg[(opcode & 0x00F0) >> 4];
          break;
        case 0x0004:
          if (vReg[(opcode & 0x0F00) >> 8] + vReg[(opcode & 0x00F0) >> 4] > 255) {
            vReg[0xF] = 1;
          } else {
            vReg[0xF] = 0;
          }
          vReg[(opcode & 0x0F00) >> 8] = vReg[(opcode & 0x0F00) >> 8] + vReg[(opcode & 0x00F0) >> 4];
          break;
        case 0x0005:
          const x = (opcode & 0x0F00) >> 8;
          const y = (opcode & 0x00F0) >> 4;
          if (vReg[x] > vReg[y]) {
            vReg[0xF] = 1;
          } else if (vReg[x] < vReg[y]) {
            vReg[0xF] = 0;
          }
          vReg[x] = vReg[x] - vReg[y];
          break;
        case 0x0006:
          vReg[(opcode & 0x0F00) >> 8] = vReg[(opcode & 0x00F0) >> 4];
          vReg[(opcode & 0x0F00) >> 8] >>= 1;
          break;
        case 0x0007:
          vReg[0xF] = 1;
          vReg[(opcode & 0x0F00) >> 8] = vReg[(opcode & 0x00F0) >> 4] - vReg[(opcode & 0x0F00) >> 8];
          if (vReg[(opcode & 0x00F0) >> 4] < vReg[(opcode & 0x0F00) >> 8]) {
            vReg[0xF] = 0;
          }
          break;
        case 0x000E:
          vReg[(opcode & 0x0F00) >> 8] = vReg[(opcode & 0x00F0) >> 4];
          vReg[(opcode & 0x0F00) >> 8] <<= 1;
          break;
      }
    case 0x0009:
      if (vReg[(opcode & 0x0F00) >> 8] !== vReg[(opcode & 0x00F0) >> 4]) {
        PC += 2;
      }
      break;
    case 0x000A:
      I = (opcode & 0x0FFF);
      break;
    case 0x000B:
      PC = (opcode & 0x0FFF) + vReg[0x0];
      break;
    case 0x000C:
      let randint = Math.floor(Math.random() * (opcode & 0x00FF));
      randint = randint & (opcode & 0x00FF);
      vReg[(opcode & 0x0F00) >> 8] = randint;
      break;
    case 0x000D:
      let y = vReg[(opcode & 0x00F0) >> 4] % 32;
      vReg[0xF] = 0;
      for (let i = 0; i < (opcode & 0x000F); i++) {
        let x = vReg[(opcode & 0x0F00) >> 8] % 64;
        let sprite = mem[I + i];
        for (let j = 0; j < 8; j++) {
          let currPix = (sprite & (1 << 7 - j)) != 0;
          const scrPixel = document.querySelector(`#x${x}-y${y}`);
          if (scrPixel.style.backgroundColor === "rgb(0, 255, 0)" && currPix) {
            scrPixel.style.backgroundColor = "rgb(0, 0, 0)";
            vReg[0xF] = 1;
          } else if (scrPixel.style.backgroundColor === "rgb(0, 0, 0)" && currPix) {
            scrPixel.style.backgroundColor = "rgb(0, 255, 0)";
            vReg[0xF] = 0;
          }
          x++;
          if (x > 63) {
            break;
          }
        }
        y++;
        if (y > 31) {
          break;
        }
      }
      break;
    case 0x000E:
      switch (opcode & 0x00FF) {
        case 0x009E:
          if (Object.values(keyLog)[(opcode & 0x0F00) >> 8]) {
            PC += 2;
          }
          break;
        case 0x00A1:
          if (!Object.values(keyLog)[(opcode & 0x0F00) >> 8]) {
            PC += 2;
          }
          break;
      }
    case 0x000F:
      switch (opcode & 0x00FF) {
        case 0x0007:
          vReg[(opcode & 0x0F00) >> 8] = delayTimer;
          break;
        case 0x0015:
          delayTimer = vReg[(opcode & 0x0F00) >> 8];
          break;
        case 0x0018:
          soundTimer = vReg[(opcode & 0x0F00) >> 8];
          break;
        case 0x001E:
          I += vReg[(opcode & 0x0F00) >> 8];
          break;
        case 0x000A:
          let pressedKey = Object.values(keyLog).indexOf(true);
          if (pressedKey !== -1) {
            vReg[(opcode & 0x0F00) >> 8] = pressedKey;
          } else {
            PC -= 2;
          }
          break;
        case 0x0029:
          I = 0x50 + (((opcode & 0x0F00) >> 8) * 5);
          break;
        case 0x0033:
          let i = 100;
          let count = 0
          while (i >= 1) {
            mem[I + count] = Math.floor(((vReg[(opcode & 0x0F00) >> 8]) / i) % 10);
            i /= 10;
            count++;
          }
          break;
        case 0x0055:
          for (let i = 0; i <= ((opcode & 0x0F00) >> 8); i++) {
            mem[I + i] = vReg[i];
          }
          break;
        case 0x0065:
          for (let i = 0; i <= ((opcode & 0x0F00) >> 8); i++) {
            vReg[i] = mem[I + i];
          }
          break;
      }
  }
};

const watchKeyEvents = () => {
  onkeydown = (e) => {
    if (e.code in keyLog) {
      keyLog[e.code] = true;
    }
  }
  onkeyup = (e) => {
    if (e.code in keyLog) {
      keyLog[e.code] = false;
    }
  }
};
