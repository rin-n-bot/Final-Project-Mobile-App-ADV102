import { Dimensions, Platform, StatusBar, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');
export const scale = (size: number) => (width / 375) * size;

export const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // TOP NAV — exact match to home/transactions
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    height: scale(60),
  },
  navTitle: {
    flex: 1,
    fontSize: scale(20),
    fontWeight: '800',
    color: '#222D31',
    letterSpacing: -1,
    marginLeft: scale(15),
  },
  navAction: {
    fontSize: scale(14),
    fontWeight: '800',
    color: '#AF0B01',
  },

  // AVATAR SECTION
  avatarSection: {
    alignItems: 'center',
    paddingTop: scale(28),
    paddingBottom: scale(24),
    paddingHorizontal: scale(20),

  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: scale(14),
  },
  avatar: {
    width: scale(88),
    height: scale(88),
    borderRadius: scale(44),
    backgroundColor: '#222D31',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: scale(88),
    height: scale(88),
    borderRadius: scale(44),
  },
  avatarInitials: {
    fontSize: scale(30),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#AF0B01',
    borderRadius: scale(11),
    width: scale(22),
    height: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // USERNAME — same weight/color as greetingText in home
  userName: {
    fontSize: scale(18),
    fontWeight: '800',
    color: '#222D31',
    letterSpacing: -0.5,
    textTransform: 'lowercase',
  },
  // EMAIL — same as cardTimestamp in home
  userEmail: {
    fontSize: scale(12),
    fontWeight: '700',
    color: '#9CA3AF',
    marginTop: scale(3),
    textTransform: 'lowercase',
  },
  // MEMBER SINCE — same as endOfListText in home
  memberSince: {
    fontSize: scale(12),
    fontWeight: '700',
    color: '#9CA3AF',
    marginTop: scale(4),
  },

  // STATS — same card border as home listing cards
  statsRow: {
    flexDirection: 'row',
    marginTop: scale(-20),
    gap: scale(10),
    width: '100%',
  },
  statCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#cfd4da',
    borderRadius: scale(12),
    paddingVertical: scale(14),
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  statNumber: {
    fontSize: scale(20),
    fontWeight: '800',
    color: '#222D31',
  },
  statLabel: {
    fontSize: scale(11),
    fontWeight: '800',
    color: '#9CA3AF',
    marginTop: scale(2),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // SECTION LABEL — same as home sectionLabel
  section: {
    paddingHorizontal: scale(20),
    paddingTop: scale(10),
    paddingBottom: scale(5),
  },
  sectionLabel: {
    fontSize: scale(15),
    fontWeight: '800',
    color: '#222D31',
    marginBottom: scale(10),
  },

  // INFO CARD — same border/radius as home listing card
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12),
    borderWidth: 1.5,
    borderColor: '#cfd4da',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(15),
    paddingVertical: scale(14),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoIcon: {
    marginRight: scale(12),
  },
  infoTextBlock: {
    flex: 1,
  },
  // ROW LABEL — same as cardCategory in home (muted uppercase)
  infoRowLabel: {
    fontSize: scale(10),
    fontWeight: '800',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // ROW VALUE — same as cardTitle in home
  infoRowValue: {
    fontSize: scale(13),
    fontWeight: '600',
    color: '#222D31',
    marginTop: scale(2),
  },

  // BIO INPUT — same font as cardTitle
  bioInput: {
    fontSize: scale(15),

    color: '#222D31',
    marginTop: scale(2),
    padding: 0,
    minHeight: scale(44),
  },
  charCount: {
    fontSize: scale(12),
    fontWeight: '700',
    color: '#999',
    marginTop: scale(6),
    textAlign: 'right',
  },

  // SAVE BUTTON — exact match to home messageBtn
  saveBtn: {
    marginHorizontal: scale(20),
    marginTop: scale(28),
    marginBottom: scale(40),
    backgroundColor: '#222D31',
    borderRadius: scale(12),
    height: scale(50),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scale(8),
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: scale(15),
    fontWeight: '800',
  },
  saveBtnDisabled: {
    backgroundColor: '#cfd4da',
  },
});