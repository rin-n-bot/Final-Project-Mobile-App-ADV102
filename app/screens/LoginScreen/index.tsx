import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView, 
  TouchableWithoutFeedback, 
  Keyboard,
  Image 
} from 'react-native';
import { auth, db } from '../../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

import { styles } from './styles';
import { AuthToggle } from './components/AuthToggle';
import { InputField } from './components/InputField';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showpassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const router = useRouter();

  const handleAuth = async () => {
    if (!email.endsWith('@hcdc.edu.ph')) {
        alert('Only HCDC email is allowed');
        return;
    }
    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    if (!isLogin && password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        if (isLogin) {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          
          if (!userCredential.user.emailVerified) {
              alert('Please verify your HCDC email first!');
              return;
          }

          // Create/Update user document on Login
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            lastLogin: serverTimestamp(),
          }, { merge: true });

          router.replace('/screens/HomeScreen');
        } else {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          
          // Create user document on Registration
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            createdAt: serverTimestamp(),
          }, { merge: true });

          await sendEmailVerification(userCredential.user);
          alert('Verification email sent! Check your HCDC email.');
        }

        setEmail('');
        setPassword('');
        setConfirmPassword('');
    } catch (error: any) {
        alert(error.message);
    }
  };

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
        showSub.remove();
        hideSub.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[styles.inner, keyboardVisible && !isLogin ? { paddingTop: 80 } : { paddingTop: 150 }]}>
            
            <View style={styles.header}>
              <Text style={styles.logo}>Cross<Text style={{color: '#AF0B01'}}>Rent</Text></Text>
              <View style={styles.quoteBar} />
              <Text style={styles.quote}>"Where Crossians share."</Text>
            </View>

            <AuthToggle isLogin={isLogin} setIsLogin={setIsLogin} />

            <View style={styles.form}>
              <InputField 
                label="EMAIL ADDRESS"
                placeholder="name@hcdc.edu.ph"
                value={email}
                onChangeText={setEmail}
              />

              <InputField 
                label="PASSWORD"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showpassword}
                showPasswordToggle
                isPasswordVisible={showpassword}
                onToggleVisibility={() => setShowPassword(!showpassword)}
              />

              {!isLogin && (
                <InputField 
                  label="CONFIRM PASSWORD"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  showPasswordToggle
                  isPasswordVisible={showConfirmPassword}
                  onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              )}

              <TouchableOpacity style={styles.mainActionBtn} onPress={handleAuth}>
                <Text style={styles.mainActionText}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Text>
              </TouchableOpacity>
              
              {isLogin && (
                <TouchableOpacity style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              <View style={styles.footerLogoContainer}>
                <Image 
                  source={require('../../../assets/hcdc_logo.png')} 
                  style={styles.footerLogo}
                />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}