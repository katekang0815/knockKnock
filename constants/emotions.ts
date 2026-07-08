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
      'Happy', 'Excited', 'Surprised', 'Amazed', 'Proud', 'Curious',
      'Hopeful', 'Motivated', 'Confident', 'Inspired', 'Successful', 'Cheerful',
      'Focused', 'Playful', 'Determined', 'Optimistic', 'Thrilled', 'Joyful',
      'Delighted', 'Accomplished', 'Productive', 'Energized', 'Enthusiastic', 'Alive',
    ],
  },
  Stormy: {
    gradientStart: '#E8614D',
    gradientEnd: '#FF8A75',
    accentColor: '#E8614D',
    subEmotions: [
      'Anxious', 'Stressed', 'Overwhelmed', 'Worried', 'Annoyed', 'Frustrated',
      'Nervous', 'Scared', 'Confused', 'Embarrassed', 'Irritated', 'Jealous',
      'Shocked', 'Tense', 'Panicked', 'Uneasy', 'Fomo', 'Furious',
      'Hyper', 'Terrified', 'Restless', 'Concerned', 'Pressured', 'Livid',
    ],
  },
  Calm: {
    gradientStart: '#4A90D9',
    gradientEnd: '#00BFFF',
    accentColor: '#4A90D9',
    subEmotions: [
      'Sad', 'Tired', 'Bored', 'Lonely', 'Down', 'Depressed',
      'Disappointed', 'Exhausted', 'Lost', 'Insecure', 'Meh', 'Guilty',
      'Ashamed', 'Numb', 'Vulnerable', 'Hopeless', 'Miserable', 'Nostalgic',
      'Burned Out', 'Disconnected', 'Trapped', 'Helpless', 'Disgusted', 'Excluded',
    ],
  },
  Breezy: {
    gradientStart: '#00D68F',
    gradientEnd: '#00FFB0',
    accentColor: '#00D68F',
    subEmotions: [
      'Loved', 'Good', 'Chill', 'Relaxed', 'Grateful', 'Thankful',
      'Blessed', 'Peaceful', 'Safe', 'Comfortable', 'Content', 'Connected',
      'Appreciated', 'Relieved', 'Understood', 'Supported', 'Calm', 'Secure',
      'Fulfilled', 'Blissful', 'Grounded', 'Included', 'Balanced', 'Accepted',
    ],
  },
};
