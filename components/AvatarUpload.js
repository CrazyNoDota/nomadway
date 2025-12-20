import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Modal,
    Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLocalization } from '../contexts/LocalizationContext';

export default function AvatarUpload({ size = 120, showEditButton = true, onUploadComplete }) {
    const { user, uploadAvatar } = useAuth();
    const { theme, isDark } = useTheme();
    const { isRussian } = useLocalization();
    
    const [isUploading, setIsUploading] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [previewUri, setPreviewUri] = useState(null);
    
    // Animation values
    const scale = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
        Animated.sequence([
            Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        ]).start();
        if (showEditButton) {
            setShowOptions(true);
        }
    };

    const requestPermissions = async () => {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        return cameraStatus === 'granted' && libraryStatus === 'granted';
    };

    const pickImage = async (useCamera = false) => {
        setShowOptions(false);

        const hasPermissions = await requestPermissions();
        if (!hasPermissions) {
            Alert.alert(
                isRussian ? 'Нет доступа' : 'Permission Required',
                isRussian 
                    ? 'Пожалуйста, разрешите доступ к камере и галерее в настройках'
                    : 'Please grant camera and photo library permissions in settings'
            );
            return;
        }

        try {
            const options = {
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            };

            let result;
            if (useCamera) {
                result = await ImagePicker.launchCameraAsync(options);
            } else {
                result = await ImagePicker.launchImageLibraryAsync(options);
            }

            if (!result.canceled && result.assets[0]) {
                setPreviewUri(result.assets[0].uri);
                await handleUpload(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert(
                isRussian ? 'Ошибка' : 'Error',
                isRussian ? 'Не удалось выбрать изображение' : 'Failed to pick image'
            );
        }
    };

    const handleUpload = async (uri) => {
        setIsUploading(true);

        try {
            const result = await uploadAvatar(uri);

            if (result.success) {
                setPreviewUri(null);
                onUploadComplete?.(result.avatarUrl);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            Alert.alert(
                isRussian ? 'Ошибка' : 'Error',
                isRussian 
                    ? 'Не удалось загрузить аватар. Попробуйте еще раз.'
                    : 'Failed to upload avatar. Please try again.'
            );
            setPreviewUri(null);
        } finally {
            setIsUploading(false);
        }
    };

    const removeAvatar = async () => {
        setShowOptions(false);
        // For now, just show a message. Full implementation would call API
        Alert.alert(
            isRussian ? 'Удаление аватара' : 'Remove Avatar',
            isRussian 
                ? 'Эта функция скоро будет доступна'
                : 'This feature will be available soon'
        );
    };

    const avatarUri = previewUri || user?.avatarUrl;

    return (
        <>
            <TouchableOpacity
                style={[styles.container, { width: size, height: size }]}
                onPress={handlePress}
                activeOpacity={0.9}
            >
                <Animated.View style={{ transform: [{ scale }] }}>
                    {/* Avatar Container */}
                    <View style={[styles.avatarContainer, { width: size, height: size, borderRadius: size / 2 }]}>
                    {avatarUri ? (
                        <Image
                            source={{ uri: avatarUri }}
                            style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
                        />
                    ) : (
                        <LinearGradient
                            colors={['#FF6B35', '#FF8C42', '#FFB347']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}
                        >
                            <Text style={[styles.initials, { fontSize: size * 0.35 }]}>
                                {user?.fullName?.charAt(0)?.toUpperCase() || user?.displayName?.charAt(0)?.toUpperCase() || '?'}
                            </Text>
                        </LinearGradient>
                    )}

                    {/* Upload Overlay */}
                    {isUploading && (
                        <View style={[styles.uploadOverlay, { borderRadius: size / 2 }]}>
                            <ActivityIndicator color="#fff" size="large" />
                        </View>
                    )}
                </View>

                {/* Edit Button */}
                {showEditButton && !isUploading && (
                    <View style={styles.editButton}>
                        <LinearGradient
                            colors={['#FF6B35', '#FF8C42']}
                            style={styles.editGradient}
                        >
                            <Ionicons name="camera" size={16} color="#fff" />
                        </LinearGradient>
                    </View>
                )}
                </Animated.View>
            </TouchableOpacity>

            {/* Options Modal */}
            <Modal
                visible={showOptions}
                transparent
                animationType="fade"
                onRequestClose={() => setShowOptions(false)}
            >
                <TouchableOpacity 
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={() => setShowOptions(false)}
                >
                    <View style={[styles.optionsCard, isDark && styles.optionsCardDark]}>
                        <Text style={[styles.optionsTitle, isDark && styles.textDark]}>
                            {isRussian ? 'Изменить фото' : 'Change Photo'}
                        </Text>

                        <TouchableOpacity 
                            style={styles.optionButton}
                            onPress={() => pickImage(true)}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#e3f2fd' }]}>
                                <Ionicons name="camera" size={24} color="#1976d2" />
                            </View>
                            <Text style={[styles.optionText, isDark && styles.textDark]}>
                                {isRussian ? 'Сделать фото' : 'Take Photo'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.optionButton}
                            onPress={() => pickImage(false)}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#e8f5e9' }]}>
                                <Ionicons name="images" size={24} color="#388e3c" />
                            </View>
                            <Text style={[styles.optionText, isDark && styles.textDark]}>
                                {isRussian ? 'Выбрать из галереи' : 'Choose from Library'}
                            </Text>
                        </TouchableOpacity>

                        {avatarUri && (
                            <TouchableOpacity 
                                style={styles.optionButton}
                                onPress={removeAvatar}
                            >
                                <View style={[styles.optionIcon, { backgroundColor: '#ffebee' }]}>
                                    <Ionicons name="trash" size={24} color="#d32f2f" />
                                </View>
                                <Text style={[styles.optionText, { color: '#d32f2f' }]}>
                                    {isRussian ? 'Удалить фото' : 'Remove Photo'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity 
                            style={styles.cancelButton}
                            onPress={() => setShowOptions(false)}
                        >
                            <Text style={styles.cancelText}>
                                {isRussian ? 'Отмена' : 'Cancel'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    avatarContainer: {
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#FF6B35',
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    avatar: {
        resizeMode: 'cover',
    },
    placeholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    initials: {
        color: '#fff',
        fontWeight: '700',
    },
    uploadOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    editButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#fff',
    },
    editGradient: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Modal Styles
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    optionsCard: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    optionsCardDark: {
        backgroundColor: '#1a1a2e',
    },
    optionsTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        textAlign: 'center',
        marginBottom: 24,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderRadius: 12,
        marginBottom: 8,
    },
    optionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    cancelButton: {
        marginTop: 16,
        paddingVertical: 16,
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    textDark: {
        color: '#fff',
    },
});
