
import { Dependency } from "./dependency";

let dep = new Dependency();
dep.test();
dep.testasync();

class Test {
  static static_member: number = 1212;
  member: number = 1313;
  constructor () {

  }
}

console.log(Test.static_member);

