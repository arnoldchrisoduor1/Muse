from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

def user_serializer(user_or_data, instance=None, many=False):
    if many:
        return [{"id": user.id, "username": user.username, "email": user.email} for user in user_or_data]
    
    if isinstance(user_or_data, User):
        return {"id": user_or_data.id, "username": user_or_data.username, "email": user_or_data.email}

    # Handle data for creation/update
    if isinstance(user_or_data, dict):
        errors = {}
        username = user_or_data.get("username")
        email = user_or_data.get("email")
        password = user_or_data.get("password")

        if not username:
            errors["username"] = "This field is required."
        if not email:
            errors["email"] = "This field is required."
        if not password and not instance:
            errors["password"] = "This field is required."

        if errors:
            return {"errors": errors}

        if instance:  # Update
            instance.username = username
            instance.email = email
            if password:
                instance.set_password(password)
            instance.save()
            return user_serializer(instance)
        else:  # Create new user
            try:
                user = User.objects.create_user(username=username, email=email, password=password)
                return user_serializer(user)
            except ValidationError as e:
                return {"errors": e.message_dict}
