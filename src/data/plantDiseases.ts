
import { DiagnosedDisease } from '@/components/diagnose/types';

// Mock database of plant diseases
export const PLANT_DISEASES: DiagnosedDisease[] = [
  {
    id: 'powdery-mildew',
    name: 'Powdery Mildew',
    description: 'A fungal disease that affects many plant species, appearing as a white to gray powdery growth on leaves, stems, and sometimes fruits.',
    causes: ['Caused by various species of fungi in the Erysiphales order. Thrives in environments with high humidity but dry leaves.'],
    symptoms: [
      'White powdery growth on leaves',
      'Yellowing or distorted leaves',
      'Premature leaf drop',
      'Reduced plant vigor'
    ],
    treatments: [
      'Remove and dispose of affected leaves',
      'Improve air circulation around plants',
      'Apply fungicides containing sulfur or potassium bicarbonate',
      'Use neem oil as an organic alternative'
    ],
    products: ['1', '2'],
    confidence: 0.92,
    resources: [{ title: 'fungal-diseases', url: '/library/fungal-diseases' }]
  },
  {
    id: 'leaf-spot',
    name: 'Leaf Spot',
    description: 'A common plant disease characterized by brown or black spots on leaves that may enlarge and cause leaf drop.',
    causes: ['Various fungi and bacteria can cause leaf spot diseases. Often spread by water splash and favored by wet conditions.'],
    symptoms: [
      'Brown or black spots on leaves',
      'Yellow halos around spots',
      'Leaf drop',
      'Weakened plant growth'
    ],
    treatments: [
      'Remove affected leaves and improve sanitation',
      'Avoid overhead watering',
      'Apply copper-based fungicides',
      'Rotate crops in vegetable gardens'
    ],
    products: ['3', '5'],
    confidence: 0.89,
    resources: [{ title: 'fungal-diseases', url: '/library/fungal-diseases' }]
  },
  {
    id: 'aphid-infestation',
    name: 'Aphid Infestation',
    description: 'Small sap-sucking insects that cluster on new growth and undersides of leaves, causing distorted growth and yellowing.',
    causes: ['Rapid reproduction of aphids, especially in warm weather. Often attracted to plants with high nitrogen levels.'],
    symptoms: [
      'Clusters of tiny insects on new growth',
      'Curled or distorted leaves',
      'Sticky honeydew on leaves',
      'Black sooty mold',
      'Yellowing foliage'
    ],
    treatments: [
      'Spray plants with strong water jet to dislodge aphids',
      'Introduce beneficial insects like ladybugs',
      'Apply insecticidal soap or neem oil',
      'For severe cases, use systemic insecticides'
    ],
    products: ['4'],
    confidence: 0.95,
    resources: [{ title: 'pest-control', url: '/library/pest-control' }]
  },
  {
    id: 'root-rot',
    name: 'Root Rot',
    description: 'A soil-borne disease that causes roots to decay, leading to poor growth, wilting, and eventual plant death.',
    causes: ['Overwatering and poor drainage creating anaerobic conditions that foster pathogenic fungi like Pythium and Phytophthora.'],
    symptoms: [
      'Wilting despite moist soil',
      'Yellowing lower leaves',
      'Stunted growth',
      'Brown, soft roots',
      'Foul smell from soil'
    ],
    treatments: [
      'Improve soil drainage',
      'Remove affected plants and surrounding soil',
      'Avoid overwatering',
      'Apply fungicides labeled for root rot',
      'For container plants, repot with fresh sterile soil'
    ],
    products: ['5'],
    confidence: 0.87,
    resources: [{ title: 'fungal-diseases', url: '/library/fungal-diseases' }]
  },
  {
    id: 'spider-mites',
    name: 'Spider Mite Infestation',
    description: 'Tiny arachnids that feed on plant sap, causing stippling on leaves and fine webbing between leaves and stems.',
    causes: ['Hot, dry conditions favor mite populations. Often thrive in indoor environments or during drought conditions.'],
    symptoms: [
      'Fine webbing between leaves',
      'Stippled or speckled leaf appearance',
      'Yellowing or bronzing of leaves',
      'Leaf drop',
      'Tiny moving specks on leaf undersides'
    ],
    treatments: [
      'Increase humidity around plants',
      'Spray plants with strong jets of water',
      'Apply insecticidal soap or horticultural oil',
      'In severe cases, use miticides',
      'Introduce predatory mites'
    ],
    products: ['4'],
    confidence: 0.91,
    resources: [{ title: 'pest-control', url: '/library/pest-control' }]
  }
];
