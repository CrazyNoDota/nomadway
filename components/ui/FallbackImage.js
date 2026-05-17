import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getImageCandidates } from '../../utils/imageSources';

export default function FallbackImage({ item, uri, sources, style, resizeMode = 'cover', iconSize = 28 }) {
  const candidates = useMemo(() => {
    const values = sources || (item ? getImageCandidates(item) : [uri]);
    return [...new Set(values.filter(Boolean))];
  }, [item, sources, uri]);
  const [index, setIndex] = useState(0);
  const candidateKey = candidates.join('|');
  const sourceUri = candidates[index];

  useEffect(() => {
    setIndex(0);
  }, [candidateKey]);

  if (!sourceUri) {
    return (
      <View style={[styles.placeholder, style]}>
        <Ionicons name="image-outline" size={iconSize} color="#d4af37" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: sourceUri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => {
        if (index < candidates.length - 1) {
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
