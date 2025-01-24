from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import base64
import json
import requests

app = Flask(__name__)

# Configurations
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:Gautam%401@localhost:5432/login_app'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your_secret_key')
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}

# CORS Configuration
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}})

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    image = db.Column(db.LargeBinary, nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    college = db.Column(db.String(150), nullable=True)
    course = db.Column(db.String(150), nullable=True)

# Utility to check allowed file types
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Routes
@app.route('/api/generate-questions', methods=['POST'])
def generate_interview_questions():
    data = request.get_json()
    interview_type = data.get('type', 'general')
    num_questions = data.get('num_questions', 3)
    groq_api_key = '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'
    groq_api_url = 'https://api.groq.com/openai/v1/chat/completions'
    prompts = {
        'technical': f"Generate {num_questions} advanced technical interview questions for a software engineering role. Provide each question as a JSON object with 'question' and 'difficulty' fields.",
        'behavioral': f"Generate {num_questions} behavioral interview questions assessing leadership, teamwork, and problem-solving skills. Format as JSON objects with 'question' and 'skill_assessed' fields.",
        'general': f"Generate {num_questions} diverse interview questions covering technical skills and behavioral aspects. Create JSON objects with 'question' and 'type' fields."
    }

    try:
        response = requests.post(
            groq_api_url,
            headers={
                'Authorization': f'Bearer {groq_api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'llama3-8b-8192',
                'messages': [
                    {
                        'role': 'system', 
                        'content': 'You are a professional interview question generator. Create thoughtful interview questions in strict JSON format.'
                    },
                    {
                        'role': 'user', 
                        'content': prompts.get(interview_type, prompts['general'])
                    }
                ],
                'response_format': {'type': 'json_object'},
                'max_tokens': 300,
                'temperature': 0.7
            }
        )

        response_data = response.json()
        generated_content = response_data['choices'][0]['message']['content']
        
        try:
            parsed_questions = json.loads(generated_content)
            
            formatted_questions = []
            for idx, q in enumerate(parsed_questions.get('questions', []), 1):
                formatted_questions.append({
                    'id': idx,
                    'type': interview_type,
                    'question': q.get('question', 'No question generated'),
                    'requiresCode': interview_type == 'technical' and idx % 2 == 0
                })

            if not formatted_questions:
                formatted_questions = [
                    {
                        'id': 1,
                        'type': interview_type,
                        'question': 'Tell me about a challenging project you worked on.',
                        'requiresCode': False
                    }
                ]

            return jsonify(formatted_questions), 200

        except (json.JSONDecodeError, KeyError) as parse_error:
            return jsonify({
                "error": "Failed to parse generated questions",
                "details": str(parse_error)
            }), 500

    except Exception as e:
        return jsonify({
            "error": "Failed to generate questions",
            "details": str(e)
        }), 500

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({"message": "All fields are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already exists"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    new_user = User(name=name, email=email, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({"message": "Invalid credentials"}), 401

    session['user_id'] = user.id

    if not all([user.image, user.phone, user.college, user.course]):
        return jsonify({
            "message": "Profile incomplete",
            "redirect": "/profile",
            "token": "dummy-token-for-now",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email
            }
        }), 200

    return jsonify({
        "message": "Login successful",
        "token": "dummy-token-for-now",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }), 200

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/api/profile', methods=['GET', 'POST'])
def profile():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    if request.method == 'GET':
        image_base64 = None
        if user.image:
            try:
                image_base64 = base64.b64encode(user.image).decode('utf-8')
            except Exception as e:
                return jsonify({"message": f"Error processing image: {str(e)}"}), 500

        return jsonify({
            "image": image_base64,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "college": user.college,
            "course": user.course
        })

    if request.method == 'POST':
        data = request.form
        image_file = request.files.get('image')

        if image_file and allowed_file(image_file.filename):
            try:
                user.image = image_file.read()
            except Exception as e:
                return jsonify({"message": f"Error saving image: {str(e)}"}), 500

        user.name = data.get('name', user.name)
        user.email = data.get('email', user.email)
        user.phone = data.get('phone', user.phone)
        user.college = data.get('college', user.college)
        user.course = data.get('course', user.course)
        db.session.commit()

        return jsonify({"message": "Profile updated successfully"}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()

    app.run(debug=True)
