from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permissions to only allow users to edit objects
    Other users can only read
    """
    def has_permissions(self, request, view):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # write permissions are only allowed to admin users
        return request.user and request.user.is_staff
    
class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request.
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner.
        return obj.user == request
