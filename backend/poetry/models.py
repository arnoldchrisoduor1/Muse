from django.db import models
from django.conf import settings
from django.utils.text import slugify
import uuid
import logging

logger = logging.getLogger(__name__)

class Poem(models.Model):
    """
    Model for storing poetry content.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='poems')
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=250, unique=True, blank=True)
    content = models.TextField()
    description = models.TextField(blank=True)
    thoughts = models.TextField(blank=True, help_text="Author's thoughts on the poem")
    image_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['slug']),
            models.Index(fields=['created_at']),
        ]
        
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        # Generate a unique slug if one doesn't exist.
        if not self.slug:
            base_slug = slugify(self.title)
            unique_slug = base_slug
            counter = 1
            
            while Poem.objects.filter(slug=unique_slug).exists():
                unique_slug = f"{base_slug}-{counter}"
                counter += 1
                
            self.slug = unique_slug
            
        super().save(*args, **kwargs)
        logger.inf(f"Poem saved: {self.title} (ID: {self.id}) by user {self.user.username}")
        
    @property
    def like_count(self):
        return self.likes.count()
    
    @property
    def comment_count(self):
        return self.comments.count()
    
    
class Like(models.Model):
    """
    Generic model for likes that can be related to poems, comments or replies.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)
    # content type for the like (poem, comment, etc)
    comment_type = models.CharField(max_length=20)
    
    # Foreign keys for different content types.
    poem = models.ForeignKey(Poem, on_delete=models.CASCADE, null=True, blank=True, related_name='likes')
    comment = models.ForeignKey('Comment', on_delete=models.CASCADE, null=True, blank=True, related_name='likes')
    
    class Meta:
        # Ensure a user can only like an item once.
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'content_type', 'poem'],
                condition=models.Q(poem_isnull=False),
                name='unique_poem_like'
            ),
            models.UniqueConstraint(
                fields=['user', 'content-type', 'comment'],
                condition=models.Q(comment_isnull=False),
                name='unique_comment_like'
            ),
        ]
        indexes = [
            models.Index(fields=['content_type']),
            models.Index(fields=['user'])
        ]
        
    def __str__(self):
        if self.poem:
            return f"Like on poem '{self.poem.title}' by {self.user.username}"
        elif self.comment:
            return f"Like on comment by {self.user.username}"
        return f"Like by {self.user.username}"
    
    def save(self, *args, **kwargs):
        # Validate that only one content type is set.
        content_types = [bool(getattr(self, field)) for field in ['poem', 'comment']]
        if sum(content_types) != 1:
            raise ValueError("Like must be associated with exactly one content type")
        
        # Setting the content_type based on what's being liked.
        if self.poem:
            self.content_type = 'poem'
        elif self.comment:
            self.content_type = 'comment'
            
            
        super().save(*args, **kwargs)
        logger.info(f"Like created by {self.user.username} on {self.content_type} (ID: {self.id})")
        
        
class Comment(models.Model):
    """
    Model for comments with support for nested replies.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    poem = models.ForeignKey(Poem, on_delete=models.CASCADE, related_name='comments', null=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateField(auto_now=True)
    
    # Denormalizing some fields for performance
    path = models.CharField(max_length=500, db_index=True)
    depth = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['poem']),
            models.Index(fields=['parent']),
            models.Index(fields=['path']),
            models.Index(fields=['user'])
        ]
        
    def __str__(self):
        return f"Comment by {self.user.username} on {self.poem.title if self.poem else 'reply'}"
    
    def save(self, *args, **kwargs):
        # Checking if this is s top level comment or a reply.
        if not self.parent:
            if not self.poem:
                raise ValueError("Top-level comments must be associated with a pome")
            
            # Create a new path for top level comments.
            super().save(*args, **kwargs)
            self.path = str(self.id)
            self.depth = 0
            super().save(update_fields=['path', 'depth'])
            logger.info(f"Comment created on poem '{self.poem.title}' by {self.user.username}")
        else:
            # For replies, extend the parent's path.
            if self.poem:
                raise ValueError("Replies cannot be directly associated with a poem")
            self.poem = self.parent.poem #inherit from parent.
            super().save(*args, **kwargs)
            self.path = f"{self.parent.path}.{self.id}"
            self.depth = self.parent.depth + 1
            super().save(update_fields=['path', 'depth', 'poem'])
            logger.info(f"Reply created to comment {self.parent.id} by {self.user.usernae}")
            
    @property
    def like_count(self):
        return self.likes.count()
    
    @property
    def reply_count(self):
        return self.replies.count()
    
    @property
    def is_reply(self):
        return self.parent is not None
    