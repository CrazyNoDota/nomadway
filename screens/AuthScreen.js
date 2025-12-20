import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    StatusBar,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLocalization } from '../contexts/LocalizationContext';

const { width, height } = Dimensions.get('window');

export default function AuthScreen({ navigation }) {
    const { login, register, forgotPassword, isLoading } = useAuth();
    const { theme } = useTheme();
    const { t, isRussian } = useLocalization();
    
    const [mode, setMode] = useState('login'); // login, register, forgot
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Animation values using standard Animated API
    const logoScale = useRef(new Animated.Value(0.5)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const formTranslateY = useRef(new Animated.Value(50)).current;
    const formOpacity = useRef(new Animated.Value(0)).current;
    const shakeValue = useRef(new Animated.Value(0)).current;
    const spinValue = useRef(new Animated.Value(0)).current;

    // Spinning animation for loading
    useEffect(() => {
        if (isSubmitting) {
            Animated.loop(
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            spinValue.setValue(0);
        }
    }, [isSubmitting]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    // Initial animations
    useEffect(() => {
        Animated.parallel([
            Animated.spring(logoScale, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();

        setTimeout(() => {
            Animated.parallel([
                Animated.spring(formTranslateY, {
                    toValue: 0,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(formOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]).start();
        }, 300);
    }, []);

    const shakeForm = () => {
        Animated.sequence([
            Animated.timing(shakeValue, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeValue, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeValue, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeValue, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeValue, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const validateForm = () => {
        const newErrors = {};

        if (!email.trim()) {
            newErrors.email = isRussian ? 'Введите email' : 'Enter email';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = isRussian ? 'Неверный формат email' : 'Invalid email format';
        }

        if (mode !== 'forgot') {
            if (!password) {
                newErrors.password = isRussian ? 'Введите пароль' : 'Enter password';
            } else if (password.length < 8) {
                newErrors.password = isRussian ? 'Минимум 8 символов' : 'Minimum 8 characters';
            }
        }

        if (mode === 'register') {
            if (!fullName.trim()) {
                newErrors.fullName = isRussian ? 'Введите имя' : 'Enter your name';
            }
            if (password !== confirmPassword) {
                newErrors.confirmPassword = isRussian ? 'Пароли не совпадают' : 'Passwords do not match';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            shakeForm();
            return;
        }

        setIsSubmitting(true);

        try {
            let result;

            if (mode === 'login') {
                result = await login(email, password);
            } else if (mode === 'register') {
                result = await register(email, password, fullName);
            } else {
                result = await forgotPassword(email);
            }

            if (result.success) {
                if (mode === 'forgot') {
                    Alert.alert(
                        isRussian ? 'Успешно!' : 'Success!',
                        isRussian 
                            ? 'Инструкции отправлены на ваш email' 
                            : 'Reset instructions sent to your email'
                    );
                    setMode('login');
                } else {
                    // Navigate to main app - handled by auth state change
                }
            } else {
                Alert.alert(
                    isRussian ? 'Ошибка' : 'Error',
                    result.error
                );
                shakeForm();
            }
        } catch (error) {
            Alert.alert(
                isRussian ? 'Ошибка' : 'Error',
                isRussian ? 'Что-то пошло не так' : 'Something went wrong'
            );
            shakeForm();
        } finally {
            setIsSubmitting(false);
        }
    };

    const switchMode = (newMode) => {
        setErrors({});
        Animated.sequence([
            Animated.timing(formOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(formOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
        setTimeout(() => setMode(newMode), 150);
    };

    const renderInput = (props) => {
        const { icon, placeholder, value, onChangeText, error, secureTextEntry, keyboardType, autoCapitalize } = props;
        
        return (
            <View style={styles.inputWrapper}>
                <View style={[styles.inputContainer, error && styles.inputError]}>
                    <Ionicons name={icon} size={20} color="#FF6B35" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder={placeholder}
                        placeholderTextColor="#999"
                        value={value}
                        onChangeText={(text) => {
                            onChangeText(text);
                            if (errors[props.errorKey]) {
                                setErrors(prev => ({ ...prev, [props.errorKey]: null }));
                            }
                        }}
                        secureTextEntry={secureTextEntry && !showPassword}
                        keyboardType={keyboardType || 'default'}
                        autoCapitalize={autoCapitalize || 'none'}
                        autoCorrect={false}
                    />
                    {secureTextEntry && (
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons 
                                name={showPassword ? 'eye-off' : 'eye'} 
                                size={20} 
                                color="#999" 
                            />
                        </TouchableOpacity>
                    )}
                </View>
                {error && (
                    <Text style={styles.errorText}>
                        {error}
                    </Text>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* Animated Background */}
            <LinearGradient
                colors={['#1b4332', '#2d6a4f', '#40916c', '#52b788']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />
            
            {/* Decorative circles */}
            <View style={[styles.circle, styles.circle1]} />
            <View style={[styles.circle, styles.circle2]} />
            <View style={[styles.circle, styles.circle3]} />

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo Section */}
                    <Animated.View style={[styles.logoSection, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
                        <View style={styles.logoContainer}>
                            <LinearGradient
                                colors={['#2d6a4f', '#40916c', '#52b788']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.logoGradient}
                            >
                                <Ionicons name="compass" size={50} color="#fff" />
                            </LinearGradient>
                        </View>
                        <Text style={styles.logoText}>NomadWay</Text>
                        <Text style={styles.tagline}>
                            {isRussian 
                                ? 'Откройте Казахстан вместе с нами' 
                                : 'Discover Kazakhstan with us'}
                        </Text>
                    </Animated.View>

                    {/* Form Section */}
                    <Animated.View style={[styles.formSection, { opacity: formOpacity, transform: [{ translateY: formTranslateY }, { translateX: shakeValue }] }]}>
                        <View style={styles.formCard}>
                            {/* Mode Title */}
                            <Text style={styles.formTitle}>
                                {mode === 'login' 
                                    ? (isRussian ? 'Добро пожаловать!' : 'Welcome back!') 
                                    : mode === 'register'
                                    ? (isRussian ? 'Создать аккаунт' : 'Create account')
                                    : (isRussian ? 'Восстановление' : 'Reset password')}
                            </Text>

                            {/* Full Name (register only) */}
                            {mode === 'register' && renderInput({
                                icon: 'person-outline',
                                placeholder: isRussian ? 'Полное имя' : 'Full name',
                                value: fullName,
                                onChangeText: setFullName,
                                error: errors.fullName,
                                errorKey: 'fullName',
                                autoCapitalize: 'words',
                            })}

                            {/* Email */}
                            {renderInput({
                                icon: 'mail-outline',
                                placeholder: 'Email',
                                value: email,
                                onChangeText: setEmail,
                                error: errors.email,
                                errorKey: 'email',
                                keyboardType: 'email-address',
                            })}

                            {/* Password */}
                            {mode !== 'forgot' && renderInput({
                                icon: 'lock-closed-outline',
                                placeholder: isRussian ? 'Пароль' : 'Password',
                                value: password,
                                onChangeText: setPassword,
                                error: errors.password,
                                errorKey: 'password',
                                secureTextEntry: true,
                            })}

                            {/* Confirm Password (register only) */}
                            {mode === 'register' && renderInput({
                                icon: 'lock-closed-outline',
                                placeholder: isRussian ? 'Подтвердите пароль' : 'Confirm password',
                                value: confirmPassword,
                                onChangeText: setConfirmPassword,
                                error: errors.confirmPassword,
                                errorKey: 'confirmPassword',
                                secureTextEntry: true,
                            })}

                            {/* Forgot Password Link */}
                            {mode === 'login' && (
                                <TouchableOpacity 
                                    style={styles.forgotLink}
                                    onPress={() => switchMode('forgot')}
                                >
                                    <Text style={styles.forgotLinkText}>
                                        {isRussian ? 'Забыли пароль?' : 'Forgot password?'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={handleSubmit}
                                disabled={isSubmitting}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['#2d6a4f', '#40916c']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.submitGradient}
                                >
                                    {isSubmitting ? (
                                        <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                            <Ionicons name="sync" size={24} color="#fff" />
                                        </Animated.View>
                                    ) : (
                                        <Text style={styles.submitText}>
                                            {mode === 'login' 
                                                ? (isRussian ? 'Войти' : 'Sign In')
                                                : mode === 'register'
                                                ? (isRussian ? 'Создать' : 'Sign Up')
                                                : (isRussian ? 'Отправить' : 'Send')}
                                        </Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Social Login */}
                            {mode !== 'forgot' && (
                                <View style={styles.socialSection}>
                                    <View style={styles.dividerContainer}>
                                        <View style={styles.divider} />
                                        <Text style={styles.dividerText}>
                                            {isRussian ? 'или' : 'or'}
                                        </Text>
                                        <View style={styles.divider} />
                                    </View>

                                    <View style={styles.socialButtons}>
                                        <TouchableOpacity 
                                            style={styles.socialButton}
                                            onPress={() => Alert.alert('Coming Soon', 'Google login will be available soon!')}
                                        >
                                            <Ionicons name="logo-google" size={24} color="#DB4437" />
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={styles.socialButton}
                                            onPress={() => Alert.alert('Coming Soon', 'Apple login will be available soon!')}
                                        >
                                            <Ionicons name="logo-apple" size={24} color="#000" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {/* Mode Switch */}
                            <View style={styles.switchContainer}>
                                {mode === 'forgot' ? (
                                    <TouchableOpacity onPress={() => switchMode('login')}>
                                        <Text style={styles.switchText}>
                                            <Ionicons name="arrow-back" size={14} color="#2d6a4f" />
                                            {' '}{isRussian ? 'Назад к входу' : 'Back to login'}
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity onPress={() => switchMode(mode === 'login' ? 'register' : 'login')}>
                                        <Text style={styles.switchText}>
                                            {mode === 'login' 
                                                ? (isRussian ? 'Нет аккаунта? ' : "Don't have an account? ")
                                                : (isRussian ? 'Уже есть аккаунт? ' : 'Already have an account? ')}
                                            <Text style={styles.switchHighlight}>
                                                {mode === 'login' 
                                                    ? (isRussian ? 'Создать' : 'Sign Up')
                                                    : (isRussian ? 'Войти' : 'Sign In')}
                                            </Text>
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1b4332',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: height * 0.08,
        paddingBottom: 40,
    },
    // Decorative circles
    circle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(82, 183, 136, 0.15)',
    },
    circle1: {
        width: 200,
        height: 200,
        top: -50,
        right: -80,
    },
    circle2: {
        width: 150,
        height: 150,
        bottom: 100,
        left: -60,
    },
    circle3: {
        width: 100,
        height: 100,
        bottom: 50,
        right: 30,
        backgroundColor: 'rgba(64, 145, 108, 0.15)',
    },
    // Logo Section
    logoSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        marginBottom: 16,
    },
    logoGradient: {
        width: 90,
        height: 90,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#2d6a4f',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    logoText: {
        fontSize: 36,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 2,
    },
    tagline: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 8,
        textAlign: 'center',
    },
    // Form Section
    formSection: {
        flex: 1,
    },
    formCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 15,
    },
    formTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1b4332',
        textAlign: 'center',
        marginBottom: 24,
    },
    // Input Styles
    inputWrapper: {
        marginBottom: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    inputError: {
        borderColor: '#dc3545',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        paddingVertical: 14,
    },
    errorText: {
        color: '#dc3545',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 16,
    },
    // Forgot Password
    forgotLink: {
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    forgotLinkText: {
        color: '#2d6a4f',
        fontSize: 14,
        fontWeight: '500',
    },
    // Submit Button
    submitButton: {
        marginTop: 8,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#2d6a4f',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    submitGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    // Social Section
    socialSection: {
        marginTop: 24,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#ddd',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#999',
        fontSize: 14,
    },
    socialButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
    },
    socialButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#eee',
    },
    // Mode Switch
    switchContainer: {
        marginTop: 24,
        alignItems: 'center',
    },
    switchText: {
        color: '#666',
        fontSize: 14,
    },
    switchHighlight: {
        color: '#2d6a4f',
        fontWeight: '600',
    },
});
