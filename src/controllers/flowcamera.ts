
import { THREE } from "enable3d";

export class FlowCameraController {
  private attachPoint: THREE.Object3D;
  private attachPointWorldPosition: THREE.Vector3;
  private camera: THREE.Camera;
  private lookPoint: THREE.Object3D;
  private lookPointWorldPosition: THREE.Vector3;
  private flow: number;

  constructor () {
    this.attachPointWorldPosition = new THREE.Vector3();
    this.lookPointWorldPosition = new THREE.Vector3();
    this.lookPoint = new THREE.Object3D();
    this.lookPoint.name = "flow-camera-controller-look-point";
    this.flow = 0.1;
  }
  attachCamera (cam: THREE.Camera): this {
    this.camera = cam;
    return this;
  }
  setLookTarget (target: THREE.Object3D): this {
    target.add(this.lookPoint);
    return this;
  }
  detachCamera (): this {
    this.camera = undefined;
    this.attachPoint.remove(this.camera);
    return this;
  }
  setFlow (flow: number): this {
    this.flow = flow;
    return this;
  }
  setAttachPoint (point: THREE.Object3D): this {
    this.attachPoint = point;
    return this;
  }
  update () {
    if (this.camera && this.attachPoint) {
      this.attachPointWorldPosition.set(0, 0, 0);
      this.attachPointWorldPosition.applyMatrix4( this.attachPoint.matrixWorld );
      this.camera.position.lerp( this.attachPointWorldPosition , this.flow );


      this.lookPointWorldPosition.set(0,0,0);
      this.lookPointWorldPosition.applyMatrix4( this.lookPoint.matrixWorld );
      this.camera.lookAt( this.lookPointWorldPosition );
    }
  }
}
