import { getLocalAttractionImage } from './attractionImages';

// Returns a React Native <Image source> compatible value. Prefers the
// in-bundle JPEG (returned as a module id by `require`) so listings render
// without depending on the Wikipedia round-trip. Falls back to remote URIs
// from the JSON / API payload.
export const getImageSource = (item) => {
  if (!item) return null;

  // Tour entries pre-bundle their image via require() — pass through as is.
  if (item.image && typeof item.image !== 'string') {
    return item.image;
  }

  const localId = item.attractionId ?? item.id;
  const local = getLocalAttractionImage(localId);
  if (local) return local;

  const uri = item.imageThumb || item.imageOriginal || item.image;
  return uri ? { uri } : null;
};

// Returns a string URI when one exists — kept for analytics / cart serialization
// where we need a plain string, not a bundle reference.
export const getImageUri = (item) =>
  item?.imageThumb || item?.imageOriginal || (typeof item?.image === 'string' ? item.image : null);

export const getImageCandidates = (item) => {
  const values = [item?.imageThumb, item?.imageOriginal, typeof item?.image === 'string' ? item.image : null]
    .filter(Boolean);
  return [...new Set(values)];
};
