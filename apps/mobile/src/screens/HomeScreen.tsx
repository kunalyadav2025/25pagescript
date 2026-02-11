import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
  Pressable,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Script, Genre, RootStackParamList } from '../types';
import { apiClient } from '../api/client';
import { ScriptCard, GenreFilter } from '../components';
import { useTheme } from '../context';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { theme, colors, setThemeMode } = useTheme();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactTip, setShowContactTip] = useState(false);

  const CONTACT_EMAIL = '25pagesscript@gmail.com';

  const handleEmailPress = () => {
    setShowContactTip(false);
    Linking.openURL(`mailto:${CONTACT_EMAIL}`);
  };

  const loadScripts = useCallback(
    async (pageNum: number, genre: Genre | null, replace = false) => {
      try {
        const response = await apiClient.getScripts({
          genre: genre || undefined,
          page: pageNum,
          limit: 3,
        });

        if (replace) {
          setScripts(response.scripts);
        } else {
          setScripts((prev) => [...prev, ...response.scripts]);
        }

        setHasMore(response.hasMore);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load scripts';
        setError(message);
      }
    },
    []
  );

  // Initial load and genre change
  useEffect(() => {
    setLoading(true);
    setPage(1);
    loadScripts(1, selectedGenre, true).finally(() => setLoading(false));
  }, [selectedGenre, loadScripts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadScripts(1, selectedGenre, true);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    await loadScripts(nextPage, selectedGenre);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const handleGenreSelect = (genre: Genre | null) => {
    setSelectedGenre(genre);
  };

  const handleScriptPress = (scriptId: string) => {
    navigation.navigate('ScriptDetail', { scriptId });
  };

  const handleUploadPress = () => {
    navigation.navigate('Upload');
  };

  const renderScript = ({ item }: { item: Script }) => (
    <ScriptCard
      script={item}
      onPress={() => handleScriptPress(item.scriptId)}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return <View style={styles.listFooter} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.text} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Scripts Found</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {selectedGenre
            ? `No ${selectedGenre} scripts available yet`
            : 'Be the first to upload a script!'}
        </Text>
        <TouchableOpacity
          style={[styles.emptyButton, { backgroundColor: colors.accent }]}
          onPress={handleUploadPress}
        >
          <Text style={styles.emptyButtonText}>Upload Script</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {/* Header - Instagram Style */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.themeSwitch}>
          <TouchableOpacity
            onPress={() => setThemeMode('light')}
            activeOpacity={0.7}
            style={[
              styles.themeSquare,
              { backgroundColor: '#FFFFFF', borderColor: theme === 'light' ? colors.accent : colors.border },
              theme === 'light' && styles.themeSquareActive,
            ]}
          />
          <TouchableOpacity
            onPress={() => setThemeMode('dark')}
            activeOpacity={0.7}
            style={[
              styles.themeSquare,
              { backgroundColor: '#000000', borderColor: theme === 'dark' ? colors.accent : colors.border },
              theme === 'dark' && styles.themeSquareActive,
            ]}
          />
        </View>
        <View style={styles.logoContainer}>
          <Text style={[styles.logo, { color: colors.text }]}>25PageScript</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>Share short, powerful & engaging scripts</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setShowContactTip(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.infoIcon, { color: colors.textSecondary }]}>{'\u2139'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUploadPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.uploadIcon, { color: colors.text }]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contact Tooltip Modal */}
      <Modal
        visible={showContactTip}
        transparent
        animationType="fade"
        onRequestClose={() => setShowContactTip(false)}
      >
        <Pressable style={styles.tooltipOverlay} onPress={() => setShowContactTip(false)}>
          <View style={[styles.tooltipBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.tooltipTitle, { color: colors.text }]}>Contact Us</Text>
            <Text style={[styles.tooltipDesc, { color: colors.textSecondary }]}>
              Have a query? Reach out to us at
            </Text>
            <TouchableOpacity onPress={handleEmailPress}>
              <Text style={[styles.tooltipEmail, { color: colors.accent }]}>{CONTACT_EMAIL}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Genre Filter */}
      <GenreFilter
        selectedGenre={selectedGenre}
        onSelectGenre={handleGenreSelect}
      />

      {/* Error State */}
      {error && !loading && (
        <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.accent }]}
            onPress={handleRefresh}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading State */}
      {loading && (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading scripts...</Text>
        </View>
      )}

      {/* Script List */}
      {!loading && !error && (
        <FlatList
          data={scripts}
          keyExtractor={(item) => item.scriptId}
          renderItem={renderScript}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.text]}
              tintColor={colors.text}
              progressBackgroundColor={colors.secondaryBackground}
            />
          }
          contentContainerStyle={
            scripts.length === 0 ? styles.emptyList : undefined
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 12,
    borderBottomWidth: 0.5,
  },
  themeSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  themeSquare: {
    width: 20,
    height: 20,
    borderRadius: 3,
    borderWidth: 1.5,
  },
  themeSquareActive: {
    borderWidth: 2.5,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 10,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 20,
    fontWeight: '700',
  },
  uploadButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipBox: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 24,
    paddingHorizontal: 28,
    alignItems: 'center',
    maxWidth: 300,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  tooltipTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  tooltipDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  tooltipEmail: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listFooter: {
    height: 32,
  },
  footerLoader: {
    paddingVertical: 24,
    alignItems: 'center',
  },
});

export default HomeScreen;
