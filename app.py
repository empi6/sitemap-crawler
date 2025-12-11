import requests
import csv
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed

MAX_WORKERS = 50   # Increase or decrease depending on your needs

def fetch_sitemap_urls(sitemap_url):
    response = requests.get(sitemap_url)
    response.raise_for_status()

    root = ET.fromstring(response.text)
    namespace = {"ns": "http://www.sitemaps.org/schemas/sitemap/0.9"}

    return [loc.text.strip() for loc in root.findall(".//ns:loc", namespace)]


def check_url_status(url):
    try:
        response = requests.get(url, timeout=10)
        return url, response.status_code
    except requests.exceptions.RequestException:
        return url, "ERROR"


def run(sitemap_url, output_csv="sitemap_status.csv"):
    urls = fetch_sitemap_urls(sitemap_url)
    print(f"Found {len(urls)} URLs.")

    results = []

    # Run fast parallel requests
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_url = {executor.submit(check_url_status, url): url for url in urls}
        
        for i, future in enumerate(as_completed(future_to_url), 1):
            url, status = future.result()
            print(f"[{i}/{len(urls)}] {status} - {url}")
            results.append((url, status))

    # Write output CSV
    with open(output_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["URL", "StatusCode"])
        writer.writerows(results)

    print(f"\nDone! Saved to {output_csv}")


# Example:
run("https://www.thebestporn.com/sitemap2.xml")
