// ============================================================
// SalahMinder — Offline Quran Verses Database
// 50 selected verses with Arabic, translation, and reference
// ============================================================

const VERSES = [
    { arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ", translation: "In the name of Allah, the Most Gracious, the Most Merciful.", ref: "Al-Fatiha 1:1" },
    { arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", translation: "All praise is due to Allah, Lord of all the worlds.", ref: "Al-Fatiha 1:2" },
    { arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", translation: "You alone we worship, and You alone we ask for help.", ref: "Al-Fatiha 1:5" },
    { arabic: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", translation: "Guide us to the straight path.", ref: "Al-Fatiha 1:6" },
    { arabic: "ذَلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِلْمُتَّقِينَ", translation: "This is the Book about which there is no doubt, a guidance for those conscious of Allah.", ref: "Al-Baqarah 2:2" },
    { arabic: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ", translation: "Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence.", ref: "Al-Baqarah 2:255" },
    { arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", translation: "Allah does not burden a soul beyond that it can bear.", ref: "Al-Baqarah 2:286" },
    { arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً", translation: "Our Lord, give us in this world good and in the Hereafter good.", ref: "Al-Baqarah 2:201" },
    { arabic: "وَمَنْ يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", translation: "And whoever relies upon Allah — then He is sufficient for him.", ref: "At-Talaq 65:3" },
    { arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", translation: "Indeed, with hardship comes ease.", ref: "Ash-Sharh 94:6" },
    { arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ", translation: "So remember Me; I will remember you.", ref: "Al-Baqarah 2:152" },
    { arabic: "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَى", translation: "And your Lord is going to give you, and you will be satisfied.", ref: "Ad-Duha 93:5" },
    { arabic: "وَقُلْ رَبِّ زِدْنِي عِلْمًا", translation: "And say, 'My Lord, increase me in knowledge.'", ref: "Ta-Ha 20:114" },
    { arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", translation: "Indeed, Allah is with the patient.", ref: "Al-Baqarah 2:153" },
    { arabic: "وَلَا تَيْأَسُوا مِنْ رَوْحِ اللَّهِ", translation: "And do not despair of the mercy of Allah.", ref: "Yusuf 12:87" },
    { arabic: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي", translation: "My Lord, expand my chest and ease my task for me.", ref: "Ta-Ha 20:25-26" },
    { arabic: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ", translation: "And He is with you wherever you are.", ref: "Al-Hadid 57:4" },
    { arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ", translation: "Say: He is Allah, the One.", ref: "Al-Ikhlas 112:1" },
    { arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", translation: "Verily, in the remembrance of Allah do hearts find rest.", ref: "Ar-Ra'd 13:28" },
    { arabic: "وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ", translation: "And We are closer to him than his jugular vein.", ref: "Qaf 50:16" },
    { arabic: "ادْعُونِي أَسْتَجِبْ لَكُمْ", translation: "Call upon Me; I will respond to you.", ref: "Ghafir 40:60" },
    { arabic: "إِنَّ الصَّلَاةَ تَنْهَى عَنِ الْفَحْشَاءِ وَالْمُنْكَرِ", translation: "Indeed, prayer prohibits immorality and wrongdoing.", ref: "Al-Ankabut 29:45" },
    { arabic: "وَلَنَبْلُوَنَّكُمْ بِشَيْءٍ مِنَ الْخَوْفِ وَالْجُوعِ", translation: "And We will surely test you with something of fear and hunger.", ref: "Al-Baqarah 2:155" },
    { arabic: "وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ", translation: "And seek help through patience and prayer.", ref: "Al-Baqarah 2:45" },
    { arabic: "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا", translation: "Our Lord, let not our hearts deviate after You have guided us.", ref: "Ali 'Imran 3:8" },
    { arabic: "وَاللَّهُ يُحِبُّ الْمُحْسِنِينَ", translation: "And Allah loves those who do good.", ref: "Ali 'Imran 3:134" },
    { arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ", translation: "O you who believe, seek help through patience and prayer.", ref: "Al-Baqarah 2:153" },
    { arabic: "وَإِنْ تَعُدُّوا نِعْمَةَ اللَّهِ لَا تُحْصُوهَا", translation: "And if you should count the favors of Allah, you could not enumerate them.", ref: "An-Nahl 16:18" },
    { arabic: "رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ", translation: "Our Lord, accept from us. Indeed, You are the Hearing, the Knowing.", ref: "Al-Baqarah 2:127" },
    { arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", translation: "For indeed, with hardship will be ease.", ref: "Ash-Sharh 94:5" },
    { arabic: "وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ", translation: "And my success is not but through Allah.", ref: "Hud 11:88" },
    { arabic: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَى أَنفُسِهِمْ لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ", translation: "Say, 'O My servants who have transgressed against themselves, do not despair of the mercy of Allah.'", ref: "Az-Zumar 39:53" },
    { arabic: "وَسَارِعُوا إِلَى مَغْفِرَةٍ مِنْ رَبِّكُمْ", translation: "And hasten to forgiveness from your Lord.", ref: "Ali 'Imran 3:133" },
    { arabic: "إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّى يُغَيِّرُوا مَا بِأَنفُسِهِمْ", translation: "Indeed, Allah will not change the condition of a people until they change what is in themselves.", ref: "Ar-Ra'd 13:11" },
    { arabic: "وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ", translation: "And your Lord says, 'Call upon Me; I will respond to you.'", ref: "Ghafir 40:60" },
    { arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", translation: "Sufficient for us is Allah, and He is the best Disposer of affairs.", ref: "Ali 'Imran 3:173" },
    { arabic: "وَمَنْ يَتَّقِ اللَّهَ يَجْعَلْ لَهُ مَخْرَجًا", translation: "And whoever fears Allah — He will make for him a way out.", ref: "At-Talaq 65:2" },
    { arabic: "رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ", translation: "My Lord, enable me to be grateful for Your favor.", ref: "An-Naml 27:19" },
    { arabic: "وَعَسَى أَنْ تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَكُمْ", translation: "Perhaps you hate a thing and it is good for you.", ref: "Al-Baqarah 2:216" },
    { arabic: "إِنَّ رَحْمَةَ اللَّهِ قَرِيبٌ مِنَ الْمُحْسِنِينَ", translation: "Indeed, the mercy of Allah is near to the doers of good.", ref: "Al-A'raf 7:56" },
    { arabic: "وَكَفَى بِاللَّهِ وَكِيلًا", translation: "And sufficient is Allah as Disposer of affairs.", ref: "An-Nisa 4:81" },
    { arabic: "رَبَّنَا أَتْمِمْ لَنَا نُورَنَا وَاغْفِرْ لَنَا", translation: "Our Lord, perfect for us our light and forgive us.", ref: "At-Tahrim 66:8" },
    { arabic: "تَبَارَكَ اسْمُ رَبِّكَ ذِي الْجَلَالِ وَالْإِكْرَامِ", translation: "Blessed is the name of your Lord, Owner of Majesty and Honor.", ref: "Ar-Rahman 55:78" },
    { arabic: "سُبْحَانَ الَّذِي خَلَقَ الْأَزْوَاجَ كُلَّهَا", translation: "Exalted is He who created all pairs.", ref: "Ya-Sin 36:36" },
    { arabic: "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ", translation: "And We have certainly made the Quran easy for remembrance.", ref: "Al-Qamar 54:17" },
    { arabic: "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ", translation: "So which of the favors of your Lord would you deny?", ref: "Ar-Rahman 55:13" },
    { arabic: "وَهُوَ الَّذِي فِي السَّمَاءِ إِلَٰهٌ وَفِي الْأَرْضِ إِلَٰهٌ", translation: "And it is He who is God in the heaven and on the earth.", ref: "Az-Zukhruf 43:84" },
    { arabic: "لَا إِلَهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ", translation: "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.", ref: "Al-Anbiya 21:87" },
    { arabic: "رَبِّ لَا تَذَرْنِي فَرْدًا وَأَنتَ خَيْرُ الْوَارِثِينَ", translation: "My Lord, do not leave me alone, and You are the best of inheritors.", ref: "Al-Anbiya 21:89" },
    { arabic: "وَاللَّهُ خَيْرُ الرَّازِقِينَ", translation: "And Allah is the best of providers.", ref: "Al-Jumu'ah 62:11" },
];

export function getDailyVerse(date = new Date()) {
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const index = dayOfYear % VERSES.length;
    return VERSES[index];
}

export { VERSES };
