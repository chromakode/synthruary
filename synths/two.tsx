import React from "react";
import styles from "../styles/Home.module.css";
import { Synth, getAudioContext, connect, SynthBox } from "./base";

class TwoSynth implements Synth {
  ATTACK = 0.01;
  RELEASE = 1;
  GAIN = 0.1;

  ctx: AudioContext;
  noteInterval: number = 1;
  freq: number = 200;
  bend: number = 200;
  filter: BiquadFilterNode;
  index: number = 0;
  count: number = 1;
  width: number = 1 / 3;
  queuedNote: number | null = null;
  lastNoteEnd: number | null = null;
  oscs: Set<() => void> = new Set();
  cancelNote: (stop? : boolean) => void = () => {};

  constructor() {
    this.ctx = getAudioContext();
    this.filter = this.ctx.createBiquadFilter();
    connect(this.filter, this.ctx.destination);
    this.filter.frequency.value = 8000;
  }

  start(x: number, y: number) {
    this.update(x, y);
  }

  note(time: number, onEnd: () => void) {
    const endTime = time + this.ATTACK + this.noteInterval;
    const createOsc = (factor: number, type: OscillatorType) => {
      const { width, index, freq } = this;
      const updateFreq = () => {
        osc.frequency.value = factor * (freq + this.bend) * (1 + width * index);
      };
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      updateFreq();
      osc?.start(time);
      osc?.stop(endTime + this.RELEASE);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(this.GAIN, time + this.ATTACK);
      gain.gain.setValueAtTime(
        this.GAIN,
        time + this.ATTACK + this.noteInterval
      );
      gain.gain.linearRampToValueAtTime(0, endTime + this.RELEASE);
      connect(osc, gain, this.filter);
      this.oscs.add(updateFreq);
      osc.addEventListener("ended", () => {
        this.oscs.delete(updateFreq);
      });
      return osc;
    };
    const osc = createOsc(1, "square");
    const osc2 = createOsc(1.01, "square");
    const osc3 = createOsc(1 / 2, "square");
    const timeout = setTimeout(onEnd, 1000 * (endTime - this.ctx.currentTime));
    this.queuedNote = time;
    this.cancelNote = (stop = true) => {
      clearTimeout(timeout);
      if (stop) {
        osc.disconnect();
        osc2.disconnect();
        osc3.disconnect();
      }
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
        this.index = (this.index + 1) % this.count;
        this.queueNote();
      }
    );
  }

  update(x: number, y: number) {
    if (this.queuedNote !== null && this.queuedNote > this.ctx.currentTime) {
      this.cancelNote();
      this.queueNote();
    }
    this.freq = 20 + 110 * x;
    this.bend = 110 * y;
    this.oscs.forEach((updateFreq) => updateFreq());
    this.count = 1 + Math.round(9 * y);
    this.width = 1;
    this.noteInterval = 0.06 / Math.pow(5, x);
    this.filter.frequency.value = 440 + 20000 * x;
    if (this.queuedNote === null) {
      this.queueNote();
    }
  }

  end() {
    this.cancelNote(false);
    this.lastNoteEnd = null;
  }
}

export function Two() {
  return <SynthBox className={styles.canvas} synth={TwoSynth} />;
}
