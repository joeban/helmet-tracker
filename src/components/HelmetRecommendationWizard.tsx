'use client';

import { useState } from 'react';
import { HELMETS } from '@/data/helmets';
import { Helmet } from '@/types/helmet';
import { generateHelmetSlug } from '@/utils/helmet-slug';
import AmazonButton from '@/components/AmazonButton';
import { AddToComparisonButton } from '@/components/ComparisonWidget';
import { trackAdvancedSearch } from '@/utils/analytics';

interface WizardStep {
  id: string;
  question: string;
  options: {
    id: string;
    label: string;
    value: string;
    description?: string;
  }[];
}

interface UserPreferences {
  ridingStyle: string;
  budget: string;
  safetyPriority: string;
  features: string[];
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'ridingStyle',
    question: 'What type of cycling do you do most?',
    options: [
      {
        id: 'commuting',
        label: '🚴‍♂️ Commuting',
        value: 'commuting',
        description: 'Daily rides to work, visibility is key'
      },
      {
        id: 'road',
        label: '🏁 Road Racing',
        value: 'road',
        description: 'Speed-focused, aerodynamic helmets'
      },
      {
        id: 'mountain',
        label: '⛰️ Mountain Biking',
        value: 'mountain',
        description: 'Trail riding, maximum protection'
      },
      {
        id: 'casual',
        label: '🌳 Recreational',
        value: 'casual',
        description: 'Casual rides, comfort-focused'
      }
    ]
  },
  {
    id: 'budget',
    question: 'What\'s your budget range?',
    options: [
      {
        id: 'budget',
        label: '💰 Budget ($30-100)',
        value: 'budget',
        description: 'Great value, solid protection'
      },
      {
        id: 'mid',
        label: '💎 Mid-Range ($60-200)',
        value: 'mid',
        description: 'Best balance of features & safety'
      },
      {
        id: 'premium',
        label: '👑 Premium ($150+)',
        value: 'premium',
        description: 'Top-tier safety & technology'
      }
    ]
  },
  {
    id: 'safetyPriority',
    question: 'How important is maximum safety?',
    options: [
      {
        id: 'maximum',
        label: '🛡️ Maximum Safety',
        value: 'maximum',
        description: 'Only Virginia Tech 5-star helmets'
      },
      {
        id: 'balanced',
        label: '⚖️ Safety + Other Features',
        value: 'balanced',
        description: 'Good safety with style/comfort'
      },
      {
        id: 'basic',
        label: '✅ Basic Protection',
        value: 'basic',
        description: 'Meets safety standards'
      }
    ]
  }
];

export default function HelmetRecommendationWizard() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({});
  const [recommendations, setRecommendations] = useState<Helmet[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const handleAnswer = (stepId: string, value: string) => {
    const newPreferences = { ...preferences, [stepId]: value };
    setPreferences(newPreferences);

    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      generateRecommendations(newPreferences as UserPreferences);
    }
  };

  const generateRecommendations = (prefs: UserPreferences) => {
    console.log('🔍 Generating recommendations with preferences:', prefs);
    let filtered = [...HELMETS];
    console.log('📊 Starting with', filtered.length, 'helmets');

    // Filter by budget - more flexible ranges
    if (prefs.budget === 'budget') {
      filtered = filtered.filter(h => h.min_price <= 100); // Increased from 80
    } else if (prefs.budget === 'mid') {
      filtered = filtered.filter(h => h.min_price >= 60 && h.min_price <= 200); // More flexible range
    } else if (prefs.budget === 'premium') {
      filtered = filtered.filter(h => h.min_price >= 150);
    }
    console.log('💰 After budget filter:', filtered.length, 'helmets');

    // Filter by safety priority - more flexible
    if (prefs.safetyPriority === 'maximum') {
      filtered = filtered.filter(h => h.star_rating >= 4 && h.safety_score <= 12); // More inclusive
    } else if (prefs.safetyPriority === 'balanced') {
      filtered = filtered.filter(h => h.star_rating >= 3); // More inclusive
    }
    // For 'basic', don't filter by safety
    console.log('🛡️ After safety filter:', filtered.length, 'helmets');

    // Filter by riding style (category matching) - more flexible
    if (prefs.ridingStyle === 'road') {
      filtered = filtered.filter(h => h.category === 'Road' || h.category === 'Multi-sport');
    } else if (prefs.ridingStyle === 'mountain') {
      filtered = filtered.filter(h => h.category === 'All Mountain' || h.category === 'Multi-sport');
    } else if (prefs.ridingStyle === 'commuting') {
      filtered = filtered.filter(h => h.category === 'Urban' || h.category === 'Multi-sport' || h.category === 'Road');
    }
    // For 'casual', include all categories
    console.log('🚴 After riding style filter:', filtered.length, 'helmets');

    // If we have very few results, be more flexible
    if (filtered.length < 3) {
      console.log('⚠️ Too few results, relaxing filters...');
      filtered = [...HELMETS];

      // Apply only budget filter if specified
      if (prefs.budget === 'budget') {
        filtered = filtered.filter(h => h.min_price <= 120);
      } else if (prefs.budget === 'premium') {
        filtered = filtered.filter(h => h.min_price >= 100);
      }

      // Prefer higher rated helmets but don't exclude others
      filtered.sort((a, b) => {
        const aScore = (5 - a.star_rating) * 2 + (a.safety_score / 10); // Prioritize rating
        const bScore = (5 - b.star_rating) * 2 + (b.safety_score / 10);
        return aScore - bScore;
      });
    } else {
      // Sort by best value (safety score and price)
      filtered.sort((a, b) => {
        const aScore = (6 - a.star_rating) + (a.safety_score / 5); // Lower is better
        const bScore = (6 - b.star_rating) + (b.safety_score / 5);
        return aScore - bScore;
      });
    }

    const topRecommendations = filtered.slice(0, 3);
    console.log('✅ Final recommendations:', topRecommendations.length, 'helmets');
    console.log('🏆 Recommended helmets:', topRecommendations.map(h => `${h.brand} ${h.name} ($${h.min_price})`));

    setRecommendations(topRecommendations);
    setIsComplete(true);

    // Track the wizard completion as a search event
    trackAdvancedSearch(`wizard_${prefs.ridingStyle}_${prefs.budget}_${prefs.safetyPriority}`, topRecommendations.length, {
      wizard: true,
      ridingStyle: prefs.ridingStyle,
      budget: prefs.budget,
      safetyPriority: prefs.safetyPriority
    });
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setPreferences({});
    setRecommendations([]);
    setIsComplete(false);
  };

  const currentStepData = WIZARD_STEPS[currentStep];

  if (!isOpen) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200 mb-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Find Your Perfect Helmet in 30 Seconds
          </h2>
          <p className="text-gray-600 mb-4">
            Skip the overwhelm. Get personalized recommendations based on your cycling needs.
          </p>
          <button
            onClick={() => setIsOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Start Helmet Finder
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {!isComplete ? (
          <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Helmet Finder</h2>
                  <p className="text-gray-600 text-sm">Step {currentStep + 1} of {WIZARD_STEPS.length}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }}
              ></div>
            </div>

            {/* Question */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                {currentStepData.question}
              </h3>
            </div>

            {/* Options */}
            <div className="grid gap-4 md:grid-cols-2">
              {currentStepData.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleAnswer(currentStepData.id, option.value)}
                  className="p-6 text-left border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <div className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600">
                    {option.label}
                  </div>
                  {option.description && (
                    <div className="text-gray-600 text-sm">
                      {option.description}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Back Button */}
            {currentStep > 0 && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="text-gray-600 hover:text-gray-800 underline"
                >
                  ← Go Back
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 lg:p-8">
            {/* Results Header */}
            <div className="text-center mb-8">
              <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🎉</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Perfect! Here are your top helmet recommendations
              </h2>
              <p className="text-gray-600">
                Based on your preferences for {preferences.ridingStyle} cycling,
                {preferences.budget} budget, and {preferences.safetyPriority} safety priority
              </p>
            </div>

            {/* Recommendations */}
            <div className="space-y-6">
              {recommendations.map((helmet, index) => {
                const helmetSlug = generateHelmetSlug(helmet.brand, helmet.name);
                return (
                  <div key={helmet.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Ranking Badge */}
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                        }`}>
                          {index + 1}
                        </div>
                      </div>

                      {/* Helmet Info */}
                      <div className="flex-1">
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                              {helmet.brand} {helmet.name}
                            </h3>
                            <div className="flex items-center gap-4 mb-3">
                              <span className="text-yellow-500 text-lg">
                                {'★'.repeat(helmet.star_rating)}{'☆'.repeat(5 - helmet.star_rating)}
                              </span>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                                Safety Score: {helmet.safety_score}
                              </span>
                              <span className="text-lg font-bold text-green-600">
                                ${helmet.min_price}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-4">
                              {index === 0 && '🏆 Best match for your needs - top safety and value'}
                              {index === 1 && '🥈 Excellent alternative with great features'}
                              {index === 2 && '🥉 Solid choice with good performance'}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-3 lg:w-48">
                            <AmazonButton
                              helmet={helmet}
                              testId="wizard_amazon_button_test"
                              size="md"
                              className="w-full"
                            />
                            <AddToComparisonButton
                              helmet={helmet}
                              source="search"
                              variant="button"
                              className="w-full"
                            />
                            <a
                              href={`/helmet/${helmetSlug}`}
                              className="w-full px-4 py-2 text-center border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                            >
                              View Details
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={resetWizard}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse All Helmets
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}