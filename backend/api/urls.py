# api/urls.py
from django.urls import path, include

urlpatterns = [
    path('auth/', include('users.auth_urls')),  # Separate auth-related URLs
    path('users/', include('users.urls')),      # User resource URLs
]