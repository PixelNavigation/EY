from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import base64
import json
import requests

# Define your API URL and key
groq_api_url = 'https://api.groq.com/openai/v1/chat/completions'
groq_api_key = os.environ.get('GROQ_API_KEY', 'your_api_key')

# Define prompts for different interview types
prompts = {
    'Google': 'Generate a set of interview questions for a Google software engineering position.',
    'Microsoft': 'Generate a set of interview questions for a Microsoft software engineering position.',
    'Amazon': 'Generate a set of interview questions for an Amazon software engineering position.'
}

app = Flask(__name__)

#Configurations
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:Gautam%401@localhost:5432/login_app'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your_secret_key')
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}

#CORS Configuration
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}},
     methods=["GET", "POST", "PUT", "DELETE"],
     allow_headers=["Content-Type", "Authorization"],
     expose_headers=["Content-Type"])

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

#User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    image = db.Column(db.LargeBinary, nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    college = db.Column(db.String(150), nullable=True)
    course = db.Column(db.String(150), nullable=True)
    career_ambition = db.Column(db.String(150), nullable=False, default="Software Developer")

#Utility to check allowed file types
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

#Routes
@app.route('/api/generate-questions', methods=['POST'])
def generate_interview_questions():
    try:
        print("Received request for generate_questions") # Debug log
        data = request.get_json()
        if not data:
            print("No JSON data received")
            return jsonify({"error": "No data received"}), 400

        interview_type = data.get('type')
        print(f"Interview type received: {interview_type}") # Debug log

        if not interview_type:
            return jsonify({"error": "Interview type is required"}), 400

        num_rounds = data.get('num_rounds', 3)
        
        # Fallback response in case of API issues
        fallback_questions = {
            'Google': [
                [
                    {
                        'id': 'fallback_1',
                        'type': 'Google',
                        'question': 'Explain your experience with algorithms and data structures.',
                        'requiresCode': False
                    }
                ]
            ],
            'Microsoft': [
                [
                    {
                        'id': 'fallback_1',
                        'type': 'Microsoft',
                        'question': 'Describe a challenging project you worked on.',
                        'requiresCode': False
                    }
                ]
            ],
            'Amazon': [
                [
                    {
                        'id': 'fallback_1',
                        'type': 'Amazon',
                        'question': 'Tell me about a time you demonstrated leadership.',
                        'requiresCode': False
                    }
                ]
            ]
        }

        # If interview type is not in our supported companies, return error
        if interview_type not in ['Google', 'Microsoft', 'Amazon']:
            return jsonify({
                "error": "Invalid company selected",
                "details": f"Company '{interview_type}' not supported"
            }), 400

        try:
            # Your existing API call code here
            response = requests.post(
                groq_api_url,
                headers={
                    'Authorization': f'Bearer {groq_api_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'llama2-70b-4096',  # Changed model to a more stable one
                    'messages': [
                        {
                            'role': 'system',
                            'content': 'You are a professional interview question generator for top tech companies.'
                        },
                        {
                            'role': 'user',
                            'content': prompts.get(interview_type)
                        }
                    ],
                    'max_tokens': 1000,
                    'temperature': 0.7
                }
            )
            
            if response.status_code != 200:
                print(f"API Error: {response.status_code} - {response.text}")  # Debug log
                return jsonify(fallback_questions[interview_type]), 200
                
            response_data = response.json()
            generated_content = response_data['choices'][0]['message']['content']
            
            # Rest of your existing parsing code...
            
        except requests.exceptions.RequestException as e:
            print(f"API Request Error: {str(e)}")  # Debug log
            # Return fallback questions if API fails
            return jsonify(fallback_questions[interview_type]), 200
            
    except Exception as e:
        print(f"Unexpected error: {str(e)}")  # Debug log
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500

@app.route('/api/save-interview-feedback', methods=['POST'])
def save_interview_feedback():
    try:
        data = request.get_json()
        feedback_type = data.get('type')
        feedback_items = data.get('feedback', {})
        questions_and_answers = data.get('questionsAndAnswers', [])
        # Here you can store feedback in a new model or as desired.
        # ...existing code or logic to save feedback...
        return jsonify({"message": "Feedback saved successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
            "course": user.course,
            "careerAmbition": user.career_ambition
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
        user.career_ambition = data.get('careerAmbition', user.career_ambition)
        db.session.commit()
        return jsonify({"message": "Profile updated successfully"}), 200
#End of routes

if __name__ == '__main__':
    with app.app_context():
        db.create_all()

    app.run(debug=True)
