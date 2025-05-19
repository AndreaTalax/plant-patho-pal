
/**
 * EPPO database symptoms for regulated pests and diseases
 */
export const eppoSymptoms = {
  'xylella fastidiosa': {
    name: 'Xylella fastidiosa',
    symptoms: [
      'Leaf scorch starting at leaf margins',
      'Widespread leaf browning and desiccation',
      'Sudden branch or plant dieback',
      'Reduced fruit production',
      'Shortened internodes and stunted growth',
      'Wilting and collapse in severe cases',
      'Often sector-specific symptoms in woody plants'
    ],
    regulatoryStatus: 'EPPO A2 List - quarantine pest',
    reportRequired: true
  },
  'huanglongbing': {
    name: 'Citrus Greening (Huanglongbing)',
    symptoms: [
      'Yellow shoot development (giving the disease its name)',
      'Blotchy, mottled leaves with asymmetric chlorosis',
      'Stunted trees with sparse foliage',
      'Twig dieback',
      'Small, misshapen fruit with thick rind',
      'Fruit remains green even when ripe',
      'Poor fruit taste, highly acidic and bitter'
    ],
    regulatoryStatus: 'EPPO A1 List - quarantine pest',
    reportRequired: true
  },
  'fire blight': {
    name: 'Fire Blight',
    symptoms: [
      'Wilting and blackening of blossoms and leaves',
      'Shepherd\'s crook appearance of wilted shoots',
      'Amber-colored bacterial ooze on infected tissue',
      'Water-soaked appearance of infected tissue',
      'Blackened, sunken cankers on branches',
      'Fruit turns black/brown and remains attached to tree',
      'Internal browning of infected wood'
    ],
    regulatoryStatus: 'EPPO A2 List - quarantine pest',
    reportRequired: true
  },
  'pine wood nematode': {
    name: 'Pine Wood Nematode',
    symptoms: [
      'Rapid wilting of needles',
      'Needles turn yellow then brown/reddish',
      'Reduced resin flow',
      'Rapid tree death, often within weeks',
      'Blue-stain fungus in wood',
      'Dead trees throughout forest stands'
    ],
    regulatoryStatus: 'EPPO A2 List - quarantine pest',
    reportRequired: true
  },
  'japanese beetle': {
    name: 'Japanese Beetle',
    symptoms: [
      'Skeletonized leaves (only veins remaining)',
      'Lace-like damage to foliage',
      'Damaged flowers, especially roses and hibiscus',
      'Adult beetles on plants feeding in groups',
      'Poor turf quality from larval feeding on roots'
    ],
    regulatoryStatus: 'EPPO A2 List - quarantine pest',
    reportRequired: true
  },
  'tomato brown rugose': {
    name: 'Tomato Brown Rugose Fruit Virus (ToBRFV)',
    symptoms: [
      'Yellow/brown spots on leaves',
      'Mosaic patterns on leaves',
      'Wrinkled/rugose leaf surface',
      'Narrow leaves',
      'Yellow/brown spots on fruits',
      'Rough fruit surface with yellow/brown patches',
      'Reduced fruit size and quality'
    ],
    regulatoryStatus: 'EPPO A2 List - quarantine pest',
    reportRequired: true
  }
};
