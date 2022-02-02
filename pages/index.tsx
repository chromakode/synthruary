import type { NextPage } from "next";
import Head from "next/head";
import React, { useCallback, useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { clamp } from "lodash";
import styles from "../styles/Home.module.css";

let _ctx: AudioContext | undefined;
function getAudioContext(): AudioContext {
  if (!_ctx) {
    _ctx = new AudioContext();
  }
  return _ctx;
}

function connect(...nodes: AudioNode[]) {
  let lastNode: AudioNode | undefined;
  for (const node of nodes) {
    if (lastNode) {
      lastNode.connect(node);
    }
    lastNode = node;
  }
}

interface Synth {
  start(x: number, y: number): void;
  update(x: number, y: number): void;
  end(): void;
}

function posMouse(
  ev: React.MouseEvent<HTMLElement>,
  el: HTMLElement
): [number, number] {
  const box = el.getBoundingClientRect();
  const x = clamp((ev.clientX - box.left) / box.width, 0, 1);
  const y = clamp((ev.clientY - box.top) / box.height, 0, 1);
  return [x, y];
}

function posTouch(ev: React.TouchEvent<HTMLElement>): [number, number] {
  const box = ev.currentTarget.getBoundingClientRect();
  const x = clamp((ev.touches[0].clientX - box.left) / box.width, 0, 1);
  const y = clamp((ev.touches[0].clientY - box.top) / box.height, 0, 1);
  return [x, y];
}

function SynthBox<S extends Synth>({
  className,
  synth: SynthClass,
}: {
  className: string;
  synth: { new (): S };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isActive, setActive] = useState(false);
  const synth = useRef<S>();

  const handleMouseDown = useCallback((ev) => {
    if (!synth.current) {
      synth.current = new SynthClass();
    }
    synth.current.start(...posMouse(ev, ref.current!));
    setActive(true);
  }, []);
  const handleMouseMove = useCallback(
    (ev) => {
      synth.current?.update(...posMouse(ev, ref.current!));
    },
    [isActive]
  );
  const handleMouseUp = useCallback((ev) => {
    synth.current?.end();
    setActive(false);
  }, []);

  const handleTouchStart = useCallback((ev) => {
    if (!synth.current) {
      synth.current = new SynthClass();
    }
    synth.current.start(...posTouch(ev));
    setActive(true);
  }, []);
  const handleTouchMove = useCallback(
    (ev) => {
      if (isActive) {
        synth.current?.update(...posTouch(ev));
      }
    },
    [isActive]
  );
  const handleTouchEnd = useCallback(
    (ev) => {
      if (isActive) {
        synth.current?.end();
        setActive(false);
      }
    },
    [isActive]
  );

  useEffect(() => {
    if (isActive) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isActive]);

  return (
    <div
      ref={ref}
      className={classNames(className, { [styles.active]: isActive })}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    ></div>
  );
}

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

function One() {
  return <SynthBox className={styles.canvas} synth={OneSynth} />;
}

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>synthruary</title>
        <meta name="description" content="chromakode's synthruary" />
        <link rel="icon" href="/favicon.png" />
      </Head>

      <main className={styles.main}>
        <h1>
          <a
            href="https://twitter.com/search?q=%23synthruary"
            target="_blank"
            rel="noreferrer"
          >
            #synthruary
          </a>
        </h1>

        <a href="#1">
          <h2 id="1">1. minimalism</h2>
        </a>
        <One />
      </main>
    </div>
  );
};

export default Home;
