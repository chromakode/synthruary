import React from "react";
import styles from "../styles/Home.module.css";
import {
  Synth,
  getAudioContext,
  connect,
  SynthBox,
  loadBuffers,
  posmod,
} from "./base";
import seedrandom from "seedrandom";
import { clamp, range } from "lodash";

class NineSynth implements Synth {
  FREQ = 440;
  GAIN = 0.55;
  SCHEDULE_DURATION = 0.05;
  BEAT_LENGTH = 8;
  RECURSE_FACTOR: number = 5;

  ctx: AudioContext;
  noteInterval: number = 0.05;
  samples: AudioBuffer[] = [];
  transportTimeout: number | undefined;
  transport2Timeout: number | undefined;
  transportGain: GainNode;
  beat: number[] = [];

  constructor() {
    this.ctx = getAudioContext();
    this.transportGain = this.ctx.createGain();
  }

  async load() {
    this.samples = await loadBuffers(
      ...range(1, 6).map((i) => `/drum/drum${i}.wav`)
    );
  }

  schedule(
    timeFactor: number,
    dest: AudioNode | AudioParam,
    time: number,
    noteNum: number = 0
  ) {
    const now = this.ctx.currentTime;
    const transportEnd = now + 2 * this.SCHEDULE_DURATION;
    const interval = this.noteInterval * timeFactor;

    while (time < transportEnd) {
      const note = this.beat[noteNum % this.BEAT_LENGTH];
      if (note) {
        const node = this.ctx.createBufferSource();
        node.buffer = this.samples[note - 1];
        node.start(time);

        // FIXME: TypeScript doesn't accept the union type of dest for the overloads of node.connect
        if (dest instanceof AudioNode) {
          node.connect(dest);
        } else {
          node.connect(dest);
        }
      }
      time += interval;
      noteNum++;
    }

    return window.setTimeout(() => {
      this.schedule(timeFactor, dest, time, noteNum);
    }, 1000 * this.SCHEDULE_DURATION);
  }

  start(x: number, y: number) {
    this.transportGain = this.ctx.createGain();
    connect(this.transportGain, this.ctx.destination);
    this.update(x, y);
    this.transportTimeout = this.schedule(
      1,
      this.transportGain,
      this.ctx.currentTime
    );
    this.transport2Timeout = this.schedule(
      this.RECURSE_FACTOR,
      this.transportGain.gain,
      this.ctx.currentTime
    );
  }

  update(x: number, y: number) {
    this.noteInterval = 1 / (7 + 40 * y);

    // Blend for gain envelopes of 2nd order rhythm
    this.transportGain.gain.value = 1 - y;

    const rng = seedrandom(`${Math.round(4 * x)}`);
    this.beat = [];
    for (let i = 0; i < this.BEAT_LENGTH; i++) {
      this.beat.push(
        rng.int32() > 0.5 ? 0 : posmod(rng.int32(), this.samples.length + 1)
      );
    }
  }

  end() {
    this.transportGain?.disconnect();
    clearTimeout(this.transportTimeout);
    clearTimeout(this.transport2Timeout);
  }
}

export function Nine() {
  return <SynthBox className={styles.canvas} synth={NineSynth} />;
}
