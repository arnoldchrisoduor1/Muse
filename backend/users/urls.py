from django.urls import path
from . import views
from utilities.upload_image_view import get_image_upload_url, update_avatar


urlpatterns = [
    path('users/', views.user_list_create, name='user-list-create'),
    path('users/<int:pk>/', views.user_detail, name='user-detail'),
    path('users/public/<int:pk>/', views.user_detail_public, name='user-detail'),
    path('users/me/', views.current_user, name='current-user'),
    path('users/me/profile/', views.update_user_profile, name='update-user-profile'),
    path('users/me/password/', views.password_change, name='password-change'),
    path('users/stats/', views.user_stats, name='user_stats'),
    
    path('users/image-url/', get_image_upload_url, name='get_image_upload_url'),
    path('users/me/avatar/', update_avatar, name='update_avatar'),
    
    # User stats
    path('users/me/stats/', views.user_stats, name='user_stats'),
]