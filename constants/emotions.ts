export type EmotionCategory = 'Sunny' | 'Stormy' | 'Calm' | 'Breezy';

export interface CategoryConfig {
  gradientStart: string;
  gradientEnd: string;
  accentColor: string;
  blobColors: string[];
  subEmotions: string[];
}

export const EMOTION_DATA: Record<EmotionCategory, CategoryConfig> = {
  Sunny: {
    gradientStart: '#F5A623',
    gradientEnd: '#F5E042',
    accentColor: '#F5C842',
    blobColors: ['#F5A623', '#F5C842', '#E8961E', '#F5E042', '#D4820F', '#F0B52A'],
    subEmotions: [
      'Surprised', 'Awe', 'Exhilarated', 'Thrilled', 'Motivated', 'Optimistic',
      'Excited', 'Determined', 'Successful', 'Amazed', 'Engaged', 'Challenged',
      'Energized', 'Eager', 'Enthusiastic', 'Joyful', 'Hopeful', 'Accomplished',
      'Cheerful', 'Curious', 'Upbeat', 'Happy', 'Elated', 'Ecstatic',
      'Pleasant', 'Focused', 'Alive', 'Confident', 'Inspired', 'Empowered',
      'Pleased', 'Playful', 'Delighted', 'Wishful', 'Productive', 'Proud',
    ],
  },
  Stormy: {
    gradientStart: '#E8614D',
    gradientEnd: '#FF8A75',
    accentColor: '#E8614D',
    blobColors: ['#E8614D', '#C0392B', '#FF6B4A', '#D44332', '#B83227', '#FF8A75'],
    subEmotions: [],
  },
  Calm: {
    gradientStart: '#8B7BE8',
    gradientEnd: '#B8AAFF',
    accentColor: '#8B7BE8',
    blobColors: ['#8B7BE8', '#6B5BD4', '#B8AAFF', '#7A6AD6', '#5B4BC4', '#9D8DF0'],
    subEmotions: [],
  },
  Breezy: {
    gradientStart: '#7BC88E',
    gradientEnd: '#A8E6B8',
    accentColor: '#7BC88E',
    blobColors: ['#7BC88E', '#5DAF72', '#A8E6B8', '#6DBF80', '#4D9F62', '#8DD8A0'],
    subEmotions: [],
  },
};
