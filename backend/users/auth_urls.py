from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from . import views

urlpatterns = [
    path('token/', views.token_obtain_pair, name='token_obtain_pair'),
    path('token/refresh/', views.token_refresh, name='token_refresh'),
]
