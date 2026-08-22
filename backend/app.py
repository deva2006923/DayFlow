"""
app.py
Flask app entrypoint. Registers all blueprints from both members' files.
Owner: MEMBER A (created once in Hour 0-1, shared after that).
"""

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from auth import auth_bp
from attendance import attendance_bp
from leave import leave_bp
from payroll import payroll_bp
from analytics import analytics_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(auth_bp)
app.register_blueprint(attendance_bp)
app.register_blueprint(leave_bp)
app.register_blueprint(payroll_bp)
app.register_blueprint(analytics_bp)


@app.route("/", methods=["GET"])
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "dayflow-backend"}), 200


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Route not found"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
