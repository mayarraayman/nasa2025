class MultiLanguage {
    constructor() {
        this.currentLanguage = 'en';
        this.languages = {
            'en': { name: 'English', native: 'English', flag: '🇺🇸' },
            'es': { name: 'Spanish', native: 'Español', flag: '🇪🇸' },
            'fr': { name: 'French', native: 'Français', flag: '🇫🇷' },
            'de': { name: 'German', native: 'Deutsch', flag: '🇩🇪' },
            'it': { name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
            'pt': { name: 'Portuguese', native: 'Português', flag: '🇵🇹' },
            'ru': { name: 'Russian', native: 'Русский', flag: '🇷🇺' },
            'zh': { name: 'Chinese', native: '中文', flag: '🇨🇳' },
            'ja': { name: 'Japanese', native: '日本語', flag: '🇯🇵' },
            'ar': { name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
            'hi': { name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' }
        };

        this.translations = this.initializeTranslations();
        this.loadPreference();
    }

    initializeTranslations() {
        return {
            // Navigation & UI
            'nav.dashboard': {
                en: 'Dashboard', es: 'Panel', fr: 'Tableau de bord', de: 'Armaturenbrett',
                it: 'Cruscotto', pt: 'Painel', ru: 'Приборная панель', zh: '仪表板',
                ja: 'ダッシュボード', ar: 'لوحة التحكم', hi: 'डैशबोर्ड'
            },
            'nav.asteroids': {
                en: 'Asteroids', es: 'Asteroides', fr: 'Astéroïdes', de: 'Asteroiden',
                it: 'Asteroidi', pt: 'Asteroides', ru: 'Астероиды', zh: '小行星',
                ja: '小惑星', ar: 'الكويكبات', hi: 'क्षुद्रग्रह'
            },
            'nav.defense': {
                en: 'Defense', es: 'Defensa', fr: 'Défense', de: 'Verteidigung',
                it: 'Difesa', pt: 'Defesa', ru: 'Защита', zh: '防御',
                ja: '防衛', ar: 'الدفاع', hi: 'रक्षा'
            },
            'nav.simulation': {
                en: 'Simulation', es: 'Simulación', fr: 'Simulation', de: 'Simulation',
                it: 'Simulazione', pt: 'Simulação', ru: 'Симуляция', zh: '模拟',
                ja: 'シミュレーション', ar: 'المحاكاة', hi: 'सिमुलेशन'
            },

            // Panel Titles
            'panel.asteroid_properties': {
                en: 'Asteroid Properties', es: 'Propiedades del Asteroide', fr: 'Propriétés de l\'Astéroïde',
                de: 'Asteroid-Eigenschaften', it: 'Proprietà dell\'Asteroide', pt: 'Propriedades do Asteroide',
                ru: 'Свойства астероида', zh: '小行星属性', ja: '小惑星のプロパティ',
                ar: 'خصائص الكويكب', hi: 'क्षुद्रग्रह गुण'
            },
            'panel.system_alerts': {
                en: 'System Alerts', es: 'Alertas del Sistema', fr: 'Alertes du système',
                de: 'Systemwarnungen', it: 'Avvisi di sistema', pt: 'Alertas do Sistema',
                ru: 'Системные оповещения', zh: '系统警报', ja: 'システムアラート',
                ar: 'تنبيهات النظام', hi: 'सिस्टम अलर्ट'
            },
            'panel.impact_simulation': {
                en: 'Impact Simulation', es: 'Simulación de Impacto', fr: 'Simulation d\'Impact',
                de: 'Aufprallsimulation', it: 'Simulazione di Impatto', pt: 'Simulação de Impacto',
                ru: 'Симуляция удара', zh: '撞击模拟', ja: '衝突シミュレーション',
                ar: 'محاكاة الاصطدام', hi: 'टक्कर सिमुलेशन'
            },

            // Asteroid Properties
            'asteroid.diameter': {
                en: 'Diameter', es: 'Diámetro', fr: 'Diamètre', de: 'Durchmesser',
                it: 'Diametro', pt: 'Diâmetro', ru: 'Диаметр', zh: '直径',
                ja: '直径', ar: 'القطر', hi: 'व्यास'
            },
            'asteroid.velocity': {
                en: 'Velocity', es: 'Velocidad', fr: 'Vitesse', de: 'Geschwindigkeit',
                it: 'Velocità', pt: 'Velocidade', ru: 'Скорость', zh: '速度',
                ja: '速度', ar: 'السرعة', hi: 'वेग'
            },
            'asteroid.composition': {
                en: 'Composition', es: 'Composición', fr: 'Composition', de: 'Zusammensetzung',
                it: 'Composizione', pt: 'Composição', ru: 'Состав', zh: '组成',
                ja: '組成', ar: 'التكوين', hi: 'संरचना'
            },
            'asteroid.impact_probability': {
                en: 'Impact Probability', es: 'Probabilidad de Impacto', fr: 'Probabilité d\'Impact',
                de: 'Aufprallwahrscheinlichkeit', it: 'Probabilità di Impatto', pt: 'Probabilidade de Impacto',
                ru: 'Вероятность удара', zh: '撞击概率', ja: '衝突確率',
                ar: 'احتمال الاصطدام', hi: 'टक्कर संभावना'
            },

            // Threat Levels
            'threat.low': {
                en: 'LOW THREAT', es: 'AMENAZA BAJA', fr: 'MENACE FAIBLE',
                de: 'GERINGE BEDROHUNG', it: 'MINACCIA BASSA', pt: 'AMEAÇA BAIXA',
                ru: 'НИЗКАЯ УГРОЗА', zh: '低威胁', ja: '低い脅威',
                ar: 'تهديد منخفض', hi: 'कम खतरा'
            },
            'threat.medium': {
                en: 'MEDIUM THREAT', es: 'AMENAZA MEDIA', fr: 'MENACE MOYENNE',
                de: 'MITTELBEDROHUNG', it: 'MINACCIA MEDIA', pt: 'AMEAÇA MÉDIA',
                ru: 'СРЕДНЯЯ УГРОЗА', zh: '中等威胁', ja: '中程度の脅威',
                ar: 'تهديد متوسط', hi: 'मध्यम खतरा'
            },
            'threat.high': {
                en: 'HIGH THREAT', es: 'AMENAZA ALTA', fr: 'MENACE ÉLEVÉE',
                de: 'HOHER BEDROHUNG', it: 'MINACCIA ALTA', pt: 'AMEAÇA ALTA',
                ru: 'ВЫСОКАЯ УГРОЗА', zh: '高威胁', ja: '高い脅威',
                ar: 'تهديد مرتفع', hi: 'उच्च खतरा'
            },

            // Simulation Controls
            'simulation.start': {
                en: 'Start Simulation', es: 'Iniciar Simulación', fr: 'Démarrer la Simulation',
                de: 'Simulation starten', it: 'Avvia Simulazione', pt: 'Iniciar Simulação',
                ru: 'Запустить симуляцию', zh: '开始模拟', ja: 'シミュレーション開始',
                ar: 'بدء المحاكاة', hi: 'सिमुलेशन शुरू करें'
            },
            'simulation.stop': {
                en: 'Stop Simulation', es: 'Detener Simulación', fr: 'Arrêter la Simulation',
                de: 'Simulation stoppen', it: 'Ferma Simulazione', pt: 'Parar Simulação',
                ru: 'Остановить симуляцию', zh: '停止模拟', ja: 'シミュレーション停止',
                ar: 'إيقاف المحاكاة', hi: 'सिमुलेशन रोकें'
            },
            'simulation.asteroid_size': {
                en: 'Asteroid Size', es: 'Tamaño del Asteroide', fr: 'Taille de l\'Astéroïde',
                de: 'Asteroidengröße', it: 'Dimensione Asteroide', pt: 'Tamanho do Asteroide',
                ru: 'Размер астероида', zh: '小行星大小', ja: '小惑星のサイズ',
                ar: 'حجم الكويكب', hi: 'क्षुद्रग्रह आकार'
            },
            'simulation.impact_velocity': {
                en: 'Impact Velocity', es: 'Velocidad de Impacto', fr: 'Vitesse d\'Impact',
                de: 'Aufprallgeschwindigkeit', it: 'Velocità di Impatto', pt: 'Velocidade de Impacto',
                ru: 'Скорость удара', zh: '撞击速度', ja: '衝突速度',
                ar: 'سرعة الاصطدام', hi: 'टक्कर वेग'
            },

            // Defense Systems
            'defense.kinetic_impactor': {
                en: 'Kinetic Impactor', es: 'Impactador Cinético', fr: 'Impacteur Cinétique',
                de: 'Kinetischer Impaktor', it: 'Impatto Cinetico', pt: 'Impacto Cinético',
                ru: 'Кинетический ударник', zh: '动能撞击器', ja: '運動量衝突装置',
                ar: 'المصطدم الحركي', hi: 'गतिज प्रभावक'
            },
            'defense.gravity_tractor': {
                en: 'Gravity Tractor', es: 'Tractor Gravitatorio', fr: 'Tracteur Gravitationnel',
                de: 'Schwerkraftschlepper', it: 'Trattore Gravitazionale', pt: 'Trator Gravitacional',
                ru: 'Гравитационный буксир', zh: '重力牵引器', ja: '重力トラクター',
                ar: 'الجرار الجاذبي', hi: 'गुरुत्वाकर्षण ट्रैक्टर'
            },
            'defense.nuclear_device': {
                en: 'Nuclear Device', es: 'Dispositivo Nuclear', fr: 'Dispositif Nucléaire',
                de: 'Nukleare Vorrichtung', it: 'Dispositivo Nucleare', pt: 'Dispositivo Nuclear',
                ru: 'Ядерное устройство', zh: '核装置', ja: '核装置',
                ar: 'الجهاز النووي', hi: 'परमाणु उपकरण'
            },

            // Alert Messages
            'alert.system_online': {
                en: 'System Online - All systems nominal', 
                es: 'Sistema En Línea - Todos los sistemas nominales',
                fr: 'Système en ligne - Tous les systèmes nominaux',
                de: 'System online - Alle Systeme nominal',
                it: 'Sistema online - Tutti i sistemi nominali',
                pt: 'Sistema Online - Todos os sistemas nominais',
                ru: 'Система онлайн - Все системы номинальны',
                zh: '系统在线 - 所有系统正常',
                ja: 'システムオンライン - 全システム正常',
                ar: 'النظام يعمل - جميع الأنظمة طبيعية',
                hi: 'सिस्टम ऑनलाइन - सभी सिस्टम सामान्य'
            },
            'alert.neo_detected': {
                en: 'New NEO Detected - Tracking initiated',
                es: 'Nuevo NEO Detectado - Seguimiento iniciado',
                fr: 'Nouveau NEO Détecté - Suivi initié',
                de: 'Neuer NEO erkannt - Verfolgung gestartet',
                it: 'Nuovo NEO Rilevato - Tracciamento avviato',
                pt: 'Novo NEO Detectado - Rastreamento iniciado',
                ru: 'Обнаружен новый ОСЗ - Начато отслеживание',
                zh: '检测到新的近地天体 - 开始跟踪',
                ja: '新しいNEOを検出 - 追跡開始',
                ar: 'تم اكتشاف جسم قريب جديد - بدء التتبع',
                hi: 'नया NEO पाया गया - ट्रैकिंग शुरू'
            },

            // Impact Results
            'result.energy_release': {
                en: 'Energy Release', es: 'Liberación de Energía', fr: 'Libération d\'Énergie',
                de: 'Energiefreisetzung', it: 'Rilascio di Energia', pt: 'Liberação de Energia',
                ru: 'Высвобождение энергии', zh: '能量释放', ja: 'エネルギー放出',
                ar: 'إطلاق الطاقة', hi: 'ऊर्जा विमोचन'
            },
            'result.crater_size': {
                en: 'Crater Size', es: 'Tamaño del Cráter', fr: 'Taille du Cratère',
                de: 'Kratergröße', it: 'Dimensione Cratere', pt: 'Tamanho da Cratera',
                ru: 'Размер кратера', zh: '陨石坑大小', ja: 'クレーターサイズ',
                ar: 'حجم الفوهة', hi: 'गड्ढे का आकार'
            },
            'result.affected_population': {
                en: 'Affected Population', es: 'Población Afectada', fr: 'Population Affectée',
                de: 'Betroffene Bevölkerung', it: 'Popolazione Colpita', pt: 'População Afetada',
                ru: 'Пострадавшее население', zh: '受影响人口', ja: '影響を受ける人口',
                ar: 'عدد السكان المتأثرين', hi: 'प्रभावित जनसंख्या'
            }
        };
    }

    setLanguage(languageCode) {
        if (this.languages[languageCode]) {
            this.currentLanguage = languageCode;
            this.updateUI();
            this.savePreference();
            
            // Dispatch event for other components
            window.dispatchEvent(new CustomEvent('languageChanged', {
                detail: { language: languageCode }
            }));
            
            return true;
        }
        return false;
    }

    getLanguage() {
        return this.currentLanguage;
    }

    translate(key, fallback = '') {
        const translation = this.translations[key];
        if (!translation) {
            console.warn(`Translation key not found: ${key}`);
            return fallback;
        }
        
        return translation[this.currentLanguage] || translation['en'] || fallback;
    }

    updateUI() {
        // Update all translatable elements
        const translatableElements = document.querySelectorAll('[data-translate]');
        
        translatableElements.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.translate(key);
            
            if (translation) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else if (element.hasAttribute('data-translate-html')) {
                    element.innerHTML = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });

        // Update language selector
        this.updateLanguageSelector();
        
        // Update dynamic content
        this.updateDynamicContent();
    }

    updateLanguageSelector() {
        const selector = document.getElementById('languageSelect');
        if (selector) {
            selector.innerHTML = '';
            
            Object.entries(this.languages).forEach(([code, lang]) => {
                const option = document.createElement('option');
                option.value = code;
                option.textContent = `${lang.flag} ${lang.name}`;
                if (code === this.currentLanguage) {
                    option.selected = true;
                }
                selector.appendChild(option);
            });
        }
    }

    updateDynamicContent() {
        // Update any dynamically generated content that needs translation
        // This would be extended based on specific application needs
    }

    detectUserLanguage() {
        // Try browser language
        const browserLang = navigator.language.split('-')[0];
        if (this.languages[browserLang]) {
            return browserLang;
        }
        
        // Try navigator languages
        if (navigator.languages) {
            for (let lang of navigator.languages) {
                const code = lang.split('-')[0];
                if (this.languages[code]) {
                    return code;
                }
            }
        }
        
        return 'en'; // Default to English
    }

    loadPreference() {
        const saved = localStorage.getItem('oblivara-language');
        if (saved && this.languages[saved]) {
            this.currentLanguage = saved;
        } else {
            this.currentLanguage = this.detectUserLanguage();
        }
    }

    savePreference() {
        localStorage.setItem('oblivara-language', this.currentLanguage);
    }

    getAvailableLanguages() {
        return Object.entries(this.languages).map(([code, data]) => ({
            code,
            ...data
        }));
    }

    formatNumber(number, options = {}) {
        const formatter = new Intl.NumberFormat(this.currentLanguage, options);
        return formatter.format(number);
    }

    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        const formatter = new Intl.DateTimeFormat(
            this.currentLanguage, 
            { ...defaultOptions, ...options }
        );
        return formatter.format(new Date(date));
    }

    // Specialized translation methods for the application
    translateAsteroidData(asteroidData) {
        return {
            ...asteroidData,
            composition: this.translate(`composition.${asteroidData.composition}`) || asteroidData.composition,
            threatLevel: this.translate(`threat.${asteroidData.threatLevel}`) || asteroidData.threatLevel
        };
    }

    translateImpactResults(results) {
        const translated = { ...results };
        
        if (results.severity) {
            translated.severity = this.translate(`severity.${results.severity}`) || results.severity;
        }
        
        if (results.climate && results.climate.agriculturalImpact) {
            translated.climate.agriculturalImpact = this.translate(
                `impact.agricultural.${results.climate.agriculturalImpact}`
            ) || results.climate.agriculturalImpact;
        }
        
        return translated;
    }

    translateDefenseMethod(method) {
        return this.translate(`defense.${method.toLowerCase()}`) || method;
    }

    // Emergency alerts and notifications
    generateEmergencyAlert(impactData, userLocation) {
        const timeToImpact = impactData.timeToImpact;
        const severity = impactData.severity;
        
        let alertKey, instructionsKey;
        
        if (timeToImpact < 1) { // Hours
            alertKey = 'emergency.immediate';
            instructionsKey = 'safety.immediate_evacuation';
        } else if (timeToImpact < 24) { // Days
            alertKey = 'emergency.urgent';
            instructionsKey = 'safety.seek_shelter';
        } else if (timeToImpact < 168) { // Weeks
            alertKey = 'emergency.warning';
            instructionsKey = 'safety.prepare_evacuation';
        } else {
            alertKey = 'emergency.monitor';
            instructionsKey = 'safety.stay_informed';
        }
        
        return {
            level: this.translate(alertKey),
            instructions: this.translate(instructionsKey),
            timeRemaining: this.formatTimeRemaining(timeToImpact),
            impactLocation: this.formatLocation(impactData.location),
            estimatedArrival: this.formatDate(Date.now() + timeToImpact * 3600000)
        };
    }

    formatTimeRemaining(hours) {
        if (hours < 1) {
            return this.translate('time.less_than_hour');
        } else if (hours < 24) {
            const h = Math.round(hours);
            return this.translate('time.hours', h, h);
        } else {
            const days = Math.round(hours / 24);
            return this.translate('time.days', days, days);
        }
    }

    formatLocation(location) {
        // This would use geocoding in a real implementation
        return location.name || `${location.lat.toFixed(2)}°, ${location.lon.toFixed(2)}°`;
    }

    // RTL (Right-to-Left) language support
    isRTL() {
        const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
        return rtlLanguages.includes(this.currentLanguage);
    }

    updateDocumentDirection() {
        document.documentElement.dir = this.isRTL() ? 'rtl' : 'ltr';
        document.documentElement.lang = this.currentLanguage;
    }

    // Pluralization support (basic)
    pluralize(key, count, ...args) {
        const pluralForm = count === 1 ? 'singular' : 'plural';
        const pluralKey = `${key}.${pluralForm}`;
        
        return this.translate(pluralKey, this.translate(key)).replace('{count}', count);
    }

    // Initialize
    initialize() {
        this.updateDocumentDirection();
        this.updateUI();
    }
}

export { MultiLanguage };