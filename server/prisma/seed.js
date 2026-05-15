const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ================== SEED ADMIN USER ==================
  console.log('Creating admin user...');
  
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@nomadway.kz';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
      fullName: 'Admin',
      displayName: 'Admin',
      emailVerified: true,
      isActive: true,
      avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=FF6B35&color=fff',
    },
  });

  console.log(`✅ Admin user created: ${adminEmail}`);

  // ================== SEED ACHIEVEMENTS ==================
  console.log('Seeding achievements...');

  const achievements = [
    // Places visited
    {
      achievementKey: 'explorer_beginner',
      title: 'Начинающий исследователь',
      titleEn: 'Beginner Explorer',
      description: 'Посетите 5 мест',
      descriptionEn: 'Visit 5 places',
      category: 'places_visited',
      threshold: 5,
      pointsReward: 50,
      icon: '🎯',
      ageGroups: ['family', 'young', 'adults'],
    },
    {
      achievementKey: 'explorer_intermediate',
      title: 'Опытный путешественник',
      titleEn: 'Experienced Traveler',
      description: 'Посетите 10 мест',
      descriptionEn: 'Visit 10 places',
      category: 'places_visited',
      threshold: 10,
      pointsReward: 100,
      icon: '🌟',
      ageGroups: ['family', 'young', 'adults'],
    },
    {
      achievementKey: 'explorer_expert',
      title: 'Мастер путешествий',
      titleEn: 'Travel Master',
      description: 'Посетите 25 мест',
      descriptionEn: 'Visit 25 places',
      category: 'places_visited',
      threshold: 25,
      pointsReward: 250,
      icon: '👑',
      ageGroups: ['young', 'adults'],
    },
    // Cities visited
    {
      achievementKey: 'city_explorer',
      title: 'Городской исследователь',
      titleEn: 'City Explorer',
      description: 'Посетите 3 города',
      descriptionEn: 'Visit 3 cities',
      category: 'cities_visited',
      threshold: 3,
      pointsReward: 150,
      icon: '🏙️',
      ageGroups: ['family', 'young', 'adults'],
    },
    {
      achievementKey: 'city_master',
      title: 'Знаток городов',
      titleEn: 'City Master',
      description: 'Посетите 5 городов',
      descriptionEn: 'Visit 5 cities',
      category: 'cities_visited',
      threshold: 5,
      pointsReward: 300,
      icon: '🗺️',
      ageGroups: ['young', 'adults'],
    },
    // Distance walked
    {
      achievementKey: 'walker_bronze',
      title: 'Бронзовый пешеход',
      titleEn: 'Bronze Walker',
      description: 'Пройдите 10 км',
      descriptionEn: 'Walk 10 km',
      category: 'distance_walked',
      threshold: 10000,
      pointsReward: 100,
      icon: '🥉',
      ageGroups: ['family', 'young', 'adults'],
    },
    {
      achievementKey: 'walker_silver',
      title: 'Серебряный пешеход',
      titleEn: 'Silver Walker',
      description: 'Пройдите 50 км',
      descriptionEn: 'Walk 50 km',
      category: 'distance_walked',
      threshold: 50000,
      pointsReward: 250,
      icon: '🥈',
      ageGroups: ['young', 'adults'],
    },
    {
      achievementKey: 'walker_gold',
      title: 'Золотой пешеход',
      titleEn: 'Gold Walker',
      description: 'Пройдите 100 км',
      descriptionEn: 'Walk 100 km',
      category: 'distance_walked',
      threshold: 100000,
      pointsReward: 500,
      icon: '🥇',
      ageGroups: ['young', 'adults'],
    },
    // Routes completed
    {
      achievementKey: 'route_starter',
      title: 'Первый маршрут',
      titleEn: 'First Route',
      description: 'Завершите свой первый маршрут',
      descriptionEn: 'Complete your first route',
      category: 'routes_completed',
      threshold: 1,
      pointsReward: 50,
      icon: '🚀',
      ageGroups: ['family', 'young', 'adults'],
    },
    {
      achievementKey: 'route_enthusiast',
      title: 'Любитель маршрутов',
      titleEn: 'Route Enthusiast',
      description: 'Завершите 5 маршрутов',
      descriptionEn: 'Complete 5 routes',
      category: 'routes_completed',
      threshold: 5,
      pointsReward: 200,
      icon: '🎒',
      ageGroups: ['young', 'adults'],
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { achievementKey: achievement.achievementKey },
      update: achievement,
      create: achievement,
    });
  }

  console.log(`✅ ${achievements.length} achievements seeded`);

  // ================== SEED ATTRACTIONS FROM JSON ==================
  console.log('Seeding attractions from JSON...');

  const packagedAttractionsPath = path.join(__dirname, '../data/attractions.json');
  const legacyAttractionsPath = path.join(__dirname, '../../data/attractions.json');
  const attractionsPath = fs.existsSync(packagedAttractionsPath)
    ? packagedAttractionsPath
    : legacyAttractionsPath;
  
  if (fs.existsSync(attractionsPath)) {
    const attractionsData = JSON.parse(fs.readFileSync(attractionsPath, 'utf8'));
    
    for (const attr of attractionsData.attractions) {
      await prisma.attraction.upsert({
        where: { id: attr.id },
        update: {},
        create: {
          id: attr.id,
          name: attr.name,
          nameEn: attr.nameEn,
          description: attr.description,
          descriptionEn: attr.descriptionEn,
          longDescription: attr.longDescription,
          longDescriptionEn: attr.longDescriptionEn,
          image: attr.image,
          latitude: attr.latitude,
          longitude: attr.longitude,
          city: attr.city,
          region: attr.region,
          category: attr.category,
          tourType: attr.tourType,
          rating: attr.rating,
          ageGroups: attr.ageGroups || [],
          activityLevel: attr.activityLevel,
          interests: attr.interests || [],
          averageVisitDuration: attr.averageVisitDuration,
          budgetMin: attr.budget?.min,
          budgetMax: attr.budget?.max,
          bestSeasons: attr.bestSeason || [],
          difficultyLevel: attr.difficultyLevel,
          aiSummary: attr.aiSummary || null,
        },
      });

      // Seed reviews for this attraction
      if (attr.reviews && attr.reviews.length > 0) {
        for (const review of attr.reviews) {
          await prisma.attractionReview.upsert({
            where: { id: `${attr.id}_${review.id}` },
            update: {},
            create: {
              id: `${attr.id}_${review.id}`,
              attractionId: attr.id,
              author: review.author,
              rating: review.rating,
              text: review.text,
              date: new Date(review.date),
            },
          });
        }
      }
    }

    console.log(`✅ ${attractionsData.attractions.length} attractions seeded`);
  } else {
    console.log('⚠️ attractions.json not found, skipping attractions seed');
  }

  // ================== SEED BLACKLIST WORDS ==================
  console.log('Seeding blacklist words...');

  const blacklistWords = [
    { word: 'spam', severity: 'high' },
    { word: 'scam', severity: 'high' },
    { word: 'hate', severity: 'high' },
  ];

  for (const word of blacklistWords) {
    await prisma.blacklistWord.upsert({
      where: { word: word.word },
      update: {},
      create: word,
    });
  }

  console.log(`✅ ${blacklistWords.length} blacklist words seeded`);

  console.log('\n🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
