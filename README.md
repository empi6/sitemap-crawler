# Sitemap Crawler

A web application that crawls a sitemap XML file, checks the HTTP status of each URL found in `<loc></loc>` tags, and displays the results on the page. Uses parallel processing for fast execution.

## Local Development

### Option 1: Flask (Original)

1. **Install required dependencies:**
   ```bash
   pip install flask requests
   ```

2. **Run the Flask server:**
   ```bash
   python app.py
   ```

3. **Open your browser:**
   ```
   http://localhost:5000
   ```

### Option 2: Netlify Dev (For Netlify Deployment)

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Run Netlify Dev:**
   ```bash
   netlify dev
   ```

3. **Open your browser:**
   ```
   http://localhost:8888
   ```

## Netlify Deployment

### Deploy to Netlify

1. **Connect your repository to Netlify:**
   - Go to [Netlify](https://app.netlify.com)
   - Click "New site from Git"
   - Connect your repository

2. **Build settings:**
   - Build command: (leave empty or use `echo 'No build step'`)
   - Publish directory: `public`
   - Functions directory: `netlify/functions`

3. **Deploy:**
   - Netlify will automatically deploy when you push to your repository
   - Or click "Deploy site" to deploy immediately

### Manual Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

## How It Works

The application:
1. Fetches the sitemap XML from the provided URL
2. Parses the XML to extract all URLs inside `<loc></loc>` tags
3. Checks each URL's HTTP status code in parallel (up to 50 concurrent requests)
4. Displays all URLs and their status codes in a table on the page

## Features

- **Real-time updates**: Results appear as they're processed
- **Progress tracking**: Shows how many URLs have been checked
- **Stop button**: Cancel processing at any time
- **Status codes**: Color-coded status indicators
  - Green (200-299): Success
  - Yellow (300-399): Redirect
  - Red (400-499): Client Error
  - Red (500-599): Server Error
  - Red (ERROR): Request failed

## Project Structure

```
sitemap-crawler/
├── app.py                 # Flask application (for local dev)
├── netlify.toml           # Netlify configuration
├── package.json           # Node.js dependencies
├── public/                # Static files (served by Netlify)
│   └── index.html         # Frontend HTML
└── netlify/
    └── functions/         # Netlify serverless functions
        ├── check-stream.js # Main crawl function
        └── cancel.js      # Cancel function
```

## Requirements

- **For Flask**: Python 3.x, Flask, requests
- **For Netlify**: Node.js (for Netlify Functions)

## Customization

- **Adjust parallel workers:** Modify `MAX_WORKERS` in the function files (default: 50)

## Notes

- Netlify Functions have timeout limits (10s free tier, 26s paid)
- For large sitemaps, consider processing in smaller batches
- The application uses polling for real-time updates on Netlify
