-- Add more PlantVillage disease articles
-- Adding corn, pepper, peach, cherry, squash, strawberry diseases

INSERT INTO public.library_articles (title, excerpt, content, category, tags, is_published, created_at, updated_at) VALUES

-- Corn Diseases
('Ruggine Comune del Mais',
 'Malattia fungina che causa pustole rossastre sulle foglie di mais.',
 $$La ruggine comune è una malattia fungina diffusa del mais che causa pustole rossastre sulle foglie. In condizioni favorevoli può causare significative riduzioni di resa.

**Sintomi:**
- Pustole rossastre su entrambe le pagine fogliari
- Pustole liberano spore color ruggine
- Foglie possono ingiallire e seccare prematuramente
- Riduzione fotosintesi
- Perdita di resa in infezioni gravi

**Cause:**
Fungo Puccinia sorghi favorito da temperature fresche (16-23°C) e elevata umidità.

**Trattamenti:**
- Fungicidi azoli o strobilurine (per mais dolce)
- Normalmente non necessari per mais da granella
- Applicare se infezione precoce e severa

**Prevenzione:**
- Varietà resistenti
- Rotazione colturale
- Eliminazione residui colturali
- Evitare irrigazione dall'alto$$,
 'Malattie Fungine',
 ARRAY['fungo', 'mais', 'ruggine', 'cereale', 'corn'],
 true, NOW(), NOW()),

('Elmintosporiosi del Mais',
 'Malattia fogliare importante che causa grandi lesioni grigio-verdi sul mais.',
 $$L'elmintosporiosi è una delle malattie fogliari più importanti del mais a livello mondiale. Causa grandi lesioni grigio-verdi sulle foglie che possono portare a significativa perdita di resa.

**Sintomi:**
- Lesioni allungate grigio-verdi sulle foglie
- Lesioni lunghe 2.5-15 cm
- Iniziano sulle foglie inferiori
- Progressione verso foglie superiori
- Riduzione area fotosintetica
- Maturazione precoce in casi gravi

**Cause:**
Fungo Exserohilum turcicum favorito da temperature moderate (18-27°C) e umidità relativa elevata.

**Trattamenti:**
- Fungicidi azoli, strobilurine
- Applicare alla prima comparsa sintomi
- Ripetere se necessario

**Prevenzione:**
- Varietà resistenti (gene Ht)
- Rotazione colturale
- Interramento residui colturali
- Evitare irrigazione dall'alto
- Distanziamento adeguato delle piante$$,
 'Malattie Fungine',
 ARRAY['fungo', 'mais', 'helminthosporium', 'cereale', 'corn'],
 true, NOW(), NOW()),

('Cercosporiosi del Mais Gray Leaf Spot',
 'Malattia fungina importante nelle zone di coltivazione intensiva del mais.',
 $$La cercosporiosi, o gray leaf spot, è una malattia fungina che è diventata sempre più importante nelle regioni coltivate intensivamente a mais. Può causare significative perdite di resa.

**Sintomi:**
- Lesioni rettangolari grigie sulle foglie
- Lesioni limitate dalle nervature
- Iniziano come piccole macchie necrotiche
- Espansione a lesioni lunghe 2-7 cm
- Coalescenza in infezioni gravi
- Morte prematura delle foglie

**Cause:**
Fungo Cercospora zeae-maydis favorito da temperature calde (22-30°C) e umidità relativa elevata.

**Trattamenti:**
- Fungicidi strobilurine, azoli
- Applicazione a inizio sintomi o preventiva
- Trattamenti ripetuti se pressione alta

**Prevenzione:**
- Varietà resistenti o tolleranti
- Rotazione con colture non ospiti
- Interramento residui quando possibile
- Evitare monocultura continua$$,
 'Malattie Fungine',
 ARRAY['fungo', 'mais', 'cercospora', 'gray leaf spot', 'corn'],
 true, NOW(), NOW()),

-- Pepper Diseases
('Macchia Batterica del Peperone',
 'Malattia batterica distruttiva che colpisce foglie, fusti e frutti del peperone.',
 $$La macchia batterica è una delle malattie più distruttive del peperone. Causata da diverse specie di Xanthomonas, colpisce foglie, fusti e frutti.

**Sintomi:**
- Macchie scure acquose su foglie
- Alone giallo attorno alle macchie
- Lesioni rialzate scure sui frutti
- Defogliazione severa
- Lesioni su fusti e piccioli
- Riduzione qualità frutti

**Cause:**
Batteri Xanthomonas favoriti da temperature 25-30°C, elevata umidità e piogge battenti.

**Trattamenti:**
- Prodotti a base di rame
- Batteriofagi (se disponibili)
- Rimozione piante gravemente infette
- Evitare lavorare con piante bagnate

**Prevenzione:**
- Sementi certificate
- Trapianti sani
- Varietà resistenti
- Rotazione colturale
- Irrigazione a goccia
- Disinfezione attrezzi$$,
 'Malattie Batteriche',
 ARRAY['batteria', 'peperone', 'xanthomonas', 'macchie', 'pepper'],
 true, NOW(), NOW()),

-- Peach Diseases
('Macchia Batterica del Pesco',
 'Malattia batterica grave che causa defogliazione e lesioni sui frutti del pesco.',
 $$La macchia batterica è una grave malattia del pesco e altre drupacee. Causa defogliazione, lesioni sui frutti e riduzione della produttività.

**Sintomi:**
- Macchie angolari scure sulle foglie
- Caduta precoce foglie (fori da pallottola)
- Lesioni scure incavate sui frutti
- Gommosi sui rami
- Cancri sui rametti
- Riduzione vigore albero

**Cause:**
Batterio Xanthomonas arboricola pv. pruni favorito da temperature 24-28°C e primavere fresche e umide.

**Trattamenti:**
- Prodotti a base di rame (dormienza e caduta petali)
- Nessun trattamento curativo efficace
- Potatura rami infetti
- Gestione nutrizione

**Prevenzione:**
- Varietà resistenti
- Materiale vivaistico certificato
- Frangivento per ridurre ferite
- Trattamenti rameici preventivi
- Potatura per migliorare aerazione$$,
 'Malattie Batteriche',
 ARRAY['batteria', 'pesco', 'drupacee', 'xanthomonas', 'peach'],
 true, NOW(), NOW()),

-- Cherry Diseases
('Oidio del Ciliegio',
 'Malattia fungina che causa muffa bianca e arricciamento fogliare del ciliegio.',
 $$L'oidio del ciliegio è una malattia fungina comune che colpisce principalmente le foglie giovani. Causa arricciamento fogliare e muffa bianca polverosa.

**Sintomi:**
- Polvere bianca su foglie giovani
- Arricciamento e deformazione foglie
- Foglie arricciate verso l'alto
- Crescita stentata germogli
- Defogliazione prematura
- Ridotto vigore albero

**Cause:**
Fungo Podosphaera clandestina favorito da temperature moderate (20-25°C) e umidità relativa elevata.

**Trattamenti:**
- Fungicidi zolfo, azoli, strobilurine
- Bicarbonato di potassio
- Rimozione parti gravemente infette
- Applicazioni preventive e curative

**Prevenzione:**
- Varietà resistenti
- Potatura per migliorare aerazione
- Evitare eccesso azoto
- Piantare in zone soleggiate
- Monitoraggio regolare$$,
 'Malattie Fungine',
 ARRAY['fungo', 'ciliegio', 'oidio', 'muffa bianca', 'cherry'],
 true, NOW(), NOW()),

-- Squash Diseases
('Oidio delle Cucurbitacee',
 'Malattia fungina comune che causa muffa bianca su zucche, cetrioli e meloni.',
 $$L'oidio delle cucurbitacee è una delle malattie più comuni di zucche, zucchine, cetrioli e meloni. Si manifesta come polvere bianca sulle foglie.

**Sintomi:**
- Polvere bianca su foglie (sopra e sotto)
- Macchie bianche che si espandono
- Ingiallimento e disseccamento foglie
- Defogliazione prematura
- Riduzione fotosintesi
- Scottature sui frutti esposti

**Cause:**
Funghi Podosphaera xanthii, Erysiphe cichoracearum favoriti da temperature moderate (20-30°C).

**Trattamenti:**
- Fungicidi zolfo bagnabile
- Fungicidi azoli, strobilurine
- Bicarbonato di potassio
- Latte diluito (10-20%)
- Olio di neem
- Applicazioni settimanali

**Prevenzione:**
- Varietà resistenti
- Distanziamento adeguato
- Irrigazione a goccia
- Evitare stress idrico
- Rotazione colturale
- Rimozione residui infetti$$,
 'Malattie Fungine',
 ARRAY['fungo', 'zucca', 'cucurbitacee', 'oidio', 'squash'],
 true, NOW(), NOW()),

-- Strawberry Diseases
('Maculatura Fogliare della Fragola',
 'Malattia fungina che causa lesioni purpuree sulle foglie di fragola.',
 $$La maculatura fogliare è una malattia fungina comune della fragola che causa lesioni purpuree sulle foglie. Infezioni gravi possono causare defogliazione.

**Sintomi:**
- Piccole macchie purpuree sulle foglie
- Macchie con centro grigio-bianco
- Coalescenza in lesioni più grandi
- Disseccamento fogliare (scorch)
- Defogliazione prematura
- Ridotta produzione

**Cause:**
Fungo Diplocarpon earlianum favorito da temperature moderate (20-25°C) e umidità elevata.

**Trattamenti:**
- Fungicidi captan, clorotalonil
- Rimozione foglie infette
- Migliorare circolazione aria
- Trattamenti ogni 7-14 giorni

**Prevenzione:**
- Varietà resistenti
- Distanziamento adeguato
- Irrigazione a goccia o manichetta
- Pacciamare per ridurre schizzi
- Rimuovere foglie vecchie
- Rotazione con colture non ospiti$$,
 'Malattie Fungine',
 ARRAY['fungo', 'fragola', 'maculatura', 'diplocarpon', 'strawberry'],
 true, NOW(), NOW()),

-- Additional Apple Disease
('Ruggine del Cedro-Melo',
 'Malattia fungina che alterna tra melo e cedro, causando macchie arancioni.',
 $$La ruggine del cedro-melo è una malattia fungina che richiede due ospiti alternati: il melo e il cedro rosso. Causa macchie gialle-arancioni caratteristiche.

**Sintomi:**
- Macchie gialle-arancioni su foglie di melo
- Protuberanze cilindriche arancioni sotto le foglie
- Defogliazione precoce
- Galle legnose sui rami di cedro
- Tentacoli gelatinosi arancioni in primavera su cedro

**Cause:**
Fungo Gymnosporangium juniperi-virginianae favorito da primavere umide e presenza di cedri rossi.

**Trattamenti:**
- Applicare fungicidi protettivi in primavera
- Rimuovere cedri infetti nelle vicinanze (se possibile)
- Trattamenti ripetuti durante la stagione

**Prevenzione:**
- Piantare varietà di melo resistenti
- Rimuovere cedri rossi entro 300 metri
- Applicare fungicidi preventivi in primavera
- Potatura per migliorare circolazione aria$$,
 'Malattie Fungine',
 ARRAY['fungo', 'melo', 'ruggine', 'cedro', 'apple'],
 true, NOW(), NOW()),

-- Tomato Additional Diseases
('Cladosporiosi del Pomodoro',
 'Malattia fungina da serra che causa muffa vellutata sulle foglie di pomodoro.',
 $$La cladosporiosi è una malattia fungina comune nelle serre e negli ambienti umidi. Causa macchie fogliari caratteristiche con muffa vellutata.

**Sintomi:**
- Macchie gialle pallide sulla pagina superiore delle foglie
- Muffa vellutata verde-oliva sotto le foglie
- Foglie arricciate e appassite
- Raramente colpisce frutti
- Defogliazione in casi gravi

**Cause:**
Fungo Passalora fulva favorito da umidità relativa elevata (>85%) e scarsa ventilazione.

**Trattamenti:**
- Migliorare ventilazione
- Ridurre umidità relativa
- Fungicidi a base di rame
- Rimuovere foglie gravemente infette

**Prevenzione:**
- Varietà resistenti (Gene Cf)
- Ventilazione adeguata in serra
- Evitare sovraffollamento
- Irrigazione al mattino
- Controllo umidità (<85%)$$,
 'Malattie Fungine',
 ARRAY['fungo', 'pomodoro', 'serra', 'muffa', 'tomato'],
 true, NOW(), NOW()),

('Septoriosi del Pomodoro',
 'Malattia fungina che causa macchie circolari con centro chiaro sulle foglie.',
 $$La septoriosi è una malattia fungina comune che causa piccole macchie circolari con centro chiaro sulle foglie. Inizia dalle foglie più basse.

**Sintomi:**
- Piccole macchie circolari con centro grigio-bianco
- Margine scuro attorno alle macchie
- Puntini neri (picnidi) al centro delle macchie
- Inizia dalle foglie più basse
- Defogliazione progressiva
- Raramente colpisce frutti

**Cause:**
Fungo Septoria lycopersici favorito da temperature 20-25°C e elevata umidità.

**Trattamenti:**
- Rimuovere foglie infette
- Fungicidi a base di rame o clorotalonil
- Trattamenti ogni 7-14 giorni
- Pacciamare il terreno

**Prevenzione:**
- Rotazione colturale (3 anni minimo)
- Rimuovere tutti i residui colturali
- Pacciamare per prevenire schizzi di terreno
- Irrigazione a goccia
- Distanziamento adeguato$$,
 'Malattie Fungine',
 ARRAY['fungo', 'pomodoro', 'macchie', 'septoria', 'tomato'],
 true, NOW(), NOW()),

('Macchia Batterica del Pomodoro',
 'Malattia batterica che colpisce foglie, fusti e frutti del pomodoro.',
 $$La macchia batterica è causata da diverse specie di Xanthomonas ed è una delle malattie più distruttive del pomodoro. Colpisce foglie, fusti e frutti.

**Sintomi:**
- Piccole macchie scure acquose su foglie
- Macchie con alone giallo
- Lesioni scure rialzate sui frutti
- Defogliazione severa
- Lesioni scure su fusti e piccioli

**Cause:**
Batteri Xanthomonas favoriti da temperature 25-30°C, elevata umidità e piogge.

**Trattamenti:**
- Prodotti a base di rame
- Batteriofagi specifici (se disponibili)
- Rimozione piante gravemente infette
- Evitare lavorazioni con piante bagnate

**Prevenzione:**
- Usare sementi certificate
- Trapianti sani
- Rotazione colturale
- Evitare irrigazione dall'alto
- Disinfezione attrezzi
- Varietà resistenti$$,
 'Malattie Batteriche',
 ARRAY['batteria', 'pomodoro', 'xanthomonas', 'macchie', 'tomato'],
 true, NOW(), NOW()),

('Virus del Mosaico del Pomodoro ToMV',
 'Virus altamente contagioso che causa mosaicatura e deformazione fogliare.',
 $$Il virus del mosaico è altamente contagioso e può persistere in residui vegetali, semi e attrezzi per anni. Causa mosaicatura fogliare e deformazione.

**Sintomi:**
- Mosaico verde chiaro/scuro sulle foglie
- Foglie arricciate e deformi
- Crescita stentata
- Frutti con macchie gialle o marroni
- Riduzione della produzione
- Maturazione irregolare dei frutti

**Cause:**
Tomato Mosaic Virus trasmesso meccanicamente (mani, attrezzi) e attraverso sementi infette.

**Trattamenti:**
- Nessuna cura disponibile
- Rimuovere e distruggere piante infette
- Disinfezione completa di attrezzi e mani
- Latte in polvere (10%) come disinfettante

**Prevenzione:**
- Varietà resistenti (Gene Tm-2²)
- Sementi certificate
- Disinfezione attrezzi con candeggina al 10%
- Lavaggio mani frequente
- Non fumare tabacco prima di lavorare$$,
 'Malattie Virali',
 ARRAY['virus', 'pomodoro', 'mosaico', 'ToMV', 'tomato'],
 true, NOW(), NOW()),

('Ragnetto Rosso del Pomodoro',
 'Acaro che succhia linfa dalle foglie, causando danni in condizioni calde e secche.',
 $$Il ragnetto rosso è un acaro minuscolo che si nutre succhiando la linfa dalle foglie. In condizioni calde e secche può moltiplicarsi rapidamente.

**Sintomi:**
- Puntini gialli o bianchi sulle foglie
- Sottili ragnatele sulle foglie
- Foglie bronzee o argentate
- Defogliazione in infestazioni gravi
- Riduzione vigore pianta
- Acari visibili sulla pagina inferiore

**Cause:**
Acaro Tetranychus urticae favorito da temperature elevate (27-32°C) e bassa umidità relativa.

**Trattamenti:**
- Acaricidi specifici (spiromesifen, abamectina)
- Sapone insetticida
- Olio di neem
- Lavaggi frequenti con acqua
- Predatori naturali (Phytoseiulus persimilis)

**Prevenzione:**
- Mantenere adeguata umidità
- Irrigazione regolare
- Evitare stress da siccità
- Favorire predatori naturali
- Monitoraggio regolare
- Quarantena nuove piante$$,
 'Parassiti',
 ARRAY['acaro', 'pomodoro', 'ragnetto', 'parassita', 'tomato'],
 true, NOW(), NOW()),

('Maculatura Bersaglio del Pomodoro',
 'Malattia fungina che causa lesioni concentriche su foglie, fusti e frutti.',
 $$La maculatura bersaglio è una malattia fungina emergente che causa lesioni concentriche caratteristiche su foglie, fusti e frutti.

**Sintomi:**
- Macchie marroni con anelli concentrici (bersaglio)
- Lesioni su foglie, fusti e frutti
- Alone clorotico attorno alle macchie
- Defogliazione grave
- Lesioni incavate sui frutti
- Caduta prematura delle foglie

**Cause:**
Fungo Corynespora cassiicola favorito da temperature 20-28°C e elevata umidità (>80%).

**Trattamenti:**
- Fungicidi azossistrobina, clorotalonil
- Rimozione foglie infette
- Migliorare ventilazione
- Trattamenti ogni 7-14 giorni

**Prevenzione:**
- Varietà resistenti (se disponibili)
- Rotazione colturale
- Evitare irrigazione dall'alto
- Distanziamento adeguato piante
- Rimozione residui colturali$$,
 'Malattie Fungine',
 ARRAY['fungo', 'pomodoro', 'maculatura', 'corynespora', 'tomato'],
 true, NOW(), NOW()),

-- Potato Additional Disease
('Alternariosi della Patata',
 'Malattia fungina che causa macchie concentriche sulle foglie di patata.',
 $$L'alternariosi è una malattia fungina comune della patata che causa macchie fogliari concentriche. Colpisce principalmente le foglie più vecchie.

**Sintomi:**
- Macchie marroni circolari con anelli concentrici
- Foglie inferiori colpite per prime
- Alone clorotico attorno alle macchie
- Defogliazione progressiva
- Lesioni scure sui tuberi
- Riduzione resa

**Cause:**
Fungo Alternaria solani favorito da temperature 24-29°C e alternanza umidità/secco.

**Trattamenti:**
- Fungicidi mancozeb, clorotalonil
- Rimozione foglie infette
- Migliorare nutrizione
- Trattamenti preventivi

**Prevenzione:**
- Varietà resistenti
- Rotazione colturale (3-4 anni)
- Fertilizzazione equilibrata
- Irrigazione regolare
- Eliminazione residui colturali$$,
 'Malattie Fungine',
 ARRAY['fungo', 'patata', 'alternaria', 'orto', 'potato'],
 true, NOW(), NOW()),

-- Grape Additional Disease
('Mal Esca della Vite',
 'Malattia complessa del legno della vite, grave e difficile da controllare.',
 $$Il mal dell'Esca è una malattia complessa del legno della vite causata da un complesso di funghi. È una delle malattie più gravi e difficili da controllare.

**Sintomi:**
- Decolorazione fogliare (tigrata)
- Imbrunimento internervale foglie
- Necrosi settoriali del legno
- Disseccamento improvviso tralci (apoplessia)
- Riduzione vigore
- Morte progressiva della pianta

**Cause:**
Complesso funghi (Phaeomoniella, Phaeoacremonium, Fomitiporia) favorito da ferite da potatura.

**Trattamenti:**
- Nessuna cura efficace disponibile
- Potatura legno infetto con sterilizzazione attrezzi
- Protezione ferite da potatura
- Trichoderma (parziale protezione)

**Prevenzione:**
- Potatura corretta con attrezzi disinfettati
- Protezione ferite di potatura
- Evitare stress idrici e nutrizionali
- Materiale vivaistico sano
- Potatura in periodi asciutti$$,
 'Malattie Fungine',
 ARRAY['fungo', 'vite', 'legno', 'esca', 'grape'],
 true, NOW(), NOW());