#!/usr/bin/env python3
"""Local server for the site: extensionless routes map to .html, directories to index.html."""
import http.server, os, sys, urllib.parse
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def translate_path(self, path):
        path = urllib.parse.urlparse(path).path
        p = super().translate_path(path)
        if os.path.isdir(p): return os.path.join(p, 'index.html')
        if not os.path.exists(p) and os.path.exists(p + '.html'): return p + '.html'
        return p
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store'); super().end_headers()
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1]) if len(sys.argv) > 1 else 8765), H).serve_forever()
