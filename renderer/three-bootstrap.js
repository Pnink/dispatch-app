// Desktop build only: loads the locally-installed Three.js as an ES module
// and exposes it as a global, so the plain <script> files (three-scenes.js,
// app.js) can use `window.THREE` the same way the mobile build does when it
// loads Three.js from a CDN UMD build instead.
import * as THREE from '../node_modules/three/build/three.module.js';
window.THREE = THREE;
