from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Profile
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class ProfileSerializer:
    @staticmethod
    def serialize(instance=None, data=None):
        if instance is None:
            instance = Profile()
        
        updated = False
        if data is not None:
            if 'avatar' in data:
                instance.avatar = data.get('avatar')
                updated = True
            if 'bio' in data:
                instance.bio = data.get('bio')
                updated = True
        
        if updated and instance.pk:
            try:
                instance.save()
                logger.info(f"Profile updated: {instance.user.username}")
            except Exception as e:
                logger.error(f"Failed to update profile for {instance.user.username}: {str(e)}")
                return {'errors': {'profile': str(e)}}
        
        return {
            'avatar': instance.avatar.url if instance.avatar else None,
            'bio': instance.bio,
            'create_at': instance.create_at if instance.pk else None,
            'updated_at': instance.updated_at if instance.pk else None,
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
        
        return {
            'id': instance.id if instance.pk else None,
            'username': instance.username,
            'email': instance.email,
            'first_name': instance.first_name,
            'last_name': instance.last_name,
            'profile': profile_data,
            'is_active': instance.is_active,
        }

    @staticmethod
    def create(data):
        logger.info(f"Attempting to create user: {data.get('username')}")
        errors = {}
        
        # Validate required fields
        for field in ['username', 'email', 'password', 'password_confirm']:
            if not data.get(field):
                errors[field] = f"{field.replace('_', ' ').title()} is required."
        
        # Check if passwords match
        if data.get('password') != data.get('password_confirm'):
            errors['password'] = "Password fields didn't match."
        
        # Check if username already exists
        if 'username' not in errors and User.objects.filter(username=data.get('username')).exists():
            errors['username'] = "Username already exists."
        
        # Check if email already exists
        if 'email' not in errors and User.objects.filter(email=data.get('email')).exists():
            errors['email'] = "Email already exists."
        
        if errors:
            logger.warning(f"User creation failed for {data.get('username')}: {errors}")
            return {'errors': errors}
        
        try:
            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password'],
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
            )
            
            Profile.objects.create(user=user)
            logger.info(f"User created successfully: {user.username} (ID: {user.pk})")
            return UserSerializer.serialize(user)
        except Exception as e:
            logger.error(f"Unexpected error creating user {data.get('username')}: {str(e)}")
            return {'errors': {'server': str(e)}}

    @staticmethod
    def change_password(user, data):
        logger.info(f"Password change attempt for user: {user.username}")
        errors = {}
        
        # Validate current password
        if not data.get('current_password'):
            errors['current_password'] = "Current password is required."
        elif not user.check_password(data.get('current_password')):
            errors['current_password'] = "Current password is incorrect."
        
        # Validate new passwords
        if not data.get('new_password'):
            errors['new_password'] = "New password is required."
        
        if not data.get('new_password_confirm'):
            errors['new_password_confirm'] = "Password confirmation is required."
        
        if data.get('new_password') != data.get('new_password_confirm'):
            errors['new_password'] = "New password fields didn't match."
        
        if errors:
            logger.warning(f"Password change failed for {user.username}: {errors}")
            return {'errors': errors}
        
        try:
            user.set_password(data['new_password'])
            user.save()
            logger.info(f"Password changed successfully for {user.username}")
            return {'success': 'Password updated successfully'}
        except Exception as e:
            logger.error(f"Unexpected error changing password for {user.username}: {str(e)}")
            return {'errors': {'server': str(e)}}