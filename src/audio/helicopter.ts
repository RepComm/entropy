
import { get } from "@repcomm/exponent-ts";
import { CurveEditor } from "../components/curveeditor";
import { Renderer } from "../renderer";
import { createVertex, Curve } from "../utils/curve";

function loadAudioFile (url: string, ctx: AudioContext): Promise<AudioBuffer> {
  return new Promise(async (_resolve, _reject)=>{
    try {
      let response = await fetch(url);
      let data = await response.arrayBuffer();
      let audio = await ctx.decodeAudioData(data);
      _resolve(audio);
      return;
    } catch (ex) {
      _reject(ex);
      return;
    }
  })
}

export class AudioHelicopter {
  private noiseSource: HTMLMediaElement;
  private noiseNode: AudioBufferSourceNode;

  private rpmOscillator: OscillatorNode;
  private rpmVolumeMod: GainNode;
  private rpmVolumeOut: GainNode;

  private rpmVolumeOutCurve: Curve;
  private rpmVolumeOutCurveEditor: CurveEditor;

  private _rpm: number;
  private _bladeCount: number;
  private _maxRpm: number;

  constructor (ctx: AudioContext) {
    this.rpmVolumeOutCurve = new Curve(
      createVertex(0, 0),
      createVertex(0.5, 0),
      createVertex(1, 1)
    );

    this.rpmVolumeOutCurveEditor = new CurveEditor( this.rpmVolumeOutCurve );
    setTimeout(()=>{
      this.rpmVolumeOutCurveEditor.mount( get("ui") );
    }, 1000);

    this.bladeCount = 4;
    this.maxRpm = 50;

    //import the noise
    this.noiseNode = ctx.createBufferSource();

    loadAudioFile("./resources/rotor-noise.wav", ctx).then((audioBuffer)=>{
      this.noiseNode.buffer = audioBuffer;
      this.noiseNode.start(0);
      this.noiseNode.loop = true;
    });

    //modulates the noise
    this.rpmOscillator = ctx.createOscillator();

    //used to apply modulation
    this.rpmVolumeMod = ctx.createGain();
    
    //connect the noise source to the modulator input
    this.noiseNode.connect(this.rpmVolumeMod);

    //connect the modulation source to the modulator
    this.rpmOscillator.connect(this.rpmVolumeMod.gain);

    //create the final output node
    this.rpmVolumeOut = ctx.createGain();

    //connect the modulator output node to the final output node
    this.rpmVolumeMod.connect(this.rpmVolumeOut);

    this.rpm = 0;

    this.rpmOscillator.start();
  }
  set bladeCount (blades: number) {
    this._bladeCount = blades;
  }
  set rpm (v: number) {
    this._rpm = v;

    this.rpmOscillator.frequency.value = this._rpm / this._bladeCount;
    this.rpmVolumeOut.gain.value = this.calculateVolumeOutGain();
  }
  calculateVolumeOutGain () {
    return this.rpmVolumeOutCurve.getY(this._rpm / this._maxRpm);
  }
  set maxRpm (v: number) {
    this._maxRpm = v;
    // this.rpmVolumeOut.gain.value = this._rpm / this._maxRpm;
  }
  setTargetRPM (rpm: number, targetMillisFromNow: number = 1000): this {
    let startMillis = Date.now() + targetMillisFromNow;

    this.rpmOscillator.frequency.setTargetAtTime(rpm * this._bladeCount, startMillis, 1);

    this.rpmVolumeOut.gain.setTargetAtTime(this.calculateVolumeOutGain(), startMillis, 1);

    setTimeout(()=>{
      this._rpm = rpm;
    }, targetMillisFromNow);

    return this;
  }
  getOutputNode (): AudioNode {
    return this.rpmVolumeOut;
  }
}
