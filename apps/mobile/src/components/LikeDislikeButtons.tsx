import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ReactionType } from '../types';
import { formatCount, getDeviceId } from '../utils';
import { apiClient } from '../api/client';
import { useTheme } from '../context';

interface LikeDislikeButtonsProps {
  scriptId: string;
  initialLikeCount: number;
  initialDislikeCount: number;
  compact?: boolean;
}

export function LikeDislikeButtons({
  scriptId,
  initialLikeCount,
  initialDislikeCount,
  compact = false,
}: LikeDislikeButtonsProps) {
  const { colors } = useTheme();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount);
  const [userReaction, setUserReaction] = useState<ReactionType>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch current user's reaction on mount
  useEffect(() => {
    const fetchReaction = async () => {
      try {
        const deviceId = await getDeviceId();
        const response = await apiClient.getReaction(scriptId, deviceId);
        setUserReaction(response.reaction);
      } catch (error) {
        console.error('Failed to fetch reaction:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReaction();
  }, [scriptId]);

  const handleLike = async () => {
    if (actionLoading || userReaction === 'LIKE') return;

    setActionLoading(true);
    try {
      const deviceId = await getDeviceId();
      const response = await apiClient.likeScript(scriptId, deviceId);
      setLikeCount(response.likeCount);
      setDislikeCount(response.dislikeCount);
      setUserReaction('LIKE');
    } catch (error) {
      console.error('Failed to like script:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDislike = async () => {
    if (actionLoading || userReaction === 'DISLIKE') return;

    setActionLoading(true);
    try {
      const deviceId = await getDeviceId();
      const response = await apiClient.dislikeScript(scriptId, deviceId);
      setLikeCount(response.likeCount);
      setDislikeCount(response.dislikeCount);
      setUserReaction('DISLIKE');
    } catch (error) {
      console.error('Failed to dislike script:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.text} />
      </View>
    );
  }

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <TouchableOpacity
        style={[
          styles.button,
          compact && styles.buttonCompact,
          { backgroundColor: colors.background, borderColor: colors.border },
          userReaction === 'LIKE' && styles.likeActive,
        ]}
        onPress={handleLike}
        disabled={actionLoading || userReaction === 'LIKE'}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.buttonText,
            compact && styles.buttonTextCompact,
            { color: colors.text },
            userReaction === 'LIKE' && styles.likeActiveText,
          ]}
        >
          {'\u2764'} {formatCount(likeCount)}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          compact && styles.buttonCompact,
          { backgroundColor: colors.background, borderColor: colors.border },
          userReaction === 'DISLIKE' && styles.dislikeActive,
        ]}
        onPress={handleDislike}
        disabled={actionLoading || userReaction === 'DISLIKE'}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.buttonText,
            compact && styles.buttonTextCompact,
            { color: colors.text },
            userReaction === 'DISLIKE' && styles.dislikeActiveText,
          ]}
        >
          {'\u{1F44E}'} {formatCount(dislikeCount)}
        </Text>
      </TouchableOpacity>

      {actionLoading && (
        <ActivityIndicator
          size="small"
          color={colors.text}
          style={styles.loader}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  containerCompact: {
    gap: 6,
    paddingVertical: 0,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  buttonCompact: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  buttonTextCompact: {
    fontSize: 12,
  },
  likeActive: {
    backgroundColor: 'rgba(237, 73, 86, 0.1)',
    borderColor: '#ED4956',
  },
  likeActiveText: {
    color: '#ED4956',
  },
  dislikeActive: {
    backgroundColor: 'rgba(142, 142, 142, 0.1)',
    borderColor: '#8E8E8E',
  },
  dislikeActiveText: {
    color: '#8E8E8E',
  },
  loader: {
    marginLeft: 8,
  },
});

export default LikeDislikeButtons;
