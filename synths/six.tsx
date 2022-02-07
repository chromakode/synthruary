import React from "react";
import styles from "../styles/Home.module.css";
import { Synth, getAudioContext, SynthBox, connect } from "./base";

class SixSynth implements Synth {
  GAIN = 0.15;
  ATTACK = 0.01;
  RELEASE = 0.5;

  ctx: AudioContext;
  osc: OscillatorNode | undefined;
  osc2: OscillatorNode | undefined;
  wsn: WaveShaperNode | undefined;
  gain: GainNode | undefined;
  filter: BiquadFilterNode;
  curveFactor: number = 0;
  interval: number | undefined;

  constructor() {
    this.ctx = getAudioContext();
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 200;
    connect(this.filter, this.ctx.destination);
  }

  note() {
    this.osc = this.ctx.createOscillator();
    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = "sawtooth";
    this.wsn = this.ctx.createWaveShaper();
    this.wsn.oversample = "4x";
    this.gain = this.ctx.createGain();
    this.gain.gain.value = this.GAIN;
    this.updateCurve();
    connect(this.osc, this.wsn, this.gain, this.filter);
    connect(this.osc2, this.wsn, this.gain, this.filter);
    this.osc.start();
    this.osc2.start();
  }

  updateCurve = () => {
    if (!this.wsn) {
      return;
    }
    const n = 256;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let x = (2 * i) / n - 1;
      curve[i] = Math.tan(
        Math.PI *
          x *
          (0.455 +
            0.005 * Math.sin((3 * this.ctx.currentTime) / 2) +
            0.03 * this.curveFactor)
      );
    }
    this.wsn.curve = curve;
  };

  start(x: number, y: number) {
    this.note();
    this.update(x, y);
    this.interval = window.setInterval(this.updateCurve, 100);
  }

  update(a: number, b: number) {
    if (!this.osc || !this.osc2) {
      return;
    }

    this.curveFactor = b;
    const freqFactor = Math.max(0, Math.abs(0.6 - a * 1.2) - 0.1) * 2;
    this.osc.frequency.value = 34 + (65.41 - 32.7) * freqFactor * 1.05;
    this.osc2.frequency.value = this.osc.frequency.value * 10;
  }

  end() {
    window.clearInterval(this.interval);
    if (!this.osc || !this.osc2 || !this.gain) {
      return;
    }
    const now = this.ctx.currentTime;
    this.osc.stop(now + 0.5);
    this.osc2.stop(now + 0.5);
    this.gain.gain.setValueAtTime(this.GAIN, now);
    this.gain.gain.linearRampToValueAtTime(0, now + this.RELEASE);
  }
}

export function Six() {
  return <SynthBox className={styles.canvas} synth={SixSynth} />;
}
