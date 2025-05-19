
import { eppoSymptoms } from './eppo-symptoms';

/**
 * Check if a classification label matches known EPPO regulated pests/diseases
 * @param label The model classification label
 * @returns Object with match information if related to EPPO, null otherwise
 */
export function checkForEppoRelation(label: string): {term: string, category: string} | null {
  if (!label) return null;
  
  const lowerLabel = label.toLowerCase();
  
  // List of terms related to EPPO regulated pests and diseases
  const eppoTerms = [
    {term: 'xylella', category: 'bacteria'},
    {term: 'xylella fastidiosa', category: 'bacteria'},
    {term: 'huanglongbing', category: 'bacteria'},
    {term: 'citrus greening', category: 'bacteria'},
    {term: 'fire blight', category: 'bacteria'},
    {term: 'erwinia amylovora', category: 'bacteria'},
    {term: 'bacterium tumefaciens', category: 'bacteria'},
    {term: 'crown gall', category: 'bacteria'},
    {term: 'candidatus liberibacter', category: 'bacteria'},
    {term: 'ralstonia solanacearum', category: 'bacteria'},
    {term: 'bacterial wilt', category: 'bacteria'},
    {term: 'clavibacter', category: 'bacteria'},
    {term: 'pine wood nematode', category: 'nematode'},
    {term: 'bursaphelenchus', category: 'nematode'},
    {term: 'globodera', category: 'nematode'},
    {term: 'meloidogyne', category: 'nematode'},
    {term: 'phytophthora ramorum', category: 'oomycete'},
    {term: 'sudden oak death', category: 'oomycete'},
    {term: 'japanese beetle', category: 'insect'},
    {term: 'popillia japonica', category: 'insect'},
    {term: 'anoplophora', category: 'insect'},
    {term: 'asian longhorn', category: 'insect'},
    {term: 'emerald ash borer', category: 'insect'},
    {term: 'agrilus planipennis', category: 'insect'},
    {term: 'citrus longhorn', category: 'insect'},
    {term: 'box tree moth', category: 'insect'},
    {term: 'spotted lanternfly', category: 'insect'},
    {term: 'lycorma delicatula', category: 'insect'},
    {term: 'fall armyworm', category: 'insect'},
    {term: 'spodoptera frugiperda', category: 'insect'},
    {term: 'red palm weevil', category: 'insect'},
    {term: 'rhynchophorus ferrugineus', category: 'insect'},
    {term: 'tomato brown rugose', category: 'virus'},
    {term: 'tobrf', category: 'virus'},
    {term: 'tomato yellow leaf curl', category: 'virus'},
    {term: 'tylcv', category: 'virus'},
    {term: 'plum pox virus', category: 'virus'},
    {term: 'sharka', category: 'virus'}
  ];
  
  for (const eppoEntry of eppoTerms) {
    if (lowerLabel.includes(eppoEntry.term)) {
      return eppoEntry;
    }
  }
  
  return null;
}
