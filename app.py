from flask import Flask, render_template, request, jsonify, Response
import requests
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import time
import json

app = Flask(__name__)
MAX_WORKERS = 50   # Increase or decrease depending on your needs

# Store active executors for cancellation
active_executors = {}
executor_lock = threading.Lock()

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


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/check', methods=['POST'])
def check_sitemap():
    sitemap_url = request.json.get('url')
    request_id = request.json.get('request_id', str(time.time()))
    client_side = request.json.get('client_side', False)
    
    if not sitemap_url:
        return jsonify({'error': 'URL is required'}), 400
    
    # If client-side mode, just return the URLs list
    if client_side:
        try:
            urls = fetch_sitemap_urls(sitemap_url)
            return jsonify({
                'urls': urls,
                'total': len(urls),
                'request_id': request_id
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    def generate():
        try:
            urls = fetch_sitemap_urls(sitemap_url)
            cancelled = threading.Event()
            
            # Store cancellation event
            with executor_lock:
                active_executors[request_id] = cancelled
            
            # Send initial message with total count
            yield f"data: {json.dumps({'type': 'start', 'total': len(urls)})}\n\n"
            
            completed_count = 0
            
            # Run fast parallel requests
            with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
                future_to_url = {executor.submit(check_url_status, url): url for url in urls}
                
                for future in as_completed(future_to_url):
                    # Check for cancellation
                    if cancelled.is_set():
                        yield f"data: {json.dumps({'type': 'cancelled'})}\n\n"
                        break
                    
                    try:
                        url, status = future.result(timeout=0.1)
                        completed_count += 1
                        # Send result immediately
                        yield f"data: {json.dumps({'type': 'result', 'url': url, 'status': status, 'completed': completed_count, 'total': len(urls)})}\n\n"
                    except Exception:
                        # Skip cancelled or failed futures
                        pass
                
                # Cancel remaining futures if cancellation occurred
                if cancelled.is_set():
                    for f in future_to_url:
                        if not f.done():
                            f.cancel()
                    
                    # Send remaining URLs that weren't completed
                    for future, url in future_to_url.items():
                        if not future.done():
                            completed_count += 1
                            yield f"data: {json.dumps({'type': 'result', 'url': url, 'status': 'CANCELLED', 'completed': completed_count, 'total': len(urls)})}\n\n"
            
            # Send completion message
            yield f"data: {json.dumps({'type': 'complete', 'total': completed_count, 'cancelled': cancelled.is_set()})}\n\n"
        
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        finally:
            # Clean up
            with executor_lock:
                active_executors.pop(request_id, None)
    
    return Response(generate(), mimetype='text/event-stream')


@app.route('/cancel', methods=['POST'])
def cancel_check():
    request_id = request.json.get('request_id')
    
    if not request_id:
        return jsonify({'error': 'Request ID is required'}), 400
    
    with executor_lock:
        if request_id in active_executors:
            active_executors[request_id].set()
            return jsonify({'success': True, 'message': 'Cancellation requested'})
        else:
            return jsonify({'success': False, 'message': 'Request not found'}), 404


if __name__ == '__main__':
    app.run(debug=True)
