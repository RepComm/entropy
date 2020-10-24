
import { Dependency } from "./dependency";

let dep = new Dependency();
dep.test();

class Test {
  static member: number = 1212;
  constructor () {

  }
}

console.log(Test.member);

