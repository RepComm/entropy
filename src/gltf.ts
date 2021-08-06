
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const LOADER = new GLTFLoader();

export const loadGLTF = (fpath: string) => new Promise<GLTF>(async (_resolve, _reject)=>{
  LOADER.load(fpath, (gltf)=>{
    _resolve(gltf);
  }, undefined, (err)=>{
    _reject(err);
  });
});

function cloneGLTF (from: GLTF): GLTF {
  let scenes = [];
  let scene;
  for (let i=0; i<from.scenes.length; i++) {
    scenes[i] = from.scenes[i].clone(true);
    if (from.scenes[i] === from.scene) {
      scene = scenes[i];
    }
    if (scene) scene = from.scenes[0].clone(true);
  }

  // let animations = [];
  // for (let anim of from.animations) {
  //   let cloneAnim = anim.clone();
  //   animations.push(cloneAnim);
  // }

  return {
    animations: from.animations,
    asset: from.asset,
    cameras: from.cameras,
    parser: from.parser,
    scene,
    scenes,
    userData: from.userData
  }
}

interface GLTFResolver {
  (instance: GLTF): void;
}

export class GLTFInstancer {
  private source: GLTF;

  private instances: Set<GLTF>;

  private resolvers: Set<GLTFResolver>;

  constructor (url: string) {
    this.instances = new Set();
    this.resolvers = new Set();

    loadGLTF(url).then((source)=>{
      this.source = source;

      for (let _resolve of this.resolvers) {
        _resolve( this.createInstance() );
      }
      this.resolvers.clear();
    });
  }
  sourceIsLoaded (): boolean {
    return this.source !== undefined;
  }
  private createInstance (): GLTF {
    let result = cloneGLTF(this.source);
    this.instances.add(result);
    return result;
  }
  getInstance (): Promise<GLTF> {
    return new Promise(async (_resolve, _reject)=>{
      if (this.sourceIsLoaded()) {
        _resolve( this.createInstance() );
        return;
      } else {
        this.resolvers.add(_resolve);
      }
    });
  }
}
