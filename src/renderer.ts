
import { THREE } from "enable3d";
import { AmmoPhysics, ExtendedObject3D } from "@enable3d/ammo-physics";
import { Panel } from "@repcomm/exponent-ts";
import { Canvas } from "./canvas";
import { LookCamera } from "@repcomm/three.lookcamera";
import { GLTFInstancer, loadGLTF } from "./gltf";
import { GameInput } from "@repcomm/gameinput-ts";
import { Helicopter } from "./helicopter";

/**Holds info on a scene, its physics, and the camera rendering it
 * stfu, i know there can be multiple cameras.
*/
export interface MetaScene {
  scene?: THREE.Scene;
  physics?: AmmoPhysics;
  camera?: THREE.PerspectiveCamera;
}

const TEST_SCENE = new GLTFInstancer("./resources/test.glb");

export class Renderer extends Panel {
  private canvas: Canvas;

  private threeRenderer: THREE.WebGLRenderer;

  private defaultMetaScene: MetaScene;
  private currentMetaScene: MetaScene;

  constructor() {
    super();

    this.canvas = new Canvas()
      .mount(this);

    // this.canvasCtx = this.canvas.element.getContext("webgl");

    this.threeRenderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: false,
      canvas: this.canvas.element,
      depth: true
    });

    this.threeRenderer.setPixelRatio(1)

    window.addEventListener("resize", () => {
      this.notifyScreenResized();
    });

    //create default scene things (in an anonymous function to avoid polluting scope with junk variables)
    let lookcam: LookCamera;
    let scene = new THREE.Scene();

    this.defaultMetaScene = {};

    scene.add(new THREE.HemisphereLight(0xffffbb, 0x080820, 1));
    scene.add(new THREE.AmbientLight(0x666666));

    const light = new THREE.DirectionalLight(0xdfebff, 1);
    light.position.set(50, 200, 100);
    light.position.multiplyScalar(1.3);

    this.defaultMetaScene.scene = scene;

    let physics = new AmmoPhysics(scene);
    physics.debug.enable();

    this.defaultMetaScene.physics = physics;

    //objects stuff
    let helicopter = new Helicopter(this.defaultMetaScene);

    physics.add.box(
      { x: 0, y: 10, z: 0, width: 1, height: 1, depth: 1, mass: 1, collisionFlags: 0 },
      { lambert: { color: 'red', transparent: true, opacity: 0.5 } }
    );

    
    TEST_SCENE.getInstance().then((test)=>{
      let ground = test.scene.getObjectByName("ground") as ExtendedObject3D;
      ground.position.set(0, -10, 0);
      physics.add.existing(ground, {
        collisionFlags: 1,
        shape: "plane",
      });
      this.defaultMetaScene.scene.add(ground);
    });
    
    // let groundWidth = 100;
    // let groundDepth = 100;
    // physics.add.ground({
    //   collisionFlags: 1,
    //   width: groundWidth / 2,
    //   height: groundDepth / 2,
    //   x: 0,
    //   y: -5,
    //   z: 0,
    // });

    lookcam = new LookCamera({
      far: 1000
    });

    helicopter.getCameraAttachPoint().add(lookcam);
    // scene.add(lookcam as any);
    // lookcam.position.set(0, 10, 20);

    this.defaultMetaScene.camera = lookcam.getCamera() as any;

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
    let physicsTargetDelta = 1000/physicsFps;
    let physicsEnlapsed = 0;

    //frame animation iteration
    const renderIteration: FrameRequestCallback = (now) => {
      let delta = now - last;
      let deltaSeconds = delta / 1000;

      //animation
      helicopter.update(delta);
      //player controls
      helicopter.control(deltaSeconds);

      // console.log("render");
      if (!this.currentMetaScene) return;

      if (!input.raw.pointerIsLocked()) {
        if (input.raw.getPointerButton(0)) {
          input.raw.pointerTryLock(this.canvas.element);
        }
        lookcam.setLookEnabled(false);
      } else {
        lookcam.setLookEnabled(true);
      }

      let mx = input.builtinMovementConsumer.getDeltaX();
      let my = input.builtinMovementConsumer.getDeltaY();
      // console.log(mx, my);
      lookcam.addRotationInput(
        mx,
        my
      );
      
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
