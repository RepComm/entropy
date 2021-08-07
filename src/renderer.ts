
import { THREE } from "enable3d";
import { AmmoPhysics, ExtendedObject3D } from "@enable3d/ammo-physics";
import { Exponent, Panel } from "@repcomm/exponent-ts";
import { Canvas } from "./components/canvas";
import { LookCamera } from "@repcomm/three.lookcamera";
import { GLTFInstancer, loadGLTF } from "./gltf";
import { GameInput } from "@repcomm/gameinput-ts";
import { Helicopter } from "./helicopter";
import { CurveEditor } from "./components/curveeditor";
import { FlowCameraController } from "./controllers/flowcamera";

/**Holds info on a scene, its physics, and the camera rendering it
 * stfu, i know there can be multiple cameras.
*/
export interface MetaScene {
  scene?: THREE.Scene;
  physics?: AmmoPhysics;
  camera?: THREE.PerspectiveCamera;
  audio?: AudioContext;
}

const TEST_SCENE = new GLTFInstancer("./resources/test.glb");
const SPAWN_PAD = new GLTFInstancer("./resources/spawn-pad.glb");

export class Renderer extends Panel {
  static SINGLETON: Renderer;

  private canvas: Canvas;

  private threeRenderer: THREE.WebGLRenderer;

  private defaultMetaScene: MetaScene;
  private currentMetaScene: MetaScene;

  private uiOverlay: Exponent;
  getUI (): Exponent {
    return this.uiOverlay;
  }

  constructor() {
    super();

    this.canvas = new Canvas()
      .mount(this);

    this.uiOverlay = new Exponent()
      .make("div")
      .setId("ui")
      .applyRootClasses()
      .setStyleItem("position", "absolute")
      .setStyleItem("width", "100%")
      .setStyleItem("height", "100%")
      .mount(this);

    this.threeRenderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: false,
      canvas: this.canvas.element,
      depth: true
    });
    this.threeRenderer.setClearColor(0x99ddff);

    this.threeRenderer.setPixelRatio(1)

    window.addEventListener("resize", () => {
      this.notifyScreenResized();
    });

    let scene = new THREE.Scene();

    this.defaultMetaScene = {};

    // scene.add(new THREE.HemisphereLight(0xffffbb, 0x080820, 1));
    scene.add(new THREE.AmbientLight(0xFFFFFF));

    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(1, 1, 1);
    scene.add(light);

    //create audio context
    this.defaultMetaScene.audio = new AudioContext({

    });

    this.defaultMetaScene.scene = scene;

    let physics = new AmmoPhysics(scene);
    physics.debug.enable();

    this.defaultMetaScene.physics = physics;

    //objects stuff
    let helicopter = new Helicopter(this.defaultMetaScene);
    helicopter.getControls().mount(this.uiOverlay);

    physics.add.box(
      { x: 0, y: 10, z: 0, width: 1, height: 1, depth: 1, mass: 1, collisionFlags: 0 },
      { lambert: { color: 'red', transparent: true, opacity: 0.5 } }
    );


    TEST_SCENE.getInstance().then((test) => {
      let ground = test.scene.getObjectByName("ground") as ExtendedObject3D;
      // ground.position.set(0, -10, 0);
      physics.add.existing(ground, {
        collisionFlags: 1,
        shape: "plane",
      });
      this.defaultMetaScene.scene.add(ground);
    });

    SPAWN_PAD.getInstance().then((gltf) => {
      let spawnpad = gltf.scene.getObjectByName("spawn-pad") as ExtendedObject3D;
      physics.add.existing(spawnpad, {
        collisionFlags: 1,
        shape: "hull",
      });
      this.defaultMetaScene.scene.add(spawnpad);
    });

    SPAWN_PAD.getInstance().then((gltf) => {
      let spawnpad = gltf.scene.getObjectByName("spawn-pad") as ExtendedObject3D;
      spawnpad.position.set(10, 0, 10);
      physics.add.existing(spawnpad, {
        collisionFlags: 1,
        shape: "hull",
      });
      this.defaultMetaScene.scene.add(spawnpad);
    });

    // let lookcam: LookCamera;
    // lookcam = new LookCamera({
    //   far: 1000
    // });
    let flowCam = new FlowCameraController();
    let camera = new THREE.PerspectiveCamera(75, 1, 0.01, 1000);
    scene.add(camera);
    flowCam.attachCamera(camera);
    flowCam.setLookTarget(helicopter.getCameraLookTarget());
    flowCam.setAttachPoint(helicopter.getCameraAttachPoint());

    // helicopter.getCameraAttachPoint().add(lookcam);
    // scene.add(lookcam as any);
    // lookcam.position.set(0, 10, 20);

    this.defaultMetaScene.camera = camera;//lookcam.getCamera() as any;

    //set the current scene
    this.currentMetaScene = this.defaultMetaScene;


    let input = GameInput.get();

    //keep looking until this is false
    let doRender = true;

    let last = 0;
    let delta = 0;
    let deltaSeconds = 0;

    let physicsFps = 30;
    let physicsLast = 0;
    let physicsTargetDelta = 1000 / physicsFps;
    let physicsEnlapsed = 0;

    //frame animation iteration
    const renderIteration: FrameRequestCallback = (now) => {
      let delta = now - last;
      let deltaSeconds = delta / 1000;

      flowCam.update();

      //animation
      helicopter.update(delta);
      //player controls
      helicopter.control(deltaSeconds);

      // console.log("render");
      if (!this.currentMetaScene) return;

      if (!input.raw.pointerIsLocked()) {
        if (input.raw.getPointerButton(0)) {
          //input.raw.pointerTryLock(this.canvas.element);
        }
        // lookcam.setLookEnabled(false);
      } else {
        // lookcam.setLookEnabled(true);
      }

      let mx = input.builtinMovementConsumer.getDeltaX();
      let my = input.builtinMovementConsumer.getDeltaY();
      // console.log(mx, my);
      // lookcam.addRotationInput(
      //   mx,
      //   my
      // );

      physicsEnlapsed += delta;
      if (physicsEnlapsed >= physicsTargetDelta) {
        physicsEnlapsed = 0;
        this.currentMetaScene.physics.update(delta);
        this.currentMetaScene.physics.updateDebugger();
      }

      this.threeRenderer.render(this.currentMetaScene.scene, this.currentMetaScene.camera);

      last = now;

      if (doRender) window.requestAnimationFrame(renderIteration);
    };
    window.requestAnimationFrame(renderIteration);

    setTimeout(() => {
      this.notifyScreenResized();
    }, 1000);

  }
  notifyScreenResized() {
    let r = this.rect;

    this.threeRenderer.setSize(r.width, r.height, false);

    this.currentMetaScene.camera.aspect = r.width / r.height;
    this.currentMetaScene.camera.updateProjectionMatrix();
  }
}
