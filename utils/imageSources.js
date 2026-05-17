export const getImageUri = (item) =>
  item?.imageThumb || item?.imageOriginal || item?.image || null;

export const getImageCandidates = (item) => {
  const values = [item?.imageThumb, item?.imageOriginal, item?.image].filter(Boolean);
  return [...new Set(values)];
};
