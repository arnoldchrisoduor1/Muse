from django.urls import path
from . import views

urlpatterns = [
    path('users/', views.user_list_create, name='user-list-create'),
    path('users/<int:pk>/', views.user_detail, name='user-detail'),
    path('users/me/', views.current_user, name='current-user'),
    path('users/me/profile/', views.update_profile, name='update-profile'),
    path('users/me/password/', views.password_change, name='password-change'),
]