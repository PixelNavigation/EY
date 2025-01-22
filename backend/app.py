from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import os

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:Gautam%401@localhost:5432/login_app'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your_secret_key'

# Update CORS configuration to allow requests from your frontend
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}})

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    image = db.Column(db.String(200), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    college = db.Column(db.String(150), nullable=True)
    course = db.Column(db.String(150), nullable=True)

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

    # Check if the user's profile is complete
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
    if request.method == 'GET':
        return jsonify({
            "image": user.image,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "college": user.college,
            "course": user.course
        })

    if request.method == 'POST':
        data = request.get_json()
        user.image = data.get('image')
        user.name = data.get('name')
        user.email = data.get('email')
        user.phone = data.get('phone')
        user.college = data.get('college')
        user.course = data.get('course')
        db.session.commit()
        return jsonify({"message": "Profile updated successfully"}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()

    app.run(debug=True)