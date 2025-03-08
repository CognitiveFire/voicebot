import os
import logging
import time
import threading
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import openai

# ✅ Load environment variables from `.env` file (if running locally)
load_dotenv()

# ✅ Set up logging
LOG_FILE = "error.log"
logging.basicConfig(filename=LOG_FILE, level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

print("🚀 Importing dependencies and setting up Flask app...")

# ✅ Initialize Flask App
app = Flask(__name__, static_folder="frontend/out", static_url_path="/")
CORS(app)  # Enable CORS for all origins

# ✅ Ensure Next.js Frontend is Served Correctly
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react_app(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")

# ✅ Load OpenAI API Key from Environment Variables
openai_api_key = os.getenv("OPENAI_API_KEY")

if not openai_api_key:
    logging.error("❌ OpenAI API key is missing! Set it in Railway or .env file.")
    raise ValueError("❌ OpenAI API key is missing! Set it in Railway or .env file.")

# ✅ Initialize OpenAI Client
client = openai.OpenAI(api_key=openai_api_key)
print("✅ OpenAI client initialized.")

# ✅ Keep-Alive Function to Prevent Railway Shutdown
railway_url = os.getenv("RAILWAY_URL")

def keep_awake():
    """Prevents Railway from shutting down the app."""
    if not railway_url:
        logging.error("❌ RAILWAY_URL is not set! Keep-alive will not work.")
        return

    while True:
        try:
            print(f"⏳ Sending keep-alive request to {railway_url}...")
            requests.get(railway_url)
        except requests.RequestException as e:
            print(f"⚠️ Keep-alive request failed! {str(e)}")
        time.sleep(600)  # Run every 10 minutes

# ✅ Start keep-alive function in the background
threading.Thread(target=keep_awake, daemon=True).start()

# ✅ API Endpoint for Chat
@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        print("🔹 Request received:", request.headers)
        data = request.get_json(force=True)
        
        if not data or "prompt" not in data:
            logging.error("❌ Missing prompt in request")
            return jsonify({"error": "Missing prompt"}), 400

        user_prompt = data["prompt"]
        print("Processing prompt:", user_prompt)

        response = client.chat.completions.create(
            model="gpt-4",  # Change to "gpt-3.5-turbo" if needed
            messages=[{"role": "user", "content": user_prompt}],
            max_tokens=1000
        )

        assistant_reply = response.choices[0].message.content
        logging.info(f"✅ OpenAI Response: {assistant_reply}")
        return jsonify({"response": assistant_reply})
    
    except Exception as e:
        logging.error(f"❌ Error in /api/chat: {str(e)}")
        return jsonify({"error": f"OpenAI API Error: {str(e)}"}), 500

# ✅ Run Flask App
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    print(f"🚀 Starting Flask app on port {port}...")
    app.run(debug=True, host="0.0.0.0", port=port)
