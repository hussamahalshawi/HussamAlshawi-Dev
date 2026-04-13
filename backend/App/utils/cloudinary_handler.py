import cloudinary
import cloudinary.uploader
import logging
from flask import current_app

def upload_media_batch(files, folder_name="general", sub_folder="my_media"):
    """
    Advanced Dynamic Uploader.
    Structure: hussam_Dev / {sub_folder} / {folder_name}
    Default sub_folder is 'my_media', but can be 'posts', 'projects', etc.
    """
    # Configuration using App Context
    cloudinary.config(
        cloud_name=current_app.config.get('CLOUDINARY_CLOUD_NAME'),
        api_key=current_app.config.get('CLOUDINARY_API_KEY'),
        api_secret=current_app.config.get('CLOUDINARY_API_SECRET'),
        secure=True
    )

    uploaded_urls = []
    app_logger = current_app.logger

    # Fixed Root and Sub-directory paths
    # This ensures everything goes to hussam_Dev/my_media/[your_folder]
    base_path = f"hussam_Dev/{sub_folder}/{folder_name}"

    print(f"🔍 [Cloudinary Session]: Targeting path: {base_path}")

    for file in files:
        if not file or file.filename == '':
            continue

        try:
            print(f"🚀 [Uploading]: {file.filename}...")

            # Dynamic Resource Detection
            ext = file.filename.lower()
            video_extensions = ('.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm')
            resource_type = "video" if ext.endswith(video_extensions) else "image"

            # Perform the upload with the structured path
            upload_result = cloudinary.uploader.upload(
                file,
                folder=base_path,
                resource_type=resource_type,
                use_filename=True,
                unique_filename=True,
                chunk_size=6000000  # 6MB chunks for stability
            )

            secure_url = upload_result.get('secure_url')
            if secure_url:
                uploaded_urls.append(secure_url)
                print(f"✅ [Success]: {file.filename} saved in {base_path}")
                app_logger.info(f"Cloudinary Success: {file.filename} saved to {base_path}")

        except Exception as e:
            app_logger.error(f"Cloudinary Critical Exception for {file.filename}: {str(e)}")
            print(f"❌ [Failed]: {file.filename}. Check logs.")
            continue

    return uploaded_urls