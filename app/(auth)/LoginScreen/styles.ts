import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  // --- LAYOUT & GLOBAL ---
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
  },
  inner: { 
    flex: 1, 
    paddingHorizontal: 30, 
    justifyContent: 'flex-start',
    paddingBottom: 30,
  },

  // --- HEADER & BRANDING ---
  header: { 
    alignItems: 'center', 
    marginBottom: 50 
  },
  logo: { 
    fontSize: 44, 
    fontWeight: '900', 
    color: '#222D31',
    letterSpacing: -1.5
  },
  quoteBar: {
    height: 3,
    width: 40,
    backgroundColor: '#AF0B01',
    marginVertical: 10,
    borderRadius: 2
  },
  quote: { 
    fontSize: 14, 
    color: '#1d3557', 
    fontWeight: '500',
    fontStyle: 'italic'
  },

  // --- SELECTION TOGGLE (LOGIN / REGISTER) ---
  selectionWrapper: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 6,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#cfd4da'
  },
  selectionBtn: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 12
  },
  activeBtn: {
    backgroundColor: '#222D31',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3
  },
  selectionText: {
    fontWeight: '700',
    color: '#1d3557',
    fontSize: 15
  },
  activeText: {
    color: '#FFFFFF'
  },

  // --- FORM & INPUT FIELDS ---
  form: {
    width: '100%'
  },
  inputBox: {
    marginBottom: 25,
    position: 'relative'
  },
  labelWrapper: {
    position: 'absolute',
    top: -10,
    left: 15,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 5,
    zIndex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#222D31',
  },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#cfd4da',
    borderRadius: 15,
    height: 60,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#1D3557'
  },
  passwordInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: '#cfd4da', 
    borderRadius: 15, 
    height: 60, 
    paddingHorizontal: 20 
  },

  // --- ACTION BUTTONS ---
  mainActionBtn: {
    backgroundColor: '#AF0B01',
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#AF0B01',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6
  },
  mainActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1
  },
  forgotBtn: {
    marginTop: 20,
    alignItems: 'center'
  },
  forgotText: {
    color: '#1d3557',
    fontSize: 14,
    fontWeight: '600'
  },

  // --- FOOTER BRANDING ---
  footerLogoContainer: { 
    alignItems: 'center', 
    marginTop: 20 
  },
  footerLogo: { 
    width: 50, 
    height: 50, 
    resizeMode: 'contain' 
  }
});