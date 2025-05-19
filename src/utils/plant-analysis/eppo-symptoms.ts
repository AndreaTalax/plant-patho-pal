
/**
 * Database of EPPO regulated pest and disease symptoms
 * This serves as a reference for identifying potential regulated issues
 */
export const eppoSymptoms = [
  {
    keyword: 'citrus greening',
    name: 'Citrus Greening',
    description: 'A serious bacterial disease affecting citrus trees',
    category: 'bacterial disease',
    symptoms: ['yellow mottling', 'leaf asymmetry', 'vein yellowing', 'stunted growth', 'blotchy mottle']
  },
  {
    keyword: 'citrus canker',
    name: 'Citrus Canker',
    description: 'A bacterial disease causing lesions on citrus fruit, leaves, and stems',
    category: 'bacterial disease',
    symptoms: ['water-soaked lesions', 'circular lesions', 'raised corky tissue', 'chlorotic halo', 'ruptured epidermis']
  },
  {
    keyword: 'xylella',
    name: 'Xylella Fastidiosa',
    description: 'A bacterial pathogen affecting multiple host plants',
    category: 'bacterial disease',
    symptoms: ['leaf scorch', 'marginal leaf burn', 'wilting', 'dieback', 'stunted growth']
  },
  {
    keyword: 'fire blight',
    name: 'Fire Blight',
    description: 'A destructive bacterial disease affecting apple, pear and related species',
    category: 'bacterial disease',
    symptoms: ['blackened leaves', 'shepherd\'s crook', 'bacterial ooze', 'cankers', 'fruit mummification']
  },
  {
    keyword: 'sudden oak death',
    name: 'Sudden Oak Death',
    description: 'A disease caused by Phytophthora ramorum affecting oak trees',
    category: 'fungal disease',
    symptoms: ['trunk cankers', 'bleeding trunk', 'wilting foliage', 'black leaf lesions', 'shoot dieback']
  },
  {
    keyword: 'ash dieback',
    name: 'Ash Dieback',
    description: 'A serious disease of ash trees caused by a fungus',
    category: 'fungal disease',
    symptoms: ['diamond-shaped lesions', 'wilting leaves', 'crown dieback', 'bark lesions', 'wood discoloration']
  },
  {
    keyword: 'dutch elm disease',
    name: 'Dutch Elm Disease',
    description: 'A fungal disease affecting elm trees, spread by bark beetles',
    category: 'fungal disease',
    symptoms: ['yellowing foliage', 'wilting leaves', 'vascular discoloration', 'crown dieback', 'bark beetles']
  },
  {
    keyword: 'grape flavescence',
    name: 'Flavescence Dorée',
    description: 'A phytoplasma disease affecting grapevines',
    category: 'phytoplasma disease',
    symptoms: ['downward leaf rolling', 'leaf discoloration', 'lack of lignification', 'flower abortion', 'berry shrivel']
  },
  {
    keyword: 'bacterial wilt',
    name: 'Bacterial Wilt',
    description: 'A bacterial disease affecting a wide range of plants',
    category: 'bacterial disease',
    symptoms: ['rapid wilting', 'vascular discoloration', 'bacterial streaming', 'epinasty', 'adventitious roots']
  },
  {
    keyword: 'plum pox',
    name: 'Plum Pox Virus',
    description: 'A viral disease affecting stone fruit trees',
    category: 'viral disease',
    symptoms: ['chlorotic rings', 'vein yellowing', 'leaf deformation', 'fruit rings', 'fruit deformation']
  }
];
