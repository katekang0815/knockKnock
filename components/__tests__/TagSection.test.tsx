import { fireEvent, render, screen } from '@testing-library/react-native';
import TagSection from '../TagSection';

const OPTIONS = ['Resting', 'Driving', 'Hobbies'];

function renderTagSection(overrides: Partial<React.ComponentProps<typeof TagSection>> = {}) {
  const onSelect = jest.fn();
  const onAdd = jest.fn();
  const onDelete = jest.fn();
  render(
    <TagSection
      title="What are you doing?"
      options={OPTIONS}
      selected={[]}
      onSelect={onSelect}
      onAdd={onAdd}
      onDelete={onDelete}
      accentColor="#DB533C"
      {...overrides}
    />,
  );
  return { onSelect, onAdd, onDelete };
}

describe('TagSection', () => {
  it('renders the title and every option as a chip', () => {
    renderTagSection();
    expect(screen.getByText('What are you doing?')).toBeTruthy();
    for (const option of OPTIONS) {
      expect(screen.getByText(option)).toBeTruthy();
    }
  });

  it('calls onSelect with the tapped option', () => {
    const { onSelect } = renderTagSection();
    fireEvent.press(screen.getByText('Driving'));
    expect(onSelect).toHaveBeenCalledWith('Driving');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('reveals a text input when the + button is pressed, and calls onAdd with the trimmed value on submit', () => {
    const { onAdd } = renderTagSection();
    expect(screen.queryByPlaceholderText('Type new option...')).toBeNull();

    fireEvent.press(screen.getByText('+'));
    const input = screen.getByPlaceholderText('Type new option...');
    expect(input).toBeTruthy();

    fireEvent.changeText(input, '  Cooking  ');
    fireEvent(input, 'submitEditing');

    expect(onAdd).toHaveBeenCalledWith('Cooking'); // trimmed
    // The input closes again after a successful add.
    expect(screen.queryByPlaceholderText('Type new option...')).toBeNull();
  });

  it('does not call onAdd for a blank/whitespace-only entry', () => {
    const { onAdd } = renderTagSection();
    fireEvent.press(screen.getByText('+'));
    const input = screen.getByPlaceholderText('Type new option...');
    fireEvent.changeText(input, '   ');
    fireEvent(input, 'submitEditing');
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('long-pressing a chip reveals Delete/Cancel instead of the chip, and Delete calls onDelete', () => {
    const { onDelete } = renderTagSection();
    fireEvent(screen.getByText('Resting'), 'longPress');

    // The chip itself is replaced by Delete/Cancel controls.
    expect(screen.queryByText('Resting')).toBeNull();
    expect(screen.getByText('Delete')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();

    fireEvent.press(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith('Resting');
    // The chip comes back once the pending-delete state clears.
    expect(screen.getByText('Resting')).toBeTruthy();
  });

  it('Cancel dismisses the Delete/Cancel row without calling onDelete', () => {
    const { onDelete } = renderTagSection();
    fireEvent(screen.getByText('Driving'), 'longPress');
    fireEvent.press(screen.getByText('Cancel'));

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByText('Driving')).toBeTruthy();
  });

  it('shows a More toggle only when there are more than 9 options, and it reveals the rest', () => {
    const many = Array.from({ length: 12 }, (_, i) => `Option ${i + 1}`);
    renderTagSection({ options: many });

    expect(screen.getByText('More ▼')).toBeTruthy();
    expect(screen.queryByText('Option 10')).toBeNull(); // trimmed by default

    fireEvent.press(screen.getByText('More ▼'));
    expect(screen.getByText('Option 10')).toBeTruthy();
    expect(screen.getByText('Less ▲')).toBeTruthy();
  });
});
