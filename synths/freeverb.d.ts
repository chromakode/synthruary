declare module "freeverb" {
  interface Freeverb extends AudioNode {
    roomSize: number;
    dampening: number;
    wet: AudioParam;
    dry: AudioParam;
  }

  function Freeverb(ctx: AudioContext): Freeverb;

  export = Freeverb;
}
