from django.urls import path
from . import views

urlpatterns = [
    path('', views.comment_list, name='comment-list'),
    path('<uuid:pk>/', views.comment_detail, name='comment-detail'),
    path('<uuid:pk>/like/', views.comment_like, name='comment-like'),
    path('<uuid:pk>/replies/', views.comment_replies, name='comment-replies'),
]