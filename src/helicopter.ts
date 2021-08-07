
import { GameInput } from "@repcomm/gameinput-ts";
import { THREE } from "enable3d";
import { ExtendedMesh } from "@enable3d/ammo-physics";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { GLTFInstancer } from "./gltf";
import { MetaScene } from "./renderer";
import { Ctrl, CtrlGroup } from "./utils/ctrl";
import { AudioHelicopter } from "./audio/helicopter";

interface DisplayResolverInfo {
  resolve: (instance: GLTF) => void;
  unique: boolean;
}

// const HelicopterGLTF = new GLTFInstancer("./resources/helicopter.glb");
const HelicopterWolfGLTF = new GLTFInstancer("./resources/helicopter-wolf.glb");

const input = GameInput.get();

const DefaultMaxRotorThrust = 80;

const DefaultRotorThrustIncrement = 0.5;

const DefaultMaxSteerForce = 10;
const DefaultHullMass = 10;
const DefaultMaxForwardForce = 80;

const RotorMaxThrustRPM = 4;

export class Helicopter {

  private controls: CtrlGroup;

  private metaScene: MetaScene;

  private instanceGLTF: GLTF;
  private mixer: THREE.AnimationMixer;
  private hull: ExtendedMesh;

  private cameraAttachPoint: THREE.Object3D;
  private cameraLookTarget: THREE.Object3D;

  private maxRotorThrust: Ctrl;
  private rotorThrust: Ctrl;
  private rotorThrustIncrement: number;
  private maxSteerForce: number;
  private maxForwardForce: number;

  private audioSource: AudioHelicopter;

  private _isReady: boolean;

  private hasInstance(): boolean {
    return this.instanceGLTF !== undefined;
  }

  private isReady (): boolean {
    return this._isReady;
  }

  constructor(metaScene: MetaScene) {
    this._isReady = false;
    
    this.audioSource = new AudioHelicopter(metaScene.audio);
    this.audioSource.getOutputNode().connect(metaScene.audio.destination);

    this.controls = new CtrlGroup();
    
    this.maxRotorThrust = this.controls.create()
    .setLabel("Max Rotor Thrust")
    .setIcon("./resources/icon-engine.svg")
    .setValue(DefaultMaxRotorThrust);

    this.rotorThrust = this.controls.create()
    .setIcon("./resources/icon-engine.svg")
    .setLabel("Rotor Thrust")
    .setValue(0);

    this.rotorThrustIncrement = DefaultRotorThrustIncrement;

    this.maxSteerForce = DefaultMaxSteerForce;
    this.maxForwardForce = DefaultMaxForwardForce;

    this.metaScene = metaScene;

    this.cameraAttachPoint = new THREE.Object3D();
    this.cameraLookTarget = new THREE.Object3D();

    // HelicopterGLTF.getInstance().then((instance) => {
    HelicopterWolfGLTF.getInstance().then((instance) => {
      this.instanceGLTF = instance;

      this.mixer = new THREE.AnimationMixer(this.instanceGLTF.scene);

      this.instanceGLTF.animations.forEach((clip) => {
        this.mixer.clipAction(clip).play();
      });

      this.mixer.timeScale = 0.01;

      let collision = instance.scene.getObjectByName("collision");
      collision.visible = false;
      let root = instance.scene.getObjectByName("root");
      root.position.set(0, 10, 0);

      let cameraAttachThirdPerson = instance.scene.getObjectByName("camera-third-person");
      let cameraAttachFirstPerson = instance.scene.getObjectByName("camera-first-person");
      cameraAttachThirdPerson.add(this.cameraAttachPoint);
      // cameraAttachFirstPerson.add(this.cameraAttachPoint);

      this.metaScene.physics.add.existing(
        root as any,
        {
          shape: "box",
          // autoCenter: true,
          collisionFlags: 0,
          mass: DefaultHullMass,
          addChildren: true
        }
      );
      this.hull = root as any;
      this.hull.add( this.cameraLookTarget );

      // this.hull = collision as any;

      this.metaScene.scene.add(instance.scene);
      this._isReady = true;
    });

  }

  getControls (): CtrlGroup {
    return this.controls;
  }

  getCameraAttachPoint(): THREE.Object3D {
    return this.cameraAttachPoint;
  }
  getCameraLookTarget (): THREE.Object3D {
    return this.cameraLookTarget;
  }

  update(delta: number) {
    if (!this.isReady()) return;
    this.mixer.update(
      this.rotorThrust.value / 5
      // (this.rotorThrust.value / this.maxRotorThrust.value) * RotorMaxThrustRPM
    );
  }
  control(delta: number) {
    if (!this.isReady()) return;
    let liftCtrl = input.getAxisValue("lift");

    this.rotorThrust.value += input.getAxisValue("lift") * this.rotorThrustIncrement;

    if (this.rotorThrust.value > this.maxRotorThrust.value) {
      this.rotorThrust.value = this.maxRotorThrust.value;
    } else if (this.rotorThrust.value < -this.maxRotorThrust.value) {
      this.rotorThrust.value = -this.maxRotorThrust.value;
    }
    this.audioSource.rpm = this.rotorThrust.value;
    
    let lift = this.rotorThrust.value;

    this.hull.body.applyCentralForce(0, lift, 0);

    let steerCtrl = input.getAxisValue("steer");

    let steer = steerCtrl * this.maxSteerForce;

    this.hull.body.setAngularVelocityX(0);
    this.hull.body.setAngularVelocityZ(0);

    this.hull.body.applyTorque(0, steerCtrl, 0);

    let forwardCtrl = input.getAxisValue("forward");
    let forward = forwardCtrl * this.maxForwardForce;

    this.hull.body.applyCentralLocalForce(0, 0, forward);

  }
}
