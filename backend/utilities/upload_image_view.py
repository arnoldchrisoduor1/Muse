from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from utilities.aws_s3 import S3Handler
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_image_upload_url(request):
    """Get a presigned URL for uploading an image to S3"""
    logger.info(f"Image upload URL requested by user: {request.user.username}")
    
    content_type = request.query_params.get('content_type', 'image/jpeg')
    
    try:
        s3_handler = S3Handler()
        url_info = s3_handler.generate_presigned_url(content_type=content_type)
        
        return Response({
            'uploadURL': url_info['upload_url'],
            'objectURL': url_info['object_url']
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error generating image upload URL: {str(e)}")
        return Response(
            {"errors": {"server": "An error occurred while generating image upload URL"}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_avatar(request):
    """Update user's avatar URL"""
    logger.info(f"Avatar update requested for user: {request.user.username}")
    
    try:
        avatar_url = request.data.get('avatar_url')
        
        if not avatar_url:
            return Response(
                {"errors": {"avatar_url": "Avatar URL is required"}},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Ensure profile exists
        if not hasattr(request.user, 'profile'):
            from users.models import Profile
            Profile.objects.create(user=request.user)
            logger.info(f"Created missing profile for user: {request.user.username}")
        
        # Update the avatar URL
        profile = request.user.profile
        profile.avatar_url = avatar_url
        profile.save()
        
        from users.serializers import UserSerializer
        return Response(UserSerializer.serialize(request.user), status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error updating avatar for {request.user.username}: {str(e)}")
        return Response(
            {"errors": {"server": "An error occurred while updating avatar"}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )