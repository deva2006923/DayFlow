from flask import Flask, jsonify
from flask_cors import CORS

from auth import auth_bp, users_bp
from attendance import attendance_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(auth_bp)
app.register_blueprint(users_bp)
app.register_blueprint(attendance_bp)


@app.route("/")
def health():
    return jsonify({"status": "Dayflow backend running"}), 200


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Route not found"}), 404


@app.errorhandler(500)
def server_error(e):
    print(f"[app.py] 500 error: {e}")
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
