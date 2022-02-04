import React, { useCallback } from "react";
import styles from "../styles/Home.module.css";
import { Synth, getAudioContext, connect, SynthBox } from "./base";
import Freeverb from "freeverb";
import seedrandom from "seedrandom";

class ThreeSynth implements Synth {
  TIMES = [
    0.23, 1.54, 3.5, 5.45, 6.62, 8.2, 8.8, 9.55, 10.7, 11.6, 11.85, 12.63, 13.2,
    14.2, 15.8, 18.7, 20.2, 21.7, 23.5, 24.25, 28, 29.05, 30, 32.5, 35.9, 36.4,
    37.8, 40.4, 41.75, 43.35, 46.5, 48,
  ];

  ctx: AudioContext;
  video: HTMLVideoElement;
  mediaNode: MediaElementAudioSourceNode;
  reverb: Freeverb;
  filter: BiquadFilterNode;
  timeout: number | undefined;
  delay: number = 150;
  beat: number[] = [0];
  idx: number = -1;

  constructor({ el }: { el: HTMLElement }) {
    this.ctx = getAudioContext();
    this.video = el.getElementsByTagName("video")[0];
    this.video.preload = "auto";
    this.video.loop = true;
    this.video.load();
    this.mediaNode = this.ctx.createMediaElementSource(this.video);
    this.reverb = Freeverb(this.ctx);
    this.filter = this.ctx.createBiquadFilter();
    connect(this.mediaNode, this.reverb, this.filter, this.ctx.destination);
  }

  pulse = () => {
    if (this.beat.length === 0) {
      return;
    }
    this.idx = (this.idx + 1) % this.beat.length;
    this.video.currentTime = this.TIMES[this.beat[this.idx]];
    this.video.play();
    this.timeout = window.setTimeout(this.pulse, this.delay);
  };

  start(x: number, y: number) {
    this.video.style.opacity = "1";
    this.pulse();
    this.update(x, y);
  }

  update(x: number, y: number) {
    this.reverb.roomSize = 0.95 * y;
    this.reverb.dampening = 1500 * x;
    this.reverb.wet.value = Math.sin(Math.PI * 1.05 * y);
    this.reverb.dry.value = 1 - this.reverb.wet.value;
    this.filter.frequency.value = 20000 - 19000 * x;
    this.video.style.filter = `blur(${y > 0.75 ? 50 * (y - 0.75) * 4 : x}px)`;
    this.video.style.transform = `scale(${Math.max(100, 120 * y)}%)`;
    this.delay = 500 - 450 * y;

    const rng = seedrandom(`
      ${Math.round(50 * x) / 50}
      ${Math.round(50 * y) / 50}
    `);
    this.beat = [];
    if (x === 0 && y === 0) {
      return;
    }
    const n = this.TIMES.length;
    for (let i = 1; i <= Math.round(31 * y) + 1; i++) {
      this.beat.push(((rng.int32() % n) + n) % n);
    }
  }

  end() {
    this.video.pause();
    this.video.style.opacity = "0";
    window.clearTimeout(this.timeout);
  }
}

export function Three() {
  const handlePreventDefault = useCallback(
    (ev: React.MouseEvent | React.TouchEvent) => {
      ev.preventDefault();
    },
    []
  );
  return (
    <SynthBox className={styles.canvas} synth={ThreeSynth}>
      <video
        src="/concrete.mp4"
        className={styles.video}
        onContextMenu={handlePreventDefault}
      />
    </SynthBox>
  );
}
