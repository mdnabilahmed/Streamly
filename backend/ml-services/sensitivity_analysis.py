import argparse
import sys
import os
import boto3
import cv2
import numpy as np
import socketio
import time
from botocore.exceptions import NoCredentialsError
from collections import deque

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

def detect_skin_regions(frame):
    """
    Improved skin detection that looks for concentrated skin regions
    rather than just total skin percentage
    """
    resized_frame = cv2.resize(frame, (320, 240))
    hsv = cv2.cvtColor(resized_frame, cv2.COLOR_BGR2HSV)
    ycrcb = cv2.cvtColor(resized_frame, cv2.COLOR_BGR2YCrCb)
    
    # Multiple color space detection for better accuracy
    # HSV-based skin detection
    lower_skin_hsv = np.array([0, 20, 70], dtype=np.uint8)
    upper_skin_hsv = np.array([20, 255, 255], dtype=np.uint8)
    mask_hsv = cv2.inRange(hsv, lower_skin_hsv, upper_skin_hsv)
    
    # YCrCb-based skin detection (more robust)
    lower_skin_ycrcb = np.array([0, 133, 77], dtype=np.uint8)
    upper_skin_ycrcb = np.array([255, 173, 127], dtype=np.uint8)
    mask_ycrcb = cv2.inRange(ycrcb, lower_skin_ycrcb, upper_skin_ycrcb)
    
    # Combine masks
    skin_mask = cv2.bitwise_and(mask_hsv, mask_ycrcb)
    
    # Remove noise
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_CLOSE, kernel)
    skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_OPEN, kernel)
    
    # Find contours to detect concentrated regions
    contours, _ = cv2.findContours(skin_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    total_pixels = resized_frame.shape[0] * resized_frame.shape[1]
    skin_pixels = cv2.countNonZero(skin_mask)
    skin_percentage = (skin_pixels / total_pixels) * 100
    
    # Analyze region concentration
    large_regions = [cv2.contourArea(c) for c in contours if cv2.contourArea(c) > 500]
    num_large_regions = len(large_regions)
    largest_region_ratio = max(large_regions) / total_pixels if large_regions else 0
    
    return {
        'skin_percentage': skin_percentage,
        'num_regions': num_large_regions,
        'largest_region_ratio': largest_region_ratio * 100,
        'concentrated': largest_region_ratio > 0.25  # Single large region
    }

def detect_violence_indicators(frame, prev_frame, motion_history):
    """
    Improved violence detection using multiple indicators:
    - Sudden color changes (blood, flashes)
    - Edge intensity (sharp objects, chaos)
    - Motion patterns (erratic vs smooth)
    """
    resized_frame = cv2.resize(frame, (320, 240))
    gray = cv2.cvtColor(resized_frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (21, 21), 0)
    
    violence_score = 0
    indicators = []
    
    if prev_frame is not None:
        # 1. Motion Analysis
        frame_delta = cv2.absdiff(prev_frame, gray)
        thresh = cv2.threshold(frame_delta, 25, 255, cv2.THRESH_BINARY)[1]
        motion_pixels = cv2.countNonZero(thresh)
        total_pixels = gray.shape[0] * gray.shape[1]
        motion_percentage = (motion_pixels / total_pixels) * 100
        
        # Track motion history to detect patterns
        motion_history.append(motion_percentage)
        
        # Calculate motion variance (erratic motion indicator)
        if len(motion_history) >= 5:
            motion_variance = np.var(list(motion_history))
            motion_mean = np.mean(list(motion_history))
            
            # High variance with high motion = chaos/violence
            # Smooth high motion = sports/action
            if motion_mean > 25 and motion_variance > 50:
                violence_score += 2
                indicators.append("erratic_motion")
            elif motion_mean > 40 and motion_variance > 100:
                violence_score += 3
                indicators.append("high_chaos")
        
        # 2. Edge Detection (weapons, sharp objects)
        edges = cv2.Canny(gray, 50, 150)
        edge_pixels = cv2.countNonZero(edges)
        edge_percentage = (edge_pixels / total_pixels) * 100
        
        # Extremely high edge density can indicate violence/chaos
        if edge_percentage > 15:
            violence_score += 1
            indicators.append("high_edge_density")
        
        # 3. Color-based indicators (red tones for blood)
        hsv = cv2.cvtColor(resized_frame, cv2.COLOR_BGR2HSV)
        # Detect red colors
        lower_red1 = np.array([0, 70, 50])
        upper_red1 = np.array([10, 255, 255])
        lower_red2 = np.array([170, 70, 50])
        upper_red2 = np.array([180, 255, 255])
        
        mask_red1 = cv2.inRange(hsv, lower_red1, upper_red1)
        mask_red2 = cv2.inRange(hsv, lower_red2, upper_red2)
        red_mask = cv2.bitwise_or(mask_red1, mask_red2)
        red_pixels = cv2.countNonZero(red_mask)
        red_percentage = (red_pixels / total_pixels) * 100
        
        # High red content combined with high motion
        if red_percentage > 25 and motion_percentage > 20:
            violence_score += 2
            indicators.append("red_with_motion")
        
        # 4. Brightness variance (flashes, explosions)
        brightness_std = np.std(gray)
        if brightness_std > 60:
            violence_score += 1
            indicators.append("high_contrast")
    
    return {
        'violence_score': violence_score,
        'indicators': indicators,
        'motion_percentage': motion_percentage if prev_frame is not None else 0
    }, gray

def analyze_video(input_path, video_id, user_id):
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        print("Error: Could not open video.")
        return {'status': 'failed', 'reason': 'Could not open video'}

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    # Tracking variables
    flagged_skin_frames = []
    flagged_violence_frames = []
    processed_count = 0
    
    prev_frame = None
    motion_history = deque(maxlen=10)  # Track last 10 frames
    
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
        
        # Skin detection
        skin_analysis = detect_skin_regions(frame)
        
        # More nuanced flagging: high skin + concentrated region
        if (skin_analysis['skin_percentage'] > 50 and 
            skin_analysis['concentrated'] and 
            skin_analysis['largest_region_ratio'] > 30):
            flagged_skin_frames.append({
                'frame': current_frame_idx,
                'data': skin_analysis
            })
        
        # Violence detection
        violence_analysis, prev_frame = detect_violence_indicators(
            frame, prev_frame, motion_history
        )
        
        # Flag only if violence score is significant
        if violence_analysis['violence_score'] >= 3:
            flagged_violence_frames.append({
                'frame': current_frame_idx,
                'data': violence_analysis
            })

        # Emit progress
        if processed_count % 5 == 0:  # Reduce socket emissions
            progress = int((current_frame_idx / total_frames) * 100)
            sio.emit('analysis-progress', {
                'videoId': video_id, 
                'userId': user_id, 
                'percentage': progress
            })
        
    cap.release()
    
    # Final Decision Logic - require sustained patterns, not isolated frames
    flagged = False
    reasons = []
    confidence_scores = {}
    
    if processed_count > 0:
        # Require at least 10% of frames to be flagged (sustained pattern)
        skin_flag_ratio = len(flagged_skin_frames) / processed_count
        violence_flag_ratio = len(flagged_violence_frames) / processed_count
        
        # Nudity/Inappropriate Content
        if skin_flag_ratio > 0.10:  # 10% of frames show concentrated skin
            flagged = True
            reasons.append("Potential inappropriate content detected")
            confidence_scores['nudity'] = min(skin_flag_ratio * 100, 100)
        
        # Violence/Chaos
        if violence_flag_ratio > 0.15:  # 15% of frames show violence indicators
            flagged = True
            reasons.append("Potential violent content detected")
            confidence_scores['violence'] = min(violence_flag_ratio * 100, 100)
        
        # Check for clustering (multiple flags in short timespan)
        if len(flagged_violence_frames) >= 3:
            frame_numbers = [f['frame'] for f in flagged_violence_frames]
            gaps = [frame_numbers[i+1] - frame_numbers[i] for i in range(len(frame_numbers)-1)]
            avg_gap = np.mean(gaps) if gaps else float('inf')
            
            # If flags are clustered (small gaps), increase confidence
            if avg_gap < 100:  # Flags within ~10 seconds of each other
                if 'violence' in confidence_scores:
                    confidence_scores['violence'] = min(confidence_scores['violence'] * 1.3, 100)
    
    result = {
        'status': 'flagged' if flagged else 'safe',
        'reasons': reasons,
        'confidence': confidence_scores,
        'metrics': {
            'skin_flagged_frames': len(flagged_skin_frames),
            'violence_flagged_frames': len(flagged_violence_frames),
            'total_processed': processed_count,
            'skin_flag_ratio': skin_flag_ratio if processed_count > 0 else 0,
            'violence_flag_ratio': violence_flag_ratio if processed_count > 0 else 0
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
    
    # Setup temporary file path
    temp_dir = os.path.join(os.path.dirname(__file__), 'temp')
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
        
    video_filename = f"{args.videoId}_{int(time.time())}.mp4"
    temp_path = os.path.join(temp_dir, video_filename)
    
    bucket = os.getenv('S3_BUCKET_NAME')
    if not bucket:
        print("S3_BUCKET_NAME not set via environment.")
        sio.emit('analysis-complete', {
            'videoId': args.videoId, 
            'userId': args.userId, 
            'result': {'status': 'failed', 'reason': 'S3 bucket not configured'}
        })
        sio.disconnect()
        return
    
    success = download_video_from_s3(bucket, args.s3Key, temp_path)
    if not success:
        sio.emit('analysis-complete', {
            'videoId': args.videoId, 
            'userId': args.userId, 
            'result': {'status': 'failed', 'reason': 'Download failed'}
        })
        sio.disconnect()
        return

    # Analyze
    result = analyze_video(temp_path, args.videoId, args.userId)
    
    # Cleanup
    if os.path.exists(temp_path):
        os.remove(temp_path)
        
    # Emit final result
    sio.emit('analysis-complete', {
        'videoId': args.videoId, 
        'userId': args.userId, 
        'result': result
    })
    
    time.sleep(2)
    sio.disconnect()

if __name__ == "__main__":
    main()