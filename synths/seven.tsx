import React, { useLayoutEffect, useRef, useState } from "react";
import styles from "../styles/Home.module.css";
import { Synth, getAudioContext, SynthBox, connect } from "./base";
import Freeverb from "freeverb";

interface State {
  pan?: number;
}

class SevenSynth implements Synth {
  GAIN = 1;
  DURATION = 0.0025;

  ctx: AudioContext;
  filter: BiquadFilterNode;
  filter2: BiquadFilterNode;
  wsn: WaveShaperNode;
  reverb: Freeverb;
  timeout: number | undefined;
  interval: number = 30;

  updateState?: (state: State) => void;

  constructor({ updateState }: { updateState?: (state: State) => void }) {
    this.updateState = updateState;

    this.ctx = getAudioContext();
    this.reverb = Freeverb(this.ctx);
    this.reverb.dampening = 20000;
    this.reverb.dry.value = 0;
    this.reverb.wet.value = 0.1;
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "notch";
    this.filter.frequency.value = 500;
    this.filter.Q.value = 0.5;
    this.filter2 = this.ctx.createBiquadFilter();
    this.filter2.type = "notch";
    this.filter2.Q.value = 0.1;
    this.wsn = this.ctx.createWaveShaper();
    this.wsn.oversample = "4x";
    const n = 256;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let x = (2 * i) / n - 1;
      curve[i] = x * Math.random();
    }
    this.wsn.curve = curve;
    connect(this.wsn, this.filter, this.ctx.destination);
    connect(this.wsn, this.reverb, this.filter2, this.ctx.destination);
  }

  drop() {
    const osc = this.ctx.createOscillator();
    osc.frequency.value = 200 + Math.random() * 5000;
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 500 + 2000 * Math.random();
    filter.Q.value = 5;
    const pan = this.ctx.createStereoPanner();
    pan.pan.value = -0.5 + Math.random();

    osc.start();
    const duration = this.DURATION * Math.random();
    gain.gain.linearRampToValueAtTime(
      this.GAIN * (1 - Math.pow(Math.random(), 2)),
      (this.ctx.currentTime * duration) / 4
    );
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
    osc.stop(this.ctx.currentTime + duration);

    connect(osc, gain, filter, pan, this.wsn);
    this.updateState?.({ pan: pan.pan.value });
  }

  queueDrop = () => {
    this.drop();
    this.timeout = window.setTimeout(
      this.queueDrop,
      Math.random() * this.interval
    );
    this.filter2.frequency.value = 500 + 100 * Math.random();
  };

  start(x: number, y: number) {
    this.update(x, y);
    this.queueDrop();
  }

  update(x: number, y: number) {
    this.interval = 10 + 30 * (1 - x);
    this.reverb.roomSize = 0.9 + 0.099 * (1 - Math.pow(1 - y, 3));
  }

  end() {
    this.reverb.roomSize = 0.8;
    window.clearTimeout(this.timeout);
  }
}

export function Seven() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<State>({});
  useLayoutEffect(() => {
    if (state.pan === undefined) {
      return;
    }
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) {
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
    ctx.beginPath();
    ctx.arc(w / 2 + state.pan * w, Math.random() * h, 2, 0, 2 * Math.PI);
    ctx.fillStyle = "white";
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.5;
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.globalCompositeOperation = "xor";
    ctx.globalAlpha = 0.01;
    ctx.fillRect(0, 0, w, h);
  }, [state]);
  return (
    <SynthBox
      className={styles.canvas}
      synth={SevenSynth}
      updateState={setState}
    >
      <canvas ref={canvas} />
    </SynthBox>
  );
}
