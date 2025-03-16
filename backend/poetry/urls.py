from django.urls import path
from . import views

urlpatterns = [
    # Poem endpoints
    path('', views.poem_list, name='poem-list'),
    path('<str:slug>/', views.poem_detail, name='poem-detail'),
    path('<str:slug>/like/', views.poem_like, name='poem-like'),
    path('<str:slug>/comments/', views.poem_comments, name='poem-comments'),
]