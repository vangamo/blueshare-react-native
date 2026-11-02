# Spec Delta

## MODIFIED Requirements

### Requirement: Edit dialog appearance
The dialog SHALL be a box with the creation background, a 2-point solid primary-blue border, and the corner radius and padding of the current size set (16 points on phones). It SHALL span the current layout's content column, centered: on phones in portrait, the screen width minus 16 points on each side. It SHALL be placed near the top of the screen so it stays visible above the keyboard. Its title "Editar elemento de texto:" SHALL be bold, in the main text color, at the size set's box title size (14 points on phones).

#### Scenario: Dialog style in both palettes
- **WHEN** the edit dialog is open in light or dark mode
- **THEN** it shows a solid primary-blue border on the active palette's creation background, and its title is bold main-color text

#### Scenario: Keyboard open
- **WHEN** the user taps the text area and the keyboard opens, in any layout except phone landscape
- **THEN** the title, the text area, "Cancelar" and "Guardar" are still visible above the keyboard

#### Scenario: Keyboard open on a phone in landscape
- **WHEN** the user taps the text area in the phone landscape layout
- **THEN** the keyboard may show the system's full-screen editor over the dialog, and after it closes the dialog shows the typed text

#### Scenario: Dialog on a tablet
- **WHEN** the edit dialog is open in the tablet portrait layout
- **THEN** it is 500 points wide and centered horizontally
