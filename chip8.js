/* 
  CHIP-8 Interpreter
  Copyright 2025 Ali Eser 
*/

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
let vReg = new Uint8Array(16).fill(0);

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
  "KeyX": false, "Digit1": false, "Digit2": false, "Digit3": false,
  "KeyQ": false, "KeyW": false, "KeyE": false, "KeyA": false,
  "KeyS": false, "KeyD": false, "KeyZ": false, "KeyC": false, 
  "Digit4": false, "KeyR": false, "KeyF": false, "KeyV": false
};

// create a 64x32 display and append to the viewport element
const viewport = document.querySelector("#viewport");
for (let i = 0; i < 32; i++) {
  for (let j = 0; j < 64; j++) {
    const px = document.createElement("div");
    px.className = "px";
    px.id = "x" + j + "-y" + i;
    px.style.backgroundColor = "rgb(0, 0, 0)";
    viewport.append(px);
  }
}

const body = document.querySelector("body");
for (let i = 0; i < vReg.length; i++) {
  const register = document.createElement(`vreg${i}`);
  register.innerHTML = `vReg${i}: ` + vReg[i];
  register.style.color = "white";
  register.className = "register";
  body.append(register);
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
    console.log("error: ", error);
  };

  reader.readAsArrayBuffer(file);
});

const fetch = () => {
  const opcode = (mem[PC] << 8) | mem[PC + 1];
  PC = PC + 2;
  cpu(opcode);
  for (let i = 0; i < vReg.length; i++) {
    const register = document.querySelector(`vreg${i}`);
    register.innerHTML = `vReg${i}: ` + vReg[i];
  }
}

const cpu = (opcode) => {
  const [x, y] = [(opcode & 0x0F00) >> 8, (opcode & 0x00F0) >> 4];
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
      if (vReg[x] === (opcode & 0x00FF)) {
        PC += 2;
      }
      break;
    case 0x0004:
      if (vReg[x] !== (opcode & 0x00FF)) {
        PC += 2;
      }
      break;
    case 0x0005:
      if (vReg[x] === vReg[y]) {
        PC += 2;
      }
      break;
    case 0x0006:
      vReg[(opcode & 0x0F00) >> 8] = opcode & 0x00FF;
      break;
    case 0x0007:
      vReg[(opcode & 0x0F00) >> 8] = (vReg[(opcode & 0x0F00) >> 8] + opcode & 0x00FF) & 0xFF;
      break;
    case 0x0008:
      switch (opcode & 0x000F) {
        case 0x0000:
          vReg[x] = vReg[y];
          break;
        case 0x0001:
          vReg[x] = (vReg[x] | vReg[y]) & 0xFF;
          break;
        case 0x0002:
          vReg[x] = (vReg[x] & vReg[y]) & 0xFF;
          break; 
        case 0x0003:
          vReg[x] = (vReg[x] ^ vReg[y]) & 0xFF;
          break;
        case 0x0004: {
          const [vx, vy] = [vReg[x], vReg[y]];
          vReg[x] = (vReg[x] + vReg[y]) & 0xFF;
          if ((vx + vy) > 0xFF) {
            vReg[0xF] = 1;
          } else {
            vReg[0xF] = 0;
          }
          break;
        }
        case 0x0005: {
          const [vx, vy] = [vReg[x], vReg[y]];
          vReg[x] = (vReg[x] - vReg[y]) & 0xFF;
          if (vx >= vy) {
            vReg[0xF] = 1;
          } else {
            vReg[0xF] = 0;
          }
          break;
        }
        case 0x0006: {
          const bitToBeShifted = vReg[y] & 0x1;
          vReg[x] = (vReg[y] >> 1) & 0xFF;
          vReg[0xF] = bitToBeShifted;
          break;
        }
        case 0x0007: {
          const [vx, vy] = [vReg[x], vReg[y]];
          vReg[x] = vReg[y] - vReg[x];
          if (vy >= vx) {
            vReg[0xF] = 1;
          } else if (vy < vx) {
            vReg[0xF] = 0;
          }
          break;
        }
        case 0x000E: {
          const bitToBeShifted = (vReg[y] >> 7) & 0x1;
          vReg[x] = (vReg[y] << 1) & 0xFF;
          vReg[0xF] = bitToBeShifted;
          break;
        }
      }
      break;
    case 0x0009:
      if (vReg[x] !== vReg[y]) {
        PC += 2;
      }
      break;
    case 0x000A:
      I = (opcode & 0x0FFF);
      break;
    case 0x000B:
      const addr = opcode & 0x0FFF;
      PC = addr + vReg[0x0];
      break;
    case 0x000C:
      vReg[x] = (((Math.random() * (opcode & 0x00FF)) * 10) & (opcode & 0x00FF)) & 0xFF;
      break;
    case 0x000D: {
      let y = vReg[(opcode & 0x00F0) >> 4] % 32;
      for (let i = 0; i < (opcode & 0x000F); i++) {
        let x = vReg[(opcode & 0x0F00) >> 8] % 64;
        let sprite = mem[I + i];
        for (let j = 0; j < 8; j++) {
          let currPix = (sprite & (1 << 7 - j)) != 0;
          const scrPixel = document.querySelector(`#x${x}-y${y}`);
          if (scrPixel.style.backgroundColor === "whitesmoke" && currPix) {
            scrPixel.style.backgroundColor = "rgb(0, 0, 0)";
            vReg[0xF] = 1;
          } else if (scrPixel.style.backgroundColor === "rgb(0, 0, 0)" && currPix) {
            scrPixel.style.backgroundColor = "whitesmoke";
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
    }
    case 0x000E:
      switch (opcode & 0x00FF) {
        case 0x009E:
          if (Object.values(keyLog)[x]) {
            console.log(Object.values(keyLog)[x & 0xF]);
            PC += 2;
          }
          break;
        case 0x00A1:
          if (!Object.values(keyLog)[x]) {
            PC += 2;
          }
          break;
      }
      break;
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
          console.log(opcode);
          let pressedKey = Object.values(keyLog).indexOf(true);
          console.log(pressedKey);
          if (pressedKey !== -1) {
            vReg[(opcode & 0x0F00) >> 8] = pressedKey;
            console.log("pressedKey: ", pressedKey);
          } else {
            PC -= 2;
          }
          break;
        case 0x0029:
          I = 0x50 + ((vReg[(opcode & 0x0F00) >> 8] & 0xF) * 5);
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
      break;
  }
};

const watchKeyEvents = () => {
  onkeydown = (e) => {
    if (e.code in keyLog) {
      if (!keyLog[e.code]) {
        keyLog[e.code] = true;
      }
    }
  }
  onkeyup = (e) => {
    if (e.code in keyLog) {
      if (keyLog[e.code]) {
        keyLog[e.code] = false;
      }
      
    }
  }
};
