import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Filter options
const CITIES = [
    { id: 'almaty', name: 'Алматы', nameEn: 'Almaty' },
    { id: 'astana', name: 'Астана', nameEn: 'Astana' },
    { id: 'aktau', name: 'Актау', nameEn: 'Aktau' },
    { id: 'turkestan', name: 'Туркестан', nameEn: 'Turkestan' },
    { id: 'kostanay', name: 'Костанай', nameEn: 'Kostanay' },
    { id: 'petropavlovsk', name: 'Петропавловск', nameEn: 'Petropavlovsk' },
    { id: 'kokshetau', name: 'Кокшетау', nameEn: 'Kokshetau' },
    { id: 'pavlodar', name: 'Павлодар', nameEn: 'Pavlodar' },
    { id: 'ust-kamenogorsk', name: 'Усть-Каменогорск', nameEn: 'Ust-Kamenogorsk' },
];

const REGIONS = [
    { id: 'south', name: 'Южный', nameEn: 'South', icon: '🏔️' },
    { id: 'north', name: 'Северный', nameEn: 'North', icon: '🌲' },
    { id: 'east', name: 'Восточный', nameEn: 'East', icon: '⛰️' },
    { id: 'west', name: 'Западный', nameEn: 'West', icon: '🏜️' },
    { id: 'central', name: 'Центральный', nameEn: 'Central', icon: '🏙️' },
];

const TOUR_TYPES = [
    { id: 'mountain', name: 'Горный / Альпийский', nameEn: 'Mountain / Alpine', icon: '🏔️' },
    { id: 'cultural', name: 'Этно-тур (Культура)', nameEn: 'Cultural / Ethno', icon: '🐎' },
    { id: 'nature', name: 'Природа / Ландшафты', nameEn: 'Nature / Landscape', icon: '🏜️' },
    { id: 'historical', name: 'Исторический / Паломничество', nameEn: 'Historical / Pilgrimage', icon: '🕌' },
    { id: 'adventure', name: 'Активный / Приключения', nameEn: 'Active / Adventure', icon: '🎒' },
];

const SEASONS = [
    { id: 'spring', name: 'Весна', nameEn: 'Spring', icon: '🌸' },
    { id: 'summer', name: 'Лето', nameEn: 'Summer', icon: '☀️' },
    { id: 'autumn', name: 'Осень', nameEn: 'Autumn', icon: '🍂' },
    { id: 'winter', name: 'Зима', nameEn: 'Winter', icon: '❄️' },
];

const DURATION_OPTIONS = [
    { id: 'day', name: 'Однодневный', nameEn: 'Day Trip', maxDays: 1 },
    { id: 'weekend', name: 'Выходные (2-3 дня)', nameEn: 'Weekend (2-3 days)', minDays: 2, maxDays: 3 },
    { id: 'week', name: 'Неделя+', nameEn: 'Week+', minDays: 4 },
];

const FilterSheet = ({
    visible,
    onClose,
    filters,
    onApply,
    language = 'ru'
}) => {
    const [localFilters, setLocalFilters] = useState(filters || {});

    useEffect(() => {
        setLocalFilters(filters || {});
    }, [filters, visible]);

    const toggleFilter = (category, value) => {
        setLocalFilters(prev => {
            const currentValues = prev[category] || [];
            const isSelected = currentValues.includes(value);

            return {
                ...prev,
                [category]: isSelected
                    ? currentValues.filter(v => v !== value)
                    : [...currentValues, value],
            };
        });
    };

    const setFilter = (category, value) => {
        setLocalFilters(prev => ({
            ...prev,
            [category]: value,
        }));
    };

    const clearFilters = () => {
        setLocalFilters({});
    };

    const applyFilters = () => {
        onApply(localFilters);
        onClose();
    };

    const getActiveCount = () => {
        let count = 0;
        Object.values(localFilters).forEach(val => {
            if (Array.isArray(val)) {
                count += val.length;
            } else if (val) {
                count += 1;
            }
        });
        return count;
    };

    const getName = (item) => language === 'en' ? item.nameEn : item.name;

    const renderChipGroup = (items, category, multiSelect = true) => (
        <View style={styles.chipGroup}>
            {items.map((item) => {
                const isSelected = multiSelect
                    ? (localFilters[category] || []).includes(item.id)
                    : localFilters[category] === item.id;

                return (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => multiSelect ? toggleFilter(category, item.id) : setFilter(category, item.id)}
                    >
                        {item.icon && <Text style={styles.chipIcon}>{item.icon}</Text>}
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                            {getName(item)}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Фильтры</Text>
                        <TouchableOpacity onPress={clearFilters}>
                            <Text style={styles.clearText}>Сбросить</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        {/* Regions */}
                        <View style={styles.filterSection}>
                            <Text style={styles.sectionTitle}>🗺️ Регион</Text>
                            {renderChipGroup(REGIONS, 'regions', true)}
                        </View>

                        {/* Tour Types */}
                        <View style={styles.filterSection}>
                            <Text style={styles.sectionTitle}>🎯 Тип тура</Text>
                            {renderChipGroup(TOUR_TYPES, 'tourTypes', true)}
                        </View>

                        {/* Duration */}
                        <View style={styles.filterSection}>
                            <Text style={styles.sectionTitle}>⏱️ Продолжительность</Text>
                            {renderChipGroup(DURATION_OPTIONS, 'duration', false)}
                        </View>

                        {/* Season */}
                        <View style={styles.filterSection}>
                            <Text style={styles.sectionTitle}>📅 Сезон</Text>
                            {renderChipGroup(SEASONS, 'seasons', true)}
                        </View>

                        {/* Cities */}
                        <View style={styles.filterSection}>
                            <Text style={styles.sectionTitle}>🏙️ Город</Text>
                            {renderChipGroup(CITIES, 'cities', true)}
                        </View>

                        {/* Price Range */}
                        <View style={styles.filterSection}>
                            <Text style={styles.sectionTitle}>💰 Бюджет</Text>
                            <View style={styles.priceButtons}>
                                {[
                                    { id: 'budget', name: 'Бюджетный (до 10K ₸)', max: 10000 },
                                    { id: 'medium', name: 'Средний (10-50K ₸)', min: 10000, max: 50000 },
                                    { id: 'premium', name: 'Премиум (50K+ ₸)', min: 50000 },
                                ].map((option) => {
                                    const isSelected = localFilters.priceRange === option.id;
                                    return (
                                        <TouchableOpacity
                                            key={option.id}
                                            style={[styles.priceButton, isSelected && styles.priceButtonSelected]}
                                            onPress={() => setFilter('priceRange', isSelected ? null : option.id)}
                                        >
                                            <Text style={[styles.priceButtonText, isSelected && styles.priceButtonTextSelected]}>
                                                {option.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Apply Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                            <Ionicons name="checkmark" size={20} color="#fff" />
                            <Text style={styles.applyButtonText}>
                                Применить {getActiveCount() > 0 ? `(${getActiveCount()})` : ''}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// Helper component for filter chips display
export const ActiveFiltersBar = ({ filters, onClear, onOpenFilter }) => {
    const activeFilters = [];

    if (filters.regions?.length) {
        filters.regions.forEach(r => {
            const region = REGIONS.find(reg => reg.id === r);
            if (region) activeFilters.push({ key: `region-${r}`, label: region.name, icon: region.icon });
        });
    }

    if (filters.tourTypes?.length) {
        filters.tourTypes.forEach(t => {
            const type = TOUR_TYPES.find(ty => ty.id === t);
            if (type) activeFilters.push({ key: `type-${t}`, label: type.name, icon: type.icon });
        });
    }

    if (filters.seasons?.length) {
        filters.seasons.forEach(s => {
            const season = SEASONS.find(se => se.id === s);
            if (season) activeFilters.push({ key: `season-${s}`, label: season.name, icon: season.icon });
        });
    }

    if (activeFilters.length === 0) return null;

    return (
        <View style={filterBarStyles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {activeFilters.map((filter) => (
                    <View key={filter.key} style={filterBarStyles.chip}>
                        <Text style={filterBarStyles.chipIcon}>{filter.icon}</Text>
                        <Text style={filterBarStyles.chipText}>{filter.label}</Text>
                    </View>
                ))}
                <TouchableOpacity style={filterBarStyles.clearButton} onPress={onClear}>
                    <Ionicons name="close-circle" size={16} color="#e74c3c" />
                    <Text style={filterBarStyles.clearText}>Сбросить</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const filterBarStyles = StyleSheet.create({
    container: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#f5f5f5',
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
    },
    chipIcon: {
        fontSize: 12,
        marginRight: 4,
    },
    chipText: {
        fontSize: 12,
        color: '#1a4d3a',
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    clearText: {
        fontSize: 12,
        color: '#e74c3c',
        marginLeft: 4,
    },
});

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    clearText: {
        fontSize: 14,
        color: '#e74c3c',
    },
    scrollView: {
        padding: 16,
    },
    filterSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    chipGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    chipSelected: {
        backgroundColor: '#1a4d3a',
        borderColor: '#1a4d3a',
    },
    chipIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    chipText: {
        fontSize: 14,
        color: '#333',
    },
    chipTextSelected: {
        color: '#fff',
    },
    priceButtons: {
        flexDirection: 'column',
    },
    priceButton: {
        backgroundColor: '#f5f5f5',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    priceButtonSelected: {
        backgroundColor: '#1a4d3a',
        borderColor: '#1a4d3a',
    },
    priceButtonText: {
        fontSize: 14,
        color: '#333',
    },
    priceButtonTextSelected: {
        color: '#fff',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    applyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a4d3a',
        paddingVertical: 14,
        borderRadius: 25,
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default FilterSheet;
