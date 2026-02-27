from sentence_transformers import SentenceTransformer
import os
import sys

def download_model():
    model_name = 'all-MiniLM-L6-v2'
    print(f"🚀 Attempting to download/verify model: {model_name}")
    print("This may take a minute depending on your internet connection...")
    
    try:
        # Force download by setting force_download=True if needed, 
        # but usually just calling the class is enough to trigger a fresh check
        model = SentenceTransformer(model_name)
        print(f"✅ Success! Model '{model_name}' is ready.")
        
        # Test encoding
        test_text = "Check if model can encode correctly."
        embedding = model.encode(test_text)
        print(f"✅ Fast test successful. Embedding shape: {embedding.shape}")
        
    except Exception as e:
        print(f"❌ Error during download: {e}")
        print("\n💡 Suggestions:")
        print("1. Check your internet connection.")
        print("2. If you are behind a proxy, ensure HTTP_PROXY and HTTPS_PROXY environment variables are set.")
        print("3. Try running: pip install --upgrade sentence-transformers huggingface_hub")

if __name__ == "__main__":
    download_model()
