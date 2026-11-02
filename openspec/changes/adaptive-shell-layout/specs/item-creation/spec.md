# Spec Delta

## MODIFIED Requirements

### Requirement: Creation box appearance
The creation box SHALL have a 2-point dashed border in primary blue, the creation background color and 16 points of padding. In the phone layouts it SHALL have a 16-point corner radius and 16 points of space below it. In the tablet layout it SHALL have an 18-point corner radius and 20 points of space below it, matching the tablet cards. Its title ("Crear nuevo elemento:" or "Crear nuevo elemento de texto:") SHALL be 14-point bold in the main text color.

#### Scenario: Box style in both palettes
- **WHEN** the creation box is open in light or dark mode
- **THEN** it shows a dashed primary-blue border on the creation background of the active palette, and its title is bold main-color text

#### Scenario: Box on a tablet
- **WHEN** the creation box is open in the tablet layout
- **THEN** it has an 18-point corner radius and 20 points of space between it and the first card
