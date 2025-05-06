import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type ThemeMode = "light" | "dark";
type Language = "en" | "it" | "fr" | "es" | "de";

type ThemeContextType = {
  mode: ThemeMode;
  language: Language;
  setMode: (mode: ThemeMode) => void;
  setLanguage: (language: Language) => void;
  translations: Record<string, Record<Language, string>>;
  t: (key: string, params?: Record<string, string>) => string;
};

const defaultTranslations = {
  "settings": {
    "en": "Settings",
    "it": "Impostazioni",
    "fr": "Paramètres",
    "es": "Configuración",
    "de": "Einstellungen"
  },
  "appearance": {
    "en": "Appearance",
    "it": "Aspetto",
    "fr": "Apparence",
    "es": "Apariencia",
    "de": "Aussehen"
  },
  "darkMode": {
    "en": "Dark Mode",
    "it": "Modalità scura",
    "fr": "Mode sombre",
    "es": "Modo oscuro",
    "de": "Dunkelmodus"
  },
  "lightMode": {
    "en": "Light Mode",
    "it": "Modalità chiara",
    "fr": "Mode clair",
    "es": "Modo claro",
    "de": "Hellmodus"
  },
  "language": {
    "en": "Language",
    "it": "Lingua",
    "fr": "Langue",
    "es": "Idioma",
    "de": "Sprache"
  },
  "english": {
    "en": "English",
    "it": "Inglese",
    "fr": "Anglais",
    "es": "Inglés",
    "de": "Englisch"
  },
  "italian": {
    "en": "Italian",
    "it": "Italiano",
    "fr": "Italien",
    "es": "Italiano",
    "de": "Italienisch"
  },
  "french": {
    "en": "French",
    "it": "Francese",
    "fr": "Français",
    "es": "Francés",
    "de": "Französisch"
  },
  "spanish": {
    "en": "Spanish",
    "it": "Spagnolo",
    "fr": "Espagnol",
    "es": "Español",
    "de": "Spanisch"
  },
  "german": {
    "en": "German",
    "it": "Tedesco",
    "fr": "Allemand",
    "es": "Alemán",
    "de": "Deutsch"
  },
  "save": {
    "en": "Save",
    "it": "Salva",
    "fr": "Enregistrer",
    "es": "Guardar",
    "de": "Speichern"
  },
  "cancel": {
    "en": "Cancel",
    "it": "Annulla",
    "fr": "Annuler",
    "es": "Cancelar",
    "de": "Abbrechen"
  },
  "profile": {
    "en": "Profile",
    "it": "Profilo",
    "fr": "Profil",
    "es": "Perfil",
    "de": "Profil"
  },
  "signOut": {
    "en": "Sign Out",
    "it": "Disconnettersi",
    "fr": "Se déconnecter",
    "es": "Cerrar sesión",
    "de": "Abmelden"
  },
  "changeUsername": {
    "en": "Change Username",
    "it": "Cambia nome utente",
    "fr": "Changer de nom d'utilisateur",
    "es": "Cambiar nombre de usuario",
    "de": "Benutzernamen ändern"
  },
  "changePassword": {
    "en": "Change Password",
    "it": "Cambia password",
    "fr": "Changer le mot de passe",
    "es": "Cambiar contraseña",
    "de": "Passwort ändern"
  },
  "currentUsername": {
    "en": "Current Username",
    "it": "Nome utente attuale",
    "fr": "Nom d'utilisateur actuel",
    "es": "Nombre de usuario actual",
    "de": "Aktueller Benutzername"
  },
  "newUsername": {
    "en": "New Username",
    "it": "Nuovo nome utente",
    "fr": "Nouveau nom d'utilisateur",
    "es": "Nuevo nombre de usuario",
    "de": "Neuer Benutzername"
  },
  "currentPassword": {
    "en": "Current Password",
    "it": "Password attuale",
    "fr": "Mot de passe actuel",
    "es": "Contraseña actual",
    "de": "Aktuelles Passwort"
  },
  "newPassword": {
    "en": "New Password",
    "it": "Nuova password",
    "fr": "Nouveau mot de passe",
    "es": "Nueva contraseña",
    "de": "Neues Passwort"
  },
  "confirmPassword": {
    "en": "Confirm Password",
    "it": "Conferma password",
    "fr": "Confirmer le mot de passe",
    "es": "Confirmar contraseña",
    "de": "Passwort bestätigen"
  },
  "privacyPolicy": {
    "en": "Privacy Policy",
    "it": "Politica sulla privacy",
    "fr": "Politique de confidentialité",
    "es": "Política de privacidad",
    "de": "Datenschutzrichtlinie"
  },
  
  // Additional translations for new pages
  "home": {
    "en": "Home",
    "it": "Home",
    "fr": "Accueil",
    "es": "Inicio",
    "de": "Startseite"
  },
  "aboutUs": {
    "en": "About Us",
    "it": "Chi Siamo",
    "fr": "À Propos de Nous",
    "es": "Sobre Nosotros",
    "de": "Über Uns"
  },
  "services": {
    "en": "Services",
    "it": "Servizi",
    "fr": "Services",
    "es": "Servicios",
    "de": "Dienstleistungen"
  },
  "contact": {
    "en": "Contact",
    "it": "Contatti",
    "fr": "Contact",
    "es": "Contacto",
    "de": "Kontakt"
  },
  "login": {
    "en": "Login",
    "it": "Accedi",
    "fr": "Connexion",
    "es": "Iniciar Sesión",
    "de": "Anmelden"
  },
  "ourMission": {
    "en": "Our Mission",
    "it": "La Nostra Missione",
    "fr": "Notre Mission",
    "es": "Nuestra Misión",
    "de": "Unsere Mission"
  },
  "missionDescription": {
    "en": "At DR PLANT, our mission is to revolutionize plant health care through accessible technology. We aim to empower gardeners, farmers, and plant enthusiasts worldwide by providing instant, accurate disease diagnosis and expert support.",
    "it": "In DR PLANT, la nostra missione è rivoluzionare la cura della salute delle piante attraverso tecnologia accessibile. Miriamo a dare potere a giardinieri, agricoltori e appassionati di piante in tutto il mondo fornendo diagnosi istantanee e accurate delle malattie e supporto esperto.",
    "fr": "Chez DR PLANT, notre mission est de révolutionner les soins de santé des plantes grâce à une technologie accessible. Nous visons à donner aux jardiniers, aux agriculteurs et aux amateurs de plantes du monde entier les moyens de fournir un diagnostic instantané et précis des maladies et un soutien expert.",
    "es": "En DR PLANT, nuestra misión es revolucionar el cuidado de la salud de las plantas a través de tecnología accesible. Nuestro objetivo es empoderar a jardineros, agricultores y entusiastas de las plantas en todo el mundo al proporcionar diagnósticos instantáneos y precisos de enfermedades y apoyo experto.",
    "de": "Bei DR PLANT ist es unsere Mission, die Pflanzenheilkunde durch zugängliche Technologie zu revolutionieren. Unser Ziel ist es, Gärtnern, Landwirten und Pflanzenliebhabern weltweit durch sofortige, genaue Krankheitsdiagnose und fachkundige Unterstützung zu stärken."
  },
  "ourTeam": {
    "en": "Our Team",
    "it": "Il Nostro Team",
    "fr": "Notre Équipe",
    "es": "Nuestro Equipo",
    "de": "Unser Team"
  },
  "teamDescription": {
    "en": "Our team consists of experienced plant pathologists, agronomists, and technology experts dedicated to combining scientific knowledge with cutting-edge AI technology.",
    "it": "Il nostro team è composto da esperti patologi vegetali, agronomi ed esperti di tecnologia dedicati a combinare conoscenze scientifiche con tecnologia AI all'avanguardia.",
    "fr": "Notre équipe est composée de phytopathologistes expérimentés, d'agronomes et d'experts en technologie dédiés à combiner les connaissances scientifiques avec la technologie d'IA de pointe.",
    "es": "Nuestro equipo está formado por fitopatólogos experimentados, agrónomos y expertos en tecnología dedicados a combinar conocimientos científicos con tecnología de IA de vanguardia.",
    "de": "Unser Team besteht aus erfahrenen Pflanzenpathogen, Agronomen und Technologieexperten, die sich der Kombination von wissenschaftlichem Wissen mit modernster KI-Technologie widmen."
  },
  "plantPathologist": {
    "en": "Plant Pathologist",
    "it": "Patologo Vegetale",
    "fr": "Phytopathologiste",
    "es": "Fitopatólogo",
    "de": "Pflanzenpathoge"
  },
  "agronomist": {
    "en": "Agronomist",
    "it": "Agronomo",
    "fr": "Agronome",
    "es": "Agrónomo",
    "de": "Agronom"
  },
  "botanist": {
    "en": "Botanist",
    "it": "Botanico",
    "fr": "Botaniste",
    "es": "Botánico",
    "de": "Botaniker"
  },
  "ourImpact": {
    "en": "Our Impact",
    "it": "Il Nostro Impatto",
    "fr": "Notre Impact",
    "es": "Nuestro Impacto",
    "de": "Unser Einfluss"
  },
  "impactDescription": {
    "en": "DR PLANT has helped thousands of users across the globe identify and treat plant diseases, contributing to healthier gardens and more sustainable farming practices.",
    "it": "DR PLANT ha aiutato migliaia di utenti in tutto il mondo a identificare e trattare malattie delle piante, contribuendo a giardini più sani e pratiche agricole più sostenibili.",
    "fr": "DR PLANT a aidé des milliers d'utilisateurs à travers le monde à identifier et à traiter les maladies des plantes, contribuant à des jardins plus sains et à des pratiques agricoles plus durables.",
    "es": "DR PLANT ha ayudado a miles de usuarios en todo el mundo a identificar y tratar enfermedades de plantas, contribuyendo a jardines más saludables y prácticas agrícolas más sostenibles.",
    "de": "DR PLANT hat Tausenden von Benutzern auf der ganzen Welt geholfen, Pflanzenkrankheiten zu identifizieren und zu behandeln, was zu gesünderen Gärten und nachhaltigeren landwirtschaftlichen Praktiken beiträgt."
  },
  "impactPoint1": {
    "en": "Over 50,000 successful plant disease diagnoses worldwide",
    "it": "Oltre 50.000 diagnosi di successo di malattie delle piante in tutto il mondo",
    "fr": "Plus de 50 000 diagnostics réussis de maladies des plantes dans le monde",
    "es": "Más de 50.000 diagnósticos exitosos de enfermedades de plantas en todo el mundo",
    "de": "Über 50.000 erfolgreiche Diagnosen von Pflanzenkrankheiten weltweit"
  },
  "impactPoint2": {
    "en": "Helped reduce pesticide use by 30% through targeted treatments",
    "it": "Ha contribuito a ridurre l'uso di pesticidi del 30% attraverso trattamenti mirati",
    "fr": "A aidé à réduire l'utilisation de pesticides de 30 % grâce à des traitements ciblés",
    "es": "Ayudó a reducir el uso de pesticidas en un 30% mediante tratamientos dirigidos",
    "de": "Half, den Pestizideinsatz durch gezielte Behandlungen um 30% zu reduzieren"
  },
  "impactPoint3": {
    "en": "Supporting 5,000+ small-scale farmers in developing regions",
    "it": "Supporto a più di 5.000 piccoli agricoltori nelle regioni in via di sviluppo",
    "fr": "Soutien à plus de 5 000 petits agriculteurs dans les régions en développement",
    "es": "Apoyo a más de 5.000 pequeños agricultores en regiones en desarrollo",
    "de": "Unterstützung von über 5.000 kleinen Landwirten in Entwicklungsregionen"
  },
  "impactPoint4": {
    "en": "Educational resources accessed by 100,000+ plant enthusiasts",
    "it": "Risorse educative consultate da oltre 100.000 appassionati di piante",
    "fr": "Ressources éducatives consultées par plus de 100 000 passionnés de plantes",
    "es": "Recursos educativos accedidos por más de 100.000 entusiastas de las plantas",
    "de": "Bildungsressourcen, auf die über 100.000 Pflanzenliebhaber zugreifen"
  },
  "ourServices": {
    "en": "Our Services",
    "it": "I Nostri Servizi",
    "fr": "Nos Services",
    "es": "Nuestros Servicios",
    "de": "Unsere Dienstleistungen"
  },
  "servicesIntro": {
    "en": "We offer comprehensive plant health solutions powered by AI technology and backed by expert knowledge.",
    "it": "Offriamo soluzioni complete per la salute delle piante alimentate dalla tecnologia AI e supportate da conoscenze specialistiche.",
    "fr": "Nous proposons des solutions complètes de santé des plantes alimentées par la technologie d'IA et soutenues par des connaissances d'experts.",
    "es": "Ofrecemos soluciones integrales de salud vegetal impulsadas por tecnología de IA y respaldadas por conocimientos especializados.",
    "de": "Wir bieten umfassende Pflanzenheilkunde-Lösungen, die von KI-Technologie angetrieben und durch Expertenwissen unterstützt werden."
  },
  "plantDiagnosis": {
    "en": "Plant Disease Diagnosis",
    "it": "Diagnosi delle Malattie delle Piante",
    "fr": "Diagnostic des Maladies des Plantes",
    "es": "Diagnóstico de Enfermedades de Plantas",
    "de": "Diagnose von Pflanzenkrankheiten"
  },
  "plantDiagnosisDesc": {
    "en": "Our advanced AI system analyzes plant photos to identify diseases and provide accurate treatment recommendations.",
    "it": "Il nostro sistema AI avanzato analizza le foto delle piante per identificare le malattie e fornire raccomandazioni di trattamento accurate.",
    "fr": "Notre système d'IA avancé analyse les photos de plantes pour identifier les maladies et fournir des recommandations de traitement précises.",
    "es": "Nuestro avanzado sistema de IA analiza fotos de plantas para identificar enfermedades y proporcionar recomendaciones de tratamiento precisas.",
    "de": "Unser fortschrittliches KI-System analysiert Pflanzenfotos, um Krankheiten zu identifizieren und genaue Behandlungsempfehlungen zu geben."
  },
  "diagnosePlant": {
    "en": "Diagnose Your Plant",
    "it": "Diagnostica la Tua Pianta",
    "fr": "Diagnostiquer Votre Plante",
    "es": "Diagnosticar Su Planta",
    "de": "Diagnostizieren Sie Ihre Pflanze"
  },
  "expertConsultation": {
    "en": "Expert Consultation",
    "it": "Consulenza Esperta",
    "fr": "Consultation Expert",
    "es": "Consulta con Expertos",
    "de": "Expertenberatung"
  },
  "expertConsultationDesc": {
    "en": "Connect with plant experts for personalized advice on complex plant health issues and care recommendations.",
    "it": "Connettiti con esperti di piante per consigli personalizzati su problemi complessi di salute delle piante e raccomandazioni di cura.",
    "fr": "Connectez-vous avec des experts en plantes pour des conseils personnalisés sur les problèmes complexes de santé des plantes et des recommandations de soins.",
    "es": "Conéctese con expertos en plantas para obtener consejos personalizados sobre problemas complejos de salud de las plantas y recomendaciones de cuidado.",
    "de": "Verbinden Sie sich mit Pflanzenexperten für persönliche Beratung zu komplexen Pflanzenheilkunde-Problemen und Pflegeempfehlungen."
  },
  "chatWithExperts": {
    "en": "Chat with Experts",
    "it": "Chatta con gli Esperti",
    "fr": "Discuter avec des Experts",
    "es": "Chatear con Expertos",
    "de": "Chatten Sie mit Experten"
  },
  "plantCareShop": {
    "en": "Plant Care Shop",
    "it": "Negozio per la Cura delle Piante",
    "fr": "Boutique de Soins des Plantes",
    "es": "Tienda de Cuidado de Plantas",
    "de": "Pflanzenpflege-Shop"
  },
  "plantCareShopDesc": {
    "en": "Browse our curated selection of plant care products, treatments, and gardening essentials for healthier plants.",
    "it": "Sfoglia la nostra selezione curata di prodotti per la cura delle piante, trattamenti e prodotti essenziali per il giardinaggio per piante più sane.",
    "fr": "Parcourez notre sélection organisée de produits de soins des plantes, de traitements et d'essentiels de jardinage pour des plantes plus saines.",
    "es": "Explore nuestra selección seleccionada de productos para el cuidado de plantas, tratamientos y artículos esenciales para la jardinería para plantas más saludables.",
    "de": "Durchstöbern Sie unsere kuratierte Auswahl an Pflanzenpflegeprodukten, Behandlungen und Gartenartikeln für gesündere Pflanzen."
  },
  "visitShop": {
    "en": "Visit Shop",
    "it": "Visita il Negozio",
    "fr": "Visiter la Boutique",
    "es": "Visitar Tienda",
    "de": "Shop besuchen"
  },
  "plantCareLibrary": {
    "en": "Plant Care Library",
    "it": "Biblioteca per la Cura delle Piante",
    "fr": "Bibliothèque de Soins des Plantes",
    "es": "Biblioteca de Cuidado de Plantas",
    "de": "Pflanzenpflege-Bibliothek"
  },
  "plantCareLibraryDesc": {
    "en": "Access comprehensive guides, tips, and best practices for maintaining healthy plants and preventing diseases.",
    "it": "Accedi a guide complete, consigli e migliori pratiche per mantenere piante sane e prevenire malattie.",
    "fr": "Accédez à des guides complets, des conseils et des meilleures pratiques pour maintenir des plantes saines et prévenir les maladies.",
    "es": "Acceda a guías completas, consejos y mejores prácticas para mantener plantas saludables y prevenir enfermedades.",
    "de": "Greifen Sie auf umfassende Leitfäden, Tipps und bewährte Praktiken zur Erhaltung gesunder Pflanzen und zur Vorbeugung von Krankheiten zu."
  },
  "browseLibrary": {
    "en": "Browse Library",
    "it": "Sfoglia la Biblioteca",
    "fr": "Parcourir la Bibliothèque",
    "es": "Explorar Biblioteca",
    "de": "Bibliothek durchsuchen"
  },
  "premiumServices": {
    "en": "Premium Services",
    "it": "Servizi Premium",
    "fr": "Services Premium",
    "es": "Servicios Premium",
    "de": "Premium-Dienste"
  },
  "premiumServicesDesc": {
    "en": "For commercial growers and serious enthusiasts, we offer specialized premium services with personalized support.",
    "it": "Per coltivatori commerciali e appassionati seri, offriamo servizi premium specializzati con supporto personalizzato.",
    "fr": "Pour les producteurs commerciaux et les passionnés sérieux, nous proposons des services premium spécialisés avec un support personnalisé.",
    "es": "Para cultivadores comerciales y entusiastas serios, ofrecemos servicios premium especializados con soporte personalizado.",
    "de": "Für kommerzielle Anbauer und ernsthafte Enthusiasten bieten wir spezialisierte Premium-Dienste mit persönlicher Unterstützung."
  },
  "onSiteConsultation": {
    "en": "On-site Consultation",
    "it": "Consulenza in Loco",
    "fr": "Consultation sur Site",
    "es": "Consulta in Situ",
    "de": "Vor-Ort-Beratung"
  },
  "onSiteConsultationDesc": {
    "en": "Expert visits to your farm or garden for comprehensive assessment",
    "it": "Visite di esperti alla tua fattoria o giardino per una valutazione completa",
    "fr": "Visites d'experts dans votre ferme ou jardin pour une évaluation complète",
    "es": "Visitas de expertos a su granja o jardín para una evaluación integral",
    "de": "Expertenbesuche auf Ihrem Bauernhof oder Garten für eine umfassende Bewertung"
  },
  "laboratoryAnalysis": {
    "en": "Laboratory Analysis",
    "it": "Analisi di Laboratorio",
    "fr": "Analyse en Laboratoire",
    "es": "Análisis de Laboratorio",
    "de": "Laboranalyse"
  },
  "laboratoryAnalysisDesc": {
    "en": "Detailed testing of soil, water, and plant tissue samples",
    "it": "Test dettagliati di campioni di suolo, acqua e tessuto vegetale",
    "fr": "Tests détaillés d'échantillons de sol, d'eau et de tissus végétaux",
    "es": "Pruebas detalladas de muestras de suelo, agua y tejido vegetal",
    "de": "Detaillierte Untersuchungen von Boden-, Wasser- und Pflanzengewebeproben"
  },
  "customTreatmentPlans": {
    "en": "Custom Treatment Plans",
    "it": "Piani di Trattamento Personalizzati",
    "fr": "Plans de Traitement Personnalisés",
    "es": "Planes de Tratamiento Personalizados",
    "de": "Individuelle Behandlungspläne"
  },
  "customTreatmentPlansDesc": {
    "en": "Tailored solutions for specific plant health challenges",
    "it": "Soluzioni personalizzate per sfide specifiche di salute delle piante",
    "fr": "Solutions sur mesure pour des défis spécifiques de santé des plantes",
    "es": "Soluciones a medida para desafíos específicos de salud vegetal",
    "de": "Maßgeschneiderte Lösungen für spezifische Pflanzengesundheitsherausforderungen"
  },
  "contactForPremium": {
    "en": "Contact Us for Premium Services",
    "it": "Contattaci per Servizi Premium",
    "fr": "Contactez-nous pour les Services Premium",
    "es": "Contáctenos para Servicios Premium",
    "de": "Kontaktieren Sie uns für Premium-Dienste"
  },
  "contactUs": {
    "en": "Contact Us",
    "it": "Contattaci",
    "fr": "Contactez-nous",
    "es": "Contáctenos",
    "de": "Kontaktieren Sie uns"
  },
  "contactUsDescription": {
    "en": "Have questions or need assistance? Reach out to our team and we'll be happy to help.",
    "it": "Hai domande o hai bisogno di assistenza? Contatta il nostro team e saremo felici di aiutarti.",
    "fr": "Vous avez des questions ou besoin d'aide ? Contactez notre équipe et nous serons heureux de vous aider.",
    "es": "¿Tiene preguntas o necesita ayuda? Póngase en contacto con nuestro equipo y estaremos encantados de ayudarle.",
    "de": "Haben Sie Fragen oder benötigen Sie Hilfe? Kontaktieren Sie unser Team und wir helfen Ihnen gerne weiter."
  },
  "emailUs": {
    "en": "Email Us",
    "it": "Inviaci un'Email",
    "fr": "Envoyez-nous un Email",
    "es": "Envíenos un Email",
    "de": "Mailen Sie uns"
  },
  "callUs": {
    "en": "Call Us",
    "it": "Chiamaci",
    "fr": "Appelez-nous",
    "es": "Llámenos",
    "de": "Rufen Sie uns an"
  },
  "visitUs": {
    "en": "Visit Us",
    "it": "Visitaci",
    "fr": "Visitez-nous",
    "es": "Visítenos",
    "de": "Besuchen Sie uns"
  },
  "yourName": {
    "en": "Your Name",
    "it": "Il Tuo Nome",
    "fr": "Votre Nom",
    "es": "Su Nombre",
    "de": "Ihr Name"
  },
  "enterYourName": {
    "en": "Enter your name",
    "it": "Inserisci il tuo nome",
    "fr": "Entrez votre nom",
    "es": "Ingrese su nombre",
    "de": "Geben Sie Ihren Namen ein"
  },
  "yourEmail": {
    "en": "Your Email",
    "it": "La Tua Email",
    "fr": "Votre Email",
    "es": "Su Email",
    "de": "Ihre Email"
  },
  "enterYourEmail": {
    "en": "Enter your email",
    "it": "Inserisci la tua email",
    "fr": "Entrez votre email",
    "es": "Ingrese su email",
    "de": "Geben Sie Ihre Email ein"
  },
  "subject": {
    "en": "Subject",
    "it": "Oggetto",
    "fr": "Sujet",
    "es": "Asunto",
    "de": "Betreff"
  },
  "enterSubject": {
    "en": "Enter subject",
    "it": "Inserisci l'oggetto",
    "fr": "Entrez le sujet",
    "es": "Ingrese el asunto",
    "de": "Geben Sie den Betreff ein"
  },
  "message": {
    "en": "Message",
    "it": "Messaggio",
    "fr": "Message",
    "es": "Mensaje",
    "de": "Nachricht"
  },
  "enterMessage": {
    "en": "Enter your message",
    "it": "Inserisci il tuo messaggio",
    "fr": "Entrez votre message",
    "es": "Ingrese su mensaje",
    "de": "Geben Sie Ihre Nachricht ein"
  },
  "fillAllFields": {
    "en": "Please fill in all fields",
    "it": "Si prega di compilare tutti i campi",
    "fr": "Veuillez remplir tous les champs",
    "es": "Por favor complete todos los campos",
    "de": "Bitte füllen Sie alle Felder aus"
  },
  "messageSent": {
    "en": "Your message has been sent",
    "it": "Il tuo messaggio è stato inviato",
    "fr": "Votre message a été envoyé",
    "es": "Su mensaje ha sido enviado",
    "de": "Ihre Nachricht wurde gesendet"
  },
  "errorSendingMessage": {
    "en": "Error sending message",
    "it": "Errore durante l'invio del messaggio",
    "fr": "Erreur lors de l'envoi du message",
    "es": "Error al enviar el mensaje",
    "de": "Fehler beim Senden der Nachricht"
  },
  "sending": {
    "en": "Sending...",
    "it": "Invio in corso...",
    "fr": "Envoi en cours...",
    "es": "Enviando...",
    "de": "Senden..."
  },
  "sendMessage": {
    "en": "Send Message",
    "it": "Invia Messaggio",
    "fr": "Envoyer le Message",
    "es": "Enviar Mensaje",
    "de": "Nachricht senden"
  },
  "connectWithExperts": {
    "en": "Connect with plant pathologists and agronomists for expert advice on your plant health issues.",
    "it": "Connettiti con patologi vegetali e agronomi per consigli esperti sui problemi di salute delle tue piante.",
    "fr": "Connectez-vous avec des phytopathologistes et des agronomes pour des conseils d'experts sur les problèmes de santé de vos plantes.",
    "es": "Conéctese con fitopatólogos y agrónomos para obtener asesoramiento experto sobre problemas de salud de sus plantas.",
    "de": "Verbinden Sie sich mit Pflanzenpathogen und Agronomen für Expertenrat zu Problemen mit der Gesundheit Ihrer Pflanzen."
  },
  "responseTime": {
    "en": "Response time: typically within 1-2 hours",
    "it": "Tempo di risposta: generalmente entro 1-2 ore",
    "fr": "Temps de réponse: généralement dans 1-2 heures",
    "es": "Tiempo de respuesta: generalmente dentro de 1-2 horas",
    "de": "Antwortzeit: normalerweise innerhalb von 1-2 Stunden"
  },
  "online": {
    "en": "Online",
    "it": "Online",
    "fr": "En ligne",
    "es": "En línea",
    "de": "Online"
  },
  "typeYourMessage": {
    "en": "Type your message...",
    "it": "Scrivi il tuo messaggio...",
    "fr": "Tapez votre message...",
    "es": "Escriba su mensaje...",
    "de": "Schreiben Sie Ihre Nachricht..."
  },
  "notificationSent": {
    "en": "Notification sent to {name}",
    "it": "Notifica inviata a {name}",
    "fr": "Notification envoyée à {name}",
    "es": "Notificación enviada a {name}",
    "de": "Benachrichtigung an {name} gesendet"
  },
  "messageSendError": {
    "en": "Failed to send message. Please try again.",
    "it": "Invio del messaggio non riuscito. Si prega di riprovare.",
    "fr": "Échec de l'envoi du message. Veuillez réessayer.",
    "es": "No se pudo enviar el mensaje. Inténtelo de nuevo.",
    "de": "Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut."
  },
  "expertResponse": {
    "en": "Thanks for the additional details. Based on the symptoms you've described, it sounds like we're dealing with a fungal infection. I'd recommend a treatment with neem oil or a potassium bicarbonate solution. Would you like me to recommend some specific products from our shop?",
    "it": "Grazie per i dettagli aggiuntivi. In base ai sintomi che hai descritto, sembra che stiamo affrontando un'infezione fungina. Consiglio un trattamento con olio di neem o una soluzione di bicarbonato di potassio. Vuoi che ti consigli alcuni prodotti specifici dal nostro negozio?",
    "fr": "Merci pour les détails supplémentaires. D'après les symptômes que vous avez décrits, il semble que nous soyons confrontés à une infection fongique. Je recommanderais un traitement à l'huile de neem ou une solution de bicarbonate de potassium. Souhaitez-vous que je vous recommande des produits spécifiques de notre boutique?",
    "es": "Gracias por los detalles adicionales. Según los síntomas que has descrito, parece que estamos tratando con una infección fúngica. Recomendaría un tratamiento con aceite de neem o una solución de bicarbonato de potasio. ¿Le gustaría que le recomendara algunos productos específicos de nuestra tienda?",
    "de": "Vielen Dank für die zusätzlichen Details. Basierend auf den von Ihnen beschriebenen Symptomen scheint es, dass wir es mit einer Pilzinfektion zu tun haben. Ich würde eine Behandlung mit Neemöl oder einer Kaliumhydrogencarbonat-Lösung empfehlen. Möchten Sie, dass ich Ihnen einige spezifische Produkte aus unserem Shop empfehle?"
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem("theme-mode");
    return (savedMode as ThemeMode) || "light";
  });
  
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("app-language");
    return (savedLanguage as Language) || "en";
  });

  useEffect(() => {
    localStorage.setItem("theme-mode", mode);
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("app-language", language);
  }, [language]);

  // Translation function with parameter support
  const t = (key: string, params?: Record<string, string>) => {
    let translatedText = defaultTranslations[key]?.[language] || key;
    
    // Replace parameters in the translated text if provided
    if (params) {
      Object.keys(params).forEach(param => {
        translatedText = translatedText.replace(`{${param}}`, params[param]);
      });
    }
    
    return translatedText;
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        language,
        setMode,
        setLanguage,
        translations: defaultTranslations,
        t
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
