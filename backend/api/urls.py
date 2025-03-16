# api/urls.py
from django.urls import path, include

urlpatterns = [
    path('auth/', include('users.auth_urls')),
    path('users/', include('users.urls')),
    path('poems/', include('poetry.urls')),
    path('comments/', include('poetry.comments_urls')),
]