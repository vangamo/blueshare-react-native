# Spec Delta

## MODIFIED Requirements

### Requirement: Edit dialog appearance
The dialog SHALL be a box with the creation background, a 2-point solid primary-blue border and 16 points of padding, with a 16-point corner radius in the phone layouts and an 18-point one in the tablet layout. It SHALL span the window width minus 16 points and the side safe-area insets on each side, but never be wider than the content column of the current layout, and SHALL be centered horizontally. It SHALL be placed near the top of the screen so it stays visible above the keyboard. Its title "Editar elemento de texto:" SHALL be 14-point bold in the main text color.

#### Scenario: Dialog style in both palettes
- **WHEN** the edit dialog is open in light or dark mode
- **THEN** it shows a solid primary-blue border on the active palette's creation background, and its title is bold main-color text

#### Scenario: Keyboard open
- **WHEN** the user taps the text area and the keyboard opens in the phone portrait or the tablet layout
- **THEN** the title, the text area, "Cancelar" and "Guardar" are still visible above the keyboard

#### Scenario: Keyboard open in phone landscape
- **WHEN** the user taps the text area and the keyboard opens in the phone landscape layout
- **THEN** the dialog content can be scrolled so that the title, the text area, "Cancelar" and "Guardar" can each be brought into view above the keyboard, and nothing is cut off for good

#### Scenario: Dialog on a wide window
- **WHEN** the edit dialog opens in the tablet layout on a window 1280 points wide
- **THEN** the dialog is at most 500 points wide, centered, with an 18-point corner radius, and the dimmed Timeline shows on both sides
