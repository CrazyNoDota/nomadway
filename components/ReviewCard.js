import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ReviewCard = ({ review, language = 'ru' }) => {
    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Ionicons
                    key={i}
                    name={i <= rating ? 'star' : 'star-outline'}
                    size={16}
                    color="#d4af37"
                />
            );
        }
        return stars;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {review.userName?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.userName}>{review.userName || 'Аноним'}</Text>
                        <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
                    </View>
                </View>
                <View style={styles.rating}>{renderStars(review.rating)}</View>
            </View>

            <Text style={styles.content}>{review.content}</Text>

            {review.visitDate && (
                <View style={styles.visitInfo}>
                    <Ionicons name="calendar-outline" size={14} color="#666" />
                    <Text style={styles.visitText}>
                        Посещение: {formatDate(review.visitDate)}
                    </Text>
                </View>
            )}

            <View style={styles.footer}>
                <TouchableOpacity style={styles.helpfulButton}>
                    <Ionicons name="thumbs-up-outline" size={16} color="#666" />
                    <Text style={styles.helpfulText}>
                        Полезно ({review.helpfulCount || 0})
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// Star Rating Selector component
export const StarRatingSelector = ({ rating, onChange, size = 32 }) => {
    return (
        <View style={selectorStyles.container}>
            {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                    key={star}
                    onPress={() => onChange(star)}
                    style={selectorStyles.starButton}
                >
                    <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={size}
                        color="#d4af37"
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
};

// Review Summary component (AI-generated pros/cons)
export const ReviewSummary = ({ summary }) => {
    if (!summary) return null;

    return (
        <View style={summaryStyles.container}>
            <View style={summaryStyles.header}>
                <Ionicons name="bulb" size={20} color="#d4af37" />
                <Text style={summaryStyles.headerText}>AI Анализ отзывов</Text>
            </View>

            {summary.pros && summary.pros.length > 0 && (
                <View style={summaryStyles.section}>
                    <Text style={summaryStyles.sectionTitle}>👍 Плюсы</Text>
                    {summary.pros.map((pro, index) => (
                        <Text key={index} style={summaryStyles.item}>• {pro}</Text>
                    ))}
                </View>
            )}

            {summary.cons && summary.cons.length > 0 && (
                <View style={summaryStyles.section}>
                    <Text style={summaryStyles.sectionTitle}>👎 Минусы</Text>
                    {summary.cons.map((con, index) => (
                        <Text key={index} style={summaryStyles.item}>• {con}</Text>
                    ))}
                </View>
            )}

            <View style={summaryStyles.statsRow}>
                <View style={summaryStyles.stat}>
                    <Text style={summaryStyles.statNumber}>{summary.averageRating?.toFixed(1) || '-'}</Text>
                    <Text style={summaryStyles.statLabel}>Средняя оценка</Text>
                </View>
                <View style={summaryStyles.stat}>
                    <Text style={summaryStyles.statNumber}>{summary.totalReviews || 0}</Text>
                    <Text style={summaryStyles.statLabel}>Отзывов</Text>
                </View>
                <View style={summaryStyles.stat}>
                    <Text style={summaryStyles.statNumber}>{summary.recommendRate || '-'}%</Text>
                    <Text style={summaryStyles.statLabel}>Рекомендуют</Text>
                </View>
            </View>
        </View>
    );
};

// Rating Breakdown component
export const RatingBreakdown = ({ breakdown }) => {
    const maxCount = Math.max(...Object.values(breakdown || {}), 1);

    return (
        <View style={breakdownStyles.container}>
            {[5, 4, 3, 2, 1].map((stars) => (
                <View key={stars} style={breakdownStyles.row}>
                    <Text style={breakdownStyles.label}>{stars}</Text>
                    <Ionicons name="star" size={12} color="#d4af37" />
                    <View style={breakdownStyles.barContainer}>
                        <View
                            style={[
                                breakdownStyles.bar,
                                { width: `${((breakdown?.[stars] || 0) / maxCount) * 100}%` },
                            ]}
                        />
                    </View>
                    <Text style={breakdownStyles.count}>{breakdown?.[stars] || 0}</Text>
                </View>
            ))}
        </View>
    );
};

const selectorStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    starButton: {
        padding: 4,
    },
});

const summaryStyles = StyleSheet.create({
    container: {
        backgroundColor: '#fffef0',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#d4af37',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a4d3a',
        marginLeft: 8,
    },
    section: {
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
    },
    item: {
        fontSize: 13,
        color: '#666',
        marginLeft: 4,
        marginBottom: 3,
        lineHeight: 18,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e8e0c0',
        marginTop: 8,
    },
    stat: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a4d3a',
    },
    statLabel: {
        fontSize: 11,
        color: '#666',
        marginTop: 2,
    },
});

const breakdownStyles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    label: {
        width: 12,
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
        marginRight: 4,
    },
    barContainer: {
        flex: 1,
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        marginHorizontal: 8,
        overflow: 'hidden',
    },
    bar: {
        height: '100%',
        backgroundColor: '#d4af37',
        borderRadius: 4,
    },
    count: {
        width: 30,
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
    },
});

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1a4d3a',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    date: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    rating: {
        flexDirection: 'row',
    },
    content: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
        marginBottom: 12,
    },
    visitInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    visitText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 6,
    },
    footer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 10,
    },
    helpfulButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    helpfulText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 6,
    },
});

export default ReviewCard;
