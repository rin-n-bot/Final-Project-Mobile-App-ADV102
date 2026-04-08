import { StyleSheet, Dimensions, Platform, StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');
export const scale = (size: number) => (width / 375) * size;
export const HORIZONTAL_PADDING = scale(20);
export const DRAWER_WIDTH = width * 0.75;
const GAP = scale(12);
export const CARD_WIDTH = (width - (HORIZONTAL_PADDING * 2) - GAP) / 2;

export const styles = StyleSheet.create({
  // --- LAYOUT & GLOBAL ---
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  overlay: { 
    position: 'absolute', 
    top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    zIndex: 99 
  },
  divider: { 
    height: 1, 
    backgroundColor: '#F0F0F0', 
    marginBottom: scale(20) 
  },

  // --- DRAWER NAVIGATION ---
  drawer: { 
    position: 'absolute', 
    left: 0, top: 0, bottom: 0, 
    width: DRAWER_WIDTH, 
    backgroundColor: '#222D31', 
    zIndex: 100, 
    elevation: 5, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 20 
  },
  drawerHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(241, 250, 238, 0.1)' 
  },
  drawerItems: { 
    padding: 20 
  },
  drawerItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 25 
  },
  drawerItemText: { 
    marginLeft: 15, 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#FFFFFF' 
  },

  // --- TOP NAVIGATION ---
  topNav: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: HORIZONTAL_PADDING, 
    height: scale(60) 
  },
  logoMini: { 
    fontSize: scale(24), 
    fontWeight: '900', 
    color: '#222D31', 
    letterSpacing: -1 
  },
  profileCircle: { 
    width: scale(32), 
    height: scale(32), 
    borderRadius: scale(16), 
    backgroundColor: '#222D31', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  // --- GREETING & CAMPUS TOGGLE ---
  greetingContainer: { 
    paddingHorizontal: HORIZONTAL_PADDING, 
    paddingTop: scale(10), 
    paddingBottom: scale(15) 
  },
  hcdcToggle: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: scale(8), 
    alignSelf: 'flex-start' 
  },
  hcdcText: { 
    fontSize: scale(14), 
    fontWeight: '800', 
    color: '#0038A8', 
    marginRight: scale(4), 
    letterSpacing: 0.5 
  },
  greetingText: { 
    fontSize: scale(24), 
    fontWeight: '800', 
    color: '#222D31', 
    lineHeight: scale(24.5), 
    letterSpacing: -0.5 
  },

  // --- SEARCH SECTION ---
  searchSection: { 
    paddingHorizontal: HORIZONTAL_PADDING, 
    marginBottom: scale(15) 
  },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    height: scale(55), 
    borderRadius: 15, 
    paddingHorizontal: 15, 
    borderWidth: 1.5, 
    borderColor: '#cfd4da' 
  },
  searchInput: { 
    flex: 1, 
    fontSize: scale(15), 
    color: '#1D3557' 
  },

  // --- CATEGORY GRID ---
  sectionLabel: { 
    paddingHorizontal: HORIZONTAL_PADDING, 
    fontSize: scale(15), 
    fontWeight: '800', 
    color: '#222D31', 
    marginBottom: scale(15) 
  },
  categoryGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: HORIZONTAL_PADDING, 
    justifyContent: 'space-between', 
    marginBottom: scale(5) 
  },
  categoryCard: { 
    width: (width - (HORIZONTAL_PADDING * 2) - scale(20)) / 3, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 15, 
    paddingVertical: scale(15), 
    alignItems: 'center', 
    marginBottom: scale(10), 
    borderWidth: 1.5, 
    borderColor: '#cfd4da' 
  },
  activeCategoryCard: { 
    backgroundColor: '#222D31', 
    borderColor: '#222D31' 
  },
  categoryCardText: { 
    marginTop: scale(8), 
    fontSize: scale(11), 
    fontWeight: '700', 
    color: '#222D31' 
  },
  activeCategoryCardText: { 
    color: '#FFFFFF' 
  },

  // --- LISTING CARDS ---
  scrollContent: { 
    paddingBottom: scale(100) 
  },
  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: HORIZONTAL_PADDING, 
    justifyContent: 'space-between' 
  },
  card: { 
    width: CARD_WIDTH, 
    marginBottom: scale(15), 
    borderRadius: scale(12), 
    backgroundColor: '#FFF', 
    borderWidth: 1, 
    borderColor: '#cfd4da', 
    overflow: 'hidden' 
  },
  imageContainer: { 
    width: '100%', 
    aspectRatio: 1.1 
  },
  cardImage: { 
    width: '100%', 
    height: '100%' 
  },
  cardContent: { 
    paddingHorizontal: scale(10), 
    paddingVertical: scale(8) 
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: scale(2) 
  },
  cardCategory: { 
    fontSize: scale(10), 
    color: '#AF0B01', 
    fontWeight: '800', 
    textTransform: 'uppercase' 
  },
  cardTitle: { 
    fontSize: scale(13), 
    fontWeight: '600', 
    color: '#222D31', 
    marginBottom: scale(4) 
  },
  cardPricePlain: { 
    fontSize: scale(14), 
    fontWeight: '800', 
    color: '#222D31' 
  },
  cardTimestamp: { 
    fontSize: scale(12), 
    fontWeight: '700', 
    color: '#9CA3AF', 
    textTransform: 'lowercase' 
  },

  // --- STATUS & LOADER ---
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
  loaderContainer: { 
    height: scale(200), 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  noResultsContainer: { 
    width: '100%', 
    paddingVertical: scale(40), 
    alignItems: 'center' 
  },
  noResultsText: { 
    fontSize: scale(14), 
    color: '#cfd4da', 
    fontWeight: '700' 
  },
  endOfListText: { 
    textAlign: 'center', 
    color: '#cfd4da', 
    fontSize: scale(14), 
    fontWeight: '700', 
    marginTop: scale(10), 
    marginBottom: scale(10) 
  },

  // --- BOTTOM TAB NAVIGATION ---
  bottomNav: { 
    position: 'absolute', 
    bottom: 0, width: '100%', 
    height: scale(75), 
    backgroundColor: '#222D31', 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    paddingBottom: Platform.OS === 'ios' ? 20 : 10 
  },
  navItem: { 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  navLabel: { 
    fontSize: scale(10), 
    fontWeight: '800', 
    color: 'rgba(255,255,255,0.4)', 
    marginTop: 4 
  },
  addBtnContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: scale(-25) 
  },
  addBtnCircle: { 
    width: scale(54), 
    height: scale(54), 
    borderRadius: scale(27), 
    backgroundColor: '#AF0B01', 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 3 
  },
  addLabel: { 
    fontSize: scale(10), 
    fontWeight: '800', 
    color: '#FFFFFF', 
    marginTop: 4 
  },

  // --- ITEM MODAL DETAILS ---
  modalContainer: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: HORIZONTAL_PADDING, 
    height: scale(60), 
    backgroundColor: '#AF0B01' 
  },
  modalHeaderTitle: { 
    fontSize: scale(16), 
    fontWeight: '800', 
    color: '#FFFFFF' 
  },
  modalCloseBtn: { 
    padding: scale(5) 
  },
  modalImage: { 
    width: width, 
    height: height * 0.4, 
    resizeMode: 'cover' 
  },
  modalInfoSection: { 
    padding: HORIZONTAL_PADDING 
  },
  modalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: scale(10) 
  },
  modalCategory: { 
    fontSize: scale(12), 
    fontWeight: '800', 
    color: '#AF0B01', 
    textTransform: 'uppercase' 
  },
  modalTitle: { 
    fontSize: scale(22), 
    fontWeight: '700', 
    color: '#222D31', 
    marginBottom: scale(5) 
  },
  modalPrice: { 
    fontSize: scale(20), 
    fontWeight: '800', 
    color: '#222D31', 
    marginBottom: scale(20) 
  },
  detailLabel: { 
    fontSize: scale(14), 
    fontWeight: '800', 
    color: '#222D31', 
    marginBottom: scale(8) 
  },
  detailValue: { 
    fontSize: scale(14), 
    color: '#555', 
    lineHeight: scale(20), 
    marginBottom: scale(20) 
  },
  contactRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: scale(12) 
  },
  detailValueContact: { 
    fontSize: scale(14), 
    fontWeight: '600', 
    color: '#222D31', 
    marginLeft: 8 
  },
  modalFooter: { 
    position: 'absolute', 
    bottom: 0, width: '100%', 
    padding: HORIZONTAL_PADDING, 
    backgroundColor: '#FFFFFF', 
    borderTopWidth: 1, 
    borderTopColor: '#F0F0F0', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingBottom: Platform.OS === 'ios' ? 30 : 20 
  },
  saveBtn: { 
    width: scale(50), 
    height: scale(50), 
    borderRadius: 12, 
    borderWidth: 1.5, 
    borderColor: '#cfd4da', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: scale(12) 
  },
  messageBtn: { 
    flex: 1, 
    height: scale(50), 
    backgroundColor: '#222D31', 
    borderRadius: 12, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  messageBtnText: { 
    color: '#FFFFFF', 
    fontSize: scale(15), 
    fontWeight: '800' 
  },
});