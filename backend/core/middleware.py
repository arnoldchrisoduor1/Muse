# In core/middleware.py
import re
from django.conf import settings
from django.urls import resolve

class CSRFExemptMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.csrf_exempt_views = getattr(settings, 'CSRF_EXEMPT_VIEWS', [])
        
    def __call__(self, request):
        view = resolve(request.path).func
        view_path = f"{view.__module__}.{view.__name__}"
        
        if view_path in self.csrf_exempt_views:
            setattr(request, '_dont_enforce_csrf_checks', True)
            
        return self.get_response(request)