import cloudinary
import cloudinary.uploader
import logging
from flask import current_app

def upload_media_batch(files, folder_name="hussam_portfolio"):
    """
    Globally optimized media uploader for HussamAlshawi-Portfolio.
    Handles batch uploads for images and videos with robust logging.
    """
    # 1. Configuration & Setup
    # English Comment: Ensure Cloudinary is configured using App Context
    cloudinary.config(
        cloud_name=current_app.config.get('CLOUDINARY_CLOUD_NAME'),
        api_key=current_app.config.get('CLOUDINARY_API_KEY'),
        api_secret=current_app.config.get('CLOUDINARY_API_SECRET'),
        secure=True
    )

    uploaded_urls = []
    # English Comment: Use the application's logger for centralized logging
    app_logger = current_app.logger

    print(f"🔍 [Cloudinary Session]: Starting upload for {len(files)} potential items...")

    for file in files:
        # 2. Validation
        if not file or file.filename == '':
            app_logger.warning("Cloudinary Skip: Received an empty file object.")
            continue

        try:
            print(f"🚀 [Uploading]: {file.filename}...")

            # 3. Dynamic Resource Detection
            # English Comment: Distinguish between video and image resources
            ext = file.filename.lower()
            video_extensions = ('.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm')
            resource_type = "video" if ext.endswith(video_extensions) else "image"

            # 4. Professional Upload Logic
            # English Comment: Uploading with secure settings and organized folder structure
            upload_result = cloudinary.uploader.upload(
                file,
                folder=f"HussamAlshawi-Portfolio/{folder_name}",
                resource_type=resource_type,
                use_filename=True,
                unique_filename=True,
                chunk_size=6000000  # 6MB chunks for stable video uploads
            )

            # 5. Result Verification
            secure_url = upload_result.get('secure_url')
            if secure_url:
                uploaded_urls.append(secure_url)
                print(f"✅ [Success]: {file.filename} -> {secure_url}")
                app_logger.info(f"Cloudinary Success: {file.filename} uploaded to {folder_name}.")
            else:
                app_logger.error(f"Cloudinary Error: No URL returned for {file.filename}")

        except Exception as e:
            # 6. Global Error Handling
            # English Comment: Logs errors to the file 'media_errors.log' via current_app logger
            error_msg = f"Cloudinary Critical Exception for {file.filename}: {str(e)}"
            app_logger.error(error_msg)
            print(f"❌ [Failed]: {file.filename}. Check logs for details.")
            continue

    print(f"🏁 [Session Finished]: Successfully stored {len(uploaded_urls)} links.")
    return uploaded_urls