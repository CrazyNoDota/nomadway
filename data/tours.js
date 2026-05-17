// Shared tours data - used by both HotToursSection and ExploreScreen
// This ensures places and tours are the same data source

// Bundled tour photos. Static require() so Metro packs the JPEGs into the APK.
const IMG = {
    charyn: require('../assets/tours/charyn.jpg'),
    borovoe: require('../assets/tours/borovoe.jpg'),
    turkestan: require('../assets/tours/turkestan.jpg'),
    kolsai: require('../assets/tours/kolsai.jpg'),
    kaindy: require('../assets/tours/kaindy.jpg'),
    bozzhyra: require('../assets/tours/bozzhyra.jpg'),
    astana: require('../assets/tours/astana.jpg'),
};

// Regular tours data
export const TOURS = [
    {
        id: 'tour_1',
        attractionId: 1, // Links to attractions.json
        name: 'Чарынский каньон',
        nameEn: 'Charyn Canyon',
        image: IMG.charyn,
        price: 42000,
        duration: '1 день',
        durationDays: 1,
        rating: 4.8,
        reviewCount: 124,
        region: 'south',
        category: 'Природа',
        categoryEn: 'Nature',
        description: 'Уникальный природный памятник, напоминающий Гранд-Каньон. Расположен в Алматинской области.',
        descriptionEn: 'A unique natural monument resembling the Grand Canyon. Located in Almaty region.',
        longDescription: 'Чарынский каньон — это природный памятник возрастом более 12 миллионов лет. Его красные скалы и причудливые формы создают незабываемое зрелище. Каньон протянулся на 154 км вдоль реки Чарын. Особенно популярна Долина замков — участок с уникальными скальными образованиями.',
        budget: { min: 38000, max: 52000 },
    },
    {
        id: 'tour_2',
        attractionId: 2,
        name: 'Боровое',
        nameEn: 'Burabay',
        image: IMG.borovoe,
        price: 165000,
        duration: '3 дня',
        durationDays: 3,
        rating: 4.9,
        reviewCount: 256,
        region: 'north',
        category: 'Природа',
        categoryEn: 'Nature',
        description: 'Живописный курорт среди сосновых лесов и скалистых гор. "Казахстанская Швейцария".',
        descriptionEn: 'Picturesque resort among pine forests and rocky mountains. "Kazakhstan\'s Switzerland".',
        longDescription: 'Боровое (Бурабай) — это национальный парк с удивительной природой: чистейшие озёра, вековые сосны, причудливые скалы. Здесь можно отдохнуть на пляже, покататься на лодке, совершить пешие прогулки и насладиться целебным воздухом.',
        budget: { min: 140000, max: 195000 },
    },
    {
        id: 'tour_3',
        attractionId: 3, // Мавзолей Туркестан
        name: 'Туркестан',
        nameEn: 'Turkestan',
        image: IMG.turkestan,
        price: 110000,
        duration: '2 дня',
        durationDays: 2,
        rating: 4.7,
        reviewCount: 89,
        region: 'south',
        category: 'История',
        categoryEn: 'History',
        description: 'Древний город на Великом Шёлковом пути. Мавзолей Ходжи Ахмеда Яссауи — объект ЮНЕСКО.',
        descriptionEn: 'Ancient city on the Great Silk Road. Mausoleum of Khoja Ahmed Yasawi — UNESCO World Heritage Site.',
        longDescription: 'Туркестан — духовная столица тюркского мира. Главная достопримечательность — величественный мавзолей Ходжи Ахмеда Яссауи XIV века, один из лучших образцов тимуридской архитектуры. Город привлекает паломников и туристов со всего мира.',
        budget: { min: 90000, max: 135000 },
    },
    {
        id: 'tour_4',
        attractionId: 9, // Кольсайские озёра
        name: 'Кольсайские озёра',
        nameEn: 'Kolsai Lakes',
        image: IMG.kolsai,
        price: 95000,
        duration: '2 дня',
        durationDays: 2,
        rating: 4.9,
        reviewCount: 178,
        region: 'south',
        category: 'Природа',
        categoryEn: 'Nature',
        description: 'Каскад горных озёр изумрудного цвета в Кунгей Алатау. "Жемчужина Северного Тянь-Шаня".',
        descriptionEn: 'Cascade of emerald mountain lakes in Kungey Alatau. "Pearl of Northern Tian Shan".',
        longDescription: 'Кольсайские озёра — это три живописных озера на высоте от 1818 до 2850 метров. Окружённые тянь-шаньскими елями, они поражают своей красотой. Отличное место для треккинга, рыбалки и фотографии.',
        budget: { min: 80000, max: 115000 },
    },
    {
        id: 'tour_5',
        attractionId: 6, // Тюльпаны в степи (визуально подходит Алтын-Эмелю)
        name: 'Алтын-Эмель',
        nameEn: 'Altyn-Emel',
        image: IMG.kaindy,
        price: 60000,
        duration: '1 день',
        durationDays: 1,
        rating: 4.6,
        reviewCount: 67,
        region: 'south',
        category: 'Природа',
        categoryEn: 'Nature',
        description: 'Национальный парк с Поющим барханом и древними курганами. Уникальная экосистема.',
        descriptionEn: 'National park with the Singing Dune and ancient burial mounds. Unique ecosystem.',
        longDescription: 'Алтын-Эмель — крупнейший национальный парк Казахстана. Здесь находится знаменитый Поющий бархан, древние курганы Бесшатыр и уникальная флора и фауна, включая куланов и джейранов.',
        budget: { min: 50000, max: 75000 },
    },
];

// Hot tours data with discounts
export const HOT_TOURS = [
    {
        id: 'hot_1',
        attractionId: 1,
        name: 'Чарынский Каньон',
        nameEn: 'Charyn Canyon',
        image: IMG.charyn,
        originalPrice: 42000,
        discountPrice: 32000,
        discount: 24,
        duration: '1 день',
        durationDays: 1,
        reason: '🔥 Скидка 24% до конца недели!',
        reasonEn: '🔥 24% off until end of week!',
        region: 'south',
        category: 'Природа',
        categoryEn: 'Nature',
        rating: 4.8,
        description: 'Уникальный природный памятник, напоминающий Гранд-Каньон. Один из самых впечатляющих каньонов Центральной Азии.',
        descriptionEn: 'A unique natural monument resembling the Grand Canyon. One of the most impressive canyons in Central Asia.',
        longDescription: 'Чарынский каньон — это природный памятник возрастом более 12 миллионов лет. Его красные скалы и причудливые формы создают незабываемое зрелище. Каньон протянулся на 154 км вдоль реки Чарын.',
        budget: { min: 28000, max: 36000 },
    },
    {
        id: 'hot_2',
        attractionId: 2,
        name: 'Боровое — 3 дня',
        nameEn: 'Burabay - 3 days',
        image: IMG.borovoe,
        originalPrice: 165000,
        discountPrice: 132000,
        discount: 20,
        duration: '3 дня',
        durationDays: 3,
        reason: '⭐ Популярный тур сезона',
        reasonEn: '⭐ Season\'s popular tour',
        region: 'north',
        category: 'Природа',
        categoryEn: 'Nature',
        rating: 4.9,
        description: 'Живописный курорт среди сосновых лесов и гор. Идеальное место для отдыха и восстановления сил.',
        descriptionEn: 'Picturesque resort among pine forests and mountains. Perfect place for relaxation and rejuvenation.',
        longDescription: 'Боровое — это уникальный природный комплекс с живописными озёрами, причудливыми скалами и целебным воздухом. Здесь можно насладиться пешими прогулками, водными развлечениями и спа-процедурами.',
        budget: { min: 115000, max: 140000 },
    },
    {
        id: 'hot_3',
        attractionId: 10, // Мангистау Бозжыра
        name: 'Мангистау Экспедиция',
        nameEn: 'Mangystau Expedition',
        image: IMG.bozzhyra,
        originalPrice: 380000,
        discountPrice: 310000,
        discount: 18,
        duration: '5 дней',
        durationDays: 5,
        reason: '🎒 Раннее бронирование -18%',
        reasonEn: '🎒 Early booking -18%',
        region: 'west',
        category: 'Приключения',
        categoryEn: 'Adventure',
        rating: 4.7,
        description: 'Экспедиция по марсианским пейзажам Мангистау. Уникальные геологические формации и древние святыни.',
        descriptionEn: 'Expedition through Martian landscapes of Mangystau. Unique geological formations and ancient shrines.',
        longDescription: 'Мангистау — это регион с невероятными ландшафтами, напоминающими другую планету. Здесь вас ждут древние некрополи, подземные мечети и потрясающие виды на Каспийское море.',
        budget: { min: 280000, max: 340000 },
    },
    {
        id: 'hot_4',
        attractionId: 17, // Астана
        name: 'Астана Weekend',
        nameEn: 'Astana Weekend',
        image: IMG.astana,
        originalPrice: 115000,
        discountPrice: 95000,
        discount: 17,
        duration: '2 дня',
        durationDays: 2,
        reason: '🏙️ Групповая скидка',
        reasonEn: '🏙️ Group discount',
        region: 'central',
        category: 'Города',
        categoryEn: 'Cities',
        rating: 4.6,
        description: 'Откройте для себя футуристическую столицу Казахстана. Современная архитектура и богатая культура.',
        descriptionEn: 'Discover the futuristic capital of Kazakhstan. Modern architecture and rich culture.',
        longDescription: 'Астана — это город контрастов, где традиции встречаются с будущим. Посетите Байтерек, Хан Шатыр, Национальный музей и насладитесь ночной жизнью столицы.',
        budget: { min: 85000, max: 110000 },
    },
];

// Helper function to get tour by ID
export const getTourById = (tourId) => {
    const allTours = [...TOURS, ...HOT_TOURS];
    return allTours.find(tour => tour.id === tourId);
};

// Helper function to get tours by region
export const getToursByRegion = (region) => {
    const allTours = [...TOURS, ...HOT_TOURS];
    return allTours.filter(tour => tour.region === region);
};

// Helper to format price
export const formatTourPrice = (price) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₸';
};
