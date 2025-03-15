from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from .views import token_obtain_pair, token_refresh

urlpatterns = [
    path('token/', csrf_exempt(token_obtain_pair), name='token_obtain_pair'),
    path('token/refresh/', csrf_exempt(token_refresh), name='token_refresh'),
]
