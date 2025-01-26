from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import os
import base64
import json
import requests
from dotenv import load_dotenv

# Loading environment variables
load_dotenv()

# Define your API URL and key
groq_api_url = 'https://api.groq.com/openai/v1/chat/completions'
groq_api_key = os.environ.get('GROQ_API_KEY', 'your_api_key')

# Flask App Initialization
app = Flask(__name__)

# Configurations
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:Gautam%401@localhost:5432/login_app'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your_secret_key')
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}

# CORS Configuration
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}},
     methods=["GET", "POST", "PUT", "DELETE"],
     allow_headers=["Content-Type", "Authorization"],
     expose_headers=["Content-Type"])

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

# Models
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

class Feedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    feedback_type = db.Column(db.String(50), nullable=False)
    feedback_items = db.Column(db.JSON, nullable=False)
    questions_and_answers = db.Column(db.JSON, nullable=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Routes
@app.route('/api/generate-questions', methods=['POST'])
def generate_interview_questions():
    try:
        data = request.get_json()
        interview_type = data.get('type')

        if interview_type not in ['Google', 'Microsoft', 'Amazon']:
            return jsonify({"error": "Invalid interview type"}), 400

        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {groq_api_key}'
        }
        system_prompt = f"""
        You are an expert interviewer generating questions for a {interview_type} interview.
        Generate interview rounds as per {interview_type} with 3 questions per round:
        - Ensure diverse question types (behavioral, technical, coding)
        - For coding questions, set 'requiresCode' to true
        - Use the following JSON structure for each round exactly:
        [
            {{
              "id": 1,
              "type": "Round 1 Question Type",
              "question": "Specific interview question",
              "requiresCode": false/true
            }},
            {{
              "id": 2,
              "type": "Another Round 1 Question Type",
              "question": "Another specific interview question",
              "requiresCode": false/true
            }},
            {{
              "id": 3,
              "type": "Another Round 1 Question Type",
              "question": "Another specific interview question",
              "requiresCode": false/true
            }},
          ],
          [
            //follow same structure for other rounds
          ],
        ]
        
        For {interview_type}, consider their specific interview styles:
        - Remember the questions are for freshers
        - Emphasize leadership principles
        - Include technical depth
        - Mix behavioral and technical questions
        """
        
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": f"Generate detailed interview questions for {interview_type}"
                }
            ],
            "temperature": 0.7,
            "response_format": {"type": "json_object"}
        }
        
        response = requests.post(groq_api_url, headers=headers, json=payload)
        
        if response.status_code == 200:
            response_data = response.json()
            try:
                generated_rounds = response_data.get('choices', [{}])[0].get('message', {}).get('content', '{}')
                parsed_rounds = json.loads(generated_rounds).get('rounds', [])
                validation_passed = (
                    isinstance(parsed_rounds, list) and
                    all(
                        isinstance(round_data, list) and 
                        len(round_data) == 3 and
                        all(
                            isinstance(question, dict) and 
                            all(key in question for key in ['id', 'type', 'question', 'requiresCode'])
                            for question in round_data
                        )
                        for round_data in parsed_rounds
                    )
                )

                if validation_passed:
                    return jsonify(parsed_rounds), 200
                else:
                    print("Generated questions do not match the required structure")
                    print(f"Generated rounds: {parsed_rounds}")
                    return jsonify({
                        "error": "Generated questions do not match the required structure",
                        "details": {
                            "rounds_count": len(parsed_rounds),
                            "questions_per_round": [len(round_data) for round_data in parsed_rounds]
                        }
                    }), 500

            except (json.JSONDecodeError, KeyError) as parsing_error:
                print(f"Error parsing Groq API response: {parsing_error}")
                return jsonify({
                    "error": "Error parsing Groq API response",
                    "details": str(parsing_error)
                }), 500

        else:
            print(f"Groq API error: {response.text}")
            return jsonify({
                "error": "Groq API error", 
                "status_code": response.status_code,
                "response_text": response.text
            }), 500

    except requests.exceptions.RequestException as e:
        print(f"Groq API request exception: {str(e)}")
        return jsonify({"error": "Groq API request exception"}), 500

    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

@app.route('/api/save-interview-feedback', methods=['POST'])
def save_interview_feedback():
    try:
        data = request.get_json()
        feedback = Feedback(
            feedback_type=data.get('type'),
            feedback_items=data.get('feedback', {}),
            questions_and_answers=data.get('questionsAndAnswers', [])
        )
        db.session.add(feedback)
        db.session.commit()
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
    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }), 200

@app.route('/api/profile', methods=['GET', 'POST'])
def profile():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401
    user = db.session.get(User, user_id)
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
# End of routes

if __name__ == '__main__':
    with app.app_context():
        db.create_all()

    app.run(debug=True)
