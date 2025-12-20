import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalization } from '../contexts/LocalizationContext';
import * as CommunityApi from '../utils/communityApi';
import { useAuth } from '../contexts/AuthContext';

const POST_CATEGORIES = {
  question: { label: { ru: 'Вопрос', en: 'Question', kk: 'Сұрақ' }, icon: 'help-circle' },
  experience: { label: { ru: 'Опыт', en: 'Experience', kk: 'Тәжірибе' }, icon: 'book' },
  guide: { label: { ru: 'Гид', en: 'Guide', kk: 'Гид' }, icon: 'map' },
  seek_travel_mates: { label: { ru: 'Ищу попутчиков', en: 'Seek Travel Mates', kk: 'Серіктес іздеу' }, icon: 'people' },
  recommendations: { label: { ru: 'Рекомендации', en: 'Recommendations', kk: 'Ұсыныстар' }, icon: 'star' },
};

export default function CreatePostScreen({ navigation }) {
  const { language } = useLocalization();
  const { isAuthenticated, requireAuth } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState(null);
  const [location, setLocation] = useState({ city: '', country_code: 'KZ' });
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      requireAuth();
    }
  }, [isAuthenticated, requireAuth]);

  const pickImage = async () => {
    if (images.length >= 10) {
      Alert.alert(
        language === 'ru' ? 'Ошибка' : language === 'kk' ? 'Қате' : 'Error',
        language === 'ru' ? 'Максимум 10 фотографий' : language === 'kk' ? 'Максимум 10 фото' : 'Maximum 10 photos'
      );
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        language === 'ru' ? 'Требуется разрешение' : language === 'kk' ? 'Рұқсат қажет' : 'Permission required',
        language === 'ru' ? 'Нужно разрешение на доступ к фотографиям' : language === 'kk' ? 'Фотоға қол жеткізу үшін рұқсат қажет' : 'Need permission to access photos'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check file size (10MB limit)
        if (asset.fileSize > 10 * 1024 * 1024) {
          Alert.alert(
            language === 'ru' ? 'Ошибка' : language === 'kk' ? 'Қате' : 'Error',
            language === 'ru' ? 'Размер файла превышает 10 МБ' : language === 'kk' ? 'Файл өлшемі 10 МБ-дан асып кетті' : 'File size exceeds 10MB'
          );
          return;
        }

        // Upload image
        setUploading(true);
        try {
          const uploadResponse = await CommunityApi.getUploadUrl({
            mime_type: 'image/jpeg',
            size_bytes: asset.fileSize,
            entity: 'post_image',
          });

          setImages(prev => [...prev, {
            uri: asset.uri,
            mediaId: uploadResponse.media_id,
            uploadUrl: uploadResponse.upload_url,
          }]);
        } catch (error) {
          console.error('Error uploading image:', error);
          Alert.alert(
            language === 'ru' ? 'Ошибка' : language === 'kk' ? 'Қате' : 'Error',
            language === 'ru' ? 'Не удалось загрузить изображение' : language === 'kk' ? 'Суретті жүктеу мүмкін болмады' : 'Failed to upload image'
          );
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && tags.length < 5 && !tags.includes(tag) && tag.length <= 30) {
      setTags(prev => [...prev, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const validateAndSubmit = async () => {
    // Validation
    if (!title.trim() || title.trim().length < 5 || title.length > 120) {
      Alert.alert(
        language === 'ru' ? 'Ошибка' : language === 'kk' ? 'Қате' : 'Error',
        language === 'ru' ? 'Заголовок должен быть от 5 до 120 символов' : language === 'kk' ? 'Тақырып 5-тен 120 таңбаға дейін болуы керек' : 'Title must be between 5 and 120 characters'
      );
      return;
    }

    if (!body.trim() || body.length < 10) {
      Alert.alert(
        language === 'ru' ? 'Ошибка' : language === 'kk' ? 'Қате' : 'Error',
        language === 'ru' ? 'Текст обязателен и должен быть ≥ 10 символов' : language === 'kk' ? 'Мәтін міндетті және ≥ 10 таңба болуы керек' : 'Body is required and must be ≥ 10 characters'
      );
      return;
    }

    if (!category) {
      Alert.alert(
        language === 'ru' ? 'Ошибка' : language === 'kk' ? 'Қате' : 'Error',
        language === 'ru' ? 'Выберите категорию' : language === 'kk' ? 'Санатты таңдаңыз' : 'Select a category'
      );
      return;
    }

    if (!location.country_code) {
      Alert.alert(
        language === 'ru' ? 'Ошибка' : language === 'kk' ? 'Қате' : 'Error',
        language === 'ru' ? 'Укажите страну' : language === 'kk' ? 'Елді көрсетіңіз' : 'Specify country'
      );
      return;
    }

    setSubmitting(true);
    try {
      const mediaIds = images.map(img => img.mediaId).filter(Boolean);
      
      await CommunityApi.createPost({
        title: title.trim(),
        body: body.trim(),
        category,
        location: {
          city: location.city || undefined,
          country_code: location.country_code,
        },
        tags,
        media_ids: mediaIds,
      });

      Alert.alert(
        language === 'ru' ? 'Успешно' : language === 'kk' ? 'Сәтті' : 'Success',
        language === 'ru' ? 'Пост опубликован' : language === 'kk' ? 'Жазба жарияланды' : 'Post published',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert(
        language === 'ru' ? 'Ошибка' : language === 'kk' ? 'Қате' : 'Error',
        error.message || (language === 'ru' ? 'Не удалось опубликовать пост' : language === 'kk' ? 'Жазбаны жариялау мүмкін болмады' : 'Failed to publish post')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Title Input */}
        <View style={styles.section}>
          <Text style={styles.label}>
            {language === 'ru' ? 'Заголовок' : language === 'kk' ? 'Тақырып' : 'Title'} *
          </Text>
          <TextInput
            style={styles.titleInput}
            placeholder={language === 'ru' ? 'Введите заголовок...' : language === 'kk' ? 'Тақырыпты енгізіңіз...' : 'Enter title...'}
            value={title}
            onChangeText={setTitle}
            maxLength={120}
            placeholderTextColor="#8e8e93"
          />
          <Text style={styles.charCount}>{title.length}/120</Text>
        </View>

        {/* Body Input */}
        <View style={styles.section}>
          <Text style={styles.label}>
            {language === 'ru' ? 'Текст' : language === 'kk' ? 'Мәтін' : 'Body'} *
          </Text>
          <TextInput
            style={styles.bodyInput}
            placeholder={language === 'ru' ? 'Напишите текст поста...' : language === 'kk' ? 'Жазба мәтінін жазыңыз...' : 'Write post text...'}
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={6}
            placeholderTextColor="#8e8e93"
          />
          <Text style={styles.charCount}>{body.length} {language === 'ru' ? 'символов' : language === 'kk' ? 'таңба' : 'characters'} (мин. 10)</Text>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>
            {language === 'ru' ? 'Категория' : language === 'kk' ? 'Санат' : 'Category'} *
          </Text>
          <View style={styles.categoryGrid}>
            {Object.keys(POST_CATEGORIES).map(cat => {
              const catInfo = POST_CATEGORIES[cat];
              const catLabel = catInfo.label[language] || catInfo.label.en;
              const isSelected = category === cat;
              
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryButton, isSelected && styles.categoryButtonSelected]}
                  onPress={() => setCategory(cat)}
                >
                  <Ionicons
                    name={catInfo.icon}
                    size={20}
                    color={isSelected ? '#fff' : '#d4af37'}
                  />
                  <Text style={[styles.categoryButtonText, isSelected && styles.categoryButtonTextSelected]}>
                    {catLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>
            {language === 'ru' ? 'Местоположение' : language === 'kk' ? 'Орналасқан жер' : 'Location'} *
          </Text>
          <TextInput
            style={styles.input}
            placeholder={language === 'ru' ? 'Город (необязательно)' : language === 'kk' ? 'Қала (міндетті емес)' : 'City (optional)'}
            value={location.city}
            onChangeText={(city) => setLocation(prev => ({ ...prev, city }))}
            placeholderTextColor="#8e8e93"
          />
          <TextInput
            style={[styles.input, styles.inputMargin]}
            placeholder={language === 'ru' ? 'Код страны (например, KZ)' : language === 'kk' ? 'Ел коды (мысалы, KZ)' : 'Country code (e.g., KZ)'}
            value={location.country_code}
            onChangeText={(country_code) => setLocation(prev => ({ ...prev, country_code: country_code.toUpperCase() }))}
            maxLength={2}
            placeholderTextColor="#8e8e93"
          />
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.label}>
            {language === 'ru' ? 'Теги' : language === 'kk' ? 'Тегтер' : 'Tags'} ({tags.length}/5)
          </Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={styles.tagInput}
              placeholder={language === 'ru' ? 'Добавить тег...' : language === 'kk' ? 'Тег қосу...' : 'Add tag...'}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={addTag}
              maxLength={30}
              placeholderTextColor="#8e8e93"
            />
            <TouchableOpacity
              style={[styles.addTagButton, tags.length >= 5 && styles.addTagButtonDisabled]}
              onPress={addTag}
              disabled={tags.length >= 5}
            >
              <Ionicons name="add" size={20} color={tags.length >= 5 ? '#ccc' : '#d4af37'} />
            </TouchableOpacity>
          </View>
          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(tag)}>
                    <Ionicons name="close-circle" size={16} color="#8e8e93" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Images */}
        <View style={styles.section}>
          <Text style={styles.label}>
            {language === 'ru' ? 'Фотографии' : language === 'kk' ? 'Фотосуреттер' : 'Photos'} ({images.length}/10)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: image.uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 10 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={pickImage}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#d4af37" />
                ) : (
                  <>
                    <Ionicons name="camera" size={32} color="#d4af37" />
                    <Text style={styles.addImageText}>
                      {language === 'ru' ? 'Добавить' : language === 'kk' ? 'Қосу' : 'Add'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={validateAndSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>
                {language === 'ru' ? 'Опубликовать' : language === 'kk' ? 'Жариялау' : 'Publish'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a4d3a',
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  bodyInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f9f9f9',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  inputMargin: {
    marginTop: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 4,
    textAlign: 'right',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d4af37',
    backgroundColor: '#fff',
  },
  categoryButtonSelected: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37',
  },
  categoryButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#d4af37',
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f9f9f9',
    marginRight: 8,
  },
  addTagButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff8e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagButtonDisabled: {
    backgroundColor: '#f5f5f5',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#3498db',
    marginRight: 6,
  },
  imagesContainer: {
    marginTop: 8,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addImageButton: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d4af37',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
  },
  addImageText: {
    marginTop: 4,
    fontSize: 12,
    color: '#d4af37',
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#d4af37',
    borderRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

