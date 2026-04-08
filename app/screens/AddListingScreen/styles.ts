import { StyleSheet, Platform, StatusBar } from 'react-native';

const s = StyleSheet.create({
  mainWrapper: { 
    flex: 1, 
    backgroundColor: '#FFF' 
  },
  redHeader: { 
    backgroundColor: '#AF0B01', 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  headerContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingVertical: 15 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#FFF' 
  },
  postBtnText: { 
    color: '#FFF', 
    fontWeight: '800', 
    fontSize: 16 
  },
  iconButton: { 
    padding: 5 
  },
  formContainer: { 
    padding: 20 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#222D31', 
    marginBottom: 10 
  },
  input: { 
    backgroundColor: '#ffffff', 
    borderWidth: 1.5, 
    borderColor: '#cfd4da', 
    borderRadius: 10, 
    padding: 12, 
    marginBottom: 20,
    fontSize: 15,
    color: '#222D31'
  },
  textArea: { 
    height: 100, 
    textAlignVertical: 'top' 
  },
  chipGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'flex-start', 
    gap: 10, 
    marginBottom: 25 
  },
  chip: { 
    paddingVertical: 10, 
    borderRadius: 25, 
    borderWidth: 1.5, 
    alignItems: 'center' 
  },
  chipInactive: { 
    backgroundColor: '#FFF', 
    borderColor: '#cfd4da' 
  },
  chipActive: { 
    backgroundColor: '#222D31', 
    borderColor: '#222D31' 
  },
  chipActiveBlack: { 
    backgroundColor: '#222D31', 
    borderColor: '#222D31' 
  },
  chipText: { 
    color: '#666', 
    fontWeight: '700', 
    fontSize: 12 
  },
  chipTextActive: { 
    color: '#FFF' 
  },
  // ... existing styles
  imageButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cfd4da',
    borderStyle: 'dashed', // Dashed border for visual cue
    borderRadius: 10,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden'
  },
  imagePlaceholder: {
    alignItems: 'center',
    gap: 5
  },
  imageButtonText: {
    color: '#AF0B01',
    fontWeight: '700',
    fontSize: 14
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  // ... continue to centeredFooter
  centeredFooter: { 
    width: '100%', 
    alignItems: 'center', 
    marginVertical: 20 
  },
  infoBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  infoText: { 
    color: '#999', 
    fontSize: 12 
  }
});

export default s;