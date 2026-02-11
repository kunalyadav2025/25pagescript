import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Comment } from '../types';
import { apiClient } from '../api/client';
import { useTheme } from '../context';
import CommentItem from './CommentItem';

interface CommentListProps {
  scriptId: string;
  commentCount: number;
  refreshTrigger?: number;
}

export function CommentList({
  scriptId,
  commentCount,
  refreshTrigger = 0,
}: CommentListProps) {
  const { colors } = useTheme();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(
    async (pageNum: number, replace = false) => {
      try {
        const response = await apiClient.getComments(scriptId, {
          page: pageNum,
          limit: 20,
        });

        if (replace) {
          setComments(response.comments);
        } else {
          setComments((prev) => [...prev, ...response.comments]);
        }

        setHasMore(response.hasMore);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load comments';
        setError(message);
      }
    },
    [scriptId]
  );

  // Initial load
  useEffect(() => {
    setLoading(true);
    setPage(1);
    loadComments(1, true).finally(() => setLoading(false));
  }, [loadComments, refreshTrigger]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    await loadComments(nextPage);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.text} />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            loadComments(1, true).finally(() => setLoading(false));
          }}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
      <Text style={[styles.header, { color: colors.accent }]}>
        {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
      </Text>

      {comments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>No comments yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Be the first to comment!</Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.commentId}
          renderItem={({ item }) => <CommentItem comment={item} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  header: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#0095F6',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 8,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export default CommentList;
