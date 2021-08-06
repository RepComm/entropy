
import { EXPONENT_CSS_BODY_STYLES, EXPONENT_CSS_STYLES, Panel } from "@repcomm/exponent-ts";
import { Renderer } from "./renderer";

EXPONENT_CSS_STYLES.mount(document.head);
EXPONENT_CSS_BODY_STYLES.mount(document.head);

const container = new Panel()
  .setId("container")
  .mount(document.body);

import { PhysicsLoader } from "enable3d";
import { GameInput } from "@repcomm/gameinput-ts";

let input = GameInput.get();
input.getOrCreateAxis("lift")
.addInfluence({
  value: 1,
  keys:[" "]
})
.addInfluence({
  value: -1,
  keys: ["z"]
});

input.getOrCreateAxis("steer")
.addInfluence({
  value: -1,
  keys:["d"]
})
.addInfluence({
  value: 1,
  keys:["a"]
});

input.getOrCreateAxis("forward")
.addInfluence({
  value: -1,
  keys:["w"]
})
.addInfluence({
  value: 1,
  keys:["s"]
});


async function main() {
  console.log("Loaded");

  console.log("Creating renderer");
  const renderer = new Renderer()
    .setId("renderer")
    .mount(container);

  
}
PhysicsLoader("./lib/ammo/kripken", () => main());