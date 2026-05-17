import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getImageCandidates } from '../../utils/imageSources';
import { getLocalAttractionImage } from '../../utils/attractionImages';

// Cascading image source: try the bundled require() first, then the
// `imageThumb` / `imageOriginal` / `image` URI candidates. Each `onError`
// advances to the next entry.
export default function FallbackImage({ item, uri, sources, style, resizeMode = 'cover', iconSize = 28 }) {
  const sourceList = useMemo(() => {
    const list = [];

    if (item) {
      // Items can pre-bundle their image via require() — pass it through as
      // a module ref so Metro keeps the asset in the bundle.
      if (item.image && typeof item.image !== 'string') {
        list.push(item.image);
      }
      const local = getLocalAttractionImage(item.attractionId ?? item.id);
      if (local) list.push(local);
    }

    const candidates = sources || (item ? getImageCandidates(item) : [uri]);
    (candidates || []).filter(Boolean).forEach((candidate) => {
      if (typeof candidate === 'string') {
        list.push({ uri: candidate });
      } else {
        list.push(candidate);
      }
    });

    // De-duplicate by URI string when possible; pass through module ids.
    const seen = new Set();
    return list.filter((src) => {
      if (!src) return false;
      const key = src.uri || (typeof src === 'number' ? `m:${src}` : JSON.stringify(src));
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [item, sources, uri]);

  const [index, setIndex] = useState(0);
  const key = sourceList
    .map((s) => s?.uri || (typeof s === 'number' ? s : JSON.stringify(s)))
    .join('|');
  const source = sourceList[index];

  useEffect(() => {
    setIndex(0);
  }, [key]);

  if (!source) {
    return (
      <View style={[styles.placeholder, style]}>
        <Ionicons name="image-outline" size={iconSize} color="#d4af37" />
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={style}
      resizeMode={resizeMode}
      onError={() => {
        if (index < sourceList.length - 1) {
          setIndex(index + 1);
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d231b',
  },
});
