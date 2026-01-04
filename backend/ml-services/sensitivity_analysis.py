import argparse
import sys
import os
import boto3
import cv2
import numpy as np
import socketio
import time
from botocore.exceptions import NoCredentialsError

# Initialize Socket.IO client
sio = socketio.Client()

def parse_arguments():
    parser = argparse.ArgumentParser(description='Video Sensitivity Analysis')
    parser.add_argument('--videoId', required=True, help='Video ID from database')
    parser.add_argument('--s3Key', required=True, help='S3 Key of the video')
    parser.add_argument('--userId', required=True, help='User ID for socket notification')
    parser.add_argument('--socketUrl', default='http://localhost:8080', help='Socket.IO server URL')
    return parser.parse_args()

@sio.event
def connect():
    print('Connected to Socket.IO server')

@sio.event
def connect_error(data):
    print(f'Connection failed: {data}')

@sio.event
def disconnect():
    print('Disconnected from Socket.IO server')

def download_video_from_s3(bucket_name, s3_key, download_path):
    s3 = boto3.client('s3')
    try:
        s3.download_file(bucket_name, s3_key, download_path)
        print(f"Downloaded {s3_key} to {download_path}")
        return True
    except NoCredentialsError:
        print("Credentials not available")
        return False
    except Exception as e:
        print(f"Error downloading file: {e}")
        return False

def analyze_video(input_path, video_id, user_id):
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        print("Error: Could not open video.")
        return {'status': 'failed', 'reason': 'Could not open video'}

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    # Heuristic counters
    skin_frame_count = 0
    high_motion_frame_count = 0
    processed_count = 0
    
    prev_frame = None
    
    # Skip rate (process every Nth frame)
    skip_frames = 10 

    print(f"Starting analysis for Video {video_id}. Total frames: {total_frames}")

    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        current_frame_idx = int(cap.get(cv2.CAP_PROP_POS_FRAMES))
        
        # Only process every Nth frame
        if current_frame_idx % skip_frames != 0:
            continue
            
        processed_count += 1
        
        # 1. Nudity Check (Skin Tone Detection - HSV)
        # Resize for speed
        resized_frame = cv2.resize(frame, (320, 240))
        hsv = cv2.cvtColor(resized_frame, cv2.COLOR_BGR2HSV)
        
        # Define skin color range in HSV (Start with generic range)
        lower_skin = np.array([0, 20, 70], dtype=np.uint8)
        upper_skin = np.array([20, 255, 255], dtype=np.uint8)
        
        mask = cv2.inRange(hsv, lower_skin, upper_skin)
        skin_pixels = cv2.countNonZero(mask)
        total_pixels = resized_frame.shape[0] * resized_frame.shape[1]
        skin_percentage = (skin_pixels / total_pixels) * 100
        
        if skin_percentage > 40: # Threshold for "significant skin"
            skin_frame_count += 1
            
        # 2. Violence/Chaos Check (Motion Intensity)
        gray = cv2.cvtColor(resized_frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (21, 21), 0)
        
        if prev_frame is None:
            prev_frame = gray
        else:
            frame_delta = cv2.absdiff(prev_frame, gray)
            thresh = cv2.threshold(frame_delta, 25, 255, cv2.THRESH_BINARY)[1]
            motion_pixels = cv2.countNonZero(thresh)
            motion_percentage = (motion_pixels / total_pixels) * 100
            
            if motion_percentage > 30: # Threshold for high motion/chaos
                high_motion_frame_count += 1
            
            prev_frame = gray

        # Emit progress
        progress = int((current_frame_idx / total_frames) * 100)
        sio.emit('analysis-progress', {'videoId': video_id, 'userId': user_id, 'percentage': progress})
        
        # Determine current status based on accumulated data
        # For simplicity, if we see >> 10% of processed frames with issues, we flag.
        
    cap.release()
    
    # Final Decision Logic
    # If > 15% of analyzed frames had high skin content
    # OR > 20% of analyzed frames had high motion (potential violence/chaos)
    flagged = False
    reasons = []
    
    if processed_count > 0:
        if (skin_frame_count / processed_count) > 0.15:
            flagged = True
            reasons.append("Nudity/Inappropriate Content detected")
        
        if (high_motion_frame_count / processed_count) > 0.20:
            flagged = True
            reasons.append("High Violence/Chaos detected")
            
    result = {
        'status': 'flagged' if flagged else 'safe',
        'reasons': reasons,
        'metrics': {
            'skin_score': skin_frame_count / processed_count if processed_count else 0,
            'motion_score': high_motion_frame_count / processed_count if processed_count else 0
        }
    }
    
    print(f"Analysis complete: {result}")
    return result

def main():
    args = parse_arguments()
    
    # Connect to Socket.IO
    try:
        sio.connect(args.socketUrl)
        print(f"Connected to backend at {args.socketUrl}")
    except Exception as e:
        print(f"Could not connect to socket server: {e}")
        # Continue anyway, but emitting won't work
    
    # Setup temporary file path
    temp_dir = os.path.join(os.path.dirname(__file__), 'temp')
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
        
    video_filename = f"{args.videoId}_{int(time.time())}.mp4"
    temp_path = os.path.join(temp_dir, video_filename)
    
    # Download from S3
    bucket = os.getenv('S3_BUCKET_NAME') # Ensure env var is passed to script or hardcode for test
    # Note: In real production, we passed S3 credentials via env vars to this process/container
    # Here we assume the environment where this runs has access (e.g. AWS CLI configured or Env vars set)
    # The NodeJS `spawn` inherits env vars by default, so if backend has them, python should too.
    
    # Fallback to fetching bucket from args or assuming it's in env
    # For now, let's assume it's in ENV as S3_BUCKET_NAME
    if not bucket:
        # Try to parse from nodejs arguments if we decided to pass it, but we didn't. 
        # We rely on S3_BUCKET_NAME env var.
        print("S3_BUCKET_NAME not set via environment.")
        # If it fails, report error
    
    success = download_video_from_s3(bucket, args.s3Key, temp_path)
    if not success:
        sio.emit('analysis-complete', {'videoId': args.videoId, 'userId': args.userId, 'result': {'status': 'failed', 'reason': 'Download failed'}})
        sio.disconnect()
        return

    # Analyze
    result = analyze_video(temp_path, args.videoId, args.userId)
    
    # Cleanup
    if os.path.exists(temp_path):
        os.remove(temp_path)
        
    # Emit final result
    sio.emit('analysis-complete', {'videoId': args.videoId, 'userId': args.userId, 'result': result})
    
    # Give a moment for socket to flush
    time.sleep(2)
    sio.disconnect()

if __name__ == "__main__":
    main()
