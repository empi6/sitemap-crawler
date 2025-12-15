# Sitemap Crawler

A web application that crawls a sitemap XML file, checks the HTTP status of each URL found in `<loc></loc>` tags, and displays the results on the page. Uses parallel processing for fast execution.

## Installation

1. **Clone or download this repository:**
   ```bash
   git clone <repository-url>
   cd sitemap-crawler
   ```

2. **Install required dependencies:**
   ```bash
   pip install flask requests
   ```

   Or if you prefer using a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install flask requests
   ```

## Usage

1. **Start the web server:**
   ```bash
   python app.py
   ```

2. **Open your browser and navigate to:**
   ```
   http://localhost:5000
   ```

3. **Enter a sitemap URL** in the input field (e.g., `https://example.com/sitemap.xml`)

4. **Click "Check Sitemap"** and wait for the results

5. **View the results** - Each URL from the sitemap will be displayed with its HTTP status code:
   - **Green (200-299)**: Success
   - **Yellow (300-399)**: Redirect
   - **Red (400-499)**: Client Error
   - **Red (500-599)**: Server Error
   - **Red (ERROR)**: Request failed

## How It Works

The application:
1. Fetches the sitemap XML from the provided URL
2. Parses the XML to extract all URLs inside `<loc></loc>` tags
3. Checks each URL's HTTP status code in parallel (up to 50 concurrent requests)
4. Displays all URLs and their status codes in a table on the page

## Customization

- **Adjust parallel workers:** Modify `MAX_WORKERS` at the top of `app.py` (default: 50)

## Requirements

- Python 3.x
- Flask
- requests library

