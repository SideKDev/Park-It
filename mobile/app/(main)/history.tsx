import { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useParkingStore } from '@/stores/parkingStore';
import { HistoryCard } from '@/components/ParkingCard';
import { colors } from '@/constants/colors';
import { ParkingSession } from '@/types';

export default function HistoryScreen() {
  const {
    sessionHistory,
    historyLoading,
    fetchHistory,
  } = useParkingStore();

  useEffect(() => {
    fetchHistory(1);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const handleLoadMore = useCallback(() => {
    // Calculate next page based on current items
    const currentPage = Math.ceil(sessionHistory.length / 20);
    fetchHistory(currentPage + 1);
  }, [sessionHistory.length, fetchHistory]);

  const handleSessionPress = (session: ParkingSession) => {
    // Could navigate to a detail view in the future
    console.log('Session pressed:', session.id);
  };

  const renderItem = ({ item }: { item: ParkingSession }) => (
    <View style={styles.itemContainer}>
      <HistoryCard session={item} onPress={() => handleSessionPress(item)} />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="time-outline" size={48} color={colors.text.muted} />
      </View>
      <Text style={styles.emptyTitle}>No Parking History</Text>
      <Text style={styles.emptyText}>
        Your past parking sessions will appear here.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.listHeaderText}>
        {sessionHistory.length} {sessionHistory.length === 1 ? 'session' : 'sessions'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
      </View>

      {/* List */}
      <FlatList
        data={sessionHistory}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={sessionHistory.length > 0 ? renderHeader : null}
        ListEmptyComponent={!historyLoading ? renderEmpty : null}
        refreshControl={
          <RefreshControl
            refreshing={historyLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  listHeader: {
    paddingVertical: 12,
  },
  listHeaderText: {
    fontSize: 14,
    color: colors.text.muted,
  },
  itemContainer: {
    marginVertical: 6,
  },
  separator: {
    height: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
