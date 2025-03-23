import boto3
import logging
import os
from django.conf import settings
from botocore.exceptions import ClientError
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)

class S3Handler:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            region_name='eu-north-1',
            aws_access_key_id=os.environ.get('AWS_ACCESS_KEY'),
            aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
        )
        self.bucket_name = 'kenyamall'  # Using your existing bucket

    def generate_presigned_url(self, content_type='image/jpeg'):
        """
        Generate a presigned URL for uploading an image to S3
        """
        try:
            # Create a unique image name
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            unique_id = str(uuid.uuid4())[:8]
            image_name = f"{unique_id}-{timestamp}.jpeg"
            
            # Generate the presigned URL
            response = self.s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': image_name,
                    'ContentType': content_type
                },
                ExpiresIn=1000
            )
            
            # Get the URL without query parameters
            object_url = f"https://{self.bucket_name}.s3.amazonaws.com/{image_name}"
            
            logger.info(f"Generated presigned URL for image upload: {image_name}")
            return {
                'upload_url': response,
                'object_url': object_url
            }
        except ClientError as e:
            logger.error(f"Error generating presigned URL: {str(e)}")
            raise