from .models import Comment, Like, Poem
from rest_framework import serializers

class LikeSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Like
        fields = ['id', 'user', 'username', 'content_type', 'created_at']
        read_only_fields = ['id', 'created_at', 'content_type', 'user']

class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    replies_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Comment
        fields = [
            'id', 'user', 'username', 'poem', 'parent', 'content', 
            'created_at', 'updated_at', 'likes_count', 'replies_count',
            'depth', 'path'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'likes_count', 'replies_count', 'depth', 'path', 'user']

class RecursiveCommentSerializer(CommentSerializer):
    replies = serializers.SerializerMethodField()
    
    class Meta(CommentSerializer.Meta):
        fields = CommentSerializer.Meta.fields + ['replies']
    
    def get_replies(self, obj):
        # Only fetch immediate children
        replies = Comment.objects.filter(parent=obj)
        serializer = RecursiveCommentSerializer(replies, many=True, context=self.context)
        return serializer.data

class PoemListSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    is_liked = serializers.SerializerMethodField()
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Like.objects.filter(
                user=request.user,
                poem=obj,
                content_type='poem'
            ).exists()
        return False
    
    class Meta:
        model = Poem
        fields = [
            'id', 'user', 'username', 'title', 'content', 'slug', 'description', 'thoughts',
            'image_url', 'created_at', 'updated_at', 'likes_count', 'comments_count', 'is_liked'
        ]
        read_only_fields = ['id', 'user', 'slug', 'created_at', 'updated_at', 'likes_count', 'comments_count', 'is_liked']

class PoemDetailSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    comments = serializers.SerializerMethodField()
    
    class Meta:
        model = Poem
        fields = [
            'id', 'user', 'username', 'title', 'slug', 'content', 
            'description', 'thoughts', 'image_url', 'created_at',
            'updated_at', 'likes_count', 'comments_count', 'comments'
        ]
        read_only_fields = ['id', 'user', 'slug', 'created_at', 'updated_at', 'likes_count', 'comments_count']
    
    def get_comments(self, obj):
        # Get only top-level comments (no parent)
        comments = Comment.objects.filter(poem=obj, parent=None).prefetch_related('replies')
        serializer = RecursiveCommentSerializer(comments, many=True, context=self.context)
        return serializer.data