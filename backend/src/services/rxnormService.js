const https = require('https');

const RXNAV_API = 'https://rxnav.nlm.nih.gov/REST';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

async function searchDrugs(name) {
  console.log('[RxNorm] Searching for:', name);
  
  try {
    const url = `${RXNAV_API}/drugs.json?name=${encodeURIComponent(name)}`;
    const data = await fetchJson(url);
    
    if (!data || !data.drugGroup || !data.drugGroup.conceptGroup) {
      return [];
    }

    const results = [];
    for (const group of data.drugGroup.conceptGroup) {
      if (group.conceptProperties) {
        for (const drug of group.conceptProperties) {
          results.push({
            rxcui: drug.rxcui,
            name: drug.name,
            genericName: drug.synonym || drug.name,
            tty: drug.tty,
          });
        }
      }
    }
    
    console.log('[RxNorm] Found', results.length, 'results');
    return results;
  } catch (error) {
    console.error('[RxNorm] Search error:', error.message);
    return [];
  }
}

async function getDrugByRxCUI(rxcui) {
  console.log('[RxNorm] Getting drug by RxCUI:', rxcui);
  
  try {
    const url = `${RXNAV_API}/rxcui/${rxcui}/properties.json`;
    const data = await fetchJson(url);
    
    if (!data || !data.properties) {
      return null;
    }

    return {
      rxcui: data.properties.rxcui,
      name: data.properties.name,
      genericName: data.properties.genericName,
      tty: data.properties.tty,
    };
  } catch (error) {
    console.error('[RxNorm] Get drug error:', error.message);
    return null;
  }
}

async function getRelatedDrugs(rxcui) {
  console.log('[RxNorm] Getting related drugs for:', rxcui);
  
  try {
    const url = `${RXNAV_API}/rxcui/${rxcui}/related.json?relaSource=RXNORM`;
    const data = await fetchJson(url);
    
    if (!data || !data.relatedGroup) {
      return [];
    }

    const results = [];
    const group = data.relatedGroup;
    
    if (group.conceptProperties) {
      for (const drug of group.conceptProperties) {
        results.push({
          rxcui: drug.rxcui,
          name: drug.name,
          relationship: drug.rel || drug.rela,
        });
      }
    }
    
    console.log('[RxNorm] Found', results.length, 'related drugs');
    return results;
  } catch (error) {
    console.error('[RxNorm] Related drugs error:', error.message);
    return [];
  }
}

async function getDrugBrands(rxcui) {
  console.log('[RxNorm] Getting brand names for:', rxcui);
  
  try {
    const url = `${RXNAV_API}/rxcui/${rxcui}/related.json?relaSource=RXNORM&reln=has_tradename`;
    const data = await fetchJson(url);
    
    if (!data || !data.relatedGroup) {
      return [];
    }

    const brands = [];
    const group = data.relatedGroup;
    
    if (group.conceptProperties) {
      for (const drug of group.conceptProperties) {
        brands.push(drug.name);
      }
    }
    
    console.log('[RxNorm] Found', brands.length, 'brands');
    return brands;
  } catch (error) {
    console.error('[RxNorm] Brand names error:', error.message);
    return [];
  }
}

async function findApproximateMatches(term, maxEntries = 5) {
  console.log('[RxNorm] Approximate search for:', term);
  
  try {
    const url = `${RXNAV_API}/approximateTerm.json?term=${encodeURIComponent(term)}&maxEntries=${maxEntries}`;
    const data = await fetchJson(url);
    
    if (!data || !data.approximateGroup) {
      return [];
    }

    const results = [];
    for (const item of data.approximateGroup.candidates || []) {
      results.push({
        rxcui: item.rxcui,
        name: item.name,
        score: item.score,
      });
    }
    
    console.log('[RxNorm] Found', results.length, 'approximate matches');
    return results;
  } catch (error) {
    console.error('[RxNorm] Approximate match error:', error.message);
    return [];
  }
}

async function getDrugCategory(rxcui) {
  try {
    const url = `${RXNAV_API}/rxcui/${rxcui}/classes.json`;
    const data = await fetchJson(url);
    
    if (!data || !data.classType) {
      return null;
    }

    const classes = data.classType;
    for (const classType of classes) {
      if (classType.class && classType.class.length > 0) {
        return classType.class[0].name;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[RxNorm] Category error:', error.message);
    return null;
  }
}

module.exports = {
  searchDrugs,
  getDrugByRxCUI,
  getRelatedDrugs,
  getDrugBrands,
  findApproximateMatches,
  getDrugCategory,
};
