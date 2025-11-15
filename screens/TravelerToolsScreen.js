import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SimplePicker from '../components/SimplePicker';
import { convertCurrency, formatCurrency, getCurrencyName } from '../utils/currencyConverter';
import { translatePhrase, speakPhrase, getCommonPhrases, getLanguageName } from '../utils/translator';
import { getWeather, getWeatherIcon } from '../utils/weatherService';
import { findNearbyPlaces, getPlaceTypeInfo, getAllPlaceTypes } from '../utils/nearbyPlaces';
import * as Location from 'expo-location';

export default function TravelerToolsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('currency');
  const [currencyAmount, setCurrencyAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('KZT');
  const [translationText, setTranslationText] = useState('');
  const [fromLang, setFromLang] = useState('ru');
  const [toLang, setToLang] = useState('en');
  const [weatherCity, setWeatherCity] = useState('Almaty');
  const [weatherData, setWeatherData] = useState(null);
  const [nearbyType, setNearbyType] = useState('cafe');
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  const convertedAmount = currencyAmount 
    ? convertCurrency(parseFloat(currencyAmount) || 0, fromCurrency, toCurrency)
    : 0;

  const translatedText = translationText
    ? translatePhrase(translationText, fromLang, toLang)
    : '';

  const loadWeather = async () => {
    setLoading(true);
    try {
      const data = await getWeather(weatherCity);
      setWeatherData(data);
    } catch (error) {
      console.error('Error loading weather:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyPlaces = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Разрешение на местоположение необходимо для поиска ближайших мест');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const places = await findNearbyPlaces(
        nearbyType,
        location.coords.latitude,
        location.coords.longitude
      );
      setNearbyPlaces(places);
    } catch (error) {
      console.error('Error loading nearby places:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'weather') {
      loadWeather();
    } else if (activeTab === 'nearby') {
      loadNearbyPlaces();
    }
  }, [activeTab, weatherCity, nearbyType]);

  const renderCurrencyConverter = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Конвертер валют</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Сумма</Text>
        <TextInput
          style={styles.input}
          value={currencyAmount}
          onChangeText={setCurrencyAmount}
          keyboardType="numeric"
          placeholder="Введите сумму"
        />
      </View>

      <View style={styles.currencyRow}>
        <View style={styles.currencyGroup}>
          <Text style={styles.label}>Из</Text>
          <SimplePicker
            options={[
              { label: 'USD', value: 'USD' },
              { label: 'EUR', value: 'EUR' },
              { label: 'KZT', value: 'KZT' },
              { label: 'RUB', value: 'RUB' },
              { label: 'GBP', value: 'GBP' },
            ]}
            selectedValue={fromCurrency}
            onValueChange={setFromCurrency}
            placeholder="Выберите валюту"
          />
        </View>

        <TouchableOpacity
          style={styles.swapButton}
          onPress={() => {
            const temp = fromCurrency;
            setFromCurrency(toCurrency);
            setToCurrency(temp);
          }}
        >
          <Ionicons name="swap-horizontal" size={24} color="#1a4d3a" />
        </TouchableOpacity>

        <View style={styles.currencyGroup}>
          <Text style={styles.label}>В</Text>
          <SimplePicker
            options={[
              { label: 'USD', value: 'USD' },
              { label: 'EUR', value: 'EUR' },
              { label: 'KZT', value: 'KZT' },
              { label: 'RUB', value: 'RUB' },
              { label: 'GBP', value: 'GBP' },
            ]}
            selectedValue={toCurrency}
            onValueChange={setToCurrency}
            placeholder="Выберите валюту"
          />
        </View>
      </View>

      <View style={styles.resultBox}>
        <Text style={styles.resultLabel}>Результат</Text>
        <Text style={styles.resultValue}>
          {formatCurrency(convertedAmount, toCurrency)}
        </Text>
      </View>
    </View>
  );

  const renderTranslator = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Переводчик фраз</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Фраза</Text>
        <TextInput
          style={styles.input}
          value={translationText}
          onChangeText={setTranslationText}
          placeholder="Введите фразу для перевода"
        />
      </View>

      <View style={styles.languageRow}>
        <View style={styles.languageGroup}>
          <Text style={styles.label}>Из</Text>
          <SimplePicker
            options={[
              { label: 'Русский', value: 'ru' },
              { label: 'English', value: 'en' },
              { label: 'Қазақша', value: 'kz' },
              { label: 'Türkçe', value: 'tr' },
              { label: 'ქართული', value: 'ka' },
            ]}
            selectedValue={fromLang}
            onValueChange={setFromLang}
            placeholder="Выберите язык"
          />
        </View>

        <View style={styles.languageGroup}>
          <Text style={styles.label}>В</Text>
          <SimplePicker
            options={[
              { label: 'Русский', value: 'ru' },
              { label: 'English', value: 'en' },
              { label: 'Қазақша', value: 'kz' },
              { label: 'Türkçe', value: 'tr' },
              { label: 'ქართული', value: 'ka' },
            ]}
            selectedValue={toLang}
            onValueChange={setToLang}
            placeholder="Выберите язык"
          />
        </View>
      </View>

      {translatedText && (
        <View style={styles.resultBox}>
          <View style={styles.translationHeader}>
            <Text style={styles.resultLabel}>Перевод</Text>
            <TouchableOpacity
              onPress={() => speakPhrase(translatedText, toLang)}
              style={styles.speakButton}
            >
              <Ionicons name="volume-high" size={24} color="#1a4d3a" />
            </TouchableOpacity>
          </View>
          <Text style={styles.resultValue}>{translatedText}</Text>
        </View>
      )}

      <View style={styles.commonPhrases}>
        <Text style={styles.label}>Частые фразы</Text>
        {getCommonPhrases('ru').slice(0, 5).map((phrase, index) => (
          <TouchableOpacity
            key={index}
            style={styles.phraseButton}
            onPress={() => setTranslationText(phrase)}
          >
            <Text style={styles.phraseText}>{phrase}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderWeather = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Погода</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Город</Text>
        <SimplePicker
          options={[
            { label: 'Алматы', value: 'Almaty' },
            { label: 'Астана', value: 'Astana' },
            { label: 'Шымкент', value: 'Shymkent' },
          ]}
          selectedValue={weatherCity}
          onValueChange={(value) => {
            setWeatherCity(value);
            loadWeather();
          }}
          placeholder="Выберите город"
        />
      </View>

      {weatherData && (
        <View style={styles.weatherContainer}>
          <View style={styles.currentWeather}>
            <Text style={styles.weatherIcon}>{weatherData.current.icon}</Text>
            <Text style={styles.weatherTemp}>{weatherData.current.temp}°C</Text>
            <Text style={styles.weatherCondition}>{weatherData.current.condition}</Text>
            <View style={styles.weatherDetails}>
              <Text style={styles.weatherDetail}>
                💧 Влажность: {weatherData.current.humidity}%
              </Text>
              <Text style={styles.weatherDetail}>
                💨 Ветер: {weatherData.current.wind} км/ч
              </Text>
            </View>
          </View>

          <View style={styles.forecastContainer}>
            <Text style={styles.forecastTitle}>Прогноз</Text>
            {weatherData.forecast.map((item, index) => (
              <View key={index} style={styles.forecastItem}>
                <Text style={styles.forecastDay}>{item.day}</Text>
                <Text style={styles.forecastIcon}>{item.icon}</Text>
                <Text style={styles.forecastTemp}>{item.temp}°C</Text>
                <Text style={styles.forecastCondition}>{item.condition}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderNearby = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Что рядом</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Тип места</Text>
        <SimplePicker
          options={getAllPlaceTypes().map(type => ({
            label: getPlaceTypeInfo(type).name,
            value: type,
          }))}
          selectedValue={nearbyType}
          onValueChange={(value) => {
            setNearbyType(value);
            loadNearbyPlaces();
          }}
          placeholder="Выберите тип места"
        />
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Загрузка...</Text>
      ) : (
        <FlatList
          data={nearbyPlaces}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.nearbyItem}>
              <Text style={styles.nearbyIcon}>{getPlaceTypeInfo(nearbyType).icon}</Text>
              <View style={styles.nearbyInfo}>
                <Text style={styles.nearbyName}>{item.name}</Text>
                <Text style={styles.nearbyDistance}>
                  {item.distance.toFixed(1)} км
                  {item.rating && ` • ⭐ ${item.rating}`}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Места не найдены</Text>
          }
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'currency' && styles.activeTab]}
          onPress={() => setActiveTab('currency')}
        >
          <Ionicons
            name="cash-outline"
            size={20}
            color={activeTab === 'currency' ? '#d4af37' : '#8e8e93'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'currency' && styles.activeTabText,
            ]}
          >
            Валюта
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'translator' && styles.activeTab]}
          onPress={() => setActiveTab('translator')}
        >
          <Ionicons
            name="language-outline"
            size={20}
            color={activeTab === 'translator' ? '#d4af37' : '#8e8e93'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'translator' && styles.activeTabText,
            ]}
          >
            Переводчик
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'weather' && styles.activeTab]}
          onPress={() => setActiveTab('weather')}
        >
          <Ionicons
            name="partly-sunny-outline"
            size={20}
            color={activeTab === 'weather' ? '#d4af37' : '#8e8e93'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'weather' && styles.activeTabText,
            ]}
          >
            Погода
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'nearby' && styles.activeTab]}
          onPress={() => setActiveTab('nearby')}
        >
          <Ionicons
            name="location-outline"
            size={20}
            color={activeTab === 'nearby' ? '#d4af37' : '#8e8e93'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'nearby' && styles.activeTabText,
            ]}
          >
            Рядом
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'currency' && renderCurrencyConverter()}
        {activeTab === 'translator' && renderTranslator()}
        {activeTab === 'weather' && renderWeather()}
        {activeTab === 'nearby' && renderNearby()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#d4af37',
  },
  tabText: {
    marginTop: 4,
    fontSize: 12,
    color: '#8e8e93',
  },
  activeTabText: {
    color: '#d4af37',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a4d3a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  currencyGroup: {
    flex: 1,
  },
  swapButton: {
    padding: 12,
    marginHorizontal: 8,
  },
  resultBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#d4af37',
  },
  resultLabel: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a4d3a',
  },
  languageRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  languageGroup: {
    flex: 1,
    marginRight: 8,
  },
  translationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speakButton: {
    padding: 8,
  },
  commonPhrases: {
    marginTop: 20,
  },
  phraseButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  phraseText: {
    fontSize: 14,
    color: '#1a4d3a',
  },
  weatherContainer: {
    marginTop: 20,
  },
  currentWeather: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  weatherIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  weatherTemp: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 8,
  },
  weatherCondition: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  weatherDetails: {
    width: '100%',
  },
  weatherDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  forecastContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  forecastTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 16,
  },
  forecastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  forecastDay: {
    flex: 1,
    fontSize: 14,
    color: '#1a4d3a',
  },
  forecastIcon: {
    fontSize: 24,
    marginHorizontal: 16,
  },
  forecastTemp: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4d3a',
    width: 60,
  },
  forecastCondition: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  nearbyItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nearbyIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  nearbyInfo: {
    flex: 1,
  },
  nearbyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4d3a',
    marginBottom: 4,
  },
  nearbyDistance: {
    fontSize: 14,
    color: '#666',
  },
  loadingText: {
    textAlign: 'center',
    color: '#8e8e93',
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#8e8e93',
    marginTop: 20,
  },
});

