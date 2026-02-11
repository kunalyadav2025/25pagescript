import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Script, RootStackParamList, Genre } from '../types';
import { apiClient } from '../api/client';
import { formatDate } from '../utils';
import {
  ContactCard,
  CommentList,
  AddCommentForm,
  LikeDislikeButtons,
} from '../components';
import { useTheme } from '../context';

type FontSizeOption = 'normal' | 'large' | 'xlarge';

const FONT_SCALES: Record<FontSizeOption, number> = {
  normal: 1,
  large: 1.2,
  xlarge: 1.4,
};

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

function getPdfViewerHtml(pdfUrl: string, fontScale: number = 1, themeColors?: { background: string; text: string; textSecondary: string; divider: string; error: string }): string {
  const escapedUrl = pdfUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const baseFontSize = Math.round(17 * fontScale);
  const baseLineHeight = Math.round(28 * fontScale);
  const bg = themeColors?.background || '#FFFFFF';
  const text = themeColors?.text || '#555555';
  const textSec = themeColors?.textSecondary || '#8E8E8E';
  const divider = themeColors?.divider || '#EFEFEF';
  const errorColor = themeColors?.error || '#ED4956';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      overflow: hidden;
      background: ${bg};
      font-family: Georgia, 'Times New Roman', Times, serif;
    }
    #viewer {
      padding: 16px;
    }
    .page {
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid ${divider};
    }
    .page:last-child {
      border-bottom: none;
    }
    .page-number {
      font-size: 14px;
      color: #0095F6;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 16px;
      font-weight: bold;
      text-align: center;
    }
    .page-text {
      font-size: ${baseFontSize}px;
      line-height: ${baseLineHeight}px;
      color: ${text};
      text-align: justify;
    }
    .page-text p {
      margin-bottom: 16px;
    }
    .page-text p:last-child {
      margin-bottom: 0;
    }
    #error {
      text-align: center;
      padding: 40px 20px;
      color: ${errorColor};
      font-size: 15px;
      display: none;
    }
  </style>
</head>
<body>
  <div id="error"></div>
  <div id="viewer"></div>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    async function renderPDF(url) {
      try {
        var pdf = await pdfjsLib.getDocument(url).promise;
        var viewer = document.getElementById('viewer');

        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'loaded' }));

        for (var i = 1; i <= pdf.numPages; i++) {
          var page = await pdf.getPage(i);
          var textContent = await page.getTextContent();

          var pageDiv = document.createElement('div');
          pageDiv.className = 'page';

          var pageNum = document.createElement('div');
          pageNum.className = 'page-number';
          pageNum.textContent = 'Page ' + i + ' of ' + pdf.numPages;
          pageDiv.appendChild(pageNum);

          var textDiv = document.createElement('div');
          textDiv.className = 'page-text';

          // Extract text and flow as paragraphs
          var paragraphs = [];
          var currentParagraph = '';
          var lastY = null;

          textContent.items.forEach(function(item) {
            if (!item.str && item.str !== '') return;
            var y = item.transform[5];

            if (lastY !== null) {
              var yDiff = Math.abs(y - lastY);
              if (yDiff > 15) {
                // New paragraph
                if (currentParagraph.trim()) {
                  paragraphs.push(currentParagraph.trim());
                }
                currentParagraph = item.str;
              } else if (yDiff > 2) {
                // Same paragraph, new line - join with space
                currentParagraph += ' ' + item.str;
              } else {
                // Same line
                currentParagraph += item.str;
              }
            } else {
              currentParagraph = item.str;
            }
            lastY = y;
          });
          if (currentParagraph.trim()) {
            paragraphs.push(currentParagraph.trim());
          }

          // Create paragraph elements
          paragraphs.forEach(function(para) {
            var p = document.createElement('p');
            p.textContent = para;
            textDiv.appendChild(p);
          });

          pageDiv.appendChild(textDiv);
          viewer.appendChild(pageDiv);
        }

        var totalHeight = document.body.scrollHeight;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', value: totalHeight }));
      } catch (e) {
        document.getElementById('error').style.display = 'block';
        document.getElementById('error').textContent = 'Failed to load script. Please try again.';
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'loaded' }));
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', value: 120 }));
      }
    }

    renderPDF('${escapedUrl}');
  <\/script>
</body>
</html>`;
}

type Props = NativeStackScreenProps<RootStackParamList, 'ScriptDetail'>;

export function ScriptDetailScreen({ route, navigation }: Props) {
  const { scriptId } = route.params;
  const { colors } = useTheme();
  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentRefreshTrigger, setCommentRefreshTrigger] = useState(0);
  const [scriptContentHeight, setScriptContentHeight] = useState(0);
  const [scriptContentLoading, setScriptContentLoading] = useState(true);
  const [fontSize, setFontSize] = useState<FontSizeOption>('normal');

  const scale = FONT_SCALES[fontSize];

  // Reset WebView state when font size changes (WebView re-mounts via key prop)
  useEffect(() => {
    setScriptContentLoading(true);
    setScriptContentHeight(0);
  }, [fontSize]);

  const loadScript = useCallback(async () => {
    try {
      const data = await apiClient.getScriptById(scriptId);
      setScript(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load script';
      setError(message);
    }
  }, [scriptId]);

  useEffect(() => {
    setLoading(true);
    loadScript().finally(() => setLoading(false));
  }, [loadScript]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadScript();
    setRefreshing(false);
  };

  const handleCommentAdded = () => {
    // Increment to trigger comment list refresh
    setCommentRefreshTrigger((prev) => prev + 1);
    // Update comment count locally
    if (script) {
      setScript({ ...script, commentCount: script.commentCount + 1 });
    }
  };

  const genreColor = script ? (GENRE_COLORS[script.genre] || GENRE_COLORS['Other']) : '#0095F6';

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading script...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !script) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error || 'Script not found'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              loadScript().finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backText, { color: colors.textSecondary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.text]}
            tintColor={colors.text}
            progressBackgroundColor={colors.secondaryBackground}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header Section - Compact */}
        <View style={[styles.heroSection, { backgroundColor: colors.secondaryBackground, borderBottomColor: colors.border }]}>
          <View style={[styles.heroAccent, { backgroundColor: genreColor }]} />
          <View style={styles.heroContent}>
            {/* Top Row: Meta + Edit */}
            <View style={styles.topRow}>
              <View style={styles.metaRow}>
                <View style={[styles.genreBadge, { backgroundColor: genreColor }]}>
                  <Text style={styles.genreText}>{script.genre}</Text>
                </View>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{script.language}</Text>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>•</Text>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{script.pageCount}p</Text>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>•</Text>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{formatDate(script.createdAt)}</Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('EditScript', { scriptId: script.scriptId })}
                activeOpacity={0.7}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Title + Like/Dislike Row */}
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{script.title}</Text>
              <LikeDislikeButtons
                scriptId={script.scriptId}
                initialLikeCount={script.likeCount}
                initialDislikeCount={script.dislikeCount}
                compact
              />
            </View>

            {/* Copyright Row */}
            <View
              style={[
                styles.copyrightBadge,
                script.copyright.hasCertificate
                  ? styles.copyrightYes
                  : styles.copyrightNo,
              ]}
            >
              <Text style={styles.copyrightIcon}>
                {script.copyright.hasCertificate ? '\u{1F512}' : '\u{1F513}'}
              </Text>
              <Text
                style={[
                  styles.copyrightText,
                  script.copyright.hasCertificate
                    ? styles.copyrightYesText
                    : styles.copyrightNoText,
                ]}
              >
                {script.copyright.hasCertificate
                  ? `Copyright: ${script.copyright.certificateNumber}`
                  : 'Not Copyrighted'}
              </Text>
            </View>
          </View>
        </View>

        {/* Font Size Control - Compact */}
        <View style={[styles.fontSizeBar, { backgroundColor: colors.secondaryBackground, borderBottomColor: colors.divider }]}>
          <Text style={[styles.fontSizeLabel, { color: colors.textSecondary }]}>Size</Text>
          <View style={styles.fontSizeOptions}>
            <TouchableOpacity
              style={[styles.fontSizeBtn, { backgroundColor: colors.background, borderColor: colors.border }, fontSize === 'normal' && styles.fontSizeBtnActive]}
              onPress={() => setFontSize('normal')}
              activeOpacity={0.7}
            >
              <Text style={[styles.fontSizeBtnText, { fontSize: 12, color: colors.text }, fontSize === 'normal' && styles.fontSizeBtnTextActive]}>A</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fontSizeBtn, { backgroundColor: colors.background, borderColor: colors.border }, fontSize === 'large' && styles.fontSizeBtnActive]}
              onPress={() => setFontSize('large')}
              activeOpacity={0.7}
            >
              <Text style={[styles.fontSizeBtnText, { fontSize: 15, color: colors.text }, fontSize === 'large' && styles.fontSizeBtnTextActive]}>A</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fontSizeBtn, { backgroundColor: colors.background, borderColor: colors.border }, fontSize === 'xlarge' && styles.fontSizeBtnActive]}
              onPress={() => setFontSize('xlarge')}
              activeOpacity={0.7}
            >
              <Text style={[styles.fontSizeBtnText, { fontSize: 18, color: colors.text }, fontSize === 'xlarge' && styles.fontSizeBtnTextActive]}>A</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logline & Synopsis Section - Compact */}
        <View style={[styles.storySection, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
          <View style={styles.storyRow}>
            <View style={styles.storyCol}>
              <Text style={[styles.sectionLabel, { color: colors.accent }]}>THE PITCH</Text>
              <Text style={[styles.logline, { color: colors.text }]} numberOfLines={3}>"{script.logline}"</Text>
            </View>
            <View style={styles.storyCol}>
              <Text style={[styles.sectionLabel, { color: colors.accent }]}>SYNOPSIS</Text>
              <Text style={[styles.synopsis, { color: colors.textSecondary }]} numberOfLines={4}>{script.synopsis}</Text>
            </View>
          </View>
        </View>

        {/* Full Script Content */}
        {script.pdfUrl && (
          <View style={[styles.scriptContentContainer, { borderBottomColor: colors.divider }]}>
            {scriptContentLoading && (
              <View style={styles.scriptContentLoading}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[styles.scriptContentLoadingText, { color: colors.textSecondary }]}>Loading script...</Text>
              </View>
            )}
            <WebView
              key={`pdf-${fontSize}`}
              source={{ html: getPdfViewerHtml(script.pdfUrl, scale, { background: colors.background, text: colors.text, textSecondary: colors.textSecondary, divider: colors.divider, error: colors.error }) }}
              style={{ height: scriptContentHeight || 300 }}
              scrollEnabled={false}
              nestedScrollEnabled={false}
              onMessage={(event) => {
                try {
                  const msg = JSON.parse(event.nativeEvent.data);
                  if (msg.type === 'loaded') setScriptContentLoading(false);
                  if (msg.type === 'height') setScriptContentHeight(msg.value);
                } catch {}
              }}
              javaScriptEnabled
              originWhitelist={['*']}
            />
          </View>
        )}

        {/* Writer Contact */}
        <ContactCard
          writerName={script.writer.name}
          mobile={script.writer.mobile}
        />

        {/* Comments Section */}
        <CommentList
          scriptId={script.scriptId}
          commentCount={script.commentCount}
          refreshTrigger={commentRefreshTrigger}
        />

        {/* Add Comment Form */}
        <AddCommentForm
          scriptId={script.scriptId}
          onCommentAdded={handleCommentAdded}
        />

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backText: {
    fontWeight: '600',
  },
  heroSection: {
    borderBottomWidth: 0.5,
  },
  heroAccent: {
    height: 3,
    width: '100%',
  },
  heroContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  topRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
  genreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  genreText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    flex: 1,
  },
  copyrightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  copyrightYes: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  copyrightNo: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  copyrightIcon: {
    fontSize: 12,
  },
  copyrightText: {
    fontSize: 12,
    fontWeight: '600',
  },
  copyrightYesText: {
    color: '#10B981',
  },
  copyrightNoText: {
    color: '#F97316',
  },
  fontSizeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 0.5,
  },
  fontSizeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  fontSizeOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  fontSizeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontSizeBtnActive: {
    backgroundColor: '#0095F6',
    borderColor: '#0095F6',
  },
  fontSizeBtnText: {
    fontWeight: '700',
  },
  fontSizeBtnTextActive: {
    color: '#FFFFFF',
  },
  storySection: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  storyRow: {
    flexDirection: 'row',
    gap: 16,
  },
  storyCol: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  logline: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  synopsis: {
    fontSize: 12,
    lineHeight: 17,
  },
  scriptContentContainer: {
    borderBottomWidth: 0.5,
  },
  scriptContentLoading: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scriptContentLoadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  editButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0095F6',
    backgroundColor: 'transparent',
  },
  editButtonText: {
    color: '#0095F6',
    fontSize: 11,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});

export default ScriptDetailScreen;
