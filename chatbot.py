
import os
import sys
from openai import OpenAI

def get_chatbot_response(prompt: str) -> str:
  """
  Gets a response from the OpenAI chatbot model.

  Args:
    prompt: The user's input prompt.

  Returns:
    The chatbot's response string, or an empty string if an error occurs (error details printed to stderr).
  """
  try:
    # Ensure the OpenAI API key is set as an environment variable
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
      print("Error: OpenAI API key not found. Please set the OPENAI_API_KEY environment variable.", file=sys.stderr)
      return ""

    client = OpenAI(api_key=api_key)

    # Use the specified model
    model_name = "gpt-4.1-nano" # As requested by the user

    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ]
    )

    # Extract the chatbot's reply
    if response.choices and response.choices[0].message and response.choices[0].message.content:
      return response.choices[0].message.content.strip()
    else:
      print("Error: Unable to get a valid response from the chatbot.", file=sys.stderr)
      return ""

  except Exception as e:
    print(f"Error during OpenAI API call: {e}", file=sys.stderr)
    return ""

if __name__ == "__main__":
  if len(sys.argv) > 1:
    user_prompt = sys.argv[1]
    chatbot_reply = get_chatbot_response(user_prompt)
    if chatbot_reply: # If there's a reply (not an error resulting in empty string)
      print(chatbot_reply) # Print successful response to stdout
    # Errors are printed to stderr within get_chatbot_response
  else:
    print("Error: No prompt provided to chatbot.py script.", file=sys.stderr)
    sys.exit(1)
