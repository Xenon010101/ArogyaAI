const Medicine = require('../models/Medicine');
const Condition = require('../models/Condition');
const DrugInteraction = require('../models/DrugInteraction');
const clinicalLogic = require('./clinicalLogic');

const KNOWLEDGE_EMBEDDING_SIZE = 2000;

async function retrieveRelevantKnowledge(symptomsText, conditions, prescriptionText) {
  const knowledgeChunks = [];
  
  try {
    if (prescriptionText && prescriptionText.length > 10) {
      const medicines = clinicalLogic.extractMedicinesFromText(prescriptionText);
      
      for (const medName of medicines) {
        const medicineDoc = await Medicine.findOne({
          $or: [
            { name: { $regex: new RegExp(`^${medName}$`, 'i') } },
            { genericName: { $regex: new RegExp(`^${medName}$`, 'i') } },
            { brandNames: { $regex: new RegExp(`^${medName}$`, 'i') } }
          ]
        }).lean();
        
        if (medicineDoc) {
          knowledgeChunks.push({
            type: 'medicine',
            source: 'database',
            content: formatMedicineKnowledge(medicineDoc)
          });
          
          const interactions = await DrugInteraction.find({
            $or: [
              { drug1Name: { $regex: new RegExp(`^${medName}$`, 'i') } },
              { drug2Name: { $regex: new RegExp(`^${medName}$`, 'i') } }
            ]
          }).lean();
          
          for (const interaction of interactions) {
            knowledgeChunks.push({
              type: 'drug_interaction',
              source: 'database',
              content: formatInteractionKnowledge(interaction)
            });
          }
        }
      }
    }
    
    if (conditions && conditions.length > 0) {
      for (const condition of conditions.slice(0, 5)) {
        const conditionDoc = await Condition.findOne({
          name: { $regex: new RegExp(condition, 'i') }
        }).lean();
        
        if (conditionDoc) {
          knowledgeChunks.push({
            type: 'condition',
            source: 'database',
            content: formatConditionKnowledge(conditionDoc)
          });
        } else {
          const mapped = clinicalLogic.prescriptionConditionMapping[condition.toLowerCase()];
          if (mapped) {
            knowledgeChunks.push({
              type: 'condition',
              source: 'clinical_logic',
              content: `Related condition: ${condition} - Associated with: ${mapped.join(', ')}`
            });
          }
        }
      }
    }
  } catch (error) {
    console.warn('[RAG] Knowledge retrieval error:', error.message);
  }
  
  return knowledgeChunks;
}

function formatMedicineKnowledge(medicine) {
  let knowledge = `Medicine: ${medicine.name}`;
  
  if (medicine.genericName) {
    knowledge += `\nGeneric: ${medicine.genericName}`;
  }
  if (medicine.brandNames && medicine.brandNames.length > 0) {
    knowledge += `\nBrand names: ${medicine.brandNames.join(', ')}`;
  }
  if (medicine.category) {
    knowledge += `\nCategory: ${medicine.category}`;
  }
  if (medicine.indications && medicine.indications.length > 0) {
    knowledge += `\nIndications: ${medicine.indications.join(', ')}`;
  }
  if (medicine.contraindications && medicine.contraindications.length > 0) {
    knowledge += `\nContraindications: ${medicine.contraindications.join(', ')}`;
  }
  if (medicine.warnings && medicine.warnings.length > 0) {
    knowledge += `\nWarnings: ${medicine.warnings.join(', ')}`;
  }
  if (medicine.sideEffects && medicine.sideEffects.length > 0) {
    knowledge += `\nSide effects: ${medicine.sideEffects.map(s => s.name).join(', ')}`;
  }
  if (medicine.fdaRecall) {
    knowledge += `\n⚠️ FDA Recall: ${medicine.recallInfo || 'Check FDA website'}`;
  }
  
  return knowledge;
}

function formatConditionKnowledge(condition) {
  let knowledge = `Condition: ${condition.name}`;
  
  if (condition.icdCode) {
    knowledge += `\nICD-10 Code: ${condition.icdCode}`;
  }
  if (condition.category) {
    knowledge += `\nCategory: ${condition.category}`;
  }
  if (condition.symptoms && condition.symptoms.length > 0) {
    knowledge += `\nSymptoms: ${condition.symptoms.join(', ')}`;
  }
  if (condition.riskFactors && condition.riskFactors.length > 0) {
    knowledge += `\nRisk factors: ${condition.riskFactors.join(', ')}`;
  }
  if (condition.treatments && condition.treatments.length > 0) {
    knowledge += `\nTreatments: ${condition.treatments.join(', ')}`;
  }
  if (condition.specialists && condition.specialists.length > 0) {
    knowledge += `\nSpecialists: ${condition.specialists.join(', ')}`;
  }
  
  return knowledge;
}

function formatInteractionKnowledge(interaction) {
  let knowledge = `Drug Interaction: ${interaction.drug1Name} + ${interaction.drug2Name}`;
  knowledge += `\nSeverity: ${interaction.severity?.toUpperCase() || 'Unknown'}`;
  knowledge += `\nDescription: ${interaction.description || 'No description'}`;
  if (interaction.recommendation) {
    knowledge += `\nRecommendation: ${interaction.recommendation}`;
  }
  if (interaction.clinicalEffects && interaction.clinicalEffects.length > 0) {
    knowledge += `\nClinical effects: ${interaction.clinicalEffects.join(', ')}`;
  }
  
  return knowledge;
}

function buildKnowledgeContext(knowledgeChunks) {
  if (!knowledgeChunks || knowledgeChunks.length === 0) {
    return '';
  }
  
  let context = '\n\n========== RELEVANT MEDICAL KNOWLEDGE ==========\n';
  
  for (const chunk of knowledgeChunks) {
    const paddedContent = chunk.content.length > KNOWLEDGE_EMBEDDING_SIZE 
      ? chunk.content.substring(0, KNOWLEDGE_EMBEDDING_SIZE) + '...'
      : chunk.content;
    
    context += `\n[${chunk.type.toUpperCase()}] ${paddedContent}\n`;
  }
  
  context += '\n===============================================\n';
  
  return context;
}

module.exports = {
  retrieveRelevantKnowledge,
  buildKnowledgeContext,
  formatMedicineKnowledge,
  formatConditionKnowledge,
  formatInteractionKnowledge
};