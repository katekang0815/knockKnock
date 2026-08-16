export type EmotionCategory = 'Sunny' | 'Stormy' | 'Rain' | 'Breezy';

export interface CategoryConfig {
  gradientStart: string;
  gradientEnd: string;
  accentColor: string;
  subEmotions: string[];
}

export const EMOTION_DATA: Record<EmotionCategory, CategoryConfig> = {
  Sunny: {
    gradientStart: '#F5A623',
    gradientEnd: '#F5E042',
    accentColor: '#F5C842',
    subEmotions: [
      'Optimistic', 'Alive', 'Surprised', 'Accomplished',
      'Proud', 'Curious', 'Hopeful', 'Motivated',
      'Confident', 'Inspired', 'Eager', 'Focused',
      'Excited', 'Thrilled', 'Joyful', 'Determined',
    ],
  },
  Stormy: {
    gradientStart: '#E8614D',
    gradientEnd: '#FF8A75',
    accentColor: '#E8614D',
    subEmotions: [
      'Anxious', 'Stressed', 'Overwhelmed', 'Worried',
      'Annoyed', 'Frustrated', 'Nervous', 'Scared',
      'Confused', 'Embarrassed', 'Irritated', 'Jealous',
      'Furious', 'Shocked', 'Tense', 'Panicked',
    ],
  },
  Rain: {
    gradientStart: '#4A90D9',
    gradientEnd: '#00BFFF',
    accentColor: '#4A90D9',
    subEmotions: [
      'Sad', 'Discouraged', 'Bored', 'Lonely',
      'Excluded', 'Depressed', 'Disappointed', 'Exhausted',
      'Lost', 'Insecure', 'Despair', 'Guilty',
      'Ashamed', 'Numb', 'Vulnerable', 'Burned Out',
    ],
  },
  Breezy: {
    gradientStart: '#00D68F',
    gradientEnd: '#00FFB0',
    accentColor: '#00D68F',
    subEmotions: [
      'Loved', 'Good', 'Chill', 'Compassionate',
      'Supported', 'Blessed', 'Included', 'Valued',
      'Safe', 'Fulfilled', 'Content', 'Connected',
      'Appreciated', 'Relieved', 'Understood',
    ],
  },
};
