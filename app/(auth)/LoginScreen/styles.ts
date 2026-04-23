import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({


  
  // MAIN LAYOUT CONTAINERS
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5',
  },
  inner: { 
    flex: 1, 
    paddingHorizontal: 30, 
    justifyContent: 'flex-start',
    paddingBottom: 30,
  },



  // HEADER AND TYPOGRAPHY
  header: { 
    alignItems: 'flex-start', 
    marginBottom: 60
  },
  logo: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#222D31',
    letterSpacing: -0.5,
    marginBottom: 8
  },
  heroHeader: {
    fontSize: 35,
    fontWeight: '900',
    color: '#222D31',
    letterSpacing: -1.5,
  },
  quote: { 
    fontSize: 13, 
    textAlign: 'left',
    color: '#999', 
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: 18
  },



  // AUTH TOGGLE TABS (LOGIN/SIGNUP SELECTION)
  selectionWrapper: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 6,
    marginBottom: 35,
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



  // FORM AND INPUT FIELDS
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
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 5,
    zIndex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#222D31',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    borderRadius: 15,
    height: 60,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#1D3557',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  passwordInputContainer: { 
    backgroundColor: '#ffffff',
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: '#ffffff', 
    borderRadius: 15, 
    height: 60, 
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },



  // PRIMARY ACTION BUTTONS
  mainActionBtn: {
    backgroundColor: '#AF0B01',
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
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



  // SECONDARY LINKS AND FOOTER
  forgotBtn: {
    marginTop: 20,
    alignItems: 'center'
  },
  forgotText: {
    color: '#1d3557',
    fontSize: 14,
    fontWeight: '600'
  },
  footerLogoContainer: { 
    alignItems: 'center', 
    marginTop: 30 
  },
  footerLogo: { 
    width: 45, 
    height: 45, 
    resizeMode: 'contain',
    opacity: 0.6
  }

});