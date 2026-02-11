import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Comment } from '../types';
import { formatRelativeTime } from '../utils';
import { useTheme } from '../context';

interface CommentItemProps {
  comment: Comment;
}

export function CommentItem({ comment }: CommentItemProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.avatar, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
        <Text style={[styles.avatarText, { color: colors.text }]}>
          {comment.commenterName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.text }]}>{comment.commenterName}</Text>
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {formatRelativeTime(comment.createdAt)}
          </Text>
        </View>
        <Text style={[styles.commentText, { color: colors.textSecondary }]}>{comment.commentText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  timestamp: {
    fontSize: 13,
  },
  commentText: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default CommentItem;
