const mongoose = require('mongoose');
require('dotenv').config();

const Medicine = require('../src/models/Medicine');
const Condition = require('../src/models/Condition');
const DrugInteraction = require('../src/models/DrugInteraction');
const rxnormService = require('../src/services/rxnormService');
const openFdaService = require('../src/services/openFdaService');
const icd10Service = require('../src/services/icd10Service');
const drugInteractionService = require('../src/services/drugInteractionService');

const ESSENTIAL_MEDICINES = [
  { name: 'Metformin', category: 'Diabetes', genericName: 'Metformin Hydrochloride', brands: ['Glucophage', 'Glycomet', 'Ciomet'] },
  { name: 'Glimepiride', category: 'Diabetes', genericName: 'Glimepiride', brands: ['Amaryl'] },
  { name: 'Insulin', category: 'Diabetes', genericName: 'Insulin', brands: ['Humulin', 'Mixtard', 'Novomix'] },
  { name: 'Sitagliptin', category: 'Diabetes', genericName: 'Sitagliptin Phosphate', brands: ['Januvia'] },
  { name: 'Amlodipine', category: 'Cardiovascular', genericName: 'Amlodipine Besylate', brands: ['Norvasc', 'Amlodin', 'Amlip'] },
  { name: 'Atenolol', category: 'Cardiovascular', genericName: 'Atenolol', brands: ['Tenormin', 'Aten', 'Beta'] },
  { name: 'Lisinopril', category: 'Cardiovascular', genericName: 'Lisinopril', brands: ['Zestril', 'Lipril', 'Lisin'] },
  { name: 'Losartan', category: 'Cardiovascular', genericName: 'Losartan Potassium', brands: ['Cozaar', 'Losacar', 'Rilos'] },
  { name: 'Metoprolol', category: 'Cardiovascular', genericName: 'Metoprolol Tartrate', brands: ['Betaloc', 'Metolar', 'Prolomet'] },
  { name: 'Atorvastatin', category: 'Cardiovascular', genericName: 'Atorvastatin Calcium', brands: ['Lipitor', 'Atorva', 'Lipikind'] },
  { name: 'Rosuvastatin', category: 'Cardiovascular', genericName: 'Rosuvastatin Calcium', brands: ['Crestor', 'Rosuvas', 'Rozat'] },
  { name: 'Simvastatin', category: 'Cardiovascular', genericName: 'Simvastatin', brands: ['Zocor', 'Simva', 'Simbax'] },
  { name: 'Omeprazole', category: 'Gastrointestinal', genericName: 'Omeprazole', brands: ['Losec', 'Omez', 'Omed'] },
  { name: 'Pantoprazole', category: 'Gastrointestinal', genericName: 'Pantoprazole Sodium', brands: ['Pan', 'Pantocid', 'Pantosec'] },
  { name: 'Esomeprazole', category: 'Gastrointestinal', genericName: 'Esomeprazole Magnesium', brands: ['Nexium', 'Esoz', 'Sompraz'] },
  { name: 'Ranitidine', category: 'Gastrointestinal', genericName: 'Ranitidine Hydrochloride', brands: ['Zantac', 'Rantac', 'Aciloc'] },
  { name: 'Domperidone', category: 'Gastrointestinal', genericName: 'Domperidone', brands: ['Motilium', 'Domstal', 'Dompy'] },
  { name: 'Ondansetron', category: 'Gastrointestinal', genericName: 'Ondansetron Hydrochloride', brands: ['Zofran', 'Ondem', 'Emeset'] },
  { name: 'Levothyroxine', category: 'Thyroid', genericName: 'Levothyroxine Sodium', brands: ['Thyronorm', 'Eltroxin', 'Thyobuild'] },
  { name: 'Salbutamol', category: 'Respiratory', genericName: 'Salbutamol Sulphate', brands: ['Ventolin', 'Asthalin', 'Asthmac'] },
  { name: 'Budesonide', category: 'Respiratory', genericName: 'Budesonide', brands: ['Pulmicort', 'Budecort', 'B前线'] },
  { name: 'Montelukast', category: 'Respiratory', genericName: 'Montelukast Sodium', brands: ['Singulair', 'Montair', 'Montukast'] },
  { name: 'Paracetamol', category: 'Pain/Fever', genericName: 'Paracetamol', brands: ['Crocin', 'Dolo', 'Calpol'] },
  { name: 'Ibuprofen', category: 'Pain/Inflammation', genericName: 'Ibuprofen', brands: ['Brufen', 'Ibugard', 'Advil'] },
  { name: 'Aspirin', category: 'Pain/Antiplatelet', genericName: 'Aspirin', brands: ['Disprin', 'Aspirin', 'Ecosprin'] },
  { name: 'Diclofenac', category: 'Pain/Inflammation', genericName: 'Diclofenac Sodium', brands: ['Voveran', 'Diclotal', 'Cataflam'] },
  { name: 'Tramadol', category: 'Pain', genericName: 'Tramadol Hydrochloride', brands: ['Ultram', 'Tramadol', 'Dolol'] },
  { name: 'Amoxicillin', category: 'Antibiotic', genericName: 'Amoxicillin', brands: ['Augmentin', 'Mox', 'Amoxil'] },
  { name: 'Azithromycin', category: 'Antibiotic', genericName: 'Azithromycin', brands: ['Zithromax', 'Azee', 'Azithral'] },
  { name: 'Ciprofloxacin', category: 'Antibiotic', genericName: 'Ciprofloxacin Hydrochloride', brands: ['Cipro', 'Cifran', 'Ciplox'] },
  { name: 'Cefixime', category: 'Antibiotic', genericName: 'Cefixime', brands: ['Omnatax', 'Taxim-O', 'Cefi'] },
  { name: 'Cetirizine', category: 'Allergy', genericName: 'Cetirizine Hydrochloride', brands: ['Cetzine', 'Citriz', 'Allercet'] },
  { name: 'Loratadine', category: 'Allergy', genericName: 'Loratadine', brands: ['Claritin', 'Loratin', 'Lora'] },
  { name: 'Gabapentin', category: 'Neurological', genericName: 'Gabapentin', brands: ['Neurontin', 'Gabapin', 'Gabantin'] },
  { name: 'Sertraline', category: 'Mental Health', genericName: 'Sertraline Hydrochloride', brands: ['Zoloft', 'Sertil', 'Serlift'] },
  { name: 'Fluoxetine', category: 'Mental Health', genericName: 'Fluoxetine Hydrochloride', brands: ['Prozac', 'Fludac', 'Oxedep'] },
  { name: 'Alprazolam', category: 'Mental Health', genericName: 'Alprazolam', brands: ['Xanax', 'Alpra', 'Zopic'] },
  { name: 'Clonazepam', category: 'Mental Health', genericName: 'Clonazepam', brands: ['Rivotril', 'Clonotril', 'Klonopin'] },
  { name: 'Prednisolone', category: 'Anti-inflammatory', genericName: 'Prednisolone', brands: ['Prednisone', 'Wysolone', 'Dermacort'] },
  { name: 'Dexamethasone', category: 'Anti-inflammatory', genericName: 'Dexamethasone', brands: ['Decadron', 'Dexona', 'Dexona'] },
  { name: 'Furosemide', category: 'Diuretic', genericName: 'Furosemide', brands: ['Lasix', 'Frusemide', 'Lasipad'] },
  { name: 'Spironolactone', category: 'Diuretic', genericName: 'Spironolactone', brands: ['Aldactone', 'Spilactone', 'Spi'] },
  { name: 'Ranitidine', category: 'Gastrointestinal', genericName: 'Ranitidine', brands: ['Zantac', 'Rantac', 'Aciloc'] },
  { name: 'Pantoprazole', category: 'Gastrointestinal', genericName: 'Pantoprazole', brands: ['Pan', 'Pantocid', 'Pantosec'] },
  { name: 'Dicyclomine', category: 'Gastrointestinal', genericName: 'Dicyclomine Hydrochloride', brands: ['Cyclomin', 'Spasmo', 'Dicyclomine'] },
  { name: 'Mefenamic Acid', category: 'Pain', genericName: 'Mefenamic Acid', brands: ['Meftal', 'Mefnic', 'Dolichil'] },
  { name: 'Nimesulide', category: 'Pain/Inflammation', genericName: 'Nimesulide', brands: ['Nise', 'Nimulid', 'Nimid'] },
  { name: 'Multivitamin', category: 'Supplement', genericName: 'Multivitamin', brands: ['Shelcal', 'Supradyn', 'Becosules'] },
  { name: 'Calcium', category: 'Supplement', genericName: 'Calcium', brands: ['Shelcal', 'Caldigest', 'Magne'] },
  { name: 'Vitamin D', category: 'Supplement', genericName: 'Cholecalciferol', brands: ['Uprise D3', 'D-Rise', 'Dycal'] },
  { name: 'Ferrous Sulfate', category: 'Supplement', genericName: 'Ferrous Sulfate', brands: ['Fecontin', 'Ferro', 'Ferronyl'] }
];

async function syncMedicines() {
  console.log('[Sync] Starting medicine sync...');
  
  let synced = 0;
  let failed = 0;
  
  for (const med of ESSENTIAL_MEDICINES) {
    try {
      const existing = await Medicine.findOne({ name: med.name });
      
      if (existing) {
        existing.brandNames = med.brands;
        existing.category = med.category;
        existing.genericName = med.genericName;
        existing.isIndianBrand = true;
        existing.source = 'hybrid';
        existing.syncedAt = new Date();
        await existing.save();
      } else {
        await Medicine.create({
          name: med.name,
          genericName: med.genericName,
          brandNames: med.brands,
          category: med.category,
          isIndianBrand: true,
          source: 'hybrid',
          syncedAt: new Date()
        });
      }
      
      synced++;
      console.log(`[Sync] Synced: ${med.name}`);
    } catch (error) {
      failed++;
      console.error(`[Sync] Failed: ${med.name}`, error.message);
    }
  }
  
  console.log(`[Sync] Medicine sync complete: ${synced} synced, ${failed} failed`);
  return { synced, failed };
}

async function syncConditions() {
  console.log('[Sync] Starting condition/ICD sync...');
  
  let synced = 0;
  let skipped = 0;
  
  for (const icd of icd10Service.ICD10_DATA) {
    try {
      const existing = await Condition.findOne({ icdCode: icd.code });
      
      if (existing) {
        existing.name = icd.name;
        existing.category = icd.category;
        existing.chapter = icd.chapter;
        await existing.save();
      } else {
        await Condition.create({
          icdCode: icd.code,
          name: icd.name,
          category: icd.category,
          chapter: icd.chapter,
          severity: getSeverityFromCategory(icd.category),
          source: 'who'
        });
      }
      
      synced++;
    } catch (error) {
      if (error.code === 11000) {
        skipped++;
      } else {
        console.error(`[Sync] Failed: ${icd.code}`, error.message);
      }
    }
  }
  
  console.log(`[Sync] Condition sync complete: ${synced} synced, ${skipped} skipped`);
  return { synced, skipped };
}

function getSeverityFromCategory(category) {
  const emergencyCategories = ['emergency', 'cardiovascular', 'oncology'];
  const chronicCategories = ['endocrine', 'chronic', 'mental'];
  
  const cat = category?.toLowerCase() || '';
  
  if (emergencyCategories.some(e => cat.includes(e))) {
    return 'emergency';
  }
  if (chronicCategories.some(c => cat.includes(c))) {
    return 'chronic';
  }
  if (cat.includes('acute') || cat.includes('injury') || cat.includes('poisoning')) {
    return 'acute';
  }
  
  return 'routine';
}

async function initializeInteractions() {
  console.log('[Sync] Initializing drug interactions...');
  await drugInteractionService.initializeCommonInteractions();
  console.log('[Sync] Drug interactions initialized');
}

async function runSync() {
  try {
    console.log('[Sync] Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Sync] Connected to database');
    
    const args = process.argv.slice(2);
    const fullSync = args.includes('--full');
    
    if (fullSync) {
      console.log('[Sync] Running full sync (all data)...');
    } else {
      console.log('[Sync] Running partial sync (essential data only)...');
    }
    
    const medicineResult = await syncMedicines();
    const conditionResult = await syncConditions();
    
    if (fullSync) {
      await initializeInteractions();
    }
    
    console.log('\n[Sync] Summary:');
    console.log(`- Medicines: ${medicineResult.synced} synced, ${medicineResult.failed} failed`);
    console.log(`- Conditions: ${conditionResult.synced} synced, ${conditionResult.skipped} skipped`);
    console.log('[Sync] Complete!');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Sync] Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

if (require.main === module) {
  runSync();
}

module.exports = { syncMedicines, syncConditions, initializeInteractions, runSync };
