# In users/urls.py
from django.urls import include
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.views import TokenRefreshView
from .views import MyTokenObtainPairView, UserViewSet, ProfileUpdateView
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register('', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('token/', csrf_exempt(MyTokenObtainPairView.as_view()), name='token_obtain_pair'),
    path('token/refresh/', csrf_exempt(TokenRefreshView.as_view()), name='token_refresh'),
    path('profile/', ProfileUpdateView.as_view(), name='profile_update')
]