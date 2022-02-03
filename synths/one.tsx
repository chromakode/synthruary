import React from "react";
import styles from "../styles/Home.module.css";
import { Synth, getAudioContext, connect, SynthBox } from "./base";

class OneSynth implements Synth {
  ATTACK = 0.01;
  HOLD = 0.05;
  RELEASE = 0.005;
  GAIN = 0.35;

  ctx: AudioContext;
  noteInterval: number = 1;
  freq: number = 200;
  filter: BiquadFilterNode;
  queuedNote: number | null = null;
  lastNoteEnd: number | null = null;
  cancelNote: () => void = () => {};

  constructor() {
    this.ctx = getAudioContext();
    this.filter = this.ctx.createBiquadFilter();
    connect(this.filter, this.ctx.destination);
  }

  start(x: number, y: number) {
    this.update(x, y);
  }

  note(time: number, onEnd: () => void) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = this.freq;
    osc?.start(time);
    osc?.stop(time + this.ATTACK + this.HOLD + this.RELEASE);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(this.GAIN, time + this.ATTACK);
    gain.gain.setValueAtTime(this.GAIN, time + this.ATTACK + this.HOLD);
    gain.gain.linearRampToValueAtTime(
      0,
      time + this.ATTACK + this.HOLD + this.RELEASE
    );
    connect(osc, gain, this.filter);
    osc.addEventListener("ended", onEnd);
    this.queuedNote = time;
    this.cancelNote = () => {
      osc.removeEventListener("ended", onEnd);
      osc.disconnect();
      gain.disconnect();
      this.queuedNote = null;
    };
  }

  queueNote() {
    this.note(
      this.lastNoteEnd === null
        ? this.ctx.currentTime
        : this.lastNoteEnd + this.noteInterval,
      () => {
        this.lastNoteEnd = this.ctx.currentTime;
        this.queueNote();
      }
    );
  }

  update(x: number, y: number) {
    if (this.queuedNote !== null && this.queuedNote > this.ctx.currentTime) {
      this.cancelNote();
      this.queueNote();
    }
    this.freq = 20 + 600 * (1 - x);
    this.noteInterval = 0.25 / Math.pow(50, x);
    this.filter.frequency.value = 400 + 400 * y;
    this.filter.Q.value = 18 * y;
    if (this.queuedNote === null) {
      this.queueNote();
    }
  }

  end() {
    this.cancelNote();
    this.lastNoteEnd = null;
  }
}

export function One() {
  return <SynthBox className={styles.canvas} synth={OneSynth} />;
}
