import { StyleSheet, Dimensions, Platform, StatusBar } from 'react-native';

const { width } = Dimensions.get('window');

// Keep the exact scaling logic from HomeScreen
export const scale = (size: number) => (width / 375) * size;
const HORIZONTAL_PADDING = scale(20);

export const transStyles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', // Matches HomeScreen
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  topNav: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: HORIZONTAL_PADDING, 
    height: scale(60) 
  },
  logoMini: { 
    fontSize: scale(20), 
    fontWeight: '800', 
    color: '#222D31', 
    letterSpacing: -1 
  },
  // REPLICATED CARD DESIGN
  card: { 
    width: '100%', // Changed from CARD_WIDTH to 100% for full-width list
    marginBottom: scale(15), 
    borderRadius: scale(12), 
    backgroundColor: '#FFF', 
    borderWidth: 1.5, 
    borderColor: '#cfd4da', 
    padding: scale(15), // Matches your transaction content padding
    overflow: 'hidden' 
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: scale(8) 
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
    marginBottom: scale(4)
  },
  // STATUS BADGES
  statusBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 5 
  },
  statusTextPlain: { 
    fontSize: scale(10), 
    fontWeight: '700', 
    textTransform: 'uppercase' 
  },
  // BUTTONS
  messageBtn: { 
    borderRadius: 12, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  messageBtnText: { 
    color: '#FFFFFF', 
    fontSize: scale(14), 
    fontWeight: '800' 
  },
  noResultsText: { 
    fontSize: scale(14), 
    color: '#cfd4da', 
    fontWeight: '700' 
  },
});