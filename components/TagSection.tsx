import { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';

export interface TagSectionProps {
  title: string;
  options: string[];
  selected: string[];
  onSelect: (option: string) => void;
  onAdd: (option: string) => void;
  onDelete?: (option: string) => void;
  accentColor: string;
  onAddFocus?: (node: { current: View | null }) => void;
}

const VISIBLE_TAGS = 9; // chips shown before the "More" toggle

// Always-open tag list: title, then a wrap of tags (+ add, first N, "More" toggle).
export default function TagSection({
  title,
  options,
  selected,
  onSelect,
  onAdd,
  onDelete,
  accentColor,
  onAddFocus,
}: TagSectionProps) {
  const [adding, setAdding] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const addRowRef = useRef<View>(null);

  const handleAdd = () => {
    const trimmed = newTag.trim();
    if (trimmed) {
      onAdd(trimmed);
      setNewTag('');
      setAdding(false);
    }
  };

  const visible = showAll ? options : options.slice(0, VISIBLE_TAGS);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.tagsWrap}>
        {/* Add new button */}
        <TouchableOpacity style={styles.addButton} onPress={() => setAdding(!adding)} activeOpacity={0.7}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>

        {visible.map((option) => {
          // Long-pressed tag: show inline Delete / Cancel instead of the chip.
          if (pendingDelete === option) {
            return (
              <View key={option} style={styles.chipConfirm}>
                <TouchableOpacity
                  onPress={() => {
                    onDelete?.(option);
                    setPendingDelete(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipDeleteText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPendingDelete(null)} activeOpacity={0.7}>
                  <Text style={styles.chipCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            );
          }

          const isSelected = selected[0] === option;
          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.chip,
                isSelected && { backgroundColor: 'rgba(219,83,60,0.22)' },
              ]}
              onPress={() => onSelect(option)}
              onLongPress={() => setPendingDelete(option)}
              delayLongPress={350}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isSelected && { color: accentColor }]}>{option}</Text>
            </TouchableOpacity>
          );
        })}

        {options.length > VISIBLE_TAGS && (
          <TouchableOpacity style={styles.moreToggle} onPress={() => setShowAll(!showAll)} activeOpacity={0.7}>
            <Text style={styles.moreText}>{showAll ? 'Less ▲' : 'More ▼'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {adding && (
        <View ref={addRowRef} style={styles.addInputRow}>
          <TextInput
            style={styles.addInput}
            value={newTag}
            onChangeText={setNewTag}
            placeholder="Type new option..."
            placeholderTextColor="#666"
            autoFocus
            onFocus={() => onAddFocus?.(addRowRef)}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Jost_400Regular',
    marginBottom: 16,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Jost_400Regular',
  },
  chipConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: 'rgba(219,83,60,0.15)',
  },
  chipDeleteText: {
    color: '#E8614D',
    fontSize: 15,
    fontFamily: 'Jost_700Bold',
  },
  chipCancelText: {
    color: '#9A9A9A',
    fontSize: 15,
    fontFamily: 'Jost_400Regular',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Jost_400Regular',
    marginTop: -1,
  },
  moreToggle: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    justifyContent: 'center',
  },
  moreText: {
    color: '#888888',
    fontSize: 15,
    fontFamily: 'Jost_400Regular',
  },
  addInputRow: {
    marginTop: 10,
  },
  addInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
    paddingVertical: 0,
    color: '#FFFFFF',
    fontFamily: 'Jost_400Regular',
    fontSize: 15,
    textAlignVertical: 'center', // Android
    includeFontPadding: false, // drop extra font padding that pushes text down
  },
});
