const EMERGENCY_KEYWORDS = {
  chest_pain: {
    keywords: ['chest pain', 'chest tightness', 'chest pressure', 'heart pain', 'cardiac pain'],
    severity: 'critical',
    message: 'Possible cardiac emergency',
  },
  breathing_difficulty: {
    keywords: [
      'difficulty breathing',
      'shortness of breath',
      'breathing trouble',
      'cant breathe',
      'cannot breathe',
      'breathlessness',
      'dyspnea',
      'wheezing',
      'gasping for air',
    ],
    severity: 'critical',
    message: 'Respiratory distress detected',
  },
  unconscious: {
    keywords: [
      'unconscious',
      'unresponsive',
      'passed out',
      'fainted',
      'lost consciousness',
      'blackout',
      'passed out',
    ],
    severity: 'critical',
    message: 'Unconsciousness reported',
  },
  seizure: {
    keywords: [
      'seizure',
      'convulsion',
      'fitting',
      'epileptic fit',
      'shake',
      'twitching',
      'uncontrolled movement',
    ],
    severity: 'critical',
    message: 'Seizure activity reported',
  },
  severe_bleeding: {
    keywords: [
      'severe bleeding',
      'heavy bleeding',
      'uncontrolled bleeding',
      'bleeding out',
      'hemorrhage',
      'blood loss',
      'arterial bleed',
    ],
    severity: 'critical',
    message: 'Severe bleeding detected',
  },
  high_fever: {
    keywords: [
      'high fever',
      'very high temperature',
      'fever over',
      'febrile',
      'temperature above',
      '104 fever',
      '105 fever',
      'hot to touch',
    ],
    severity: 'high',
    message: 'High fever detected',
  },
  stroke: {
    keywords: [
      'stroke',
      'slurred speech',
      'face drooping',
      'arm weakness',
      'numbness',
      'paralysis',
      'facial droop',
      'sudden confusion',
    ],
    severity: 'critical',
    message: 'Possible stroke symptoms',
  },
  poisoning: {
    keywords: [
      'poisoning',
      'toxic ingestion',
      'overdose',
      'drug overdose',
      'swallowed poison',
      'ingested toxic',
    ],
    severity: 'critical',
    message: 'Possible poisoning/overdose',
  },
  severe_allergic: {
    keywords: [
      'anaphylaxis',
      'allergic reaction',
      'throat swelling',
      'anaphylactic',
      'cant breathe due to allergy',
      'severe allergy',
    ],
    severity: 'critical',
    message: 'Severe allergic reaction',
  },
  severe_burn: {
    keywords: [
      'severe burn',
      'third degree burn',
      'chemical burn',
      'electrical burn',
      'burning skin',
      'extensive burn',
    ],
    severity: 'high',
    message: 'Severe burn injury',
  },
  broken_bone: {
    keywords: [
      'broken bone',
      'fracture',
      'bone sticking out',
      'open fracture',
      'dislocated joint',
      'cant move',
    ],
    severity: 'moderate',
    message: 'Possible bone fracture',
  },
  head_injury: {
    keywords: [
      'head injury',
      'hit head',
      'head trauma',
      'concussion',
      'skull injury',
      'blunt head trauma',
    ],
    severity: 'high',
    message: 'Head injury detected',
  },
};

const SEVERITY_LEVELS = {
  critical: 1,
  high: 2,
  moderate: 3,
  low: 4,
};

function normalizeText(text) {
  return text.toLowerCase().trim().replace(/[^\w\s]/g, ' ');
}

function checkForKeywords(inputText) {
  const normalizedText = normalizeText(inputText);
  const detectedFlags = [];

  for (const [key, config] of Object.entries(EMERGENCY_KEYWORDS)) {
    for (const keyword of config.keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        detectedFlags.push({
          type: key,
          keyword: keyword,
          severity: config.severity,
          message: config.message,
        });
        break;
      }
    }
  }

  return detectedFlags;
}

function determineSeverity(flags) {
  if (!flags.length) return 'none';

  const severities = flags.map((f) => f.severity);

  if (severities.includes('critical')) return 'critical';
  if (severities.includes('high')) return 'high';
  if (severities.includes('moderate')) return 'moderate';
  return 'low';
}

function getRecommendedAction(severity) {
  const actions = {
    critical: {
      action: 'EMERGENCY',
      instruction: 'Call emergency services immediately (911/112)',
      urgency: 'immediate',
    },
    high: {
      action: 'URGENT',
      instruction: 'Seek immediate medical attention at nearest emergency room',
      urgency: 'asap',
    },
    moderate: {
      action: 'SOON',
      instruction: 'Schedule appointment with healthcare provider within 24-48 hours',
      urgency: 'scheduled',
    },
    low: {
      action: 'ROUTINE',
      instruction: 'Monitor symptoms and consult doctor if condition changes',
      urgency: 'routine',
    },
    none: {
      action: 'MONITOR',
      instruction: 'No emergency detected. Continue monitoring symptoms.',
      urgency: 'none',
    },
  };

  return actions[severity] || actions.none;
}

function triage(input) {
  const inputText = typeof input === 'string' ? input : input.symptoms || input.text || '';

  if (!inputText.trim()) {
    return {
      isEmergency: false,
      flags: [],
      severity: 'none',
      recommendation: getRecommendedAction('none'),
    };
  }

  const flags = checkForKeywords(inputText);
  const severity = determineSeverity(flags);
  const recommendation = getRecommendedAction(severity);

  const uniqueFlags = flags.filter(
    (flag, index, self) => index === self.findIndex((f) => f.type === flag.type)
  );

  return {
    isEmergency: severity === 'critical' || severity === 'high',
    flags: uniqueFlags,
    severity,
    recommendation,
    analyzedAt: new Date().toISOString(),
  };
}

function triageMultiple(symptoms) {
  if (!Array.isArray(symptoms)) {
    return triage(symptoms);
  }

  const results = symptoms.map((symptom) => triage(symptom));
  const combinedFlags = results.flatMap((r) => r.flags);

  const uniqueFlags = combinedFlags.filter(
    (flag, index, self) => index === self.findIndex((f) => f.type === flag.type)
  );

  const severity = determineSeverity(uniqueFlags);
  const recommendation = getRecommendedAction(severity);

  return {
    isEmergency: severity === 'critical' || severity === 'high',
    flags: uniqueFlags,
    severity,
    recommendation,
    analyzedAt: new Date().toISOString(),
  };
}

module.exports = {
  triage,
  triageMultiple,
  checkForKeywords,
  EMERGENCY_KEYWORDS,
  SEVERITY_LEVELS,
  getRecommendedAction,
};
