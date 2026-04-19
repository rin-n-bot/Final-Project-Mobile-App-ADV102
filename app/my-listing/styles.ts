import { StyleSheet } from 'react-native';
import { COLORS, LAYOUT, scale, SPACING } from '../../styles/global'; // Adjust path as needed

export const listingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.accent,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  headerContent: {
    height: scale(50),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: LAYOUT.horizontalPadding,
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: scale(18),
    fontWeight: '800',
    textAlign: 'center',
    marginRight: scale(28), // Offset to keep text centered against back button
  },
  listContainer: {
    padding: LAYOUT.horizontalPadding,
    paddingBottom: scale(100),
    marginTop: scale(-10),
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: LAYOUT.borderRadius,
    marginBottom: SPACING.md, // Match Transaction spacing
    flexDirection: 'row',
    padding: scale(15), // Matching scale(15) from Transaction card
    borderWidth: 1.5,
    borderColor: '#cfd4da', // The specific border color you wanted
    // Simplified shadows to match the cleaner transaction look
    elevation: 0, 
    shadowColor: 'transparent', 
  },
  // --- ADD THESE TO MATCH TRANSACTION DESIGN ---
  statusBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(4),
    alignSelf: 'flex-start', // Important: makes badge only as wide as text
    marginTop: scale(6),
  },
  statusText: {
    fontSize: scale(10),
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  itemImage: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(10),
    backgroundColor: COLORS.lightBackground,
  },
  itemInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: scale(15),
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  itemPrice: {
    fontSize: scale(14),
    fontWeight: '600',
    color: COLORS.accent,
    marginTop: SPACING.xs,
  },
  actions: {
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingLeft: SPACING.sm,
  },
  actionBtn: {
    padding: SPACING.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scale(250),
  },
  emptyText: {
    fontSize: scale(16),
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: SPACING.md,
  }
});