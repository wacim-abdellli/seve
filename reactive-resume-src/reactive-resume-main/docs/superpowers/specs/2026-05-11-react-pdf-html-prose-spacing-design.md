# React PDF HTML Prose Spacing Design

## Context

Resume rich-text fields are rendered in PDF through `packages/pdf/src/templates/shared/rich-text.tsx`, which wraps normalized HTML with `react-pdf-html`. Each template currently supplies body-derived styles such as `richParagraph`, `richListItemRow`, `richListItemMarker`, and `richListItemContent`. Those styles intentionally keep rich text aligned with the template typography.

The current PDF rich-text spacing differs from what users see in Tailwind Typography prose. Paragraphs and list items are effectively flattened by zero margins, while browser prose gives paragraphs and list items vertical rhythm and trims the outside edges of the rich-text flow.

## Goals

- Add vertical spacing to `react-pdf-html` paragraphs and list items in the shared `RichText` path.
- Match Tailwind Typography `prose-sm` spacing proportions without importing Tailwind's browser font size into PDF output.
- Preserve each resume template's body font size and line height for rich text and adjacent non-rich-text PDF elements.
- Remove the outer top margin from the first renderable rich-text block and the outer bottom margin from the last renderable rich-text block.
- Keep the change shared and template-compatible unless a future template needs an explicit exception.

## Non-Goals

- Do not change web editor `.wysiwyg` styles.
- Do not change template body or heading font sizes.
- Do not add a new PDF typography system.
- Do not restyle headings, blockquotes, tables, or other HTML tags beyond paragraph and list item spacing.

## Recommended Approach

Use Tailwind Typography `prose-sm` spacing ratios and derive the final PDF spacing from the current template body font size. Tailwind Typography's `prose-sm` paragraph spacing is `16 / 14` of the body size, and list item spacing is `4 / 14` of the body size. The PDF renderer should use those ratios against the resolved body font size already present in the template styles.

This keeps rich-text content visually consistent with Tailwind Typography while respecting the resume template's PDF typography scale.

## Implementation Shape

The shared `RichText` component should:

1. Continue normalizing input through `normalizeRichTextHtml`.
2. Inspect the normalized HTML to identify renderable top-level prose blocks relevant to this change: paragraphs and list items.
3. Apply derived paragraph spacing to `p` through the `react-pdf-html` stylesheet.
4. Apply derived list item spacing to the custom `li` renderer row container.
5. Trim `marginTop` on the first relevant rich-text element and `marginBottom` on the last relevant rich-text element.
6. Merge spacing after template styles where needed so old `margin: 0` template defaults do not suppress the new shared prose rhythm.

For list items, the spacing belongs on the custom `li` row container. Marker and content styles should continue coming from template slots so bullets, numbers, font size, and line height remain template-owned.

## Testing

Add focused tests around the shared rich-text spacing behavior. Coverage should include:

- A single paragraph has both outer margins trimmed.
- Multiple paragraphs keep internal paragraph spacing and trim only the first top and last bottom edge.
- Multiple list items get list-item vertical spacing with first top and last bottom trimmed.
- Mixed paragraph/list content trims the first and last relevant elements across element types.
- Rich-text font sizing remains template-derived rather than hard-coded to Tailwind's browser `14px`.

## Open Decisions

No open decisions remain. The approved behavior is to use Tailwind Typography spacing ratios derived from the resume template body font size.
