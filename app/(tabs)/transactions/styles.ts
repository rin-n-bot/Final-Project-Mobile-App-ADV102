import { StyleSheet, Dimensions, Platform, StatusBar } from 'react-native';

const { width } = Dimensions.get('window');



// SCALING AND LAYOUT UTILITIES
export const scale = (size: number) => (width / 375) * size;
const HORIZONTAL_PADDING = scale(20);



export const transStyles = StyleSheet.create({

  // SCREEN AND TOP NAVIGATION
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    height: scale(60),
  },
  logoMini: {
    fontSize: scale(20),
    fontWeight: '800',
    color: '#222D31',
    letterSpacing: -1,
  },



  // TRANSACTION CARD BASE
  card: {
    width: '100%',
    marginBottom: scale(10),
    borderRadius: scale(12),
    backgroundColor: '#FFF',
    padding: scale(15),
    overflow: 'hidden',
  },



  // CARD CONTENT AND TYPOGRAPHY
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  cardTitle: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#222D31',
  },
  cardTimestamp: {
    fontSize: scale(13),
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: scale(4),
  },



  // STATUS INDICATORS AND BADGES
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
  },
  statusTextPlain: {
    fontSize: scale(10),
    fontWeight: '700',
    textTransform: 'uppercase',
  },



  // ACTION BUTTONS AND INTERACTION
  messageBtn: {
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBtnText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: '800',
  },



  // EMPTY STATE AND FALLBACKS
  noResultsText: {
    fontSize: scale(14),
    color: '#cfd4da',
    fontWeight: '700',
  },

});