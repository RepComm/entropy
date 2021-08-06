
import { GameInput } from "@repcomm/gameinput-ts";
import { THREE } from "enable3d";
import { ExtendedMesh } from "@enable3d/ammo-physics";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { GLTFInstancer } from "./gltf";
import { MetaScene } from "./renderer";

interface DisplayResolverInfo {
  resolve: (instance: GLTF) => void;
  unique: boolean;
}

const HelicopterGLTF = new GLTFInstancer("./resources/helicopter.glb");

const input = GameInput.get();

const DefaultMaxRotorLift = 25;
const DefaultMaxSteerForce = 10;
const DefaultHullMass = 10;
const DefaultMaxForwardForce = 50;

export class Helicopter {
  private metaScene: MetaScene;

  private instanceGLTF: GLTF;
  private mixer: THREE.AnimationMixer;
  private hull: ExtendedMesh;
  private body: any;

  private cameraAttachPoint: THREE.Group;

  private maxRotorLift: number;
  private maxSteerForce: number;
  private maxForwardForce: number;

  private _isReady: boolean;

  private hasInstance(): boolean {
    return this.instanceGLTF !== undefined;
  }

  private isReady (): boolean {
    return this._isReady;
  }

  constructor(metaScene: MetaScene) {
    this._isReady = false;
    this.maxRotorLift = DefaultMaxRotorLift;
    this.maxSteerForce = DefaultMaxSteerForce;
    this.maxForwardForce = DefaultMaxForwardForce;

    this.metaScene = metaScene;

    this.cameraAttachPoint = new THREE.Group();
    this.cameraAttachPoint.position.set(0, 10, 20);

    HelicopterGLTF.getInstance().then((instance) => {
      this.instanceGLTF = instance;

      this.mixer = new THREE.AnimationMixer(this.instanceGLTF.scene);

      this.instanceGLTF.animations.forEach((clip) => {
        this.mixer.clipAction(clip).play();
      });

      this.mixer.timeScale = 0.01;

      let hull = instance.scene.getObjectByName("hull");
      hull.add(this.cameraAttachPoint);

      this.metaScene.physics.add.existing(
        hull as any,
        {
          shape: 'box',
          // autoCenter: true,
          collisionFlags: 0,
          mass: DefaultHullMass,
          addChildren: false
        }
      );
      this.hull = hull as any;

      this.metaScene.scene.add(instance.scene);
      this._isReady = true;
    });

  }

  getCameraAttachPoint(): THREE.Group {
    return this.cameraAttachPoint;
  }

  update(delta: number) {
    if (!this.isReady()) return;
    this.mixer.update( delta );
  }
  control(delta: number) {
    if (!this.isReady()) return;
    let liftCtrl = input.getAxisValue("lift");

    // this.body
    // console.log(this.hull);
    // let lift = liftCtrl * this.maxRotorLift;
    let lift = (DefaultHullMass*9) + (liftCtrl * this.maxRotorLift);

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
