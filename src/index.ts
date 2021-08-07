
import { EXPONENT_CSS_BODY_STYLES, EXPONENT_CSS_STYLES, Panel, Style } from "@repcomm/exponent-ts";
import { Renderer } from "./renderer";

EXPONENT_CSS_STYLES.mount(document.head);
EXPONENT_CSS_BODY_STYLES.mount(document.head);

const STYLES = new Style()
.setTextContent(`
.ctrl-group {
  background-color: black;
  border-radius: 0.5em;
}
.exponent-image {
	// min-width: 0%;
	// min-height: 0%;
	// width: 100%;
	// height: 100%;
	max-width: 100%;
	max-height: 100%;
}
.iconbutton {
	background-color: #282828;
	border-radius: 0.5em;
	color: white;
	padding: 0.25em;
	max-height: 2em;
	margin: 0.25em;
	border-color: #238a7c;
	border-width: 2px;
	border-style: solid;
}
.iconbutton-icon {
  flex: 1;
}
.iconbutton-label {
	flex: 3;
	font-family: courier;
	text-align: center;
	font-size: large;
}
.iconbutton-input {
	flex: 2;
	font-size: large;
	text-align: center;
	margin-right: 2em;
	background-color: #343839;
	border-radius: 0.5em;
	color: inherit;
	font-weight: bold;
	border-style: solid;
	border-width: 1px;
	border-color: #0b0b0b;
	text-shadow: 0 0 10px #08ff00, 0 0 2px #000;
}
.curveeditor {
	min-width: 10em;
	min-height: 10em;
	max-width: 100%;
	max-height: 100%;
	background-color: #282828;
	border-radius: 1em;
	margin: 1em;
	padding: 1em;
	border-color: #238a7c;
	border-width: 2px;
	border-style: solid;
}
.curveeditor-display {
	cursor: pointer;
	background-color: #343839;
	border-radius: 1em;
}
.no-select {
  -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
     -khtml-user-select: none; /* Konqueror HTML */
       -moz-user-select: none; /* Old versions of Firefox */
        -ms-user-select: none; /* Internet Explorer/Edge */
            user-select: none; /* Non-prefixed version, currently
                                  supported by Chrome, Edge, Opera and Firefox */
}
.no-drag {
	-moz-user-select: none; /* These user-select properties are inheritable, used to prevent text selection */
	-webkit-user-select: none;
	-ms-user-select: none; /* From IE10 only */
	user-select: none; /* Not valid CSS yet, as of July 2012 */

	-webkit-user-drag: none; /* Prevents dragging of images/divs etc */
	user-drag: none;
}
`)
.mount(document.head);

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