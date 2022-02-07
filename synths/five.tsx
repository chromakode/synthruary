import Freeverb from "freeverb";
import { random, range, runInContext, sample, throttle } from "lodash";
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "../styles/Home.module.css";
import { Synth, getAudioContext, connect, SynthBox, loadBuffers } from "./base";

// https://github.com/NAalytics/Assemblies-of-putative-SARS-CoV2-spike-encoding-mRNA-sequences-for-vaccines-BNT-162b2-and-mRNA-1273/raw/21fac9b29bb8a69c1a82a8f322bb11124d65cd0b/Assemblies%20of%20putative%20SARS-CoV2-spike-encoding%20mRNA%20sequences%20for%20vaccines%20BNT-162b2%20and%20mRNA-1273.docx.pdf
const BASE_PAIRS = `
GGGAAATAAGAGAGAAAAGAAGAGTAAGAAGAAATATAAGACCCCGGCGCCGCCACCATGTTCGTGTTCCTGGTGCTGCTGCCCCTGGTGA
GCAGCCAGTGCGTGAACCTGACCACCCGGACCCAGCTGCCACCAGCCTACACCAACAGCTTCACCCGGGGCGTCTACTACCCCGACAAGGT
GTTCCGGAGCAGCGTCCTGCACAGCACCCAGGACCTGTTCCTGCCCTTCTTCAGCAACGTGACCTGGTTCCACGCCATCCACGTGAGCGGC
ACCAACGGCACCAAGCGGTTCGACAACCCCGTGCTGCCCTTCAACGACGGCGTGTACTTCGCCAGCACCGAGAAGAGCAACATCATCCGGG
GCTGGATCTTCGGCACCACCCTGGACAGCAAGACCCAGAGCCTGCTGATCGTGAATAACGCCACCAACGTGGTGATCAAGGTGTGCGAGTT
CCAGTTCTGCAACGACCCCTTCCTGGGCGTGTACTACCACAAGAACAACAAGAGCTGGATGGAGAGCGAGTTCCGGGTGTACAGCAGCGCC
AACAACTGCACCTTCGAGTACGTGAGCCAGCCCTTCCTGATGGACCTGGAGGGCAAGCAGGGCAACTTCAAGAACCTGCGGGAGTTCGTGT
TCAAGAACATCGACGGCTACTTCAAGATCTACAGCAAGCACACCCCAATCAACCTGGTGCGGGATCTGCCCCAGGGCTTCTCAGCCCTGGA
GCCCCTGGTGGACCTGCCCATCGGCATCAACATCACCCGGTTCCAGACCCTGCTGGCCCTGCACCGGAGCTACCTGACCCCAGGCGACAGC
AGCAGCGGGTGGACAGCAGGCGCGGCTGCTTACTACGTGGGCTACCTGCAGCCCCGGACCTTCCTGCTGAAGTACAACGAGAACGGCACCA
TCACCGACGCCGTGGACTGCGCCCTGGACCCTCTGAGCGAGACCAAGTGCACCCTGAAGAGCTTCACCGTGGAGAAGGGCATCTACCAGAC
CAGCAACTTCCGGGTGCAGCCCACCGAGAGCATCGTGCGGTTCCCCAACATCACCAACCTGTGCCCCTTCGGCGAGGTGTTCAACGCCACC
CGGTTCGCCAGCGTGTACGCCTGGAACCGGAAGCGGATCAGCAACTGCGTGGCCGACTACAGCGTGCTGTACAACAGCGCCAGCTTCAGCA
CCTTCAAGTGCTACGGCGTGAGCCCCACCAAGCTGAACGACCTGTGCTTCACCAACGTGTACGCCGACAGCTTCGTGATCCGTGGCGACGA
GGTGCGGCAGATCGCACCCGGCCAGACAGGCAAGATCGCCGACTACAACTACAAGCTGCCCGACGACTTCACCGGCTGCGTGATCGCCTGG
AACAGCAACAACCTCGACAGCAAGGTGGGCGGCAACTACAACTACCTGTACCGGCTGTTCCGGAAGAGCAACCTGAAGCCCTTCGAGCGGG
ACATCAGCACCGAGATCTACCAAGCCGGCTCCACCCCTTGCAACGGCGTGGAGGGCTTCAACTGCTACTTCCCTCTGCAGAGCTACGGCTT
CCAGCCCACCAACGGCGTGGGCTACCAGCCCTACCGGGTGGTGGTGCTGAGCTTCGAGCTGCTGCACGCCCCAGCCACCGTGTGTGGCCCC
AAGAAGAGCACCAACCTGGTGAAGAACAAGTGCGTGAACTTCAACTTCAACGGCCTTACCGGCACCGGCGTGCTGACCGAGAGCAACAAGA
AATTCCTGCCCTTTCAGCAGTTCGGCCGGGACATCGCCGACACCACCGACGCTGTGCGGGATCCCCAGACCCTGGAGATCCTGGACATCAC
CCCTTGCAGCTTCGGCGGCGTGAGCGTGATCACCCCAGGCACCAACACCAGCAACCAGGTGGCCGTGCTGTACCAGGACGTGAACTGCACC
GAGGTGCCCGTGGCCATCCACGCCGACCAGCTGACACCCACCTGGCGGGTCTACAGCACCGGCAGCAACGTGTTCCAGACCCGGGCCGGTT
GCCTGATCGGCGCCGAGCACGTGAACAACAGCTACGAGTGCGACATCCCCATCGGCGCCGGCATCTGTGCCAGCTACCAGACCCAGACCAA
TTCACCCCGGAGGGCAAGGAGCGTGGCCAGCCAGAGCATCATCGCCTACACCATGAGCCTGGGCGCCGAGAACAGCGTGGCCTACAGCAAC
AACAGCATCGCCATCCCCACCAACTTCACCATCAGCGTGACCACCGAGATTCTGCCCGTGAGCATGACCAAGACCAGCGTGGACTGCACCA
TGTACATCTGCGGCGACAGCACCGAGTGCAGCAACCTGCTGCTGCAGTACGGCAGCTTCTGCACCCAGCTGAACCGGGCCCTGACCGGCAT
CGCCGTGGAGCAGGACAAGAACACCCAGGAGGTGTTCGCCCAGGTGAAGCAGATCTACAAGACCCCTCCCATCAAGGACTTCGGCGGCTTC
AACTTCAGCCAGATCCTGCCCGACCCCAGCAAGCCCAGCAAGCGGAGCTTCATCGAGGACCTGCTGTTCAACAAGGTGACCCTAGCCGACG
CCGGCTTCATCAAGCAGTACGGCGACTGCCTCGGCGACATAGCCGCCCGGGACCTGATCTGCGCCCAGAAGTTCAACGGCCTGACCGTGCT
GCCTCCCCTGCTGACCGACGAGATGATCGCCCAGTACACCAGCGCCCTGTTAGCCGGAACCATCACCAGCGGCTGGACTTTCGGCGCTGGA
GCCGCTCTGCAGATCCCCTTCGCCATGCAGATGGCCTACCGGTTCAACGGCATCGGCGTGACCCAGAACGTGCTGTACGAGAACCAGAAGC
TGATCGCCAACCAGTTCAACAGCGCCATCGGCAAGATCCAGGACAGCCTGAGCAGCACCGCTAGCGCCCTGGGCAAGCTGCAGGACGTGGT
GAACCAGAACGCCCAGGCCCTGAACACCCTGGTGAAGCAGCTGAGCAGCAACTTCGGCGCCATCAGCAGCGTGCTGAACGACATCCTGAGC
CGGCTGGACCCTCCCGAGGCCGAGGTGCAGATCGACCGGCTGATCACTGGCCGGCTGCAGAGCCTGCAGACCTACGTGACCCAGCAGCTGA
TCCGGGCCGCCGAGATTCGGGCCAGCGCCAACCTGGCCGCCACCAAGATGAGCGAGTGCGTGCTGGGCCAGAGCAAGCGGGTGGACTTCTG
CGGCAAGGGCTACCACCTGATGAGCTTTCCCCAGAGCGCACCCCACGGAGTGGTGTTCCTGCACGTGACCTACGTGCCCGCCCAGGAGAAG
AACTTCACCACCGCCCCAGCCATCTGCCACGACGGCAAGGCCCACTTTCCCCGGGAGGGCGTGTTCGTGAGCAACGGCACCCACTGGTTCG
TGACCCAGCGGAACTTCTACGAGCCCCAGATCATCACCACCGACAACACCTTCGTGAGCGGCAACTGCGACGTGGTGATCGGCATCGTGAA
CAACACCGTGTACGATCCCCTGCAGCCCGAGCTGGACAGCTTCAAGGAGGAGCTGGACAAGTACTTCAAGAATCACACCAGCCCCGACGTG
GACCTGGGCGACATCAGCGGCATCAACGCCAGCGTGGTGAACATCCAGAAGGAGATCGATCGGCTGAACGAGGTGGCCAAGAACCTGAACG
AGAGCCTGATCGACCTGCAGGAGCTGGGCAAGTACGAGCAGTACATCAAGTGGCCCTGGTACATCTGGCTGGGCTTCATCGCCGGCCTGAT
CGCCATCGTGATGGTGACCATCATGCTGTGCTGCATGACCAGCTGCTGCAGCTGCCTGAAGGGCTGTTGCAGCTGCGGCAGCTGCTGCAAG
TTCGACGAGGACGACAGCGAGCCCGTGCTGAAGGGCGTGAAGCTGCACTACACCTGATAATAGGCTGGAGCCTCGGTGGCCTAGCTTCTTG
CCCCTTGGGCCTCCCCCCAGCCCCTCCTCCCCTTCCTGCACCCGTACCCCCGTGGTCTTTGAATAAAGTCTGAGTGGGCGGCAAAAAAAAA
`
  .replace(/[^ATGC]/g, "")
  .replace(/T/g, "D");

const COLORS = ["red", "green", "blue", "purple", "orange"];

interface Run {
  voice: number;
  interval: number;
  pan: number;
  idx: number;
  delay: number;
  nextTime: number;
  timeout: number | undefined;
}

interface State {
  data: string;
  runs: Run[];
  duration: number;
}

class FiveSynth implements Synth {
  QUANTIZE_DELAY = 4 as const;
  JITTER = 0.005 as const;

  ctx: AudioContext;
  reverb: Freeverb;
  buffers: Record<string, AudioBuffer[]> = { a: [], d: [], g: [], c: [] };
  nextVoice: number = 0;
  hold: number = 0.1;
  attack: number = 0.1;
  release: number = 0.75;
  interval: number = 1;
  gain: number = 0.1;
  runs: Run[] = [];
  queuedUpdate: number | null = null;

  updateState?: (state: State) => void;

  constructor({ updateState }: { updateState?: (state: State) => void }) {
    this.updateState = updateState;
    this.ctx = getAudioContext();
    this.reverb = Freeverb(this.ctx);
    this.reverb.roomSize = 0.95;
    this.reverb.dampening = 5000;
    this.reverb.wet.value = 0.125;
    connect(this.reverb, this.ctx.destination);
  }

  async load() {
    const [a, d, g, c] = await Promise.all(
      ["a", "d", "g", "c"].map((n) =>
        loadBuffers(...range(1, 6).map((v) => `/adgc/${n}${v}.wav`))
      )
    );
    this.buffers = { a, d, g, c };
    this.nextVoice = random(a.length);
  }

  queueUpdate() {
    if (this.queuedUpdate !== null) {
      return;
    }
    this.queuedUpdate = requestAnimationFrame(() => {
      this.queuedUpdate = null;
      this.updateState?.({
        data: BASE_PAIRS,
        runs: this.runs,
        duration: this.attack + this.hold + this.release,
      });
    });
  }

  note(time: number, note: string, voice: number, pan: number) {
    if (!(note in this.buffers)) {
      throw new Error(`Unknown note '${note}'`);
    }
    const node = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    const panNode = this.ctx.createStereoPanner();
    node.buffer = this.buffers[note][voice]!;
    node.start(time);
    const endTime = time + this.attack + this.hold + this.release;
    node.stop(endTime);
    gain.gain.setValueAtTime(0, time);
    gain.gain.setValueAtTime(0, time + 0.05); // Prevent click at start of sample
    gain.gain.linearRampToValueAtTime(this.gain, time + this.attack);
    gain.gain.setValueAtTime(this.gain, time + this.attack + this.hold);
    gain.gain.linearRampToValueAtTime(0, endTime);
    panNode.pan.value = pan;
    connect(node, gain, panNode, this.reverb);
    this.queueUpdate();
  }

  queueRun(run: Run) {
    const nextTime =
      run.nextTime + run.delay * this.interval + Math.random() * this.JITTER;
    run.timeout = window.setTimeout(() => {
      run.idx = (run.idx + 1) % BASE_PAIRS.length;
      const nextNote = BASE_PAIRS[run.idx].toLowerCase();
      this.note(nextTime, nextNote, run.voice, run.pan);
      run.nextTime += this.interval * run.interval;
      this.queueRun(run);
    }, 1000 * (nextTime - this.ctx.currentTime) - 100);
  }

  start(x: number, y: number) {
    this.update(x, y);
    this.nextVoice = (this.nextVoice + 1) % this.buffers.a.length;

    this.runs.push({
      voice: this.nextVoice,
      pan: -0.5 + Math.random(),
      interval: sample([1 / 2, 2 / 3])!,
      idx: random(BASE_PAIRS.length - 1),
      nextTime: 0,
      delay: 0,
      timeout: undefined,
    });

    const now = this.ctx.currentTime;
    for (const run of this.runs) {
      run.nextTime = now + 0.05;
      this.queueRun(run);
    }
  }

  update(x: number, y: number) {
    this.attack = 0.15 + 0.1 * x;
    this.hold = 0.2 * 0.2 * x;
    this.release = 0.1 + 0.5 * x;
    this.interval = 0.35 + (1 - y);
    // Slowly ramp down individual voice volume with mass, keeping some build as voices are added
    this.gain = 0.18 / (0.5 + 0.5 * Math.sqrt(this.runs.length + 1));
    this.queueUpdate();
  }

  end() {
    const now = this.ctx.currentTime;
    for (const run of this.runs) {
      window.clearTimeout(run.timeout);
      const delay = Math.max(0, run.nextTime + run.delay * this.interval - now);
      run.delay =
        (Math.floor(this.QUANTIZE_DELAY * delay) % this.QUANTIZE_DELAY) /
        this.QUANTIZE_DELAY;
      run.timeout = undefined;
    }
    this.queueUpdate();
  }
}

export function Five() {
  const [state, setState] = useState<State | null>(null);
  const pairsRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!state || !pairsRef.current) {
      return;
    }
    const COLS = 79;
    const ROWS = Math.ceil(state.data.length / COLS);
    if (pairsRef.current.childElementCount === 0) {
      for (let i = 0; i < state.data.length; i++) {
        const l = state.data[i];
        const spanEl = document.createElement("span");
        spanEl.innerText = l;
        spanEl.className = styles.basePair;
        spanEl.style.left = `${0.5 + 99 * ((i % COLS) / COLS)}%`;
        spanEl.style.top = `${0.5 + (99 * Math.floor(i / COLS)) / ROWS}%`;
        spanEl.style.width = `${100 / COLS}%`;
        pairsRef.current?.appendChild(spanEl);
      }
    }
    const playingEls = [
      ...pairsRef.current.getElementsByClassName(styles.playing),
    ] as HTMLSpanElement[];

    const runEls = new Set<HTMLSpanElement>();

    for (const run of state.runs) {
      if (!run.timeout) {
        continue;
      }
      const el = pairsRef.current.children[run.idx] as HTMLSpanElement;
      el.style.transitionDuration = `${state.duration}s`;
      el.style.backgroundColor = COLORS[run.voice];
      el.classList.add(styles.playing);
      runEls.add(el);
    }

    for (const el of playingEls) {
      if (runEls.has(el)) {
        continue;
      }
      el.style.backgroundColor = "";
      el.className = styles.basePair;
    }
  }, [state, pairsRef.current]);
  return (
    <SynthBox
      className={styles.canvas}
      synth={FiveSynth}
      updateState={setState}
    >
      <div className={styles.basePairs} ref={pairsRef} />
    </SynthBox>
  );
}
