from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .serializers import ProfileSerializer, UserSerializer, UserProfileSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.views.decorators.csrf import csrf_exempt
import logging
import traceback

logger = logging.getLogger(__name__)
User = get_user_model()

@api_view(['POST'])
@csrf_exempt
@permission_classes([AllowAny])
def token_obtain_pair(request):
    logger.info("Login attempt")
    username = request.data.get("username")
    password = request.data.get("password")
    
    if not username or not password:
        logger.warning("Login failed: Missing credentials")
        return Response(
            {"errors": {"credentials": "Both username and password are required"}}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = authenticate(username=username, password=password)
        if user is None:
            logger.warning(f"Login failed: Invalid credentials for username: {username}")
            return Response(
                {"errors": {"credentials": "Invalid username or password"}}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        refresh = RefreshToken.for_user(user)
        logger.info(f"Login successful: {username}")
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserSerializer.serialize(user)
        })
    except Exception as e:
        logger.error(f"Login error: {str(e)}\n{traceback.format_exc()}")
        return Response(
            {"errors": {"server": "An unexpected error occurred"}}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@csrf_exempt
@permission_classes([AllowAny])
def token_refresh(request):
    logger.info("Token refresh attempt")
    refresh_token = request.data.get("refresh")
    
    if not refresh_token:
        logger.warning("Token refresh failed: Missing refresh token")
        return Response(
            {"errors": {"refresh": "Refresh token is required"}}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        refresh = RefreshToken(refresh_token)
        logger.info("Token refresh successful")
        return Response({
            "access": str(refresh.access_token)
        })
    except Exception as e:
        logger.warning(f"Token refresh failed: {str(e)}")
        return Response(
            {"errors": {"refresh": "Invalid refresh token"}}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
        
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Get the currently authenticated user's details"""
    logger.info(f"Current user info requested: {request.user.username}")
    try:
        return Response(UserSerializer.serialize(request.user, include_stats=True), status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error fetching current user info: {str(e)}\n{traceback.format_exc()}")
        return Response(
            {"errors": {"server": "An error occurred while fetching user information"}}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        


@api_view(['GET', 'POST'])
@csrf_exempt
@permission_classes([AllowAny])
def user_list_create(request):
    if request.method == 'GET':
        logger.info("User list requested")
        try:
            users = User.objects.all()
            serialized_users = [UserSerializer.serialize(user) for user in users]
            return Response(serialized_users, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching users: {str(e)}\n{traceback.format_exc()}")
            return Response(
                {"errors": {"server": "An error occurred while fetching users"}}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    if request.method == 'POST':
        logger.info("User creation requested")
        try:
            user_data = request.data
            serialized_data = UserSerializer.create(user_data)
            if serialized_data.get('errors'):
                return Response(
                    {"errors": serialized_data['errors']}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response(serialized_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}\n{traceback.format_exc()}")
            return Response(
                {"errors": {"server": "An error occurred while creating user"}}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
@api_view(['GET'])
@permission_classes([AllowAny])
def user_detail_public(request, pk):
    try:
        user = User.objects.get(pk=pk)
        logger.info(f"User detail requested: {user.username}")
        return Response(UserSerializer.serialize(user), status=status.HTTP_200_OK)
    except User.DoesNotExist:
        logger.warning(f"User not found: ID {pk}")
        return Response(
            {'errors': {'user': 'User not found'}}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET', 'PUT', 'DELETE'])
@csrf_exempt
def user_detail(request, pk):
    # For GET requests, explicitly use AllowAny permission
    if request.method == 'GET':
        try:
            user = User.objects.get(pk=pk)
            logger.info(f"User detail requested: {user.username}")
            return Response(UserSerializer.serialize(user), status=status.HTTP_200_OK)
        except User.DoesNotExist:
            logger.warning(f"User not found: ID {pk}")
            return Response(
                {'errors': {'user': 'User not found'}}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    # For PUT and DELETE requests, require authentication
    if not request.user.is_authenticated:
        return Response(
            {'errors': {'authentication': 'Authentication required'}}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        logger.warning(f"User not found: ID {pk}")
        return Response(
            {'errors': {'user': 'User not found'}}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Permission check - users can only modify their own data unless they're staff
    if request.method in ['PUT', 'DELETE'] and user != request.user and not request.user.is_staff:
        logger.warning(f"Permission denied: User {request.user.username} attempted to modify user {user.username}")
        return Response(
            {'errors': {'permission': 'You do not have permission to modify this user'}},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'PUT':
        logger.info(f"User update requested: {user.username}")
        try:
            serialized_data = UserSerializer.serialize(instance=user, data=request.data)
            if serialized_data.get('errors'):
                return Response(
                    {"errors": serialized_data['errors']}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response(serialized_data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error updating user {user.username}: {str(e)}\n{traceback.format_exc()}")
            return Response(
                {"errors": {"server": "An error occurred while updating user"}}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    if request.method == 'DELETE':
        try:
            username = user.username
            user.delete()
            logger.info(f"User deleted: {username}")
            return Response({'message': 'User deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error deleting user {user.username}: {str(e)}\n{traceback.format_exc()}")
            return Response(
                {"errors": {"server": "An error occurred while deleting user"}}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['POST'])
@csrf_exempt
@permission_classes([IsAuthenticated])
def password_change(request):
    logger.info(f"Password change requested for user: {request.user.username}")
    try:
        result = UserSerializer.change_password(request.user, request.data)
        if result.get('errors'):
            return Response(
                {"errors": result['errors']}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error changing password for {request.user.username}: {str(e)}\n{traceback.format_exc()}")
        return Response(
            {"errors": {"server": "An error occurred while changing password"}}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
        
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Get the currently authenticated user's details"""
    logger.info(f"Current user info requested: {request.user.username}")
    try:
        return Response(UserSerializer.serialize(request.user, include_stats=True), status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error fetching current user info: {str(e)}\n{traceback.format_exc()}")
        return Response(
            {"errors": {"server": "An error occurred while fetching user information"}}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    """Update both user and profile information in a single request"""
    logger.info(f"User and profile update requested for user: {request.user.username}")
    
    try:
        # Ensure profile exists
        if not hasattr(request.user, 'profile'):
            from .models import Profile
            Profile.objects.create(user=request.user)
            logger.info(f"Created missing profile for user: {request.user.username}")
        
        serializer = UserProfileSerializer(data=request.data)
        if serializer.is_valid():
            serializer.update(request.user, serializer.validated_data)
            
            # Return updated user data
            return Response(UserSerializer.serialize(request.user), status=status.HTTP_200_OK)
        else:
            return Response(
                {"errors": serializer.errors}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        logger.error(f"Error updating user and profile for {request.user.username}: {str(e)}\n{traceback.format_exc()}")
        return Response(
            {"errors": {"server": "An error occurred while updating user and profile"}}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_stats(request):
    """Get poetry stats for the authenticated user"""
    logger.info(f"Stats requested for user: {request.user.username}")
    try:
        stats = UserSerializer.get_user_stats(request.user)
        return Response(stats, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error fetching stats for {request.user.username}: {str(e)}\n{traceback.format_exc()}")
        return Response(
            {"errors": {"server": "An error occurred while fetching user stats"}}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )