// define memory
let mem = new Uint8Array(4096);

// function for writing to memory
const writeToMemory = (data, address) => {
  for (let i = 0; i < data.length; i++) {
    mem[address] = data[i];
    address++;
  }
};

let I;

let PC = 0x200;

let vReg = {
  0x0: 0, 0x1: 0, 0x2: 0, 0x3: 0,
  0x4: 0, 0x5: 0, 0x6: 0, 0x7: 0,
  0x8: 0, 0x9: 0, 0xA: 0, 0xB: 0,
  0xC: 0, 0xD: 0, 0xE: 0, 0xF: 0
};

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
    writeToMemory(new Uint8Array(e.target.result), 0x200);
    setInterval(() => {
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
  //console.log("OPCODE: ", opcode.toString(16).toUpperCase());
  PC = PC + 2;
  decode(opcode);
}

const decode = (opcode) => {
  switch ((opcode & 0xF000) >> 12) {
    case 0x0000:
      switch (opcode & 0x00FF) {
        case 224:
          const px = document.querySelectorAll(".px");
          px.forEach((p) => {
            p.style.backgroundColor = "#000000";
          });
          console.log("cleared screen");
          break;
        case 238:
          PC = stack.pop();
          break;
      }
      break;
    case 0x0001:
      PC = opcode & 0x0FFF;
      console.log("PC set to: ", PC);
      break;
    case 0x0002:
      stack.push(PC);
      console.log("pushed to stack: ", PC);
      PC = opcode & 0x0FFF;
      console.log("PC set to: ", PC);
      break;
    case 0x0003:
      if (vReg[(opcode & 0x0F00) >> 8] === (opcode & 0x00FF)) {
        PC = PC + 2;
      }
      break;
    case 0x0004:
      if (vReg[(opcode & 0x0F00) >> 8] != (opcode & 0x00FF)) {
        PC = PC + 2;
      }
      break;
    case 0x0005:
      if (vReg[(opcode & 0x0F00) >> 8] === vReg[(opcode & 0x00F0) >> 4]) {
        PC = PC + 2;
      }
      break;
    case 0x0009:
      if (vReg[(opcode & 0x0F00) >> 8] != vReg[(opcode & 0x00F0) >> 4]) {
        PC = PC + 2;
      }
      break;
    case 0x0006:
      vReg[(opcode & 0x0F00) >> 8] = opcode & 0x00FF;
      console.log(`${vReg[(opcode & 0x0F00) >> 8]} set to ${opcode & 0x00FF}`);
      break;
    case 0x0007:
      vReg[(opcode & 0x0F00) >> 8] += opcode & 0x00FF;
      console.log(`added ${opcode & 0x00FF} to ${vReg[(opcode & 0x0F00) >> 8]}`);
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
          vReg[(opcode & 0x0F00) >> 8] = vReg[(opcode & 0x0F00) >> 8] + vReg[(opcode & 0x00F0) >> 4];
          if (vReg[(opcode & 0x0F00) >> 8] > 255) {
            vReg[0xF] = 1;
          } else {
            vReg[0xF] = 0;
          }
          break;
        case 0x0005:
          if (vReg[(opcode & 0x0F00) >> 8] > vReg[(opcode & 0x00F0) >> 4]) {
            vReg[0xF] = 1;
          } else {
            vReg[0xF] = 0;
          }
          vReg[(opcode & 0x0F00) >> 8] = vReg[(opcode & 0x0F00) >> 8] - vReg[(opcode & 0x00F0) >> 4];
          break;
        case 0x0006:
          vReg[(opcode & 0x0F00) >> 8] = vReg[(opcode & 0x00F0) >> 4];
          vReg[(opcode & 0x0F00) >> 8] > 1;
          break;
        case 0x0007:
          if (vReg[(opcode & 0x00F0) >> 4] > vReg[(opcode & 0x0F00) >> 8]) {
            vReg[0xF] = 1;
          } else {
            vReg[0xF] = 0;
          }
          vReg[(opcode & 0x0F00) >> 8] = vReg[(opcode & 0x00F0) >> 4] - vReg[(opcode & 0x0F00) >> 8];
          break;
        case 0x000E:
          vReg[(opcode & 0x0F00) >> 8] = vReg[(opcode & 0x00F0) >> 4];
          vReg[(opcode & 0x0F00) >> 8] < 1;
          break;
      }
    case 0x000A:
      I = opcode & 0x0FFF;
      console.log("set I to ", I);
      break;
    case 0x000B:
      /* IMPLEMENT THIS */
      break;
    case 0x000C:
      let randint = Math.floor(Math.random() * (opcode & 0x00FF));
      randint = randint & (opcode & 0x00FF);
      vReg[(opcode & 0x0F00) >> 8] = randint;
      break;
  }
};
