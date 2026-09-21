# Improve the admin structure

## What will change
- Replace the tall, sparse mobile drawer with a compact navigation panel that clearly separates workspace identity, active section, navigation groups, and account access.
- Reduce repeated page titles and unnecessary decorative labels so the selected work area becomes the main focus.
- Reorganize the top summary into a concise status row and keep it visually secondary to the active queue.
- Strengthen desktop hierarchy with a quieter sidebar, consistent spacing, and clearer active, pending, and section states.
- Preserve all existing admin modules, permissions, data, actions, translations, and mobile behavior.

## Technical details
- Refine the existing admin route and shared sheet presentation only; no backend or business-logic changes.
- Keep semantic design tokens and existing button components.
- Validate the admin page on desktop and mobile, including opening the drawer and changing sections.
