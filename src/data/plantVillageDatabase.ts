/**
 * PlantVillage Disease Database
 * Comprehensive plant disease information database based on PlantVillage dataset
 */

export interface PlantDisease {
  id: string;
  title: string;
  scientificName?: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  hostPlant: string;
  symptoms: string[];
  causes: string[];
  treatments: string[];
  prevention: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  imageQuery?: string; // For Unsplash search
}

export const plantVillageDatabase: PlantDisease[] = [
  // APPLE DISEASES
  {
    id: 'apple-scab',
    title: 'Ticchiolatura del Melo (Apple Scab)',
    scientificName: 'Venturia inaequalis',
    content: 'La ticchiolatura del melo è una malattia fungina che causa macchie scure vellutate su foglie e frutti. È una delle malattie più comuni e distruttive del melo, specialmente in condizioni di umidità elevata. Le infezioni gravi possono causare defogliazione precoce e riduzione della qualità dei frutti.',
    excerpt: 'Malattia fungina che causa macchie scure vellutate su foglie e frutti del melo.',
    category: 'Malattie Fungine',
    tags: ['fungo', 'melo', 'frutteto', 'macchie'],
    hostPlant: 'Melo (Malus domestica)',
    symptoms: [
      'Macchie olive-verdastre vellutate su foglie',
      'Lesioni scure su frutti',
      'Deformazione e caduta precoce delle foglie',
      'Screpolature sui frutti maturi',
      'Ridotta crescita dei germogli'
    ],
    causes: [
      'Fungo Venturia inaequalis',
      'Primavere umide e fresche',
      'Scarsa circolazione d\'aria',
      'Presenza di foglie infette sul terreno'
    ],
    treatments: [
      'Applicare fungicidi a base di rame o zolfo',
      'Trattamenti preventivi in primavera',
      'Rimuovere e distruggere le foglie cadute',
      'Potatura per migliorare la circolazione dell\'aria'
    ],
    prevention: [
      'Scegliere varietà resistenti',
      'Raccogliere e distruggere foglie cadute in autunno',
      'Mantenere buona circolazione d\'aria tramite potatura',
      'Evitare irrigazione dall\'alto',
      'Applicare trattamenti preventivi primaverili'
    ],
    severity: 'high',
    imageQuery: 'apple scab disease'
  },
  {
    id: 'apple-black-rot',
    title: 'Marciume Nero del Melo (Black Rot)',
    scientificName: 'Botryosphaeria obtusa',
    content: 'Il marciume nero è una malattia fungina che colpisce foglie, frutti e rami del melo. Causa macchie fogliari, cancri sui rami e marciume dei frutti che può devastare il raccolto. La malattia è favorita da condizioni calde e umide.',
    excerpt: 'Malattia fungina che causa macchie fogliari, cancri e marciume dei frutti.',
    category: 'Malattie Fungine',
    tags: ['fungo', 'melo', 'marciume', 'frutteto'],
    hostPlant: 'Melo (Malus domestica)',
    symptoms: [
      'Macchie circolari rosso-porpora su foglie',
      'Marciume secco nero sui frutti',
      'Frutti mummificati sui rami',
      'Cancri sui rami con corteccia screpolata',
      'Anelli concentrici sulle lesioni'
    ],
    causes: [
      'Fungo Botryosphaeria obtusa',
      'Temperature calde (20-27°C)',
      'Elevata umidità',
      'Ferite sui frutti o rami',
      'Frutti mummificati lasciati sull\'albero'
    ],
    treatments: [
      'Rimuovere e distruggere frutti mummificati',
      'Potare rami infetti durante il riposo vegetativo',
      'Applicare fungicidi sistemici',
      'Bruciare o eliminare materiale infetto'
    ],
    prevention: [
      'Rimuovere frutti mummificati e rami morti',
      'Potatura per migliorare ventilazione',
      'Evitare ferite meccaniche',
      'Trattamenti fungicidi preventivi',
      'Raccolta tempestiva dei frutti maturi'
    ],
    severity: 'medium',
    imageQuery: 'apple black rot'
  },
  {
    id: 'cedar-apple-rust',
    title: 'Ruggine del Cedro-Melo',
    scientificName: 'Gymnosporangium juniperi-virginianae',
    content: 'La ruggine del cedro-melo è una malattia fungina che richiede due ospiti alternati: il melo e il cedro rosso. Causa macchie gialle-arancioni caratteristiche sulle foglie del melo e può portare a defogliazione precoce e riduzione del raccolto.',
    excerpt: 'Malattia fungina che alterna tra melo e cedro, causando macchie arancioni.',
    category: 'Malattie Fungine',
    tags: ['fungo', 'melo', 'ruggine', 'cedro'],
    hostPlant: 'Melo (Malus domestica) e Cedro (Juniperus)',
    symptoms: [
      'Macchie gialle-arancioni su foglie di melo',
      'Protuberanze cilindriche arancioni sotto le foglie',
      'Defogliazione precoce',
      'Galle legnose sui rami di cedro',
      'Tentacoli gelatinosi arancioni in primavera su cedro'
    ],
    causes: [
      'Fungo Gymnosporangium juniperi-virginianae',
      'Presenza di cedri rossi nelle vicinanze',
      'Primavere umide',
      'Spore trasportate dal vento'
    ],
    treatments: [
      'Applicare fungicidi protettivi in primavera',
      'Rimuovere cedri infetti nelle vicinanze (se possibile)',
      'Trattamenti ripetuti durante la stagione di crescita'
    ],
    prevention: [
      'Piantare varietà di melo resistenti',
      'Rimuovere cedri rossi entro 300 metri',
      'Applicare fungicidi preventivi in primavera',
      'Potatura per migliorare circolazione aria'
    ],
    severity: 'medium',
    imageQuery: 'cedar apple rust'
  },

  // TOMATO DISEASES
  {
    id: 'tomato-early-blight',
    title: 'Peronospora Precoce del Pomodoro',
    scientificName: 'Alternaria solani',
    content: 'La peronospora precoce è una delle malattie fungine più comuni del pomodoro. Causa macchie scure concentriche sulle foglie più vecchie che possono portare a grave defogliazione. Può anche colpire fusti e frutti, riducendo significativamente la resa.',
    excerpt: 'Malattia fungina comune che causa macchie concentriche sulle foglie di pomodoro.',
    category: 'Malattie Fungine',
    tags: ['fungo', 'pomodoro', 'alternaria', 'orto'],
    hostPlant: 'Pomodoro (Solanum lycopersicum)',
    symptoms: [
      'Macchie marroni circolari con anelli concentrici',
      'Foglie inferiori colpite per prime',
      'Defogliazione progressiva dal basso verso l\'alto',
      'Lesioni scure su fusti',
      'Macchie incavate sui frutti vicino al peduncolo'
    ],
    causes: [
      'Fungo Alternaria solani',
      'Temperatura 24-29°C',
      'Elevata umidità e rugiada',
      'Carenza nutrizionale',
      'Piante stressate'
    ],
    treatments: [
      'Rimuovere foglie infette',
      'Applicare fungicidi a base di rame o mancozeb',
      'Migliorare nutrizione della pianta',
      'Evitare bagnatura fogliare',
      'Trattamenti ogni 7-10 giorni'
    ],
    prevention: [
      'Rotazione colturale (3-4 anni)',
      'Rimuovere residui colturali',
      'Pacciamare il terreno',
      'Irrigazione a goccia invece che a pioggia',
      'Distanziare adeguatamente le piante',
      'Fertilizzazione equilibrata'
    ],
    severity: 'high',
    imageQuery: 'tomato early blight'
  },
  {
    id: 'tomato-late-blight',
    title: 'Peronospora Tardiva del Pomodoro',
    scientificName: 'Phytophthora infestans',
    content: 'La peronospora tardiva è una malattia devastante causata da un oomicete. Può distruggere completamente una coltura di pomodoro in pochi giorni in condizioni favorevoli. È la stessa malattia che causò la carestia delle patate in Irlanda nel 1800.',
    excerpt: 'Malattia devastante che può distruggere intere coltivazioni di pomodoro rapidamente.',
    category: 'Malattie Fungine',
    tags: ['oomicete', 'pomodoro', 'peronospora', 'emergenza'],
    hostPlant: 'Pomodoro (Solanum lycopersicum), Patata',
    symptoms: [
      'Macchie acquose grigio-verdi su foglie',
      'Muffa biancastra sotto le foglie',
      'Rapida necrosi e disseccamento',
      'Marciume bruno sui frutti',
      'Lesioni scure sui fusti',
      'Odore sgradevole delle parti infette'
    ],
    causes: [
      'Oomicete Phytophthora infestans',
      'Temperature fresche (15-21°C)',
      'Umidità elevata (>90%)',
      'Piogge frequenti',
      'Scarsa ventilazione'
    ],
    treatments: [
      'Rimuovere immediatamente piante infette',
      'Fungicidi sistemici (mefenoxam, metalaxyl)',
      'Fungicidi di contatto preventivi',
      'Distruzione completa delle piante gravemente colpite'
    ],
    prevention: [
      'Scegliere varietà resistenti',
      'Evitare irrigazione dall\'alto',
      'Garantire buona circolazione d\'aria',
      'Trattamenti preventivi in condizioni favorevoli',
      'Monitoraggio regolare delle piante',
      'Rotazione colturale',
      'Eliminare piante di patata volontarie'
    ],
    severity: 'critical',
    imageQuery: 'tomato late blight'
  },
  {
    id: 'tomato-leaf-mold',
    title: 'Cladosporiosi del Pomodoro',
    scientificName: 'Passalora fulva',
    content: 'La cladosporiosi è una malattia fungina comune nelle serre e negli ambienti umidi. Causa macchie fogliari caratteristiche con muffa vellutata sulla pagina inferiore. Raramente uccide le piante ma riduce la fotosintesi e la resa.',
    excerpt: 'Malattia fungina da serra che causa muffa vellutata sulle foglie di pomodoro.',
    category: 'Malattie Fungine',
    tags: ['fungo', 'pomodoro', 'serra', 'muffa'],
    hostPlant: 'Pomodoro (Solanum lycopersicum)',
    symptoms: [
      'Macchie gialle pallide sulla pagina superiore delle foglie',
      'Muffa vellutata verde-oliva sotto le foglie',
      'Foglie arricciate e appassite',
      'Raramente colpisce frutti',
      'Defogliazione in casi gravi'
    ],
    causes: [
      'Fungo Passalora fulva',
      'Umidità relativa >85%',
      'Scarsa ventilazione',
      'Temperature 20-25°C',
      'Coltivazione in serra'
    ],
    treatments: [
      'Migliorare ventilazione',
      'Ridurre umidità relativa',
      'Fungicidi a base di rame',
      'Rimuovere foglie gravemente infette'
    ],
    prevention: [
      'Varietà resistenti (Gene Cf)',
      'Ventilazione adeguata in serra',
      'Evitare sovraffollamento',
      'Irrigazione al mattino',
      'Controllo umidità (<85%)',
      'Rimozione residui colturali'
    ],
    severity: 'medium',
    imageQuery: 'tomato leaf mold'
  },
  {
    id: 'tomato-septoria-leaf-spot',
    title: 'Septoriosi del Pomodoro',
    scientificName: 'Septoria lycopersici',
    content: 'La septoriosi è una malattia fungina comune che causa piccole macchie circolari con centro chiaro sulle foglie. Inizia dalle foglie più basse e progredisce verso l\'alto, causando defogliazione che espone i frutti alle scottature solari.',
    excerpt: 'Malattia fungina che causa macchie circolari con centro chiaro sulle foglie.',
    category: 'Malattie Fungine',
    tags: ['fungo', 'pomodoro', 'macchie', 'septoria'],
    hostPlant: 'Pomodoro (Solanum lycopersicum)',
    symptoms: [
      'Piccole macchie circolari con centro grigio-bianco',
      'Margine scuro attorno alle macchie',
      'Puntini neri (picnidi) al centro delle macchie',
      'Inizia dalle foglie più basse',
      'Defogliazione progressiva',
      'Raramente colpisce frutti'
    ],
    causes: [
      'Fungo Septoria lycopersici',
      'Temperature 20-25°C',
      'Elevata umidità',
      'Piogge frequenti',
      'Irrigazione dall\'alto',
      'Residui colturali infetti'
    ],
    treatments: [
      'Rimuovere foglie infette',
      'Fungicidi a base di rame o clorotalonil',
      'Trattamenti ogni 7-14 giorni',
      'Pacciamare il terreno'
    ],
    prevention: [
      'Rotazione colturale (3 anni minimo)',
      'Rimuovere tutti i residui colturali',
      'Pacciamare per prevenire schizzi di terreno',
      'Irrigazione a goccia',
      'Distanziamento adeguato',
      'Evitare lavorare con piante bagnate'
    ],
    severity: 'high',
    imageQuery: 'tomato septoria leaf spot'
  },
  {
    id: 'tomato-bacterial-spot',
    title: 'Macchia Batterica del Pomodoro',
    scientificName: 'Xanthomonas spp.',
    content: 'La macchia batterica è causata da diverse specie di Xanthomonas ed è una delle malattie più distruttive del pomodoro. Colpisce foglie, fusti e frutti, causando significative perdite di resa e qualità. È particolarmente problematica in condizioni calde e umide.',
    excerpt: 'Malattia batterica che colpisce foglie, fusti e frutti del pomodoro.',
    category: 'Malattie Batteriche',
    tags: ['batteria', 'pomodoro', 'xanthomonas', 'macchie'],
    hostPlant: 'Pomodoro (Solanum lycopersicum), Peperone',
    symptoms: [
      'Piccole macchie scure acquose su foglie',
      'Macchie con alone giallo',
      'Lesioni scure rialzate sui frutti',
      'Defogliazione severa',
      'Lesioni scure su fusti e piccioli'
    ],
    causes: [
      'Batteri Xanthomonas (X. euvesicatoria, X. perforans, X. gardneri, X. vesicatoria)',
      'Temperature 25-30°C',
      'Elevata umidità',
      'Piogge e irrigazione dall\'alto',
      'Sementi o trapianti infetti',
      'Ferite sulle piante'
    ],
    treatments: [
      'Prodotti a base di rame',
      'Batteriofagi specifici (se disponibili)',
      'Rimozione piante gravemente infette',
      'Evitare lavorazioni con piante bagnate'
    ],
    prevention: [
      'Usare sementi certificate',
      'Trapianti sani',
      'Rotazione colturale',
      'Evitare irrigazione dall\'alto',
      'Disinfezione attrezzi',
      'Varietà resistenti (se disponibili)',
      'Trattamenti preventivi con rame'
    ],
    severity: 'high',
    imageQuery: 'tomato bacterial spot'
  },
  {
    id: 'tomato-yellow-leaf-curl',
    title: 'Virus dell\'Accartocciamento Fogliare del Pomodoro',
    scientificName: 'Tomato Yellow Leaf Curl Virus (TYLCV)',
    content: 'Il TYLCV è uno dei virus più devastanti del pomodoro a livello mondiale. Trasmesso dalla mosca bianca, causa grave arresto della crescita, arricciamento fogliare e rese drasticamente ridotte. Non esiste cura, quindi la prevenzione è fondamentale.',
    excerpt: 'Virus devastante trasmesso da mosca bianca che causa accartocciamento fogliare.',
    category: 'Malattie Virali',
    tags: ['virus', 'pomodoro', 'mosca bianca', 'TYLCV'],
    hostPlant: 'Pomodoro (Solanum lycopersicum)',
    symptoms: [
      'Foglie giovani arricciate verso l\'alto',
      'Ingiallimento delle foglie',
      'Nanismo e arresto della crescita',
      'Riduzione drastica della produzione frutti',
      'Frutti piccoli e deformi',
      'Ispessimento fogliare'
    ],
    causes: [
      'Tomato Yellow Leaf Curl Virus',
      'Trasmesso da mosca bianca (Bemisia tabaci)',
      'Piante infette nelle vicinanze',
      'Alte popolazioni di mosca bianca',
      'Climi caldi'
    ],
    treatments: [
      'Rimuovere e distruggere piante infette',
      'Controllo rigoroso della mosca bianca',
      'Insetticidi sistemici',
      'Barriere fisiche (reti anti-insetto)'
    ],
    prevention: [
      'Varietà resistenti o tolleranti',
      'Reti anti-insetto',
      'Controllo mosca bianca con insetticidi o predatori naturali',
      'Rimozione piante ospiti alternative',
      'Riflettenti pacciamanti argentati',
      'Monitoraggio trappole gialle adesive',
      'Produzione piantine protette'
    ],
    severity: 'critical',
    imageQuery: 'tomato yellow leaf curl virus'
  },
  {
    id: 'tomato-mosaic-virus',
    title: 'Virus del Mosaico del Pomodoro',
    scientificName: 'Tomato Mosaic Virus (ToMV)',
    content: 'Il virus del mosaico è altamente contagioso e può persistere in residui vegetali, semi e attrezzi per anni. Causa mosaicatura fogliare, deformazione e riduzione della crescita. Si diffonde facilmente attraverso il contatto meccanico.',
    excerpt: 'Virus altamente contagioso che causa mosaicatura e deformazione fogliare.',
    category: 'Malattie Virali',
    tags: ['virus', 'pomodoro', 'mosaico', 'ToMV'],
    hostPlant: 'Pomodoro (Solanum lycopersicum), altre Solanacee',
    symptoms: [
      'Mosaico verde chiaro/scuro sulle foglie',
      'Foglie arricciate e deformi',
      'Crescita stentata',
      'Frutti con macchie gialle o marroni',
      'Riduzione della produzione',
      'Maturazione irregolare dei frutti'
    ],
    causes: [
      'Tomato Mosaic Virus',
      'Trasmissione meccanica (mani, attrezzi)',
      'Sementi infette',
      'Residui di piante infette',
      'Fumo di tabacco (virus del tabacco correlato)'
    ],
    treatments: [
      'Nessuna cura disponibile',
      'Rimuovere e distruggere piante infette',
      'Disinfezione completa di attrezzi e mani',
      'Latte in polvere (10%) come disinfettante per mani'
    ],
    prevention: [
      'Varietà resistenti (Gene Tm-2²)',
      'Sementi certificate',
      'Disinfezione attrezzi con candeggina al 10%',
      'Lavaggio mani frequente',
      'Non fumare tabacco prima di lavorare',
      'Rimozione completa residui colturali',
      'Evitare contatto con piante infette'
    ],
    severity: 'high',
    imageQuery: 'tomato mosaic virus'
  },
  {
    id: 'tomato-spider-mites',
    title: 'Ragnetto Rosso del Pomodoro',
    scientificName: 'Tetranychus urticae',
    content: 'Il ragnetto rosso è un acaro minuscolo che si nutre succhiando la linfa dalle foglie. In condizioni calde e secche può moltiplicarsi rapidamente, causando grave danno alle piante. Produce sottili ragnatele caratteristiche.',
    excerpt: 'Acaro che succhia linfa dalle foglie, causando danni in condizioni calde e secche.',
    category: 'Parassiti',
    tags: ['acaro', 'pomodoro', 'ragnetto', 'parassita'],
    hostPlant: 'Pomodoro (Solanum lycopersicum) e molte altre piante',
    symptoms: [
      'Puntini gialli o bianchi sulle foglie',
      'Sottili ragnatele sulle foglie',
      'Foglie bronzee o argentate',
      'Defogliazione in infestazioni gravi',
      'Riduzione vigore pianta',
      'Acari visibili sulla pagina inferiore (con lente)'
    ],
    causes: [
      'Acaro Tetranychus urticae',
      'Temperature elevate (27-32°C)',
      'Bassa umidità relativa',
      'Piante stressate per siccità',
      'Eccesso di azoto',
      'Mancanza di predatori naturali'
    ],
    treatments: [
      'Acaricidi specifici (spiromesifen, abamectina)',
      'Sapone insetticida',
      'Olio di neem',
      'Lavaggi frequenti con acqua',
      'Predatori naturali (Phytoseiulus persimilis)',
      'Alternare prodotti per evitare resistenza'
    ],
    prevention: [
      'Mantenere adeguata umidità',
      'Irrigazione regolare',
      'Evitare stress da siccità',
      'Favorire predatori naturali',
      'Monitoraggio regolare',
      'Quarantena nuove piante',
      'Rimuovere piante molto infestate'
    ],
    severity: 'medium',
    imageQuery: 'tomato spider mites'
  },
  {
    id: 'tomato-target-spot',
    title: 'Maculatura Bersaglio del Pomodoro',
    scientificName: 'Corynespora cassiicola',
    content: 'La maculatura bersaglio è una malattia fungina emergente che causa lesioni concentriche caratteristiche su foglie, fusti e frutti. Può causare grave defogliazione e riduzione della qualità dei frutti in condizioni calde e umide.',
    excerpt: 'Malattia fungina che causa lesioni concentriche su foglie, fusti e frutti.',
    category: 'Malattie Fungine',
    tags: ['fungo', 'pomodoro', 'maculatura', 'corynespora'],
    hostPlant: 'Pomodoro (Solanum lycopersicum), Cetriolo, Soia',
    symptoms: [
      'Macchie marroni con anelli concentrici (bersaglio)',
      'Lesioni su foglie, fusti e frutti',
      'Alone clorotico attorno alle macchie',
      'Defogliazione grave',
      'Lesioni incavate sui frutti',
      'Caduta prematura delle foglie'
    ],
    causes: [
      'Fungo Corynespora cassiicola',
      'Temperature 20-28°C',
      'Elevata umidità (>80%)',
      'Bagnatura prolungata delle foglie',
      'Scarsa ventilazione'
    ],
    treatments: [
      'Fungicidi azossistrobina, clorotalonil',
      'Rimozione foglie infette',
      'Migliorare ventilazione',
      'Trattamenti ogni 7-14 giorni'
    ],
    prevention: [
      'Varietà resistenti (se disponibili)',
      'Rotazione colturale',
      'Evitare irrigazione dall\'alto',
      'Distanziamento adeguato piante',
      'Rimozione residui colturali',
      'Trattamenti preventivi in condizioni favorevoli'
    ],
    severity: 'high',
    imageQuery: 'tomato target spot'
  },

  // POTATO DISEASES
  {
    id: 'potato-early-blight',
    title: 'Alternariosi della Patata',
    scientificName: 'Alternaria solani',
    content: 'L\'alternariosi è una malattia fungina comune della patata che causa macchie fogliari concentriche. Colpisce principalmente le foglie più vecchie e può ridurre significativamente la resa se non controllata.',
    excerpt: 'Malattia fungina che causa macchie concentriche sulle foglie di patata.',
    category: 'Malattie Fungine',
    tags: ['fungo', 'patata', 'alternaria', 'orto'],
    hostPlant: 'Patata (Solanum tuberosum)',
    symptoms: [
      'Macchie marroni circolari con anelli concentrici',
      'Foglie inferiori colpite per prime',
      'Alone clorotico attorno alle macchie',
      'Defogliazione progressiva',
      'Lesioni scure sui tuberi',
      'Riduzione resa'
    ],
    causes: [
      'Fungo Alternaria solani',
      'Temperature 24-29°C',
      'Alternanza umidità/secco',
      'Piante stressate',
      'Carenza nutrizionale'
    ],
    treatments: [
      'Fungicidi mancozeb, clorotalonil',
      'Rimozione foglie infette',
      'Migliorare nutrizione',
      'Trattamenti preventivi'
    ],
    prevention: [
      'Varietà resistenti',
      'Rotazione colturale (3-4 anni)',
      'Fertilizzazione equilibrata',
      'Irrigazione regolare',
      'Eliminazione residui colturali',
      'Distanziamento adeguato'
    ],
    severity: 'medium',
    imageQuery: 'potato early blight'
  },
  {
    id: 'potato-late-blight',
    title: 'Peronospora della Patata',
    scientificName: 'Phytophthora infestans',
    content: 'La peronospora della patata è una delle malattie più devastanti dell\'agricoltura. Causò la Grande Carestia irlandese del 1845-1852. Può distruggere completamente un campo in pochi giorni in condizioni favorevoli.',
    excerpt: 'Malattia devastante che può distruggere rapidamente intere coltivazioni di patate.',
    category: 'Malattie Fungine',
    tags: ['oomicete', 'patata', 'peronospora', 'emergenza'],
    hostPlant: 'Patata (Solanum tuberosum), Pomodoro',
    symptoms: [
      'Macchie acquose grigio-verdi su foglie',
      'Muffa bianca sotto le foglie',
      'Rapida necrosi e collasso pianta',
      'Marciume bruno sui tuberi',
      'Odore sgradevole',
      'Lesioni scure su fusti'
    ],
    causes: [
      'Oomicete Phytophthora infestans',
      'Temperature fresche (15-21°C)',
      'Umidità elevata (>90%)',
      'Piogge frequenti',
      'Rugiada persistente'
    ],
    treatments: [
      'Fungicidi sistemici (metalaxyl, mefenoxam)',
      'Fungicidi di contatto (mancozeb, clorotalonil)',
      'Distruzione immediata piante infette',
      'Trattamenti ogni 5-7 giorni in condizioni favorevoli'
    ],
    prevention: [
      'Varietà resistenti',
      'Tuberi-seme certificati',
      'Monitoraggio con modelli predittivi',
      'Eliminazione patate volontarie',
      'Buon drenaggio terreno',
      'Trattamenti preventivi',
      'Distruzione cumuli scarti'
    ],
    severity: 'critical',
    imageQuery: 'potato late blight'
  },

  // CORN DISEASES
  {
    id: 'corn-common-rust',
    title: 'Ruggine Comune del Mais',
    scientificName: 'Puccinia sorghi',
    content: 'La ruggine comune è una malattia fungina diffusa del mais che causa pustole rossastre sulle foglie. In condizioni favorevoli può causare significative riduzioni di resa, ma generalmente è controllabile con varietà resistenti.',
    excerpt: 'Malattia fungina che causa pustole rossastre sulle foglie di mais.',
    category: 'Malattie Fungine',
    tags: ['fungo', 'mais', 'ruggine', 'cereale'],
    hostPlant: 'Mais (Zea mays)',
    symptoms: [
      'Pustole rossastre su entrambe le pagine fogliari',
      'Pustole liberano spore color ruggine',
      'Foglie possono ingiallire e seccare prematuramente',
      'Riduzione fotosintesi',
      'Perdita di resa in infezioni gravi'
    ],
    causes: [
      'Fungo Puccinia sorghi',
      'Temperature fresche (16-23°C)',
      'Elevata umidità',
      'Rugiada frequente',
      'Vento che trasporta spore'
    ],
    treatments: [
      'Fungicidi azoli o strobilurine (per mais dolce)',
      'Normalmente non necessari per mais da granella',
      'Applicare se infezione precoce e severa'
    ],
    prevention: [
      'Varietà resistenti',
      'Rotazione colturale',
      'Eliminazione residui colturali',
      'Evitare irrigazione dall\'alto',
      'Semina varietà precoci in zone problematiche'
    ],
    severity: 'medium',
    imageQuery: 'corn common rust'
  },
  {
    id: 'corn-northern-leaf-blight',
    title: 'Elmintosporiosi del Mais',
    scientificName: 'Exserohilum turcicum',
    content: 'L\'elmintosporiosi è una delle malattie fogliari più importanti del mais a livello mondiale. Causa grandi lesioni grigio-verdi sulle foglie che possono portare a significativa perdita di resa se si manifesta prima della fioritura.',
    excerpt: 'Malattia fogliare importante che causa grandi lesioni grigio-verdi sul mais.',
    category: 'Malattie Fungine',
    tags: ['fungo', 'mais', 'helminthosporium', 'cereale'],
    hostPlant: 'Mais (Zea mays), Sorgo',
    symptoms: [
      'Lesioni allungate grigio-verdi sulle foglie',
      'Lesioni lunghe 2.5-15 cm',
      'Iniziano sulle foglie inferiori',
      'Progressione verso foglie superiori',
      'Riduzione area fotosintetica',
      'Maturazione precoce in casi gravi'
    ],
    causes: [
      'Fungo Exserohilum turcicum',
      'Temperature moderate (18-27°C)',
      'Elevata umidità relativa',
      'Rugiada prolungata',
      'Residui colturali infetti',
      'Monocultura di mais'
    ],
    treatments: [
      'Fungicidi azoli, strobilurine',
      'Applicare alla prima comparsa sintomi',
      'Ripetere se necessario',
      'Economicamente giustificato solo per mais dolce o infezioni precoci gravi'
    ],
    prevention: [
      'Varietà resistenti (gene Ht)',
      'Rotazione colturale',
      'Interramento residui colturali',
      'Evitare irrigazione dall\'alto',
      'Distanziamento adeguato delle piante',
      'Evitare stress nutrizionale'
    ],
    severity: 'high',
    imageQuery: 'corn northern leaf blight'
  },
  {
    id: 'corn-cercospora-leaf-spot',
    title: 'Cercosporiosi del Mais',
    scientificName: 'Cercospora zeae-maydis',
    content: 'La cercosporiosi, o gray leaf spot, è una malattia fungina che è diventata sempre più importante nelle regioni coltivate intensivamente a mais. Può causare significative perdite di resa, specialmente con pratiche di minima lavorazione.',
    excerpt: 'Malattia fungina importante nelle zone di coltivazione intensiva del mais.',
    category: 'Malattie Fungine',
    tags: ['fungo', 'mais', 'cercospora', 'gray leaf spot'],
    hostPlant: 'Mais (Zea mays)',
    symptoms: [
      'Lesioni rettangolari grigie sulle foglie',
      'Lesioni limitate dalle nervature',
      'Iniziano come piccole macchie necrotiche',
      'Espansione a lesioni lunghe 2-7 cm',
      'Coalescenza in infezioni gravi',
      'Morte prematura delle foglie'
    ],
    causes: [
      'Fungo Cercospora zeae-maydis',
      'Temperature calde (22-30°C)',
      'Umidità relativa elevata (>90%)',
      'Monocultura mais',
      'Minima lavorazione del terreno',
      'Residui colturali in superficie'
    ],
    treatments: [
      'Fungicidi strobilurine, azoli',
      'Applicazione a inizio sintomi o preventiva',
      'Trattamenti ripetuti se pressione alta',
      'Valutare costo/beneficio'
    ],
    prevention: [
      'Varietà resistenti o tolleranti',
      'Rotazione con colture non ospiti',
      'Interramento residui quando possibile',
      'Evitare monocultura continua',
      'Gestione stress idrico e nutrizionale'
    ],
    severity: 'high',
    imageQuery: 'corn gray leaf spot cercospora'
  },

  // GRAPE DISEASES
  {
    id: 'grape-black-rot',
    title: 'Marciume Nero dell\'Uva',
    scientificName: 'Guignardia bidwellii',
    content: 'Il marciume nero è una malattia fungina grave dell\'uva che può distruggere completamente il raccolto in condizioni favorevoli. Colpisce foglie, tralci e soprattutto grappoli, causando mummificazione degli acini.',
    excerpt: 'Malattia fungina grave che può distruggere completamente il raccolto d\'uva.',
    category: 'Malattie Fungine',
    tags: ['fungo', 'uva', 'vite', 'marciume'],
    hostPlant: 'Vite (Vitis vinifera)',
    symptoms: [
      'Macchie marroni circolari sulle foglie',
      'Lesioni sui tralci giovani',
      'Acini con marciume bruno',
      'Mummificazione degli acini',
      'Picnidi neri sulle lesioni',
      'Perdita completa grappoli'
    ],
    causes: [
      'Fungo Guignardia bidwellii',
      'Temperature 20-25°C',
      'Umidità elevata',
      'Piogge frequenti durante fioritura/allegagione',
      'Acini mummificati da annate precedenti'
    ],
    treatments: [
      'Fungicidi mancozeb, captan',
      'Trattamenti preventivi critici',
      'Proteggere dalla fioritura a chiusura grappolo',
      'Ripetere dopo piogge'
    ],
    prevention: [
      'Rimuovere acini mummificati',
      'Potatura per migliorare aerazione',
      'Gestione vigorosa chioma',
      'Trattamenti preventivi primaverili',
      'Eliminare residui infetti'
    ],
    severity: 'high',
    imageQuery: 'grape black rot'
  },
  {
    id: 'grape-esca',
    title: 'Mal dell\'Esca della Vite',
    scientificName: 'Complesso fungino',
    content: 'Il mal dell\'Esca è una malattia complessa del legno della vite causata da un complesso di funghi. È una delle malattie più gravi e difficili da controllare, che può portare alla morte della pianta. Non esistono cure efficaci.',
    excerpt: 'Malattia complessa del legno della vite, grave e difficile da controllare.',
    category: 'Malattie Fungine',
    tags: ['fungo', 'vite', 'legno', 'esca'],
    hostPlant: 'Vite (Vitis vinifera)',
    symptoms: [
      'Decolorazione fogliare (tigrata)',
      'Imbrunimento internervale foglie',
      'Necrosi settoriali del legno',
      'Disseccamento improvviso tralci (apoplessia)',
      'Riduzione vigore',
      'Morte progressiva della pianta'
    ],
    causes: [
      'Complesso funghi (Phaeomoniella, Phaeoacremonium, Fomitiporia)',
      'Ferite da potatura',
      'Stress climatico',
      'Età avanzata piante',
      'Potature improprie'
    ],
    treatments: [
      'Nessuna cura efficace disponibile',
      'Potatura legno infetto con sterilizzazione attrezzi',
      'Protezione ferite da potatura',
      'Trichoderma (parziale protezione)',
      'Gestione stress pianta'
    ],
    prevention: [
      'Potatura corretta con attrezzi disinfettati',
      'Protezione ferite di potatura',
      'Evitare stress idrici e nutrizionali',
      'Materiale vivaistico sano',
      'Potatura in periodi asciutti',
      'Bruciare legno potato'
    ],
    severity: 'critical',
    imageQuery: 'grape esca disease'
  },
  {
    id: 'grape-leaf-blight',
    title: 'Peronospora della Vite',
    scientificName: 'Plasmopara viticola',
    content: 'La peronospora è una delle malattie più importanti della vite a livello mondiale. Un oomicete che colpisce tutte le parti verdi della pianta, può causare perdite complete del raccolto se non controllata adeguatamente.',
    excerpt: 'Una delle malattie più importanti della vite, colpisce tutte le parti verdi.',
    category: 'Malattie Fungine',
    tags: ['oomicete', 'vite', 'peronospora', 'plasmopara'],
    hostPlant: 'Vite (Vitis vinifera)',
    symptoms: [
      'Macchie d\'olio sulla pagina superiore foglie',
      'Muffa bianca sotto le foglie',
      'Disseccamento foglie',
      'Grappoli ricoperti di muffa grigio-bianca',
      'Acini che disseccano (leather berries)',
      'Caduta foglie e acini'
    ],
    causes: [
      'Oomicete Plasmopara viticola',
      'Temperature 20-25°C',
      'Piogge frequenti',
      'Umidità elevata',
      'Rugiada prolungata',
      'Vegetazione densa'
    ],
    treatments: [
      'Fungicidi rameici preventivi',
      'Fungicidi sistemici (metalaxyl, fosetyl-al)',
      'Trattamenti ogni 10-14 giorni',
      'Aumentare frequenza in periodi piovosi'
    ],
    prevention: [
      'Varietà resistenti o tolleranti',
      'Gestione chioma (sfogliatura)',
      'Drenaggio adeguato',
      'Evitare irrigazione dall\'alto',
      'Monitoraggio condizioni favorevoli',
      'Trattamenti preventivi primaverili'
    ],
    severity: 'critical',
    imageQuery: 'grape downy mildew peronospora'
  },

  // PEPPER DISEASES
  {
    id: 'pepper-bacterial-spot',
    title: 'Macchia Batterica del Peperone',
    scientificName: 'Xanthomonas spp.',
    content: 'La macchia batterica è una delle malattie più distruttive del peperone. Causata da diverse specie di Xanthomonas, colpisce foglie, fusti e frutti, causando defoliazione e perdita di qualità commerciale.',
    excerpt: 'Malattia batterica distruttiva che colpisce foglie, fusti e frutti del peperone.',
    category: 'Malattie Batteriche',
    tags: ['batteria', 'peperone', 'xanthomonas', 'macchie'],
    hostPlant: 'Peperone (Capsicum annuum), Pomodoro',
    symptoms: [
      'Macchie scure acquose su foglie',
      'Alone giallo attorno alle macchie',
      'Lesioni rialzate scure sui frutti',
      'Defogliazione severa',
      'Lesioni su fusti e piccioli',
      'Riduzione qualità frutti'
    ],
    causes: [
      'Batteri Xanthomonas (X. euvesicatoria, X. gardneri, X. perforans, X. vesicatoria)',
      'Temperature 25-30°C',
      'Elevata umidità',
      'Piogge battenti',
      'Irrigazione dall\'alto',
      'Sementi contaminate'
    ],
    treatments: [
      'Prodotti a base di rame',
      'Batteriofagi (se disponibili)',
      'Rimozione piante gravemente infette',
      'Evitare lavorare con piante bagnate'
    ],
    prevention: [
      'Sementi certificate',
      'Trapianti sani',
      'Varietà resistenti',
      'Rotazione colturale',
      'Irrigazione a goccia',
      'Disinfezione attrezzi',
      'Trattamenti preventivi con rame'
    ],
    severity: 'high',
    imageQuery: 'pepper bacterial spot'
  },

  // PEACH DISEASES
  {
    id: 'peach-bacterial-spot',
    title: 'Macchia Batterica del Pesco',
    scientificName: 'Xanthomonas arboricola pv. pruni',
    content: 'La macchia batterica è una grave malattia del pesco e altre drupacee. Causa defogliazione, lesioni sui frutti e riduzione della produttività. È particolarmente problematica in primavere umide e fresche.',
    excerpt: 'Malattia batterica grave che causa defogliazione e lesioni sui frutti del pesco.',
    category: 'Malattie Batteriche',
    tags: ['batteria', 'pesco', 'drupacee', 'xanthomonas'],
    hostPlant: 'Pesco (Prunus persica), Albicocco, Susino, Ciliegio',
    symptoms: [
      'Macchie angolari scure sulle foglie',
      'Caduta precoce foglie (fori da pallottola)',
      'Lesioni scure incavate sui frutti',
      'Gommosi sui rami',
      'Cancri sui rametti',
      'Riduzione vigore albero'
    ],
    causes: [
      'Batterio Xanthomonas arboricola pv. pruni',
      'Temperature 24-28°C',
      'Primavere fresche e umide',
      'Piogge battenti',
      'Ferite da tempeste/grandine',
      'Materiale vivaistico infetto'
    ],
    treatments: [
      'Prodotti a base di rame (dormienza e caduta petali)',
      'Nessun trattamento curativo efficace',
      'Potatura rami infetti',
      'Gestione nutrizione (evitare eccesso azoto)'
    ],
    prevention: [
      'Varietà resistenti',
      'Materiale vivaistico certificato',
      'Frangivento per ridurre ferite',
      'Trattamenti rameici preventivi',
      'Potatura per migliorare aerazione',
      'Evitare eccesso vigore',
      'Distruzione materiale potato infetto'
    ],
    severity: 'high',
    imageQuery: 'peach bacterial spot'
  },

  // CHERRY DISEASES
  {
    id: 'cherry-powdery-mildew',
    title: 'Oidio del Ciliegio',
    scientificName: 'Podosphaera clandestina',
    content: 'L\'oidio del ciliegio è una malattia fungina comune che colpisce principalmente le foglie giovani. Causa arricciamento fogliare e muffa bianca polverosa. Può ridurre il vigore degli alberi, specialmente in vivai o su piante giovani.',
    excerpt: 'Malattia fungina che causa muffa bianca e arricciamento fogliare del ciliegio.',
    category: 'Malattie Fungine',
    tags: ['fungo', 'ciliegio', 'oidio', 'muffa bianca'],
    hostPlant: 'Ciliegio (Prunus avium, Prunus cerasus)',
    symptoms: [
      'Polvere bianca su foglie giovani',
      'Arricciamento e deformazione foglie',
      'Foglie arricciate verso l\'alto',
      'Crescita stentata germogli',
      'Defogliazione prematura',
      'Ridotto vigore albero'
    ],
    causes: [
      'Fungo Podosphaera clandestina',
      'Temperature moderate (20-25°C)',
      'Umidità relativa elevata (ma non pioggia)',
      'Scarsa circolazione aria',
      'Ombreggiamento',
      'Eccesso azoto'
    ],
    treatments: [
      'Fungicidi zolfo, azoli, strobilurine',
      'Bicarbonato di potassio',
      'Rimozione parti gravemente infette',
      'Applicazioni preventive e curative'
    ],
    prevention: [
      'Varietà resistenti',
      'Potatura per migliorare aerazione',
      'Evitare eccesso azoto',
      'Piantare in zone soleggiate',
      'Monitoraggio regolare',
      'Trattamenti preventivi primaverili'
    ],
    severity: 'medium',
    imageQuery: 'cherry powdery mildew'
  },

  // SQUASH DISEASES
  {
    id: 'squash-powdery-mildew',
    title: 'Oidio delle Cucurbitacee',
    scientificName: 'Podosphaera xanthii, Erysiphe cichoracearum',
    content: 'L\'oidio delle cucurbitacee è una delle malattie più comuni di zucche, zucchine, cetrioli e meloni. Si manifesta come polvere bianca sulle foglie e può causare defogliazione prematura, esponendo i frutti alle scottature solari.',
    excerpt: 'Malattia fungina comune che causa muffa bianca su zucche, cetrioli e meloni.',
    category: 'Malattie Fungine',
    tags: ['fungo', 'zucca', 'cucurbitacee', 'oidio'],
    hostPlant: 'Zucca, Zucchino, Cetriolo, Melone, Anguria',
    symptoms: [
      'Polvere bianca su foglie (sopra e sotto)',
      'Macchie bianche che si espandono',
      'Ingiallimento e disseccamento foglie',
      'Defogliazione prematura',
      'Riduzione fotosintesi',
      'Scottature sui frutti esposti'
    ],
    causes: [
      'Funghi Podosphaera xanthii, Erysiphe cichoracearum',
      'Temperature moderate (20-30°C)',
      'Umidità relativa variabile (non necessita pioggia)',
      'Ombreggiamento',
      'Sovraffollamento piante',
      'Stress idrico'
    ],
    treatments: [
      'Fungicidi zolfo bagnabile',
      'Fungicidi azoli, strobilurine',
      'Bicarbonato di potassio',
      'Latte diluito (10-20%)',
      'Olio di neem',
      'Applicazioni settimanali'
    ],
    prevention: [
      'Varietà resistenti',
      'Distanziamento adeguato',
      'Irrigazione a goccia',
      'Evitare stress idrico',
      'Rotazione colturale',
      'Rimozione residui infetti',
      'Trattamenti preventivi'
    ],
    severity: 'medium',
    imageQuery: 'squash powdery mildew cucurbit'
  },

  // STRAWBERRY DISEASES
  {
    id: 'strawberry-leaf-scorch',
    title: 'Maculatura Fogliare della Fragola',
    scientificName: 'Diplocarpon earlianum',
    content: 'La maculatura fogliare è una malattia fungina comune della fragola che causa lesioni purpuree sulle foglie. Infezioni gravi possono causare defogliazione e riduzione della produzione. È favorita da umidità elevata.',
    excerpt: 'Malattia fungina che causa lesioni purpuree sulle foglie di fragola.',
    category: 'Malattie Fungine',
    tags: ['fungo', 'fragola', 'maculatura', 'diplocarpon'],
    hostPlant: 'Fragola (Fragaria × ananassa)',
    symptoms: [
      'Piccole macchie purpuree sulle foglie',
      'Macchie con centro grigio-bianco',
      'Coalescenza in lesioni più grandi',
      'Disseccamento fogliare (scorch)',
      'Defogliazione prematura',
      'Ridotta produzione'
    ],
    causes: [
      'Fungo Diplocarpon earlianum',
      'Temperature moderate (20-25°C)',
      'Umidità elevata',
      'Bagnatura fogliare prolungata',
      'Irrigazione dall\'alto',
      'Sovraffollamento'
    ],
    treatments: [
      'Fungicidi captan, clorotalonil',
      'Rimozione foglie infette',
      'Migliorare circolazione aria',
      'Trattamenti ogni 7-14 giorni'
    ],
    prevention: [
      'Varietà resistenti',
      'Distanziamento adeguato',
      'Irrigazione a goccia o manichetta',
      'Pacciamare per ridurre schizzi',
      'Rimuovere foglie vecchie',
      'Rotazione con colture non ospiti',
      'Evitare eccesso azoto'
    ],
    severity: 'medium',
    imageQuery: 'strawberry leaf scorch'
  },

  // CITRUS DISEASES
  {
    id: 'citrus-greening',
    title: 'Inverdimento degli Agrumi (Huanglongbing)',
    scientificName: 'Candidatus Liberibacter spp.',
    content: 'Il greening degli agrumi è considerata la malattia più devastante degli agrumi a livello mondiale. Causata da batteri trasmessi da insetti psillidi, non ha cura. Gli alberi infetti producono frutti deformi e amari e alla fine muoiono.',
    excerpt: 'La malattia più devastante degli agrumi, trasmessa da insetti, senza cura.',
    category: 'Malattie Batteriche',
    tags: ['batteria', 'agrumi', 'hlb', 'psillide', 'quarantena'],
    hostPlant: 'Tutti gli agrumi (Citrus spp.)',
    symptoms: [
      'Mosaico clorotico asimmetrico sulle foglie',
      'Frutti piccoli, deformi, lopsided',
      'Frutti con semi abortiti',
      'Sapore amaro e acido dei frutti',
      'Defogliazione graduale',
      'Declino e morte dell\'albero (3-5 anni)'
    ],
    causes: [
      'Batteri Candidatus Liberibacter asiaticus, africanus, americanus',
      'Trasmesso da psillidi (Diaphorina citri, Trioza erytreae)',
      'Materiale vivaistico infetto',
      'Nessuna cura disponibile'
    ],
    treatments: [
      'Nessun trattamento curativo',
      'Rimozione immediata alberi infetti',
      'Controllo intensivo psillidi',
      'Nutrizione ottimale (può ritardare sintomi)',
      'Programmi di eradicazione regionali'
    ],
    prevention: [
      'Materiale vivaistico certificato',
      'Controllo rigoroso psillidi (insetticidi, predatori)',
      'Survey e rimozione alberi infetti',
      'Barriere fisiche in vivaio',
      'Quarantena rigorosa',
      'Piantare solo in aree libere dalla malattia',
      'Ricerca varietà resistenti (in corso)'
    ],
    severity: 'critical',
    imageQuery: 'citrus greening huanglongbing hlb'
  }
];

// Helper functions
export const getDiseasesByHost = (hostPlant: string): PlantDisease[] => {
  return plantVillageDatabase.filter(disease => 
    disease.hostPlant.toLowerCase().includes(hostPlant.toLowerCase())
  );
};

export const getDiseasesByCategory = (category: string): PlantDisease[] => {
  return plantVillageDatabase.filter(disease => 
    disease.category === category
  );
};

export const searchDiseases = (query: string): PlantDisease[] => {
  const lowerQuery = query.toLowerCase();
  return plantVillageDatabase.filter(disease =>
    disease.title.toLowerCase().includes(lowerQuery) ||
    disease.content.toLowerCase().includes(lowerQuery) ||
    disease.hostPlant.toLowerCase().includes(lowerQuery) ||
    disease.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

export const getDiseaseById = (id: string): PlantDisease | undefined => {
  return plantVillageDatabase.find(disease => disease.id === id);
};

// Get all unique categories
export const getAllCategories = (): string[] => {
  return Array.from(new Set(plantVillageDatabase.map(d => d.category)));
};

// Get all unique host plants
export const getAllHostPlants = (): string[] => {
  return Array.from(new Set(plantVillageDatabase.map(d => d.hostPlant)));
};
