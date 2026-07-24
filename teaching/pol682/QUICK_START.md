# Quick Start Guide

## What Was Done

Your bookdown project has been successfully converted to Quarto! All files are now in the `quarto-book/` directory.

## Directory Structure

```
quarto-book/
├── _quarto.yml              # Main configuration (replaces _bookdown.yml + _output.yml)
├── index.qmd                # Introduction chapter
├── 01-simple-regression.qmd # Chapter 1
├── 02-multiple-regression.qmd # Chapter 2
├── 03-diagnostics.qmd       # Chapter 3
├── 04-applications.qmd      # Chapter 4
├── book.bib                 # Bibliography
├── packages.bib             # Package citations
├── style.css                # Custom styling
├── spotify_data.csv         # Spotify dataset
├── data/                    # Data directory
│   ├── academic_data.csv
│   ├── housing_data.csv
│   ├── multiple_data.csv
│   ├── sales_data.csv
│   └── sample_data.csv
└── README.md                # Documentation
```

## How to Build Your Quarto Book

### Option 1: Command Line

```bash
cd quarto-book
quarto preview    # Preview with live reload
quarto render     # Build the complete book
```

### Option 2: VS Code

1. Open the `quarto-book` folder in VS Code
2. Open any `.qmd` file
3. Click the "Preview" button in the editor toolbar
4. Or use Command Palette: "Quarto: Preview"

### Option 3: RStudio

1. Open `quarto-book` folder in RStudio
2. Open `index.qmd` or any chapter file
3. Click "Render" button
4. Or in Console: `quarto::quarto_preview()`

## Key Changes from Bookdown

1. **File extension**: `.Rmd` → `.qmd` (content is the same)
2. **Config files**: Single `_quarto.yml` instead of two separate config files
3. **Chapters**: Automatically detected by file naming convention
4. **Output**: Supports HTML, PDF, and EPUB out of the box

## What's Compatible

✅ All R code chunks work exactly the same
✅ Bibliography and citations
✅ Math equations (LaTeX)
✅ Cross-references
✅ Custom CSS
✅ Data files and assets

## Testing Your Book

To quickly test if everything works:

```bash
cd quarto-book
quarto render index.qmd
```

This will render just the introduction. If successful, render the full book:

```bash
quarto render
```

## Output Location

Rendered files will be in `quarto-book/_book/`

## Need Help?

- Quarto Documentation: https://quarto.org/docs/books/
- Quarto Gallery: https://quarto.org/docs/gallery/
- Bookdown to Quarto Migration: https://quarto.org/docs/books/book-crossrefs.html

## Next Steps

1. Preview the book: `cd quarto-book && quarto preview`
2. Make any desired customizations to `_quarto.yml`
3. Render the full book: `quarto render`
4. Check output in `_book/` directory

Enjoy your Quarto book! 📚✨
