#!/usr/bin/env python3
"""Give a hand-built page the template's header and footer (static markup from tools/chrome/*.norm.html)."""
import re, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
hdr = open(os.path.join(ROOT, 'tools/chrome/header.norm.html')).read()
hdr_phone = open(os.path.join(ROOT, 'tools/chrome/header-phone.norm.html')).read()
ftr = open(os.path.join(ROOT, 'tools/chrome/footer.norm.html')).read()
menu = open(os.path.join(ROOT, 'tools/chrome/menu.norm.html')).read()
MENU_JS = '''<script>(function(){var btn=document.querySelector('[data-oteo-chrome-header] [data-framer-name="Menu"]'),panel=document.querySelector('[data-oteo-chrome-menu]');if(!btn||!panel)return;var open=false;function set(o){open=o;panel.style.display=o?'block':'none';document.documentElement.classList.toggle('oteo-menu-open',o);btn.setAttribute('aria-expanded',o?'true':'false');}btn.setAttribute('role','button');btn.setAttribute('tabindex','0');btn.setAttribute('aria-label','Menu');btn.addEventListener('click',function(e){e.preventDefault();set(!open);});btn.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();set(!open);}});var close=panel.querySelector('[data-framer-name="Close"],[data-framer-name="Menu"]');if(close)close.addEventListener('click',function(e){e.preventDefault();set(false);});panel.addEventListener('click',function(e){if(e.target.closest('a[href]'))set(false);});window.addEventListener('scroll',function(){document.documentElement.classList.toggle('oteo-scrolled',(window.pageYOffset||0)>60);},{passive:true});})();</script>'''
def inject(path):
    s = open(path, encoding='utf-8').read(); o = s
    header = '<div data-oteo-chrome-header class="framer-HYYn6 framer-nKpJp framer-5uyrZ framer-Yxc0r framer-yxbwub oteo-chrome"><div class="hidden-z4neyz">' + hdr + '</div><div class="hidden-kqp3m2 hidden-yxbwub">' + hdr_phone + '</div></div><div data-oteo-chrome-menu class="framer-HYYn6 framer-nKpJp framer-5uyrZ framer-Yxc0r framer-yxbwub oteo-chrome" style="display:none">' + menu + '</div>'
    footer = '<div data-oteo-chrome-footer class="framer-HYYn6 framer-nKpJp framer-5uyrZ framer-Yxc0r framer-yxbwub oteo-chrome">' + ftr + '</div>'
    s = re.sub(r'<header class="site-header">.*?</header>', header, s, count=1, flags=re.S)
    s = re.sub(r'<footer class="site-footer".*?</footer>', footer + MENU_JS, s, count=1, flags=re.S)
    if 'oteo-chrome.css' not in s: s = s.replace('</head>', '<link rel="stylesheet" href="/assets/oteo-chrome.css">\n</head>', 1)
    # mark the current page in the header
    slug = '/' + os.path.basename(path).replace('.html', '')
    open(path, 'w', encoding='utf-8').write(s); return s != o
if __name__ == '__main__':
    for p in sys.argv[1:]: print(p, inject(p))
