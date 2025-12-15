# Netlify Deployment Guide

## Quick Start

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Connect to Netlify:**
   - Go to [Netlify](https://app.netlify.com)
   - Click "New site from Git"
   - Select your repository
   - Configure build settings:
     - **Build command:** (leave empty)
     - **Publish directory:** `public`
     - **Functions directory:** `netlify/functions`

3. **Deploy:**
   - Click "Deploy site"
   - Your site will be live at `https://your-site-name.netlify.app`

## Important Notes

### Function Limitations

- **Stateless Functions:** Netlify Functions are stateless and isolated. Each invocation has its own memory space.
- **Timeout Limits:** 
  - Free tier: 10 seconds
  - Pro tier: 26 seconds
  - Enterprise: 50 seconds
- **Cancellation:** The cancel function won't work across function invocations due to stateless nature. Cancellation is handled client-side by stopping the polling interval.

### For Large Sitemaps

If you have very large sitemaps (>1000 URLs), consider:
1. Processing URLs in smaller batches
2. Using a database to store progress (instead of in-memory)
3. Implementing pagination or chunking

### Environment Variables

You can set environment variables in Netlify:
- Go to Site settings → Environment variables
- Add any needed variables

## Local Testing

Test locally with Netlify Dev:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run locally
netlify dev
```

This will start:
- Frontend at `http://localhost:8888`
- Functions at `http://localhost:8888/.netlify/functions/`

## Troubleshooting

### Functions timeout
- Reduce `MAX_WORKERS` in the function files
- Process URLs in smaller batches
- Consider upgrading to Pro tier for longer timeouts

### CORS issues
- CORS headers are already configured in the functions
- If issues persist, check Netlify's CORS settings

### Functions not found
- Ensure `netlify.toml` has correct functions directory
- Check that function files are in `netlify/functions/`
- Verify function names match the endpoint paths

