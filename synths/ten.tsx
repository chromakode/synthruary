import React, { useLayoutEffect, useRef, useState } from "react";
import styles from "../styles/Home.module.css";
import { Synth, getAudioContext, SynthBox, connect, posmod } from "./base";
import Freeverb from "freeverb";
import seedrandom from "seedrandom";
import { Note, Scale } from "@tonaljs/tonal";

interface State {
  prompt?: string;
}

class TenSynth implements Synth {
  PHASES = [4, 7, 8];

  ctx: AudioContext;
  reverb: Freeverb;
  gain: GainNode;
  notes: number[] = [];
  timeout: number | undefined;
  curPhaseIdx: number = -1;

  updateState?: (state: State) => void;

  constructor({ updateState }: { updateState?: (state: State) => void }) {
    this.updateState = updateState;

    this.ctx = getAudioContext();
    this.reverb = Freeverb(this.ctx);
    this.reverb.roomSize = 0.98;
    this.reverb.dampening = 5000;
    this.reverb.wet.value = 0.1;
    this.gain = this.ctx.createGain();
    connect(this.reverb, this.ctx.destination);
  }

  doPhase = () => {
    const now = this.ctx.currentTime;

    this.curPhaseIdx += 1;

    if (this.curPhaseIdx > this.PHASES.length - 1) {
      return;
    }

    if (this.curPhaseIdx === 0) {
      this.updateState?.({ prompt: "breathe in" });
      for (let i = 0; i < this.PHASES[0]; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const pan = this.ctx.createStereoPanner();
        const maxGain = 0.5;
        osc.frequency.value = this.notes[i];
        osc.start(now + i);
        osc.stop(now + this.PHASES[0] + this.PHASES[1] + this.PHASES[2] + 1);
        pan.pan.value = Math.random() - 0.5;
        connect(osc, pan, gain, this.gain);

        let time = now + i;
        const targetGain = (0.2 + i * 0.04) * maxGain;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(targetGain, time + 0.01);
        gain.gain.setValueAtTime(targetGain, time + 0.5);
        gain.gain.linearRampToValueAtTime(0, time + 1.5);
        if (i === this.PHASES[0] - 1) {
          time = now + this.PHASES[0] + this.PHASES[1];
          gain.gain.setValueAtTime(0.001, time);
          gain.gain.exponentialRampToValueAtTime(0.7 * targetGain, time + 5.96);
          gain.gain.linearRampToValueAtTime(0, time + 6);
        } else {
          time =
            now + this.PHASES[0] + this.PHASES[1] + 4 + (this.PHASES[0] - i);
          gain.gain.setValueAtTime(0, time - 1.5);
          gain.gain.linearRampToValueAtTime(0.9 * targetGain, time + -0.05);
          gain.gain.linearRampToValueAtTime(0, time + 0.25);
        }
      }
    } else if (this.curPhaseIdx === 1) {
      this.updateState?.({ prompt: "(hold...)" });
    } else if (this.curPhaseIdx === 2) {
      this.updateState?.({ prompt: "breathe out" });
    }

    this.timeout = window.setTimeout(
      this.doPhase,
      this.PHASES[this.curPhaseIdx] * 1000
    );
  };

  start(x: number, y: number) {
    this.curPhaseIdx = -1;
    this.gain = this.ctx.createGain();
    connect(this.gain, this.reverb);
    this.update(x, y);
    this.doPhase();
  }

  update(x: number, y: number) {
    const rng = seedrandom(`
      ${Math.round(10 * x) / 10}
      ${Math.round(10 * y) / 10}
    `);
    const octave = rng.int32() > 0 ? 3 : 4;
    const scaleNotes = Scale.get(
      rng.int32() > 0
        ? `c${octave} minor pentatonic`
        : `f${octave} minor pentatonic`
    ).notes;
    this.notes = [];
    let idx = 0;
    for (let i = 0; i < this.PHASES[0]; i++) {
      idx = posmod(
        idx + 1 + Math.floor((rng.double() * scaleNotes.length) / 3),
        scaleNotes.length
      );
      this.notes.push(Note.freq(scaleNotes[idx])!);
    }
  }

  end() {
    const { gain } = this;
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
    clearTimeout(this.timeout);
    setTimeout(() => {
      gain.disconnect();
    }, 100);
    this.updateState?.({});
  }
}

export function Ten() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<State>({});
  useLayoutEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) {
      return;
    }
  }, [state]);
  return (
    <SynthBox className={styles.canvas} synth={TenSynth} updateState={setState}>
      {state.prompt && <span className={styles.prompt}>{state.prompt}</span>}
    </SynthBox>
  );
}
