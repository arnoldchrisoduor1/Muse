from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    """Custom User model using the default username for authentication."""
    email = models.EmailField('email address', unique=True)
    
    # Revert to using the default username field for authentication
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']  # Email is required for creating users via createsuperuser
    
    def __str__(self):
        return self.username
    
class Profile(models.Model):
    """Extends the profile information for users."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='profiles/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    create_at = models.DateField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s profile"