import React, { useLayoutEffect, useRef, useState } from "react";
import styles from "../styles/Home.module.css";
import { Synth, getAudioContext, SynthBox, connect } from "./base";
import { processWaveFolder } from "../workers/waveFolder";

interface State {
  gain?: number;
}

class EightSynth implements Synth {
  ctx: AudioContext;
  osc: OscillatorNode | undefined;
  gain: GainNode;
  outGain: GainNode;
  worklet: AudioWorkletNode | undefined;

  updateState?: (state: State) => void;

  constructor({ updateState }: { updateState?: (state: State) => void }) {
    this.updateState = updateState;

    this.ctx = getAudioContext();
    this.gain = this.ctx.createGain();
    this.outGain = this.ctx.createGain();
    this.outGain.gain.value = 0.35;
    connect(this.outGain, this.ctx.destination);
  }

  async load() {
    await this.ctx.audioWorklet.addModule(
      new URL("../workers/waveFolder", import.meta.url)
    );
    this.worklet = new AudioWorkletNode(this.ctx, "wave-folder");
    connect(this.worklet, this.outGain);
  }

  start(x: number, y: number) {
    if (!this.worklet) {
      return;
    }
    this.osc = this.ctx.createOscillator();
    this.osc.frequency.value = 110;
    connect(this.osc, this.gain, this.worklet);
    this.osc.start();
    this.update(x, y);
  }

  update(x: number, y: number) {
    if (this.osc) {
      this.osc.frequency.value = 25 + x * 160;
    }
    // Use linear ramp so there's fewer audible clicks when gain instantaneously changes
    const gain = (1 - y) * 12;
    this.gain.gain.linearRampToValueAtTime(gain, this.ctx.currentTime + 0.05);
    this.updateState?.({ gain });
  }

  end() {
    this.osc?.stop();
  }
}

export function Eight() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<State>({});
  useLayoutEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx || state.gain === undefined) {
      return;
    }
    const { width, height } = ctx.canvas.getBoundingClientRect();
    const w = Math.floor(width);
    const h = Math.floor(height);
    if (ctx.canvas.width !== w) {
      ctx.canvas.width = w;
    }
    if (ctx.canvas.height !== h) {
      ctx.canvas.height = h;
    }

    const input = new Float32Array(w);
    const output = new Float32Array(w);
    for (let i = 0; i < w; i++) {
      input[i] = state.gain * Math.sin(Math.PI * ((2 * i) / w - w));
    }
    processWaveFolder([[input]], [[output]]);
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    for (let x = 0; x < w; x++) {
      const val = (1 - (output[x] + 1) / 2) * h;
      if (x === 0) {
        ctx.moveTo(x, val);
      } else {
        ctx.lineTo(x, val);
      }
    }
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [state]);
  return (
    <SynthBox
      className={styles.canvas}
      synth={EightSynth}
      updateState={setState}
    >
      <canvas ref={canvas} />
    </SynthBox>
  );
}
