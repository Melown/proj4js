export function init() {
  this.isGeocent = true;
}

function identity(pt) {
  return pt;
}
export {identity as forward};
export {identity as inverse};
export var names = ["geocent"];
export default {
  init: init,
  forward: identity,
  inverse: identity,
  names: names
};