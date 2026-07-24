# Linear Regression Analysis - Quarto Book

This is the Quarto version of the Linear Regression Analysis course reader for POL 682.

## About

This book provides a comprehensive overview of linear regression techniques, including simple and multiple linear regression, with practical examples and visualizations.

## Building the Book

### Prerequisites

- [Quarto](https://quarto.org/docs/get-started/) (version 1.3 or higher)
- R (version 4.0 or higher)
- Required R packages (will be installed automatically when rendering)

### Rendering the Book

To render the entire book:

```bash
quarto render
```

To preview the book with live reload:

```bash
quarto preview
```

To render to a specific format:

```bash
quarto render --to html
quarto render --to pdf
quarto render --to epub
```

### Output

The rendered book will be in the `_book/` directory.

## Structure

- `index.qmd` - Introduction and overview
- `01-simple-regression.qmd` - Understanding linear regression basics
- `02-multiple-regression.qmd` - Ordinary Least Squares derivation
- `03-diagnostics.qmd` - Model diagnostics and assumption checking
- `04-applications.qmd` - Real-world applications and case studies
- `_quarto.yml` - Book configuration file
- `data/` - Data files for examples
- `style.css` - Custom styling

## Converting from Bookdown

This Quarto book was converted from a bookdown project. Key differences:

1. **File extension**: Changed from `.Rmd` to `.qmd`
2. **Configuration**: Single `_quarto.yml` instead of `_bookdown.yml` and `_output.yml`
3. **YAML header**: Simplified headers in chapter files
4. **Code chunks**: Mostly compatible, but Quarto offers enhanced features

## Differences Between Bookdown and Quarto

### Advantages of Quarto:
- Unified configuration file
- Better support for multiple output formats
- Built-in support for Observable JS, Julia, and Python
- Modern features like code annotation and tabsets
- Simpler syntax for cross-references
- Better integration with VS Code and other editors

### Features:
- All R code from the bookdown version is preserved
- Bibliography and citations work the same way
- Custom CSS styling is maintained
- Data files are identical

## Author

Christopher Weber, PhD

## License

Course materials for POL 682.
