from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Profile

User = get_user_model()

class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile data"""
    
    class Meta:
        model = Profile
        fields = ['avatar', 'bio', 'create_at', 'updated_at']
        read_only_fields = ['create_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user objects"""
    profile = ProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile', 'is_active']
        read_only_fields = ['id', 'is_active']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating user objects"""
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        
        # Create an empty profile for the user
        Profile.objects.create(user=user)
        
        return user


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change endpoint"""
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs