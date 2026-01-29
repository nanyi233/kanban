"""
Project Kanban Board - Flask Backend
A visual card-based kanban board for managing P0/P1/P2 priority projects
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import shutil
import re
from pathlib import Path

app = Flask(__name__, static_folder='static')
CORS(app)

# Base directory for project management
BASE_DIR = Path(r"D:\BaiduSyncdisk\分享")

# Priority folders
PRIORITY_FOLDERS = ['P0', 'P1', 'P2']

# Maturity markers
MATURITY_MARKERS = {
    'seed': {'emoji': '🌱', 'prefix': '[Seed]', 'label': 'Seed'},
    'sprout': {'emoji': '🌿', 'prefix': '[Sprout]', 'label': 'Sprout'},
    'tree': {'emoji': '🌳', 'prefix': '[Tree]', 'label': 'Tree'}
}


def parse_item_info(name):
    """Parse item name to extract maturity and clean name"""
    maturity = None
    clean_name = name.strip()
    
    # Check for maturity markers in the name
    for key, marker in MATURITY_MARKERS.items():
        if marker['prefix'] in clean_name:
            maturity = key
            clean_name = clean_name.replace(marker['prefix'], '').strip()
            break
    
    return {
        'original_name': name,
        'clean_name': clean_name,
        'maturity': maturity
    }


def get_item_type(path):
    """Determine if path is a file or directory and get extension"""
    if path.is_dir():
        return 'directory', None
    else:
        return 'file', path.suffix.lower()


def scan_priority_folder(priority):
    """Scan a priority folder and return all items"""
    folder_path = BASE_DIR / priority
    items = []
    
    if not folder_path.exists():
        # Create folder if not exists
        folder_path.mkdir(parents=True, exist_ok=True)
        return items
    
    for item in folder_path.iterdir():
        # Skip README.md and hidden files
        if item.name.startswith('.') or item.name == 'README.md':
            continue
            
        item_info = parse_item_info(item.name)
        item_type, extension = get_item_type(item)
        
        # Get file size for files
        size = None
        if item_type == 'file':
            try:
                size = item.stat().st_size
            except:
                size = 0
        
        items.append({
            'id': f"{priority}_{item.name}",
            'name': item_info['original_name'],
            'clean_name': item_info['clean_name'],
            'maturity': item_info['maturity'],
            'priority': priority,
            'type': item_type,
            'extension': extension,
            'size': size,
            'path': str(item)
        })
    
    return items


@app.route('/')
def index():
    """Serve the main page"""
    return send_from_directory('static', 'index.html')


@app.route('/styles.css')
def serve_css():
    """Serve the CSS file"""
    return send_from_directory('static', 'styles.css')


@app.route('/app.js')
def serve_js():
    """Serve the JS file"""
    return send_from_directory('static', 'app.js')


@app.route('/sound-effects.js')
def serve_sound_effects_js():
    """Serve the sound effects JS file"""
    return send_from_directory('static', 'sound-effects.js')


@app.route('/three-background.js')
def serve_three_background_js():
    """Serve the Three.js background JS file"""
    return send_from_directory('static', 'three-background.js')


@app.route('/api/projects', methods=['GET'])
def get_all_projects():
    """Get all projects from all priority folders"""
    all_projects = {
        'P0': scan_priority_folder('P0'),
        'P1': scan_priority_folder('P1'),
        'P2': scan_priority_folder('P2')
    }
    return jsonify(all_projects)


@app.route('/api/move', methods=['POST'])
def move_project():
    """Move a project from one priority to another"""
    data = request.json
    source_priority = data.get('source_priority')
    target_priority = data.get('target_priority')
    item_name = data.get('item_name')
    
    if not all([source_priority, target_priority, item_name]):
        return jsonify({'success': False, 'error': 'Missing parameters'}), 400
    
    if source_priority == target_priority:
        return jsonify({'success': True, 'message': 'No move needed'})
    
    source_path = BASE_DIR / source_priority / item_name
    target_path = BASE_DIR / target_priority / item_name
    
    if not source_path.exists():
        return jsonify({'success': False, 'error': 'Source item not found'}), 404
    
    if target_path.exists():
        return jsonify({'success': False, 'error': 'Target already exists'}), 409
    
    try:
        # Ensure target directory exists
        (BASE_DIR / target_priority).mkdir(parents=True, exist_ok=True)
        
        # Move the file/directory
        shutil.move(str(source_path), str(target_path))
        
        return jsonify({
            'success': True,
            'message': f'Moved {item_name} from {source_priority} to {target_priority}'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/update_maturity', methods=['POST'])
def update_maturity():
    """Update the maturity level of a project"""
    data = request.json
    priority = data.get('priority')
    current_name = data.get('current_name')
    new_maturity = data.get('new_maturity')
    
    if not all([priority, current_name]):
        return jsonify({'success': False, 'error': 'Missing parameters'}), 400
    
    current_path = BASE_DIR / priority / current_name
    
    if not current_path.exists():
        return jsonify({'success': False, 'error': 'Item not found'}), 404
    
    # Parse current name and build new name
    item_info = parse_item_info(current_name)
    
    # Remove old maturity prefix if exists
    base_name = item_info['clean_name']
    
    # Add new maturity prefix
    if new_maturity and new_maturity in MATURITY_MARKERS:
        new_name = f" {MATURITY_MARKERS[new_maturity]['prefix']} {base_name}"
    else:
        new_name = base_name
    
    new_path = BASE_DIR / priority / new_name
    
    if new_name == current_name:
        return jsonify({'success': True, 'message': 'No change needed'})
    
    if new_path.exists():
        return jsonify({'success': False, 'error': 'Target name already exists'}), 409
    
    try:
        os.rename(str(current_path), str(new_path))
        return jsonify({
            'success': True,
            'message': f'Updated maturity to {new_maturity}',
            'new_name': new_name
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/open', methods=['POST'])
def open_item():
    """Open a file or folder in the system default application"""
    data = request.json
    path = data.get('path')
    
    if not path:
        return jsonify({'success': False, 'error': 'Missing path'}), 400
    
    if not os.path.exists(path):
        return jsonify({'success': False, 'error': 'Path not found'}), 404
    
    try:
        os.startfile(path)
        return jsonify({'success': True, 'message': 'Opened successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    # Ensure static folder exists
    static_folder = Path(__file__).parent / 'static'
    static_folder.mkdir(exist_ok=True)
    
    print("🚀 Project Kanban Board Server Starting...")
    print(f"📁 Base Directory: {BASE_DIR}")
    print("🌐 Open http://localhost:5000 in your browser")
    
    app.run(debug=True, port=5000)
