from django.db import models
from django.contrib.auth.models import AbstractUser
import logging
import random

logger = logging.getLogger(__name__)

class User(AbstractUser):
    """Custom User model using the default username for authentication."""
    email = models.EmailField('email address', unique=True)
    
    # Revert to using the default username field for authentication
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']  # Email is required for creating users via createsuperuser
    
    def __str__(self):
        return self.username
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        try:
            super().save(*args, **kwargs)
            if is_new:
                logger.info(f"User created: {self.username} (ID: {self.pk})")
                # Create profile for new users
                if not hasattr(self, 'profile'):
                    Profile.objects.create(user=self)
            else:
                logger.info(f"User updated: {self.username} (ID: {self.pk})")
        except Exception as e:
            logger.error(f"Error saving user {self.username}: {str(e)}")
            raise

class Profile(models.Model):
    """Extends the profile information for users."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar_url = models.URLField(max_length=500, null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    create_at = models.DateField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s profile"
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        
        # Generate default avatar URL for new profiles
        if is_new and not self.avatar_url:
            
            self.avatar_url = f"https://robohash.org/{self.user.username}"
            
        try:
            super().save(*args, **kwargs)
            if is_new:
                logger.info(f"Profile created for user: {self.user.username} (ID: {self.user.pk})")
            else:
                logger.info(f"Profile updated for user: {self.user.username} (ID: {self.user.pk})")
        except Exception as e:
            logger.error(f"Error saving profile for {self.user.username}: {str(e)}")
            raise
        
# from users.models import Profile
# for profile in Profile.objects.all():
#     profile.avatar_url = f"https://robohash.org/{profile.user.username}"
#     profile.save()