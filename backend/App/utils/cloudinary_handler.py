import cloudinary
import cloudinary.uploader
from flask import current_app


def upload_media_batch(files, folder_name="hussam_portfolio"):
    """
    Uploads multiple files to Cloudinary and returns a list of secure URLs.
    Adheres to professional error logging and validation standards.
    """
    uploaded_urls = []

    # Configure Cloudinary (Ideally move this to App/__init__.py for better performance)
    cloudinary.config(
        cloud_name=current_app.config.get('CLOUDINARY_CLOUD_NAME'),
        api_key=current_app.config.get('CLOUDINARY_API_KEY'),
        api_secret=current_app.config.get('CLOUDINARY_API_SECRET'),
        secure=True
    )

    for file in files:
        # Skip empty files or files without a name
        if not file or file.filename == '':
            continue

        try:
            # Determine resource type dynamically
            ext = file.filename.lower()
            is_video = ext.endswith(('.mp4', '.mov', '.avi', '.mkv', '.wmv'))
            resource_type = "video" if is_video else "image"

            # Perform the upload
            upload_result = cloudinary.uploader.upload(
                file,
                folder=folder_name,
                resource_type=resource_type,
                use_filename=True,
                unique_filename=True
            )

            # Store secure URL
            secure_url = upload_result.get('secure_url')
            if secure_url:
                uploaded_urls.append(secure_url)
                current_app.logger.info(f"Successfully uploaded: {file.filename}")

        except Exception as e:
            # Error is logged to hussam_dev.log as per your system rules
            current_app.logger.error(f"Cloudinary Upload Error for {file.filename}: {str(e)}")
            continue

    return uploaded_urls