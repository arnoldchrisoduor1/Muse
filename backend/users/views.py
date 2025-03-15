import logging
from django.contrib.auth import get_user_model
from rest_framework import viewsets, status, generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from .models import Profile
from .serializers import (
    UserSerializer, 
    UserCreateSerializer, 
    ProfileSerializer, 
    PasswordChangeSerializer
)
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

# Configure logger
logger = logging.getLogger(__name__)

User = get_user_model()

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Enhanced JWT token serializer with user details"""
    
    def validate(self, attrs):
        username = attrs.get('username', '')
        logger.info(f"Attempting token validation for user: {username}")
        
        try:
            data = super().validate(attrs)
            
            # Add custom claims
            data['username'] = self.user.username
            data['email'] = self.user.email
            data['user_id'] = self.user.id
            data['is_staff'] = self.user.is_staff
            
            logger.info(f"Token generated successfully for user: {username}")
            return data
            
        except Exception as e:
            logger.error(f"Token validation error for user '{username}': {str(e)}")
            raise

@method_decorator(csrf_exempt, name='dispatch')
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        username = request.data.get('username', 'unknown')
        logger.info(f"Authentication attempt for user: {username}")
        
        # Check if user exists
        try:
            user = User.objects.get(username=username)
            logger.info(f"User {username} found in database")
        except User.DoesNotExist:
            logger.error(f"User {username} not found in database")
            return Response(
                {"detail": "No active account found with the given credentials"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if password is correct
        if not user.check_password(request.data.get('password', '')):
            logger.error(f"Invalid password for user {username}")
            return Response(
                {"detail": "No active account found with the given credentials"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # If we get here, user exists and password is correct
        # Continue with normal token generation
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Token generation error: {str(e)}")
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserViewSet(viewsets.ModelViewSet):
    """Viewset for user operations with enhanced logging"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    http_method_names = ['get', 'post', 'patch', 'delete']
    
    def get_permissions(self):
        """Set custom permissions for different actions"""
        if self.action in ['list', 'retrieve']:  # Allow unauthenticated access to list and retrieve users
            permission_classes = [permissions.AllowAny]
        elif self.action == 'create':
            permission_classes = [permissions.AllowAny]
        elif self.action in ['me', 'update', 'partial_update', 'destroy', 'change_password']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAdminUser]
        return [permission() for permission in permission_classes]

    
    def get_serializer_class(self):
        """Return appropriate serializer class"""
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
    
    def get_queryset(self):
        """Filter queryset based on permissions"""
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)
    
    def create(self, request, *args, **kwargs):
        """Create a new user with enhanced logging"""
        logger.info("Attempting to create new user")
        
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            
            logger.info(f"User created successfully: {serializer.instance.username}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"User creation failed: {str(e)}")
            return Response(
                {"detail": "Failed to create user", "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Return the authenticated user"""
        logger.debug(f"User {request.user.username} requested profile data")
        
        try:
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error retrieving user profile for {request.user.username}: {str(e)}")
            return Response(
                {"detail": "Failed to retrieve profile", "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change user password with enhanced security and logging"""
        user = request.user
        logger.info(f"Password change attempt for user: {user.username}")
        
        serializer = PasswordChangeSerializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            
            # Check current password
            if not user.check_password(serializer.validated_data.get('current_password')):
                logger.warning(f"Password change failed for {user.username}: incorrect current password")
                return Response(
                    {"current_password": ["Wrong password."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set new password
            user.set_password(serializer.validated_data.get('new_password'))
            user.save()
            
            logger.info(f"Password changed successfully for user: {user.username}")
            return Response({"detail": "Password changed successfully"})
            
        except Exception as e:
            logger.error(f"Password change error for {user.username}: {str(e)}")
            return Response(
                {"detail": "Failed to change password", "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class ProfileUpdateView(generics.RetrieveUpdateAPIView):
    """View for retrieving and updating profile with better error handling"""
    serializer_class = ProfileSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_object(self):
        """Get profile for the requested user"""
        user_id = self.kwargs.get("pk")  # Get user ID from URL
        try:
            return Profile.objects.get(user_id=user_id)
        except Profile.DoesNotExist:
            logger.error(f"Profile not found for user ID: {user_id}")
            return None
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve user profile with error handling"""
        instance = self.get_object()
        if instance:
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        return Response(
            {"detail": "Profile not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    def update(self, request, *args, **kwargs):
        """Update user profile - still requires authentication"""
        self.permission_classes = [permissions.IsAuthenticated]  # Restrict updates to authenticated users
        return super().update(request, *args, **kwargs)