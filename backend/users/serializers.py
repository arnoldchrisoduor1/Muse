from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import Profile
import logging
import traceback
from django.apps import apps

logger = logging.getLogger(__name__)
User = get_user_model()

class ProfileSerializer:
    @staticmethod
    def serialize(profile):
        """Serialize Profile objects"""
        return {
            'avatar_url': profile.avatar_url,
            'bio': profile.bio,
            'create_at': profile.create_at.strftime('%Y-%m-%d') if profile.create_at else None,
            'updated_at': profile.updated_at.strftime('%Y-%m-%d %H:%M:%S') if profile.updated_at else None
        }

class UserSerializer:
    @staticmethod
    def serialize(instance=None, data=None):
        if instance is None:
            instance = User()
        
        updated = False
        if data is not None:
            if 'username' in data:
                instance.username = data.get('username')
                updated = True
            if 'email' in data:
                instance.email = data.get('email')
                updated = True
            if 'first_name' in data:
                instance.first_name = data.get('first_name')
                updated = True
            if 'last_name' in data:
                instance.last_name = data.get('last_name')
                updated = True
        
        if updated and instance.pk:
            try:
                instance.save()
                logger.info(f"User updated: {instance.username}")
            except Exception as e:
                logger.error(f"Failed to update user {instance.username}: {str(e)}")
                return {'errors': {'user': str(e)}}
        
        # Handle cases where profile might not exist yet
        profile_data = None
        if hasattr(instance, 'profile') and instance.profile:
            profile_data = ProfileSerializer.serialize(instance.profile)
        
        result = {
            'id': instance.id if instance.pk else None,
            'username': instance.username,
            'email': instance.email,
            'first_name': instance.first_name,
            'last_name': instance.last_name,
            'profile': profile_data,
            'is_active': instance.is_active,
        }
        
        # Always include stats
        result['stats'] = UserSerializer.get_user_stats(instance)
        
        return result

    
    @staticmethod
    def create(data):
        """Create a new user"""
        try:
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            password_confirm = data.get('password_confirm')
            
            # Validate required fields
            errors = {}
            if not username:
                errors['username'] = 'Username is required'
            if not email:
                errors['email'] = 'Email is required'
            if not password:
                errors['password'] = 'Password is required'
            if password != password_confirm:
                errors['password_confirm'] = 'Passwords do not match'
            
            # Check if username or email already exists
            if User.objects.filter(username=username).exists():
                errors['username'] = 'Username already exists'
            if User.objects.filter(email=email).exists():
                errors['email'] = 'Email already exists'
            
            # Validate password strength
            if password:
                try:
                    validate_password(password)
                except ValidationError as e:
                    errors['password'] = list(e.messages)
            
            if errors:
                return {'errors': errors}
            
            # Create user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )
            
            # Profile will be created automatically through the User.save() method
            
            logger.info(f"User created: {user.username} (ID: {user.id})")
            return UserSerializer.serialize(user)
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}\n{traceback.format_exc()}")
            raise
    
    @staticmethod
    def update(instance, data):
        """Update user details"""
        try:
            # Update basic user fields
            if 'first_name' in data:
                instance.first_name = data['first_name']
            if 'last_name' in data:
                instance.last_name = data['last_name']
            if 'email' in data:
                instance.email = data['email']
            
            instance.save()
            
            # Update profile if provided
            if 'profile' in data and isinstance(data['profile'], dict):
                profile = instance.profile
                profile_data = data['profile']
                
                if 'bio' in profile_data:
                    profile.bio = profile_data['bio']
                if 'avatar_url' in profile_data:
                    profile.avatar_url = profile_data['avatar_url']
                
                profile.save()
            
            logger.info(f"User updated: {instance.username} (ID: {instance.id})")
            return UserSerializer.serialize(instance)
        except Exception as e:
            logger.error(f"Error updating user {instance.username}: {str(e)}\n{traceback.format_exc()}")
            raise
    
    @staticmethod
    def change_password(user, data):
        """Change user password"""
        try:
            current_password = data.get('current_password')
            new_password = data.get('new_password')
            confirm_password = data.get('confirm_password')
            
            errors = {}
            
            # Validate inputs
            if not current_password:
                errors['current_password'] = 'Current password is required'
            elif not user.check_password(current_password):
                errors['current_password'] = 'Current password is incorrect'
            
            if not new_password:
                errors['new_password'] = 'New password is required'
            
            if new_password != confirm_password:
                errors['confirm_password'] = 'Passwords do not match'
            
            # Validate password strength
            if new_password:
                try:
                    validate_password(new_password, user=user)
                except ValidationError as e:
                    errors['new_password'] = list(e.messages)
            
            if errors:
                return {'errors': errors}
            
            # Change password
            user.set_password(new_password)
            user.save()
            
            logger.info(f"Password changed for user: {user.username} (ID: {user.id})")
            return {'message': 'Password changed successfully'}
        except Exception as e:
            logger.error(f"Error changing password for {user.username}: {str(e)}\n{traceback.format_exc()}")
            raise
    
    @staticmethod
    def get_user_stats(user):
        """Get poetry stats for a user"""
        # Dynamically import models from the other app
        Poem = apps.get_model('poetry', 'Poem')  # Replace 'poetry_app' with the actual app name
        Like = apps.get_model('poetry', 'Like')  # Replace 'poetry_app' with the actual app name
        
        # Count poems by this user
        poem_count = Poem.objects.filter(user=user).count()
        
        # Count total likes on all poems by this user
        total_likes = Like.objects.filter(
            content_type='poem',
            poem__user=user
        ).count()
        
        return {
            'poem_count': poem_count,
            'total_likes': total_likes
        }
class UserProfileSerializer(serializers.Serializer):
    """Serializer for updating user and profile data together"""
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    bio = serializers.CharField(max_length=500, required=False, allow_blank=True)
    avatar_url = serializers.URLField(max_length=500, required=False, allow_null=True)
    
    def update(self, instance, validated_data):
        # Update user fields
        if 'first_name' in validated_data:
            instance.first_name = validated_data['first_name']
        if 'last_name' in validated_data:
            instance.last_name = validated_data['last_name']
        
        instance.save()
        
        # Update profile fields
        profile = instance.profile
        if 'bio' in validated_data:
            profile.bio = validated_data['bio']
        if 'avatar_url' in validated_data:
            profile.avatar_url = validated_data['avatar_url']
        
        profile.save()
        
        return instance