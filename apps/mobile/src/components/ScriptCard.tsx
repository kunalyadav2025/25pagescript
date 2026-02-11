import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Script, Genre } from '../types';
import { formatRelativeTime, formatCount } from '../utils';
import { useTheme } from '../context';

interface ScriptCardProps {
  script: Script;
  onPress: () => void;
  style?: ViewStyle;
}

const GENRE_COLORS: Record<Genre, string> = {
  'Drama': '#8B5CF6',
  'Thriller': '#EF4444',
  'Comedy': '#F59E0B',
  'Romance': '#EC4899',
  'Action': '#F97316',
  'Horror': '#DC2626',
  'Sci-Fi': '#06B6D4',
  'Mystery': '#7C3AED',
  'Family': '#10B981',
  'Documentary': '#6B7280',
  'Other': '#9CA3AF',
};

export function ScriptCard({ script, onPress, style }: ScriptCardProps) {
  const { colors } = useTheme();
  const genreColor = GENRE_COLORS[script.genre] || GENRE_COLORS['Other'];

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.background }, style]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Header - Genre and Timestamp */}
      <View style={styles.header}>
        <View style={[styles.genreBadge, { backgroundColor: genreColor }]}>
          <Text style={styles.genreText}>{script.genre}</Text>
        </View>
        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
          {formatRelativeTime(script.createdAt)}
        </Text>
      </View>

      {/* Content Area - Bigger */}
      <View style={styles.content}>
        {/* Title - Bigger */}
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {script.title}
        </Text>

        {/* Logline - Bigger */}
        <Text style={[styles.logline, { color: colors.textSecondary }]} numberOfLines={4}>
          {script.logline}
        </Text>

        {/* Meta info */}
        <Text style={[styles.metaInfo, { color: colors.textMuted }]}>
          {script.pageCount} pages
        </Text>
      </View>

      {/* Actions Row */}
      <View style={styles.actionsRow}>
        <View style={styles.leftActions}>
          <View style={styles.actionItem}>
            <Text style={styles.actionIcon}>{'\u2764'}</Text>
            <Text style={[styles.actionCount, { color: colors.text }]}>{formatCount(script.likeCount)}</Text>
          </View>
          <View style={styles.actionItem}>
            <Text style={styles.actionIcon}>{'\u{1F4AC}'}</Text>
            <Text style={[styles.actionCount, { color: colors.text }]}>{formatCount(script.commentCount)}</Text>
          </View>
        </View>
        <Text style={[styles.readMore, { color: colors.accent }]}>Read more</Text>
      </View>

      {/* Author at Bottom - Small fonts */}
      <View style={[styles.authorSection, { borderTopColor: colors.divider }]}>
        <View style={[styles.authorAvatar, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
          <Text style={[styles.authorInitial, { color: colors.text }]}>
            {script.writer.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.authorName, { color: colors.textSecondary }]}>
          by {script.writer.name}
        </Text>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  genreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  genreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 12,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    lineHeight: 28,
  },
  logline: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
  },
  metaInfo: {
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  readMore: {
    fontSize: 14,
    fontWeight: '600',
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 0.5,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  authorInitial: {
    fontSize: 11,
    fontWeight: '600',
  },
  authorName: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 6,
    marginTop: 4,
  },
});

export default ScriptCard;
