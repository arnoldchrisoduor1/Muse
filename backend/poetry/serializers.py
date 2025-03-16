from backend.poetry.models import Comment, Like, Poem
from rest_framework import serializers

class LikeSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Like
        fields = ['id', 'user', 'username', 'content-type', 'created_at']
        read_only_fields = ['id', 'created_at', 'content_type']
        
class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    like_count = serializers.IntegerField(read_only=True)
    reply_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Comment
        fields = [
            'id', 'user', 'username', 'poem', 'parent', 'content', 
            'created_at', 'updated_at', 'like_count', 'reply_count',
            'depth', 'path'
        ]
        
        read_only_fields = ['id', 'created_at', 'updated_at', 'like_count', 'reply_count', 'depth', 'path']
        
class RecursiveCommentSerializer(CommentSerializer):
    replies = serializers.SerializerMethodField()
    
    class Meta(CommentSerializer.Meta):
        fields = CommentSerializer.Meta.fields + ['replies']
        
    def get_replies(self, obj):
        # Only fetching immediate children.
        replies = Comment.objects.filter(parent=obj)
        serializer = RecursiveCommentSerializer(replies, many=True, context=self.context)
        return serializer.data
    
class PoemListSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    like_count = serializers.IntegerField(read_only=True)
    comment_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Poem
        fields = [
            'id', 'user', 'username', 'title', 'slug', 'description',
            'image_url', 'created_at', 'updated_at', 'like_count',
            'comment_count'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at', 'like_count', 'comment_count']
        
class PoemDetailSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    like_count = serializers.IntegerField(read_only=True)
    comment_count = serializers.IntegerField(read_only=True)
    comments = serializers.SerializerMethodField()
    
    class Meta:
        model = Poem
        fields = [
            'id', 'user', 'username', 'title', 'slug', 'content', 
            'description', 'thoughts', 'image_url', 'created_at',
            'updated_at', 'like_count', 'comment_count', 'comments'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at', 'like_count', 'comment_count']
    
    def get_comments(self, obj):
        # Get only top-level comments (no parent)
        comments = Comment.objects.filter(poem=obj, parent=None).prefetch_related('replies')
        serializer = RecursiveCommentSerializer(comments, many=True, context=self.context)
        return serializer.data