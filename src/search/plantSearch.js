// ============================================
// RICERCA AVANZATA PER SEMI E PIANTE
// ============================================

export const searchPlants = async (query, filters = {}) => {
  try {
    console.log('🔍 Ricerca piante:', query, filters);
    
    // Costruisci la query
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (filters.species) params.append('species', filters.species);
    if (filters.location) params.append('location', filters.location);
    if (filters.era) params.append('era', filters.era);
    
    // Chiamata API al gateway
    const response = await fetch(
      `${process.env.GATEWAY_URL}/api/pytho/search-plant/${encodeURIComponent(query)}`
    );
    
    if (!response.ok) {
      throw new Error(`Errore ricerca: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return data.found || [];
    }
    
    return [];
  } catch (error) {
    console.error('❌ Errore ricerca piante:', error);
    return [];
  }
};

export const filterBySpecies = (plants, species) => {
  if (!species) return plants;
  return plants.filter(p => 
    p.species?.some(s => s.toLowerCase().includes(species.toLowerCase()))
  );
};

export const filterByEra = (plants, era) => {
  if (!era) return plants;
  return plants.filter(p => p.era === era);
};

export const filterByLocation = (plants, location) => {
  if (!location) return plants;
  return plants.filter(p => 
    p.location?.toLowerCase().includes(location.toLowerCase())
  );
};

export const sortPlants = (plants, sortBy = 'name') => {
  const sorted = [...plants];
  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    case 'year':
      return sorted.sort((a, b) => (a.year || 0) - (b.year || 0));
    case 'species':
      return sorted.sort((a, b) => (a.species || '').length - (b.species || '').length);
    default:
      return sorted;
  }
};

export default { searchPlants, filterBySpecies, filterByEra, filterByLocation, sortPlants };
