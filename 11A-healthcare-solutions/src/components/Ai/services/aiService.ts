import { AIResponse } from '../types/index';

// ------------------- CONSTANTS ------------------------

const conversationalGreetings: string[] = [
  "Hey there! 😊 How's your day going? I'm here if you want to chat about anything health-related!",
  "Hi! 👋 Nice to see you! I'm your friendly health buddy - what's on your mind today?",
  "Hello! 🌟 Hope you're having a good day! I'm here to chat about any health stuff you might be wondering about.",
  "Hey! 😊 Great to meet you! I'm like having a knowledgeable friend who happens to know a lot about health - what can I help you with?",
  "Hi there! 👋 I'm so glad you stopped by! Think of me as your caring health companion - what would you like to talk about?",
  "Hello! 🌈 How are you feeling today? I'm here to chat about anything health-related that might be on your mind!",
  "Hey! 😊 Welcome! I'm your AI health friend - I love helping people feel better and connecting them with great doctors when needed!"
];

const casualResponses: string[] = [
  "That's awesome! 😊 I'm doing great too, thanks for asking! I love chatting with people about health and wellness. Is there anything health-related you'd like to talk about today?",
  "I'm doing wonderful, thank you! 🌟 I really enjoy helping people with their health questions. Anything on your mind health-wise?",
  "I'm fantastic! 😊 I love what I do - helping people understand their health better and connecting them with amazing doctors. What about you - how are you feeling?",
  "I'm great! Thanks for asking! 💫 I'm always excited to help with health questions or just chat about wellness. Anything you'd like to know?",
  "I'm doing really well! 😊 I find it so rewarding to help people with their health concerns. Is there anything you'd like to discuss about your health today?"
];

const medicalCategories: Record<string, string[]> = {
  'Dermatology': [
    'skin', 'rash', 'itchy', 'acne', 'pimples', 'spots', 'dry skin', 'eczema',
    'psoriasis', 'moles', 'wrinkles', 'scars', 'allergic reaction', 'hives',
    'red spots', 'skin problem', 'skin issue', 'breakout', 'blemish', 'irritation',
    'burning skin', 'peeling', 'flaky', 'bumps', 'skin redness', 'skin condition',
    'dermatitis', 'rosacea', 'blackheads', 'whiteheads', 'skin allergy'
  ],
  'Cardiology': [
    'chest pain', 'heart', 'palpitations', 'shortness of breath', 'cardiac',
    'heart racing', 'chest tightness', 'heart attack', 'chest pressure',
    'irregular heartbeat', 'heart flutter', 'chest discomfort'
  ],
  'Gastroenterology': [
    'stomach', 'abdomen', 'nausea', 'vomiting', 'digestive', 'acid reflux',
    'stomach pain', 'belly ache', 'indigestion', 'heartburn', 'bloating',
    'constipation', 'diarrhea', 'stomach cramps', 'gas', 'upset stomach'
  ],
  'Pulmonology': [
    'lungs', 'cough', 'breathing', 'asthma', 'respiratory',
    'breathing problems', 'wheezing', 'chest congestion', 'shortness of breath',
    'difficulty breathing', 'bronchitis', 'pneumonia'
  ],
  'Psychiatry': [
    'anxiety', 'depression', 'mental health', 'stress', 'panic', 'mood',
    'feeling sad', 'worried', 'anxious', 'depressed', 'overwhelmed',
    'panic attack', 'mental', 'emotional', 'psychological'
  ],
  'Neurology': [
    'headache', 'migraine', 'dizzy', 'seizure', 'neurological',
    'head pain', 'dizziness', 'vertigo', 'memory problems', 'confusion',
    'numbness', 'tingling', 'weakness'
  ],
  'Orthopedics': [
    'bone', 'joint', 'back pain', 'knee', 'shoulder', 'fracture', 'arthritis',
    'joint pain', 'muscle pain', 'sprain', 'strain', 'injury', 'broken',
    'hip pain', 'ankle pain', 'wrist pain', 'neck pain'
  ],
  'Ophthalmology': [
    'eye', 'vision', 'blurry', 'sight', 'eye pain', 'eyes',
    'eye problems', "can't see", 'vision problems', 'double vision',
    'eye infection', 'red eyes', 'dry eyes'
  ],
  'ENT': [
    'ear', 'throat', 'nose', 'sinus', 'hearing', 'ears',
    'ear pain', 'sore throat', 'stuffy nose', 'runny nose',
    'hearing loss', 'tinnitus', 'earache', 'congestion'
  ],
  'General Medicine': [
    'fever', 'cold', 'flu', 'fatigue', 'weakness', 'tired',
    'feeling sick', 'not feeling well', 'pain', 'hurt', 'ache',
    'temperature', 'chills', 'body aches', 'malaise'
  ]
};

const empathyResponses: Record<string, string[]> = {
  'Dermatology': [
    "Oh no, skin issues can be so frustrating! 😔...",
    "Ugh, skin problems are the worst, aren't they? 😕...",
    "I'm sorry you're dealing with skin troubles! 💙...",
    "Skin issues can be such a pain! 😔..."
  ],
  'Cardiology': [
    "Oh wow, heart symptoms can be really scary! 😰...",
    "Heart issues are so worrying, aren't they? 💙...",
    "I hear you about the heart concerns - that's got to be really stressful! 😟..."
  ],
  'Psychiatry': [
    "I'm really glad you're reaching out about this! 💙...",
    "Thank you for sharing that with me - I know it's not always easy to talk about mental health stuff. 💙...",
    "I really appreciate you opening up about this! 🌟..."
  ],
  'General Medicine': [
    "Aw, I'm sorry you're not feeling well! 😔...",
    "Oh no, feeling under the weather is never fun! 😕...",
    "I'm sorry you're dealing with this! 💙..."
  ]
};

const healthTips: Record<string, string[]> = {
  'Dermatology': [
    "Try to be gentle with your skin...",
    "Keep your skin moisturized...",
    "Don't forget sunscreen...",
    "Identify triggers...",
    "Stay hydrated 💧"
  ],
  'Cardiology': [
    "Avoid strenuous activities...",
    "Call emergency services if severe...",
    "Try deep breathing...",
    "Keep a symptom journal"
  ],
  'Psychiatry': [
    "Be gentle with yourself 💙",
    "Maintain a routine",
    "Reach out to others",
    "Try journaling or walking"
  ],
  'General Medicine': [
    "Rest is your best friend 😴",
    "Stay hydrated",
    "Eat light foods",
    "Listen to your body"
  ]
};

// -------------------- MAIN FUNCTION ------------------------

export const analyzeSymptoms = async (symptoms: string): Promise<AIResponse> => {
  const lowerSymptoms = symptoms.toLowerCase().trim();

  const greetingPatterns = [
    /^(hi|hello|hey|hiya|howdy)$/i,
    /^(hi|hello|hey)\s+(there|friend|buddy)?$/i,
    /^good\s+(morning|afternoon|evening)$/i,
    /^how\s+are\s+you(\s+doing)?(\?)?$/i,
    /^what'?s\s+up(\?)?$/i,
    /^(nice\s+to\s+meet\s+you|pleasure\s+to\s+meet\s+you)$/i
  ];

  const casualPatterns = [
    /^(i'?m\s+)?(good|fine|okay|ok|great|awesome|fantastic|wonderful)(\s+thanks?)?(\s+and\s+you)?(\?)?$/i,
    /^(not\s+much|nothing\s+much|just\s+saying\s+hi)$/i,
    /^(thanks?|thank\s+you)(\s+so\s+much)?$/i
  ];

  if (greetingPatterns.some(p => p.test(lowerSymptoms))) {
    const greeting = conversationalGreetings[Math.floor(Math.random() * conversationalGreetings.length)];
    return { analysis: greeting, specializations: [], urgency: 'low', recommendations: [] };
  }

  if (casualPatterns.some(p => p.test(lowerSymptoms))) {
    const casual = casualResponses[Math.floor(Math.random() * casualResponses.length)];
    return { analysis: casual, specializations: [], urgency: 'low', recommendations: [] };
  }

  let bestMatch = '';
  let maxMatches = 0;

  for (const [category, keywords] of Object.entries(medicalCategories) as [string, string[]][]) {
    const matches = keywords.filter((keyword: string) =>
      lowerSymptoms.includes(keyword.toLowerCase())
    );

    if (matches.length > maxMatches) {
      maxMatches = matches.length;
      bestMatch = category;
    }
  }

  if (maxMatches === 0) {
    return {
      analysis: "I'd love to help with any health concerns 😊 Could you describe your symptoms a bit more?",
      specializations: [],
      urgency: 'low',
      recommendations: []
    };
  }

  const empathy = empathyResponses[bestMatch] || empathyResponses['General Medicine'];
  const randomEmpathy = empathy[Math.floor(Math.random() * empathy.length)];

  const tips = healthTips[bestMatch] || healthTips['General Medicine'];

  let urgency: 'low' | 'medium' | 'high' = 'medium';

  const highUrgencyKeywords = [
    'severe', 'intense', 'unbearable', 'emergency', "can't breathe", 'chest pain', 'heart attack',
    'suicide', 'kill myself', 'bleeding heavily', 'unconscious', 'seizure', 'stroke'
  ];

  const lowUrgencyKeywords = [
    'mild', 'slight', 'minor', 'small', 'little bit', 'sometimes',
    'occasionally', 'not too bad', 'manageable'
  ];

  if (highUrgencyKeywords.some(k => lowerSymptoms.includes(k))) urgency = 'high';
  else if (lowUrgencyKeywords.some(k => lowerSymptoms.includes(k))) urgency = 'low';

  return {
    analysis: randomEmpathy,
    specializations: [bestMatch],
    urgency,
    recommendations: tips
  };
};

// ------------------- FOLLOW-UP QUESTIONS -------------------

export const generateFollowUpQuestions = (specialization: string): string[] => {
  const questions: Record<string, string[]> = {
    'Dermatology': [
      'How long have you been dealing with this skin issue?',
      'Does it itch or cause any discomfort?',
      'Have you noticed any triggers that make it worse?',
      'Have you tried any treatments or products for it?'
    ],
    'Cardiology': [
      'When did you first notice these heart symptoms?',
      'Do they happen during physical activity or at rest?',
      'Any family history of heart problems?',
      'Are you currently taking any medications?'
    ],
    'Psychiatry': [
      'How long have you been feeling this way?',
      'Have you noticed any specific triggers?',
      'Are you getting enough sleep lately?',
      'Do you have support from family or friends?'
    ],
    'General Medicine': [
      'How long have you been feeling unwell?',
      'Any other symptoms you\'ve noticed?',
      'Have you taken your temperature?',
      'Are you taking any medications currently?'
    ]
  };

  return questions[specialization] || questions['General Medicine'];
};
