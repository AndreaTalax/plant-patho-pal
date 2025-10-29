// -------------------------
// Plant & Disease Databases
// -------------------------
export const plantSpeciesMap = {
  tomato: 'Tomato (Solanum lycopersicum)',
  potato: 'Potato (Solanum tuberosum)',
  pepper: 'Pepper (Capsicum annuum)',
  cucumber: 'Cucumber (Cucumis sativus)',
  lettuce: 'Lettuce (Lactuca sativa)',
  carrot: 'Carrot (Daucus carota)',
  spinach: 'Spinach (Spinacia oleracea)',
  pumpkin: 'Pumpkin (Cucurbita pepo)',
  beans: 'Beans (Phaseolus vulgaris)',
  corn: 'Corn (Zea mays)',
  apple: 'Apple (Malus domestica)',
  grape: 'Grape (Vitis vinifera)',
  strawberry: 'Strawberry (Fragaria ananassa)',
  peach: 'Peach (Prunus persica)',
  orange: 'Orange (Citrus sinensis)',
  cherry: 'Cherry (Prunus avium)',
  lemon: 'Lemon (Citrus limon)',
  banana: 'Banana (Musa)',
  monstera: 'Monstera (Monstera deliciosa)',
  pothos: 'Pothos (Epipremnum aureum)',
  'snake plant': 'Snake Plant (Sansevieria)',
  aloe: 'Aloe Vera (Aloe barbadensis)',
  fiddle: 'Fiddle Leaf Fig (Ficus lyrata)',
  'peace lily': 'Peace Lily (Spathiphyllum)',
  orchid: 'Orchid (Orchidaceae)',
  'spider plant': 'Spider Plant (Chlorophytum comosum)',
  'rubber plant': 'Rubber Plant (Ficus elastica)',
  jade: 'Jade Plant (Crassula ovata)',
  'zz plant': 'ZZ Plant (Zamioculcas zamiifolia)',
  philodendron: 'Philodendron (Philodendron)',
  rose: 'Rose (Rosa)',
  tulip: 'Tulip (Tulipa)',
  daisy: 'Daisy (Bellis perennis)',
  sunflower: 'Sunflower (Helianthus)',
  lily: 'Lily (Lilium)',
  lavender: 'Lavender (Lavandula)',
  marigold: 'Marigold (Tagetes)',
  hydrangea: 'Hydrangea (Hydrangea)',
  geranium: 'Geranium (Pelargonium)',
  dahlia: 'Dahlia (Dahlia)',
  basil: 'Basil (Ocimum basilicum)',
  mint: 'Mint (Mentha)',
  rosemary: 'Rosemary (Rosmarinus officinalis)',
  thyme: 'Thyme (Thymus vulgaris)',
  cilantro: 'Cilantro (Coriandrum sativum)',
  oregano: 'Oregano (Origanum vulgare)',
  sage: 'Sage (Salvia officinalis)',
  chives: 'Chives (Allium schoenoprasum)',
  parsley: 'Parsley (Petroselinum crispum)',
  dill: 'Dill (Anethum graveolens)',
  oak: 'Oak (Quercus)',
  maple: 'Maple (Acer)',
  pine: 'Pine (Pinus)',
  birch: 'Birch (Betula)',
  willow: 'Willow (Salix)',
  poplar: 'Poplar (Populus)',
  eucalyptus: 'Eucalyptus (Eucalyptus)',
  rhododendron: 'Rhododendron (Rhododendron)',
  azalea: 'Azalea (Rhododendron)',
  juniper: 'Juniper (Juniperus)',
  ivy: 'Ivy (Hedera)',
  fern: 'Ferns (Polypodiopsida)',
  bamboo: 'Bamboo (Bambusoideae)',
  cactus: 'Cactus (Cactaceae)',
  succulent: 'Succulent Plants (various species)',
  palm: 'Palm (Arecaceae)',
  cypress: 'Cypress (Cupressus)',
  dogwood: 'Dogwood (Cornus)',
  magnolia: 'Magnolia (Magnolia)',
  hibiscus: 'Hibiscus (Hibiscus)',
  dandelion: 'Dandelion (Taraxacum officinale)',
  clover: 'Clover (Trifolium)',
  nettle: 'Nettle (Urtica)',
  plantain: 'Plantain (Plantago)',
  chickweed: 'Chickweed (Stellaria media)',
  dock: 'Dock (Rumex)',
  chamomile: 'Chamomile (Matricaria)',
  goldenrod: 'Goldenrod (Solidago)',
  thistle: 'Thistle (Cirsium)',
  yarrow: 'Yarrow (Achillea millefolium)'
};

export const plantDiseasesMap = {
  'tomato early blight': 'Tomato - Early Blight',
  'tomato late blight': 'Tomato - Late Blight',
  'tomato leaf mold': 'Tomato - Leaf Mold',
  'tomato septoria': 'Tomato - Septoria Leaf Spot',
  'tomato mosaic virus': 'Tomato - Mosaic Virus',
  'tomato yellow curl': 'Tomato - Yellow Leaf Curl Virus',
  'potato late blight': 'Potato - Late Blight',
  'potato early blight': 'Potato - Early Blight',
  'apple scab': 'Apple - Scab Disease',
  'apple black rot': 'Apple - Black Rot',
  'apple cedar rust': 'Apple - Cedar Apple Rust',
  'cherry powdery': 'Cherry - Powdery Mildew',
  'grape black rot': 'Grape - Black Rot',
  'grape esca': 'Grape - Esca',
  'citrus greening': 'Citrus - Huanglongbing',
  'citrus canker': 'Citrus - Bacterial Canker',
  'xylella': 'Olive - Xylella fastidiosa',
  'fire blight': 'Apple/Pear - Fire Blight',
  'sudden oak death': 'Oak - Phytophthora ramorum',
  'ash dieback': 'Ash - Chalara Ash Dieback',
  'dutch elm disease': 'Elm - Dutch Elm Disease'
};

export const plantPartKeywords = {
  leaf: ['leaf', 'foliage', 'frond', 'leaflet', 'blade'],
  stem: ['stem', 'stalk', 'petiole', 'cane'],
  root: ['root', 'rhizome', 'tuber', 'bulb', 'corm'],
  flower: ['flower', 'bloom', 'blossom', 'inflorescence', 'petal'],
  fruit: ['fruit', 'berry', 'pod', 'seed', 'cone'],
  shoot: ['shoot', 'sprout', 'seedling', 'bud', 'tendril'],
  branch: ['branch', 'twig', 'bough'],
  trunk: ['trunk', 'bark', 'wood'],
  'collar region': ['collar', 'crown', 'base']
};

// -------------------------
// Image Verification
// -------------------------
const API_KEY = 'K89074639088957';
export async function verifyPlantImage(file: File): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', API_KEY);

    const response = await fetch('https://api.plantrecognition.com/v1/identify', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    // Assume API returns `isPlant: boolean` and optionally `species: string`
    if (result.isPlant) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Image verification error:', error);
    return false;
  }
}

