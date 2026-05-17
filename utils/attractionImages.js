// Bundled attraction photos. Generated alongside scripts/bundle-place-images.js.
// Keeping all `require` calls in a single static map lets the Metro bundler
// resolve them at build time so the JPEGs ship inside the APK and render
// without depending on Wikipedia at runtime.

const ATTRACTION_IMAGES = {
  1: require('../assets/places/1.jpg'),
  2: require('../assets/places/2.jpg'),
  3: require('../assets/places/3.jpg'),
  4: require('../assets/places/4.jpg'),
  5: require('../assets/places/5.jpg'),
  6: require('../assets/places/6.jpg'),
  7: require('../assets/places/7.jpg'),
  8: require('../assets/places/8.jpg'),
  9: require('../assets/places/9.jpg'),
  10: require('../assets/places/10.jpg'),
  11: require('../assets/places/11.jpg'),
  12: require('../assets/places/12.jpg'),
  13: require('../assets/places/13.jpg'),
  14: require('../assets/places/14.jpg'),
  15: require('../assets/places/15.jpg'),
  16: require('../assets/places/16.jpg'),
  17: require('../assets/places/17.jpg'),
  18: require('../assets/places/18.jpg'),
  19: require('../assets/places/19.jpg'),
  20: require('../assets/places/20.jpg'),
  21: require('../assets/places/21.jpg'),
  22: require('../assets/places/22.jpg'),
  23: require('../assets/places/23.jpg'),
};

export const getLocalAttractionImage = (id) => {
  if (id == null) return null;
  // Items round-tripped through APIs sometimes arrive as strings.
  const key = typeof id === 'string' ? Number.parseInt(id, 10) : id;
  return ATTRACTION_IMAGES[key] || null;
};

export default ATTRACTION_IMAGES;
