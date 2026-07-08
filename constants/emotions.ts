export type EmotionCategory = 'Sunny' | 'Stormy' | 'Calm' | 'Breezy';

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
      'Happy', 'Excited', 'Surprised', 'Amazed',
      'Proud', 'Curious', 'Hopeful', 'Motivated',
      'Confident', 'Inspired', 'Successful', 'Focused',
      'Playful', 'Thrilled', 'Joyful', 'Determined',
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
      'Fomo', 'Shocked', 'Tense', 'Panicked',
    ],
  },
  Calm: {
    gradientStart: '#4A90D9',
    gradientEnd: '#00BFFF',
    accentColor: '#4A90D9',
    subEmotions: [
      'Sad', 'Tired', 'Bored', 'Lonely',
      'Down', 'Depressed', 'Disappointed', 'Exhausted',
      'Lost', 'Insecure', 'Meh', 'Guilty',
      'Ashamed', 'Numb', 'Vulnerable', 'Burned Out',
    ],
  },
  Breezy: {
    gradientStart: '#00D68F',
    gradientEnd: '#00FFB0',
    accentColor: '#00D68F',
    subEmotions: [
      'Loved', 'Good', 'Chill', 'Relaxed',
      'Grateful', 'Blessed', 'Thankful', 'Peaceful',
      'Safe', 'Comfortable', 'Content', 'Connected',
      'Appreciated', 'Relieved', 'Understood', 'Supported',
    ],
  },
};
