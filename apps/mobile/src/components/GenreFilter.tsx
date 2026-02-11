import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Genre, GENRES } from '../types';
import { useTheme } from '../context';

interface GenreFilterProps {
  selectedGenre: Genre | null;
  onSelectGenre: (genre: Genre | null) => void;
}

export function GenreFilter({ selectedGenre, onSelectGenre }: GenreFilterProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* All genres option */}
        <TouchableOpacity
          style={[
            styles.chip,
            { backgroundColor: colors.background, borderColor: colors.border },
            selectedGenre === null && styles.chipSelected,
          ]}
          onPress={() => onSelectGenre(null)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.chipText,
              { color: colors.text },
              selectedGenre === null && styles.chipTextSelected,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        {/* Genre chips */}
        {GENRES.map((genre) => (
          <TouchableOpacity
            key={genre}
            style={[
              styles.chip,
              { backgroundColor: colors.background, borderColor: colors.border },
              selectedGenre === genre && styles.chipSelected,
            ]}
            onPress={() => onSelectGenre(genre)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                { color: colors.text },
                selectedGenre === genre && styles.chipTextSelected,
              ]}
            >
              {genre}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: '#262626',
    borderColor: '#262626',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
});

export default GenreFilter;
