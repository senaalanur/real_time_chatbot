import os
import google.generativeai as genai
import speech_recognition as sr
import pyttsx3

# Load Gemini API key from environment variable
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def capture_voice():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Listening... Speak now!")
        try:
            audio = recognizer.listen(source, timeout=10, phrase_time_limit=15)
            text = recognizer.recognize_google(audio)
            print(f"You said: {text}")
            return text
        except sr.WaitTimeoutError:
            print("Listening timed out. No speech detected.")
        except sr.UnknownValueError:
            print("Sorry, I couldn't understand what you said.")
        except sr.RequestError:
            print("Speech recognition service is unavailable.")
        return ""

def generate_response(prompt):
    try:
        model = genai.GenerativeModel("gemini-pro")
        response = model.generate_content(prompt)
        return response.text.strip() if response.text else "I'm having trouble responding right now."
    except Exception as e:
        print("Error with Gemini API:", e)
        return "I'm having trouble responding right now."

def text_to_speech(text):
    engine = pyttsx3.init()
    engine.setProperty('rate', 150)
    engine.setProperty('volume', 0.9)
    engine.say(text)
    engine.runAndWait()

def chatbot_loop():
    print("Real-Time Chatbot with Voice Interaction (Say 'exit' to quit)")
    while True:
        user_input = capture_voice()
        if not user_input:
            continue
        if user_input.lower() in ["exit", "quit", "stop"]:
            print("Goodbye!")
            break

        response = generate_response(user_input)
        print(f"Bot: {response}")
        text_to_speech(response)

if __name__ == "__main__":
    chatbot_loop()
