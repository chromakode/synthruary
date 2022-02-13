export function processWaveFolder(inputs, outputs) {
  const input = inputs[0][0];
  if (!input) {
    return;
  }
  const output = outputs[0][0];
  for (let i = 0; i < output.length; i++) {
    const inVal = input[i];
    const wraps = Math.trunc((inVal + Math.sign(inVal)) / 2);
    const val = wraps % 2 ? -(inVal - 2 * wraps) : inVal - 2 * wraps;
    output[i] = val;
  }
  return;
}

if (typeof AudioWorkletProcessor !== "undefined") {
  class WaveFolderProcessor extends AudioWorkletProcessor {
    process(inputs, outputs) {
      processWaveFolder(inputs, outputs);
      return true;
    }
  }

  registerProcessor("wave-folder", WaveFolderProcessor);
}
