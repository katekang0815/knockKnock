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
    subEmotions: [
      'Terrified', 'Enraged', 'Irate', 'Livid', 'Frightened', 'Furious',
      'Jealous', 'Scared', 'Envious', 'Repulsed', 'Contempt', 'Troubled',
      'Panicked', 'Shocked', 'Annoyed', 'Stressed', 'Pressured', 'Overwhelmed',
      'Apprehensive', 'Irritated', 'Restless', 'Jittery', 'Fomo', 'Confused',
      'Embarrassed', 'Concerned', 'Tense', 'Peeved', 'Nervous', 'Uneasy',
      'Worried', 'Frustrated', 'Impassioned', 'Hyper', 'Excited', 'Anxious',
    ],
  },
  Calm: {
    gradientStart: '#8B7BE8',
    gradientEnd: '#B8AAFF',
    accentColor: '#8B7BE8',
    subEmotions: [],
  },
  Breezy: {
    gradientStart: '#7BC88E',
    gradientEnd: '#A8E6B8',
    accentColor: '#7BC88E',
    subEmotions: [],
  },
};
