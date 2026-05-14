# Resume

Handlebars + Puppeteer resume builder. Edit one JSON file, get HTML, PDF, and DOCX output.

## Setup

```bash
npm install
```

Requires [pandoc](https://pandoc.org/) for DOCX export:

```bash
brew install pandoc
```

## Usage

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with live reload |
| `npm run build` | Build HTML, PDF, and DOCX |
| `npm run pdf` | Build HTML + PDF only |
| `npm run docx` | Build HTML + DOCX only |

Output files are written to `dist/`.

## PII

Phone and email are kept in `resume.pii.json` (git-ignored) and merged into the build at runtime.

```json
{
  "contact": {
    "phone": "555-555-5555",
    "email": "you@example.com"
  }
}
```

Without this file the build still works — those fields just render empty.

## Data format

All resume content lives in `resume.json`. The top-level shape:

```json
{
  "name": "Your Name",
  "contact": {
    "location": "City, ST 00000"
  },
  "education": [...],
  "skills": [...],
  "experience": [...]
}
```

### `education`

Array of degree entries, rendered in order.

```json
{
  "degree": "Master of Science in Computer Science",
  "emphasis": "with a specialization in Interactive Intelligence",
  "school": "Georgia Institute of Technology",
  "gpa": "3.50",
  "graduated": "December 2019"
}
```

### `skills`

Array of labeled skill rows.

```json
{ "label": "Front End", "items": "TypeScript, React, HTML, CSS" }
```

### `experience`

Array of companies. Each company can have multiple `roles`, and each role has `bullets`. Bullets can optionally have `subbullets` (rendered as a nested list with `–` prefixes).

```json
{
  "company": "Acme Corp",
  "location": "Remote",
  "startDate": "January 2020",
  "endDate": "Present",
  "pageBreak": false,
  "roles": [
    {
      "title": "Senior Software Engineer",
      "suffix": "Remote",
      "bullets": [
        { "text": "Built things." },
        {
          "text": "Led a project.",
          "subbullets": ["Designed the schema.", "Wrote the migration."]
        }
      ]
    }
  ]
}
```

Set `"pageBreak": true` on an experience entry to force a page break before it in the PDF. A continuation header (name + "Page 2 of 2") is automatically inserted.

## Template

`template.html` is a [Handlebars](https://handlebarsjs.com/) template. It has access to every field in `resume.json` (merged with `resume.pii.json` at build time). The CSS is inlined in the `<style>` block — edit it there to change fonts, spacing, or layout. Print styles (`@media print`) control PDF margins and page size.
