# Sitemap Crawler

A Python tool that crawls a sitemap XML file, checks the HTTP status of each URL, and exports the results to a CSV file. Uses parallel processing for fast execution.

## Installation

1. **Clone or download this repository:**
   ```bash
   git clone <repository-url>
   cd sitemap-crawler
   ```

2. **Install required dependencies:**
   ```bash
   pip install requests
   ```

   Or if you prefer using a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install requests
   ```

## Usage

1. **Open `app.py` and modify the sitemap URL:**
   ```python
   run("https://example.com/sitemap.xml")
   ```

2. **Run the script:**
   ```bash
   python app.py
   ```

3. **Check the output:**
   The script will create a CSV file (default: `sitemap_status.csv`) containing:
   - URL: The checked URL
   - StatusCode: HTTP status code (e.g., 200, 404) or "ERROR" if the request failed

## Customization

- **Change output filename:** Modify the `output_csv` parameter in the `run()` function:
  ```python
  run("https://example.com/sitemap.xml", output_csv="my_results.csv")
  ```

- **Adjust parallel workers:** Modify `MAX_WORKERS` at the top of `app.py` (default: 50)

## Requirements

- Python 3.x
- requests library

