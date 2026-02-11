import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { apiClient } from '../api/client';
import { useTheme } from '../context';

interface AddCommentFormProps {
  scriptId: string;
  onCommentAdded: () => void;
}

export function AddCommentForm({ scriptId, onCommentAdded }: AddCommentFormProps) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedComment = comment.trim();

    if (!trimmedName) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }

    if (!trimmedComment) {
      Alert.alert('Required', 'Please enter a comment');
      return;
    }

    if (trimmedComment.length > 500) {
      Alert.alert('Too long', 'Comment must be 500 characters or less');
      return;
    }

    setLoading(true);
    try {
      await apiClient.addComment(scriptId, {
        name: trimmedName,
        comment: trimmedComment,
      });

      setComment('');
      Keyboard.dismiss();
      onCommentAdded();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to post comment';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.accent }]}>Add a Comment</Text>

      <TextInput
        style={[styles.input, { backgroundColor: colors.secondaryBackground, color: colors.text, borderColor: colors.border }]}
        placeholder="Your name"
        placeholderTextColor={colors.textSecondary}
        value={name}
        onChangeText={setName}
        maxLength={50}
        editable={!loading}
      />

      <TextInput
        style={[styles.input, styles.commentInput, { backgroundColor: colors.secondaryBackground, color: colors.text, borderColor: colors.border }]}
        placeholder="Write your comment..."
        placeholderTextColor={colors.textSecondary}
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={3}
        maxLength={500}
        editable={!loading}
        textAlignVertical="top"
      />

      <View style={styles.footer}>
        <Text style={[styles.charCount, { color: colors.textSecondary }]}>
          {comment.length}/500
        </Text>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
  },
  commentInput: {
    minHeight: 80,
    paddingTop: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 12,
  },
  button: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(0, 149, 246, 0.5)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AddCommentForm;
