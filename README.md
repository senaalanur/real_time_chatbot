# 🎙️ AI Voice Chatbot
## Overview 
An AI-powered voice chatbot that uses **speech recognition**, **Gemini AI API**, and **text-to-speech conversion** to provide interactive conversations.  

## ⚙️ Setup & Installation

### 1. Set your API key
For **Windows**:
set GEMINI_API_KEY="your_api_key_here"

### 2. Run the chatbot

python chatbox.py

### 🖥️ Usage

Start the chatbot by running:
python chatbox.py

- Speak into your microphone — the chatbot will recognize your voice and process your query.
- The AI will generate a response and read it aloud using text-to-speech.
- You can modify the chatbot’s behavior by tweaking the script to fit your needs.

### 🛠️ Technologies Used

Python – Core programming language for the chatbot.

Gemini AI API – Processes and generates AI-powered responses.

SpeechRecognition – Captures and processes user speech input.

pyttsx3 – Converts text responses into speech for voice output.

### 🎯 Purpose & Use Cases

This project demonstrates the integration of voice recognition, AI-driven responses, and text-to-speech synthesis in a single application.

Possible use cases include:

- Personal AI assistants
- Accessibility tools for individuals with disabilities
- Customer support automation
- Educational tools for interactive learning
- Fun and engaging AI-powered conversations

#### 👩‍💻 Author
Sena Alanur
GitHub: @senaalanur

#### 📜 License
This project is open-source and available under the MIT License.


# AI Voice Chatbot

## Overview

AI Voice Chatbot is a real-time, voice-driven chatbot designed to provide instant responses and enhance interactive communication. This project integrates speech recognition, AI-powered text generation, and text-to-speech conversion, creating a seamless conversational experience.

The chatbot captures user speech through voice recognition, processes the input using the Gemini AI API to generate intelligent responses, and then converts the AI-generated text back into speech using pyttsx3. This ensures an engaging and natural interaction, making it useful for personal assistants, accessibility applications, and interactive AI experiences.

## Features

* Real-time voice recognition: Captures and processes user speech input.

* AI-powered responses: Uses the Gemini AI API to generate intelligent replies.

* Text-to-speech conversion: Converts AI-generated text back into spoken responses for seamless interaction.

* User-friendly interface: Simple and easy-to-use setup for a smooth experience.

* Lightweight and easy to deploy: Can be installed and run with minimal setup.

* Customizable behavior: Allows modifications to chatbot responses and functionality.

## Installation & Setup

* Clone the repository:

    git clone https://github.com/senaalanur/real_time_chatbot.git

    cd real_time_chatbot

* Create a virtual environment (optional but recommended):

    python -m venv venv
    source venv/bin/activate  # On macOS/Linux
    venv\Scripts\activate  # On Windows

* Install dependencies:

    pip install -r requirements.txt

* Set up your API key:

  -For macOS/Linux:

    export GEMINI_API_KEY="your_api_key_here"

  -For Windows:

    set GEMINI_API_KEY="your_api_key_here"

* Run the chatbot:

   python chatbox.py

* Usage

 -Start the chatbot by running:

    python chatbox.py

 -Speak into your microphone; the chatbot will recognize your voice and process your query.

 -The AI will generate a response and read it aloud using text-to-speech conversion.

 -Modify the chatbot’s behavior by tweaking the script to fit your needs.

## Technologies Used

* Python - Core programming language for the chatbot.

* Gemini AI API - Processes and generates AI-powered responses.

* SpeechRecognition - Captures and processes user speech input.

* pyttsx3 - Converts text responses into speech for voice output.

## Purpose & Use Cases

This project demonstrates the integration of voice recognition, AI-driven responses, and text-to-speech synthesis in a single application. It can be adapted for various use cases, such as:

* Personal AI assistants

* Accessibility tools for individuals with disabilities

* Customer support automation

* Educational tools for interactive learning

* Fun and engaging AI-powered conversations

### Author ###

Sena Alanur

GitHub: @senaalanur

### License ###

This project is open-source and available under the MIT License.
