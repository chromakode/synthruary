import React from "react";
import styles from "../styles/Home.module.css";
import { Synth, getAudioContext, connect, SynthBox } from "./base";
import { Interval, Mode, Note } from "@tonaljs/tonal";

const modeCount = Mode.all().length;

interface State {
  modeName?: string;
}

class FourSynth implements Synth {
  ATTACK = 0.001;
  HOLD = 0.05;
  RELEASE = 1.5;
  GAIN = 0.25;
  INTERVALS = [0.15, 0.15, 0.05, 0.2];

  ctx: AudioContext;
  filter: BiquadFilterNode;
  panner: StereoPannerNode;
  bend: number = 0;
  idx: number = 0;
  modeIdx: number | undefined;
  nextModeIdx: number = 0;
  baseNote: string | undefined;
  nextBaseNote: string = "C3";
  nextTime: number = 0;
  oscs: Set<() => void> = new Set();
  timeout: number | undefined;

  updateState?: (state: State) => void;

  constructor({ updateState }: { updateState?: (state: State) => void }) {
    this.updateState = updateState;
    this.ctx = getAudioContext();
    this.filter = this.ctx.createBiquadFilter();
    this.filter.frequency.value = 1000;
    this.panner = this.ctx.createStereoPanner();
    connect(this.filter, this.panner, this.ctx.destination);
  }

  note(time: number) {
    if (this.idx === 0 || this.modeIdx === undefined) {
      this.modeIdx = this.nextModeIdx;
      this.updateState?.({ modeName: Mode.all()[this.modeIdx].name });
    }
    if (this.idx === 0 || this.baseNote === undefined) {
      this.baseNote = this.nextBaseNote;
    }

    let noteInterval = `${1 + 7 * Math.min(2, this.idx)}P`;
    if (this.idx > 0) {
      noteInterval = Interval.add(
        noteInterval,
        Mode.all()[this.modeIdx].intervals[this.idx * 2]
      )!;
    }
    const freq = Note.freq(Note.transpose(this.baseNote, noteInterval))!;
    const updateFreq = () => {
      osc.frequency.value = freq * this.bend;
    };
    this.idx = (this.idx + 1) % 4;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    updateFreq();
    osc.start(time);
    osc.stop(time + this.ATTACK + this.HOLD + this.RELEASE);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(this.GAIN, time + this.ATTACK);
    gain.gain.setValueAtTime(this.GAIN, time + this.ATTACK + this.HOLD);
    const endTime = time + this.ATTACK + this.HOLD + this.RELEASE;
    gain.gain.linearRampToValueAtTime(0, endTime);
    connect(osc, gain, this.filter);

    this.oscs.add(updateFreq);
    osc.addEventListener("ended", () => {
      this.oscs.delete(updateFreq);
    });
  }

  queueNote = () => {
    this.note(this.nextTime);
    this.nextTime += this.INTERVALS[this.idx];
    this.timeout = window.setTimeout(
      this.queueNote,
      1000 * (this.nextTime - this.ctx.currentTime) - 100
    );
  };

  start(x: number, y: number) {
    this.update(x, y);
    this.nextTime = this.ctx.currentTime;
    this.queueNote();
  }

  update(x: number, y: number) {
    this.bend = 0.95 + 0.1 * y;
    this.oscs.forEach((updateFreq) => updateFreq());

    this.nextModeIdx = Math.min(modeCount - 1, Math.floor(x * modeCount));

    const noteIdx = Math.floor(y * 5) * 3;
    const noteInterval = Interval.add(
      `${1 + Math.floor(noteIdx / 7) * 7}P`,
      Mode.all()[this.nextModeIdx].intervals[noteIdx % 7]
    )!;
    this.nextBaseNote = Note.transpose("A1", noteInterval);

    this.panner.pan.value = 0.5 * x - 0.25;
  }

  end() {
    window.clearTimeout(this.timeout);
    this.timeout = undefined;
    this.updateState?.({});
  }
}

export function Four() {
  const [state, setState] = React.useState<State>({});
  return (
    <SynthBox
      className={styles.canvas}
      synth={FourSynth}
      updateState={setState}
    >
      {state.modeName && <span className={styles.mode}>{state.modeName}</span>}
    </SynthBox>
  );
}
