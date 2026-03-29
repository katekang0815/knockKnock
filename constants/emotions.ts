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
    gradientStart: '#4A90D9',
    gradientEnd: '#00BFFF',
    accentColor: '#4A90D9',
    subEmotions: [
      'Insecure', 'Disheartened', 'Down', 'Bored', 'Trapped', 'Disgusted',
      'Lost', 'Disappointed', 'Meh', 'Tired', 'Ashamed', 'Humiliated',
      'Disconnected', 'Forlorn', 'Sad', 'Fatigued', 'Vulnerable', 'Pessimistic',
      'Excluded', 'Spent', 'Discouraged', 'Disengaged', 'Guilty', 'Numb',
      'Alienated', 'Nostalgic', 'Lonely', 'Apathetic', 'Depressed', 'Hopeless',
      'Glum', 'Burned Out', 'Exhausted', 'Helpless', 'Miserable', 'Despair',
    ],
  },
  Breezy: {
    gradientStart: '#00D68F',
    gradientEnd: '#00FFB0',
    accentColor: '#00D68F',
    subEmotions: [
      'Calm', 'At Ease', 'Understood', 'Respected', 'Fulfilled', 'Blissful',
      'Good', 'Thoughtful', 'Appreciated', 'Supported', 'Loved', 'Connected',
      'Relaxed', 'Chill', 'Compassionate', 'Included', 'Valued', 'Grateful',
      'Sympathetic', 'Comfortable', 'Empathetic', 'Content', 'Accepted', 'Moved',
      'Mellow', 'Peaceful', 'Balanced', 'Safe', 'Secure', 'Blessed',
      'Thankful', 'Relieved', 'Comforted', 'Grounded', 'Centered', 'Serene',
    ],
  },
};
