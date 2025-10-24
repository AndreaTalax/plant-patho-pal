-- Populate library_articles with PlantVillage disease database
-- This migration adds comprehensive plant disease information

INSERT INTO public.library_articles (title, excerpt, content, category, tags, is_published, created_at, updated_at) VALUES
-- Apple Diseases
('Ticchiolatura del Melo (Apple Scab)', 
 'Malattia fungina che causa macchie scure vellutate su foglie e frutti del melo.',
 $$La ticchiolatura del melo è una malattia fungina che causa macchie scure vellutate su foglie e frutti. È una delle malattie più comuni e distruttive del melo, specialmente in condizioni di umidità elevata.

**Sintomi:**
- Macchie olive-verdastre vellutate su foglie
- Lesioni scure su frutti
- Deformazione e caduta precoce delle foglie
- Screpolature sui frutti maturi

**Cause:**
Fungo Venturia inaequalis favorito da primavere umide e fresche.

**Trattamenti:**
- Applicare fungicidi a base di rame o zolfo
- Trattamenti preventivi in primavera
- Rimuovere e distruggere le foglie cadute
- Potatura per migliorare la circolazione dell'aria

**Prevenzione:**
- Scegliere varietà resistenti
- Raccogliere e distruggere foglie cadute in autunno
- Mantenere buona circolazione d'aria tramite potatura$$,
 'Malattie Fungine',
 ARRAY['fungo', 'melo', 'frutteto', 'macchie', 'apple'],
 true, NOW(), NOW()),

('Marciume Nero del Melo (Black Rot)',
 'Malattia fungina che causa macchie fogliari, cancri e marciume dei frutti.',
 $$Il marciume nero è una malattia fungina che colpisce foglie, frutti e rami del melo. Causa macchie fogliari, cancri sui rami e marciume dei frutti che può devastare il raccolto.

**Sintomi:**
- Macchie circolari rosso-porpora su foglie
- Marciume secco nero sui frutti
- Frutti mummificati sui rami
- Cancri sui rami con corteccia screpolata

**Cause:**
Fungo Botryosphaeria obtusa favorito da temperature calde (20-27°C) e umidità elevata.

**Trattamenti:**
- Rimuovere e distruggere frutti mummificati
- Potare rami infetti durante il riposo vegetativo
- Applicare fungicidi sistemici

**Prevenzione:**
- Rimuovere frutti mummificati e rami morti
- Potatura per migliorare ventilazione
- Evitare ferite meccaniche$$,
 'Malattie Fungine',
 ARRAY['fungo', 'melo', 'marciume', 'frutteto', 'apple'],
 true, NOW(), NOW()),

-- Tomato Diseases
('Peronospora Precoce del Pomodoro',
 'Malattia fungina comune che causa macchie concentriche sulle foglie di pomodoro.',
 $$La peronospora precoce è una delle malattie fungine più comuni del pomodoro. Causa macchie scure concentriche sulle foglie più vecchie che possono portare a grave defogliazione.

**Sintomi:**
- Macchie marroni circolari con anelli concentrici
- Foglie inferiori colpite per prime
- Defogliazione progressiva dal basso verso l'alto
- Lesioni scure su fusti
- Macchie incavate sui frutti vicino al peduncolo

**Cause:**
Fungo Alternaria solani favorito da temperatura 24-29°C e elevata umidità.

**Trattamenti:**
- Rimuovere foglie infette
- Applicare fungicidi a base di rame o mancozeb
- Migliorare nutrizione della pianta
- Evitare bagnatura fogliare

**Prevenzione:**
- Rotazione colturale (3-4 anni)
- Rimuovere residui colturali
- Pacciamare il terreno
- Irrigazione a goccia invece che a pioggia$$,
 'Malattie Fungine',
 ARRAY['fungo', 'pomodoro', 'alternaria', 'orto', 'tomato'],
 true, NOW(), NOW()),

('Peronospora Tardiva del Pomodoro',
 'Malattia devastante che può distruggere intere coltivazioni di pomodoro rapidamente.',
 $$La peronospora tardiva è una malattia devastante causata da un oomicete. Può distruggere completamente una coltura di pomodoro in pochi giorni in condizioni favorevoli.

**Sintomi:**
- Macchie acquose grigio-verdi su foglie
- Muffa biancastra sotto le foglie
- Rapida necrosi e disseccamento
- Marciume bruno sui frutti
- Lesioni scure sui fusti
- Odore sgradevole delle parti infette

**Cause:**
Oomicete Phytophthora infestans favorito da temperature fresche (15-21°C) e umidità elevata.

**Trattamenti:**
- Rimuovere immediatamente piante infette
- Fungicidi sistemici (mefenoxam, metalaxyl)
- Fungicidi di contatto preventivi
- Distruzione completa delle piante gravemente colpite

**Prevenzione:**
- Scegliere varietà resistenti
- Evitare irrigazione dall'alto
- Garantire buona circolazione d'aria
- Trattamenti preventivi in condizioni favorevoli$$,
 'Malattie Fungine',
 ARRAY['oomicete', 'pomodoro', 'peronospora', 'emergenza', 'tomato'],
 true, NOW(), NOW()),

('Virus Accartocciamento Fogliare Pomodoro TYLCV',
 'Virus devastante trasmesso da mosca bianca che causa accartocciamento fogliare.',
 $$Il TYLCV è uno dei virus più devastanti del pomodoro a livello mondiale. Trasmesso dalla mosca bianca, causa grave arresto della crescita, arricciamento fogliare e rese drasticamente ridotte.

**Sintomi:**
- Foglie giovani arricciate verso l'alto
- Ingiallimento delle foglie
- Nanismo e arresto della crescita
- Riduzione drastica della produzione frutti
- Frutti piccoli e deformi

**Cause:**
Tomato Yellow Leaf Curl Virus trasmesso da mosca bianca (Bemisia tabaci).

**Trattamenti:**
- Rimuovere e distruggere piante infette
- Controllo rigoroso della mosca bianca
- Insetticidi sistemici
- Barriere fisiche (reti anti-insetto)

**Prevenzione:**
- Varietà resistenti o tolleranti
- Reti anti-insetto
- Controllo mosca bianca con insetticidi o predatori naturali
- Rimozione piante ospiti alternative$$,
 'Malattie Virali',
 ARRAY['virus', 'pomodoro', 'mosca bianca', 'TYLCV', 'tomato'],
 true, NOW(), NOW()),

-- Potato Diseases
('Peronospora della Patata',
 'Malattia devastante che può distruggere rapidamente intere coltivazioni di patate.',
 $$La peronospora della patata è una delle malattie più devastanti dell'agricoltura. Causò la Grande Carestia irlandese del 1845-1852. Può distruggere completamente un campo in pochi giorni.

**Sintomi:**
- Macchie acquose grigio-verdi su foglie
- Muffa bianca sotto le foglie
- Rapida necrosi e collasso pianta
- Marciume bruno sui tuberi
- Odore sgradevole

**Cause:**
Oomicete Phytophthora infestans favorito da temperature fresche (15-21°C) e umidità elevata.

**Trattamenti:**
- Fungicidi sistemici (metalaxyl, mefenoxam)
- Fungicidi di contatto (mancozeb, clorotalonil)
- Distruzione immediata piante infette
- Trattamenti ogni 5-7 giorni in condizioni favorevoli

**Prevenzione:**
- Varietà resistenti
- Tuberi-seme certificati
- Monitoraggio con modelli predittivi
- Eliminazione patate volontarie$$,
 'Malattie Fungine',
 ARRAY['oomicete', 'patata', 'peronospora', 'emergenza', 'potato'],
 true, NOW(), NOW()),

-- Grape Diseases
('Marciume Nero della Vite',
 'Malattia fungina grave che può distruggere completamente il raccolto di uva.',
 $$Il marciume nero è una malattia fungina grave dell'uva che può distruggere completamente il raccolto in condizioni favorevoli. Colpisce foglie, tralci e soprattutto grappoli.

**Sintomi:**
- Macchie marroni circolari sulle foglie
- Lesioni sui tralci giovani
- Acini con marciume bruno
- Mummificazione degli acini
- Picnidi neri sulle lesioni

**Cause:**
Fungo Guignardia bidwellii favorito da temperature 20-25°C e piogge frequenti.

**Trattamenti:**
- Fungicidi mancozeb, captan
- Trattamenti preventivi critici
- Proteggere dalla fioritura a chiusura grappolo

**Prevenzione:**
- Rimuovere acini mummificati
- Potatura per migliorare aerazione
- Gestione vigorosa chioma
- Trattamenti preventivi primaverili$$,
 'Malattie Fungine',
 ARRAY['fungo', 'uva', 'vite', 'marciume', 'grape'],
 true, NOW(), NOW()),

('Peronospora della Vite',
 'Una delle malattie più importanti della vite, colpisce tutte le parti verdi.',
 $$La peronospora è una delle malattie più importanti della vite a livello mondiale. Un oomicete che colpisce tutte le parti verdi della pianta, può causare perdite complete del raccolto.

**Sintomi:**
- Macchie olio sulla pagina superiore foglie
- Muffa bianca sotto le foglie
- Disseccamento foglie
- Grappoli ricoperti di muffa grigio-bianca
- Acini che disseccano (leather berries)

**Cause:**
Oomicete Plasmopara viticola favorito da temperature 20-25°C e piogge frequenti.

**Trattamenti:**
- Fungicidi rameici preventivi
- Fungicidi sistemici (metalaxyl, fosetyl-al)
- Trattamenti ogni 10-14 giorni

**Prevenzione:**
- Varietà resistenti o tolleranti
- Gestione chioma (sfogliatura)
- Drenaggio adeguato
- Evitare irrigazione dall'alto$$,
 'Malattie Fungine',
 ARRAY['oomicete', 'vite', 'peronospora', 'plasmopara', 'grape'],
 true, NOW(), NOW()),

-- Citrus Diseases
('Inverdimento Agrumi Huanglongbing HLB',
 'La malattia più devastante degli agrumi, trasmessa da insetti, senza cura.',
 $$Il greening degli agrumi è considerata la malattia più devastante degli agrumi a livello mondiale. Causata da batteri trasmessi da insetti psillidi, non ha cura. Gli alberi infetti producono frutti deformi e amari e alla fine muoiono.

**Sintomi:**
- Mosaico clorotico asimmetrico sulle foglie
- Frutti piccoli, deformi, lopsided
- Frutti con semi abortiti
- Sapore amaro e acido dei frutti
- Defogliazione graduale
- Declino e morte albero (3-5 anni)

**Cause:**
Batteri Candidatus Liberibacter trasmessi da psillidi (Diaphorina citri).

**Trattamenti:**
- Nessun trattamento curativo
- Rimozione immediata alberi infetti
- Controllo intensivo psillidi

**Prevenzione:**
- Materiale vivaistico certificato
- Controllo rigoroso psillidi
- Survey e rimozione alberi infetti
- Quarantena rigorosa$$,
 'Malattie Batteriche',
 ARRAY['batteria', 'agrumi', 'hlb', 'psillide', 'quarantena', 'citrus'],
 true, NOW(), NOW());